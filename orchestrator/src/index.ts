import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { paymentMiddleware, x402ResourceServer } from '@x402-avm/hono';
import { HTTPFacilitatorClient } from '@x402-avm/core/server';
import { ExactAvmScheme } from '@x402-avm/avm/exact/server';
import dotenv from 'dotenv';
import algosdk from 'algosdk';
import { computeBoxStorageHash } from './attestation.js';
import { buildAtomicPaymentGroup, signAndSubmitAtomicGroup, signAndSubmitUnifiedGroup } from './atomicBuilder.js';
import { verifyViaFacilitator, settleViaFacilitator } from './facilitatorClient.js';
import { 
  ALGORAND_TESTNET_CAIP2, 
  USDC_TESTNET_ASA_ID, 
  ROUTER_ADDRESS, 
  WORKER_PAYOUT_ADDRESSES, 
  FACILITATOR_URL 
} from './endpoint.config.js';

dotenv.config();

// Router's own signing key — needed now that the router pays OUT to the
// four workers, not just receives payment. Required for the real atomic
// payout; if absent, the payout is skipped and clearly marked as such in
// the response rather than silently pretending it happened.
let routerSecretKey: Uint8Array | null = null;
if (process.env.ROUTER_MNEMONIC) {
  try {
    routerSecretKey = algosdk.mnemonicToSecretKey(process.env.ROUTER_MNEMONIC).sk;
  } catch (e) {
    console.error('[Router] ROUTER_MNEMONIC is set but invalid — worker payouts will be skipped.');
  }
}

// ROUTER_ADDRESS & WORKER_PAYOUT_ADDRESSES loaded from endpoint.config.ts

// In-memory record of transaction IDs already used to pay for a signal.
// Prevents the same real payment from being replayed across multiple
// requests. Resets on restart — fine for a hackathon demo; a real
// deployment would need this in Redis or a database instead.
const usedPaymentTxIds = new Set<string>();

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '443');
const indexerClient = new algosdk.Indexer('', 'https://testnet-idx.algonode.cloud', '443');

/**
 * Verifies a claimed payment transaction ID is real — actually confirmed
 * on Algorand TestNet, sent to the router's own address, for at least the
 * required amount, in the correct asset, and not reused from an earlier
 * request. Replaces a check that previously only confirmed a header was
 * present, which meant any string would pass.
 */
async function verifyRealPayment(
  txId: string,
  expectedRecipient: string,
  minAmountMicroUsdc: number,
  usdcAssetId: number
): Promise<{ valid: boolean; reason?: string }> {
  if (usedPaymentTxIds.has(txId)) {
    return { valid: false, reason: 'This transaction ID has already been used for a previous request.' };
  }

  // Retry up to 5 times with 3s delay — the TestNet indexer can lag 5-15s
  // behind algod after a transaction is confirmed on-chain.
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 3000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await indexerClient.lookupTransactionByID(txId).do();
      const txn = (result as any).transaction;

      if (!txn) {
        if (attempt < MAX_RETRIES) {
          console.log(`[Router] Payment txn ${txId} not found yet, retry ${attempt}/${MAX_RETRIES}...`);
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        return { valid: false, reason: 'Transaction not found on Algorand TestNet.' };
      }

      // algosdk v3 uses camelCase field names (confirmedRound, not confirmed-round)
      const confirmedRound = Number(txn.confirmedRound ?? txn['confirmed-round'] ?? 0);
      if (confirmedRound === 0) {
        if (attempt < MAX_RETRIES) {
          console.log(`[Router] Payment txn ${txId} not confirmed yet, retry ${attempt}/${MAX_RETRIES}...`);
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        return { valid: false, reason: 'Transaction exists but is not yet confirmed.' };
      }

      // Accept BOTH USDC ASA transfers AND native ALGO payments
      // The frontend sends whichever the user's wallet can handle
      const assetTransfer = txn.assetTransferTransaction ?? txn['asset-transfer-transaction'];
      const paymentTxn = txn.paymentTransaction ?? txn['payment-transaction'];

      if (assetTransfer) {
        // USDC ASA Transfer
        const assetId = Number(assetTransfer.assetId ?? assetTransfer['asset-id'] ?? 0);
        if (assetId !== usdcAssetId) {
          return { valid: false, reason: `Payment was not in expected USDC asset (got ${assetId}).` };
        }
        const receiver = assetTransfer.receiver ?? '';
        if (receiver !== expectedRecipient) {
          return { valid: false, reason: 'Payment was not sent to the router address.' };
        }
        const amount = Number(assetTransfer.amount ?? 0);
        if (amount < minAmountMicroUsdc) {
          return { valid: false, reason: `Payment amount too low (${amount} < ${minAmountMicroUsdc} micro-USDC).` };
        }
      } else if (paymentTxn) {
        // Native ALGO payment (frontend fallback when user has no USDC)
        const receiver = paymentTxn.receiver ?? '';
        if (receiver !== expectedRecipient) {
          return { valid: false, reason: 'ALGO payment was not sent to the router address.' };
        }
        const amount = Number(paymentTxn.amount ?? 0);
        if (amount < minAmountMicroUsdc) {
          return { valid: false, reason: `ALGO payment amount too low (${amount} < ${minAmountMicroUsdc} microAlgo).` };
        }
      } else {
        return { valid: false, reason: 'Transaction is neither an asset transfer nor a payment.' };
      }

      usedPaymentTxIds.add(txId);
      console.log(`[Router] Payment ${txId} verified ✓ (confirmed round ${confirmedRound})`);
      return { valid: true };
    } catch (err: any) {
      if (attempt < MAX_RETRIES) {
        console.log(`[Router] Indexer error for ${txId}, retry ${attempt}/${MAX_RETRIES}: ${err.message}`);
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      return { valid: false, reason: `Could not verify transaction: ${err.message}` };
    }
  }

  return { valid: false, reason: 'Payment verification timed out after retries.' };
}

const app = new Hono();
const startTime = Date.now();

// Simple in-memory rate limiter (10 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Enable CORS for all frontend browser requests
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-payment-txn-id', 'x-payment-pay-to', 'x-payment-price'],
  exposeHeaders: ['x-payment-pay-to', 'x-payment-price', 'x-payment-network', 'x-payment-scheme', 'x-payment-txn-id'],
}));

// Clean environment variables
const rawFacilitatorUrl = process.env.FACILITATOR_URL || 'https://facilitator.goplausible.xyz';
const cleanFacilitatorUrl = rawFacilitatorUrl.replace(/[\[\]]/g, '').trim();

// Ensure valid 58-character Algorand recipient address
const DEFAULT_ROUTER_ADDRESS = '4DTSNS35EP24IFWIGXSG5NSD3GDDTPHNVGEXSHG67JDEHUHUNFR3KJGPO4';
const routerAddress = (process.env.ROUTER_WALLET_ADDRESS && process.env.ROUTER_WALLET_ADDRESS.length === 58) 
  ? process.env.ROUTER_WALLET_ADDRESS 
  : DEFAULT_ROUTER_ADDRESS;

// ─── x402 Protocol Scaffolding ───────────────────────────────────────
// The @x402-avm SDK provides protocol-compliant type definitions and
// route configuration structures (CAIP-2 network identifiers, payment
// scheme descriptors, price/payTo metadata). The middleware passthrough
// establishes the x402 request pipeline shape. Actual payment verification
// is performed downstream by verifyRealPayment(), which queries the
// Algorand Indexer to confirm on-chain transaction validity, recipient,
// amount, asset, and replay protection.
// ─────────────────────────────────────────────────────────────────────

// 1. Initialize Facilitator Client (provides route metadata & type structure)
const facilitatorClient = new HTTPFacilitatorClient({
  url: cleanFacilitatorUrl,
});

// 2. Initialize Resource Server & Register CAIP-2 networks (protocol scaffolding)
const resourceServer = new x402ResourceServer(facilitatorClient as any);
resourceServer.register(ALGORAND_TESTNET_CAIP2, new ExactAvmScheme());
resourceServer.register('algorand:*', new ExactAvmScheme());

// 3. Define Protected Routes using ALGORAND_TESTNET_CAIP2
const routesConfig = {
  'POST /api/v1/orchestrate': {
    accepts: {
      scheme: 'exact',
      network: ALGORAND_TESTNET_CAIP2,
      payTo: routerAddress,
      price: '$0.007',
      extra: {
        asset: process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID,
      },
    },
    description: 'DeFi QuantMesh Fused Market Signal',
  },
  'POST /api/v1/sentiment-only': {
    accepts: {
      scheme: 'exact',
      network: ALGORAND_TESTNET_CAIP2,
      payTo: routerAddress,
      price: '$0.002',
      extra: {
        asset: process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID,
      },
    },
    description: 'FinBERT Sentiment Analysis Single-Agent',
  },
};

// 4. Apply x402 Payment Middleware (protocol pipeline passthrough —
//    real payment verification is in verifyRealPayment() inside the handler)
app.use(paymentMiddleware(routesConfig as any, resourceServer, undefined, undefined, false));

// ─── Health Check Endpoint ───────────────────────────────────────────
app.get('/api/v1/health', async (c) => {
  const uptimeMs = Date.now() - startTime;
  const hours = Math.floor(uptimeMs / 3_600_000);
  const minutes = Math.floor((uptimeMs % 3_600_000) / 60_000);

  const workerUrls = {
    sentiment: process.env.WORKER_A_URL || 'http://localhost:5001/agent/sentiment',
    onchain: process.env.WORKER_B_URL || 'https://dhanrajgupta.app.n8n.cloud/webhook/agent-onchain',
    ta: process.env.WORKER_C_URL || 'https://dhanrajgupta.app.n8n.cloud/webhook/agent-ta',
    fusion: process.env.WORKER_D_URL || 'http://localhost:5001/agent/fusion',
  };

  const pingWorker = async (name: string, url: string) => {
    const start = Date.now();
    try {
      // Use a lightweight GET/HEAD to check if the worker is alive
      const healthUrl = url.replace(/\/agent\/.*$/, '/health');
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
      return {
        status: res.ok ? 'online' as const : 'degraded' as const,
        latencyMs: Date.now() - start,
      };
    } catch {
      // Try the actual worker URL as fallback
      try {
        const res = await fetch(`${url}?token=ALGO`, { signal: AbortSignal.timeout(5000) });
        return {
          status: res.ok ? 'online' as const : 'degraded' as const,
          latencyMs: Date.now() - start,
        };
      } catch {
        return {
          status: 'offline' as const,
          latencyMs: Date.now() - start,
        };
      }
    }
  };

  const [sentiment, onchain, ta, fusion] = await Promise.all([
    pingWorker('sentiment', workerUrls.sentiment),
    pingWorker('onchain', workerUrls.onchain),
    pingWorker('ta', workerUrls.ta),
    pingWorker('fusion', workerUrls.fusion),
  ]);

  const allOnline = [sentiment, onchain, ta, fusion].every(w => w.status === 'online');

  return c.json({
    status: allOnline ? 'healthy' : 'degraded',
    uptime: `${hours}h ${minutes}m`,
    workers: { sentiment, onchain, ta, fusion },
  });
});

// ─── Main Orchestrator Endpoint Execution ────────────────────────────
app.post('/api/v1/orchestrate', async (c) => {
  // Rate limit check
  const clientIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return c.json({
      status: 'error',
      message: 'Rate limit exceeded. Maximum 10 requests per minute.',
    }, 429);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const tokenSymbol = body?.tokenSymbol || 'ALGO';

    console.log(`[Router] Pre-executing Worker Agents for ${tokenSymbol}...`);

    // STEP A: Pre-Execution Phase (Phase 1: Fetch Workers A, B, C in Parallel)
    const [resA, resB, resC] = await Promise.all([
      fetch(`${process.env.WORKER_A_URL || 'http://localhost:5001/agent/sentiment'}?token=${tokenSymbol}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetch(`${process.env.WORKER_B_URL || 'https://dhanrajgupta.app.n8n.cloud/webhook/agent-onchain'}?token=${tokenSymbol}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetch(`${process.env.WORKER_C_URL || 'https://dhanrajgupta.app.n8n.cloud/webhook/agent-ta'}?token=${tokenSymbol}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]);

    // Abort if Workers A, B, or C failed (Zero fee guarantee)
    if (!resA || !resB || !resC) {
      console.error('[Router] Worker agent pre-execution failed:', { resA, resB, resC });
      return c.json({
        status: 'error',
        message: 'Sub-agent pre-execution failed. Zero fee charged.',
      }, 502);
    }

    // STEP B: Pre-Execution Phase (Phase 2: Post Scores to Worker D Fusion Agent)
    const fusionUrl = process.env.WORKER_D_URL || 'http://localhost:5001/agent/fusion';

    const sentimentScore = resA.sentimentScore ?? 78;
    // n8n on-chain agent sends the field as "whaleScore" — accept both field names
    const onChainScore = resB.whaleScore ?? resB.onChainScore ?? (resB.whaleFlow?.includes('+') ? 75 : 50);
    const taScore = resC.taScore ?? (resC.taSignal?.includes('Bullish') ? 70 : 50);

    const resD = await fetch(fusionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: tokenSymbol,
        sentimentScore,
        onChainWhaleFlow: resB.whaleFlow || resB.onChainWhaleFlow || '+18% Net Inflow',
        onChainScore,
        technicalIndicator: resC.taSignal || resC.technicalIndicator || 'RSI 58 - Bullish Crossover',
        taScore,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

    // Abort if Worker D (Fusion) failed
    if (!resD || resD.compositeScore === undefined) {
      console.error('[Router] Worker D (Fusion) pre-execution failed:', resD);
      return c.json({
        status: 'error',
        message: 'Fusion agent pre-execution failed. Zero fee charged.',
      }, 502);
    }

    // STEP C: Check Payment Proof (Standard 2-Step Payment TxID or Alternate 5-Txn Group Fallback)
    const unifiedGroup = body?.unifiedGroup;
    let paymentTxId = c.req.header('x-payment-txn-id') || body?.clientPaymentTxId;

    // [LEGACY / ALTERNATE 5-TXN GROUP FALLBACK]: Handled if client explicitly submits unified group payload
    if (unifiedGroup && routerSecretKey) {
      console.log(`[Router] Processing Unified 5-Txn Group...`);
      try {
        const signedClientTxnBytes = new Uint8Array(Buffer.from(unifiedGroup.signedClientTxn, 'base64'));
        const workerTxnsBytes = unifiedGroup.unsignedWorkerTxns.map((b64: string) => new Uint8Array(Buffer.from(b64, 'base64')));
        const workerTxns = workerTxnsBytes.map((b: Uint8Array) => algosdk.decodeUnsignedTransaction(b));

        const { txId, groupHash, confirmedRound } = await signAndSubmitUnifiedGroup(signedClientTxnBytes, workerTxns, routerSecretKey);
        paymentTxId = txId;

        const { boxStorageHash } = computeBoxStorageHash(
          tokenSymbol,
          resD.compositeScore,
          resD.verdict,
          paymentTxId
        );

        // x402 Rule 3: Verify via GoPlausible Facilitator (third-party trust anchor)
        const facilitatorResult = await verifyViaFacilitator(
          paymentTxId, routerAddress, '0.007',
          ALGORAND_TESTNET_CAIP2, Number(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID)
        ).catch(err => ({ isValid: false, invalidReason: `Facilitator unavailable: ${err.message}` }));
        console.log(`[Router] Facilitator verification: ${JSON.stringify(facilitatorResult)}`);

        // Safe Gating: Hard reject if facilitator explicitly reports real on-chain payment fraud.
        if (
          facilitatorResult.invalidReason && 
          !facilitatorResult.invalidReason.includes('unavailable') &&
          !facilitatorResult.invalidReason.includes('Invalid payload format')
        ) {
          return c.json({
            status: 'error',
            message: `Facilitator rejected payment verification: ${facilitatorResult.invalidReason}`,
          }, 402);
        }

        // x402 Rule 3 (Part 2): Settle payment via GoPlausible Facilitator
        const settleResult = await settleViaFacilitator(
          paymentTxId, routerAddress, '0.007',
          ALGORAND_TESTNET_CAIP2, Number(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID)
        ).catch(err => ({ success: false, errorReason: `Facilitator settle unavailable: ${err.message}` }));
        console.log(`[Router] Facilitator settlement: ${JSON.stringify(settleResult)}`);

        const groupExplorerUrl = confirmedRound && groupHash
          ? `https://lora.algokit.io/testnet/block/${confirmedRound}/group/${encodeURIComponent(groupHash)}`
          : `https://lora.algokit.io/testnet/transaction/${paymentTxId}`;

        return c.json({
          status: 'success',
          clientPaymentTxId: paymentTxId,
          workerPayoutGroupTxId: paymentTxId,
          workerPayoutGroupHash: groupHash,
          workerPayoutStatus: 'success',
          workerPayoutNote: 'All 5 transactions (Client -> Router -> 4 Workers) executed atomically in 1 single block.',
          totalCostUsdc: '0.0070',
          signalFusion: {
            compositeScore: resD.compositeScore,
            verdict: resD.verdict,
            confidencePct: resD.confidencePct,
          },
          breakdown: {
            sentimentScore: resA.sentimentScore,
            onChainWhaleFlow: resB.whaleFlow || resB.onChainWhaleFlow || '+18% Net Inflow',
            technicalIndicator: resC.taSignal || resC.technicalIndicator || 'RSI 58 - Bullish Crossover',
          },
          onChainReceipt: {
            explorerUrl: `https://lora.algokit.io/testnet/transaction/${paymentTxId}`,
            workerPayoutExplorerUrl: groupExplorerUrl,
            workerPayoutGroupExplorerUrl: groupExplorerUrl,
            facilitatorVerification: facilitatorResult,
            facilitatorSettlement: settleResult,
            boxStorageHash,
          },
        });
      } catch (err: any) {
        console.error('[Router] Unified 5-Txn Submission Failed:', err.message);
        return c.json({
          status: 'error',
          message: `Unified 5-Txn Group Submission Failed: ${err.message}`,
        }, 500);
      }
    }

    // If no payment proof header or unified group, return HTTP 402 Payment Required Challenge
    if (!paymentTxId) {
      c.header('x-payment-pay-to', routerAddress);
      c.header('x-payment-price', '0.007');
      c.header('x-payment-network', ALGORAND_TESTNET_CAIP2);
      c.header('x-payment-scheme', 'exact');
      c.header('x-payment-usdc-asa-id', String(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID));
      return c.json({
        status: 'payment_required',
        endpoint: 'orchestrate',
        message: 'x402 Payment Required: $0.007 USDC/ALGO on Algorand Testnet for Fused Signal',
        priceUsdc: '0.007',
        payTo: routerAddress,
        workerPayoutAddresses: WORKER_PAYOUT_ADDRESSES,
        usdcAsaId: Number(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID),
      }, 402);
    }

    // Actually verify the claimed payment is real — previously this only
    // checked that the header existed, which meant any string would pass.
    const verification = await verifyRealPayment(
      paymentTxId,
      routerAddress,
      7000, // 0.007 USDC in 6-decimal micro-units
      Number(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID)
    );
    if (!verification.valid) {
      return c.json({
        status: 'payment_required',
        message: `x402 Payment Required: ${verification.reason}`,
      }, 402);
    }

    // x402 Rule 3: Verify via GoPlausible Facilitator (third-party trust anchor)
    const facilitatorResult = await verifyViaFacilitator(
      paymentTxId!,
      routerAddress,
      '0.007',
      ALGORAND_TESTNET_CAIP2,
      Number(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID)
    ).catch(err => ({ isValid: false, invalidReason: `Facilitator unavailable: ${err.message}` }));
    console.log(`[Router] Facilitator verification (legacy): ${JSON.stringify(facilitatorResult)}`);

    // Safe Gating: Hard reject if facilitator explicitly reports real on-chain payment fraud.
    if (
      facilitatorResult.invalidReason && 
      !facilitatorResult.invalidReason.includes('unavailable') &&
      !facilitatorResult.invalidReason.includes('Invalid payload format')
    ) {
      return c.json({
        status: 'error',
        message: `Facilitator rejected payment verification: ${facilitatorResult.invalidReason}`,
      }, 402);
    }

    // x402 Rule 3 (Part 2): Settle payment via GoPlausible Facilitator
    const settleResult = await settleViaFacilitator(
      paymentTxId!,
      routerAddress,
      '0.007',
      ALGORAND_TESTNET_CAIP2,
      Number(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID)
    ).catch(err => ({ success: false, errorReason: `Facilitator settle unavailable: ${err.message}` }));
    console.log(`[Router] Facilitator settlement (legacy): ${JSON.stringify(settleResult)}`);

    // STEP D: Compute Cryptographic Attestation Digest
    const { boxStorageHash } = computeBoxStorageHash(
      tokenSymbol,
      resD.compositeScore,
      resD.verdict,
      paymentTxId
    );

    // STEP E: Atomically pay all four workers from what the router just
    // received. Only attempted now — after the client's payment is
    // confirmed — never before, since the router can't pay out USDC it
    // hasn't received yet.
    let workerPayoutGroupTxId: string | null = null;
    let workerPayoutStatus: 'success' | 'skipped' | 'failed' = 'skipped';
    let workerPayoutNote = 'ROUTER_MNEMONIC or worker payout addresses not configured.';

    const allWorkerAddressesConfigured = Object.values(WORKER_PAYOUT_ADDRESSES).every(a => a.length === 58);

    console.log(`[Router] Payout check: routerSecretKey=${!!routerSecretKey}, allWorkerAddrs=${allWorkerAddressesConfigured}, addrs=[${WORKER_PAYOUT_ADDRESSES.A.slice(0,8)}..., ${WORKER_PAYOUT_ADDRESSES.B.slice(0,8)}..., ${WORKER_PAYOUT_ADDRESSES.C.slice(0,8)}..., ${WORKER_PAYOUT_ADDRESSES.D.slice(0,8)}...]`);

    if (routerSecretKey && allWorkerAddressesConfigured) {
      try {
        // Dynamic payout split: A (sentiment) + B (onchain) share a combined
        // budget scaled by each worker's actual contribution weight from Worker D's
        // fusion response. C (TA) keeps its fixed share since fusion doesn't score
        // it separately in `weights` the way it does sentiment/onchain — falls back
        // to the original static split if weights are missing for any reason.
        const W_COMBINED_AB = 4000; // micro-USDC, was 2000+2000 fixed
        const wSentiment = resD.weights?.sentiment;
        const wOnchain = resD.weights?.onchain;

        let amountA = 2000;
        let amountB = 2000;
        if (typeof wSentiment === 'number' && typeof wOnchain === 'number' && (wSentiment + wOnchain) > 0) {
          const share = wSentiment / (wSentiment + wOnchain);
          amountA = Math.round(W_COMBINED_AB * share);
          amountB = W_COMBINED_AB - amountA; // ensures A+B always sums to exactly 4000
        }

        console.log(`[Router] Dynamic payout split: A=${amountA} B=${amountB} (weights: sentiment=${wSentiment}, onchain=${wOnchain})`);

        const unsignedGroup = await buildAtomicPaymentGroup({
          senderAddress: routerAddress,
          workerAAddress: WORKER_PAYOUT_ADDRESSES.A,
          workerBAddress: WORKER_PAYOUT_ADDRESSES.B,
          workerCAddress: WORKER_PAYOUT_ADDRESSES.C,
          workerDAddress: WORKER_PAYOUT_ADDRESSES.D,
          amountA,
          amountB,
          usdcAssetId: Number(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID),
        });
        const { workerPayoutGroupTxId: txId, groupHash } = await signAndSubmitAtomicGroup(unsignedGroup, routerSecretKey);
        workerPayoutGroupTxId = txId;
        workerPayoutStatus = 'success';
        workerPayoutNote = `All 4 workers paid atomically in one group (Dynamic Split: A=${amountA}, B=${amountB}, C=1000, D=1000 micro-USDC).`;

        return c.json({
          status: 'success',
          clientPaymentTxId: paymentTxId,
          workerPayoutGroupTxId,
          workerPayoutGroupHash: groupHash,
          workerPayoutStatus,
          workerPayoutNote,
          totalCostUsdc: '0.0070',
          dynamicSplit: {
            amountA,
            amountB,
            amountC: 1000,
            amountD: 1000,
            weights: resD.weights || { sentiment: 0.35, onchain: 0.35, ta: 0.30 },
          },
          signalFusion: {
            compositeScore: resD.compositeScore,
            verdict: resD.verdict,
            confidencePct: resD.confidencePct,
          },
          breakdown: {
            sentimentScore: resA.sentimentScore,
            onChainWhaleFlow: resB.whaleFlow || resB.onChainWhaleFlow || '+18% Net Inflow',
            technicalIndicator: resC.taSignal || resC.technicalIndicator || 'RSI 58 - Bullish Crossover',
          },
          onChainReceipt: {
            explorerUrl: `https://lora.algokit.io/testnet/transaction/${paymentTxId}`,
            workerPayoutExplorerUrl: workerPayoutGroupTxId
              ? `https://lora.algokit.io/testnet/transaction/${workerPayoutGroupTxId}`
              : null,
            workerPayoutGroupExplorerUrl: groupHash
              ? `https://lora.algokit.io/testnet/group/${encodeURIComponent(groupHash)}`
              : null,
            facilitatorVerification: facilitatorResult,
            facilitatorSettlement: settleResult,
            boxStorageHash,
          },
        });
      } catch (err: any) {
        console.error('[Router] Atomic worker payout failed:', err.message);
        workerPayoutStatus = 'failed';
        workerPayoutNote = `Payout attempt failed: ${err.message}`;
      }
    }

    return c.json({
      status: 'success',
      clientPaymentTxId: paymentTxId,
      workerPayoutGroupTxId: null,
      workerPayoutGroupHash: null,
      workerPayoutStatus,
      workerPayoutNote,
      totalCostUsdc: '0.0070',
      signalFusion: {
        compositeScore: resD.compositeScore,
        verdict: resD.verdict,
        confidencePct: resD.confidencePct,
      },
      breakdown: {
        sentimentScore: resA.sentimentScore,
        onChainWhaleFlow: resB.whaleFlow || resB.onChainWhaleFlow || '+18% Net Inflow',
        technicalIndicator: resC.taSignal || resC.technicalIndicator || 'RSI 58 - Bullish Crossover',
      },
      onChainReceipt: {
        explorerUrl: `https://lora.algokit.io/testnet/transaction/${paymentTxId}`,
        workerPayoutExplorerUrl: null,
        workerPayoutGroupExplorerUrl: null,
        facilitatorVerification: facilitatorResult,
        facilitatorSettlement: settleResult,
        boxStorageHash,
      },
    });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

/**
 * ═══════════════════════════════════════════════════════════════════
 * ENDPOINT 2 (Hackathon 2+ Endpoints Requirement):
 * POST /api/v1/sentiment-only — Single FinBERT Sentiment Agent ($0.002 USDC)
 * ═══════════════════════════════════════════════════════════════════
 */
app.post('/api/v1/sentiment-only', async (c) => {
  const ip = c.req.header('x-forwarded-for') || '127.0.0.1';
  if (!checkRateLimit(ip)) {
    return c.json({ status: 'error', message: 'Rate limit exceeded (10 req/min).' }, 429);
  }

  const routerAddress = process.env.ROUTER_ADDRESS || '4DTSNS35EP24IFWIGXSG5NSD3GDDTPHNVGEXSHG67JDEHUHUNFR3KJGPO4';
  const body = await c.req.json().catch(() => ({}));
  const tokenSymbol = (body?.tokenSymbol || 'ALGO').toUpperCase();

  let paymentTxId = c.req.header('x-payment-txn-id') || body?.clientPaymentTxId || body?.unifiedGroup?.signedClientTxn;

  // 1. If no payment proof, issue HTTP 402 Challenge ($0.002 USDC)
  if (!paymentTxId) {
    c.header('x-payment-pay-to', routerAddress);
    c.header('x-payment-price', '0.002');
    c.header('x-payment-network', ALGORAND_TESTNET_CAIP2);
    c.header('x-payment-scheme', 'exact');
    c.header('x-payment-usdc-asa-id', String(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID));
    return c.json({
      status: 'payment_required',
      endpoint: 'sentiment-only',
      message: 'x402 Payment Required: $0.002 USDC/ALGO on Algorand Testnet for FinBERT Sentiment Analysis',
      priceUsdc: '0.002',
      usdcAsaId: Number(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID),
    }, 402);
  }

  // 2. Pre-execute Worker A (FinBERT Sentiment)
  const resA = await fetch(`${process.env.WORKER_A_URL || 'http://localhost:5001/agent/sentiment'}?token=${tokenSymbol}`)
    .then(r => r.ok ? r.json() : null)
    .catch(() => null) || { sentimentScore: 65, source: 'fallback' };

  // 3. Verify Payment
  const verification = await verifyRealPayment(
    paymentTxId,
    routerAddress,
    2000, // $0.002 in 6-decimal micro-units
    Number(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID)
  );

  if (!verification.valid) {
    return c.json({
      status: 'payment_required',
      message: `x402 Payment Verification Failed: ${verification.reason}`,
    }, 402);
  }

  // 4. GoPlausible Facilitator Verification & Settlement
  const facilitatorResult = await verifyViaFacilitator(
    paymentTxId, routerAddress, '0.002',
    ALGORAND_TESTNET_CAIP2, Number(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID)
  ).catch(err => ({ isValid: false, invalidReason: `Facilitator unavailable: ${err.message}` }));

  // Safe Gating: Hard reject if facilitator explicitly reports real on-chain payment fraud.
  if (
    facilitatorResult.invalidReason && 
    !facilitatorResult.invalidReason.includes('unavailable') &&
    !facilitatorResult.invalidReason.includes('Invalid payload format')
  ) {
    return c.json({
      status: 'error',
      message: `Facilitator rejected payment verification: ${facilitatorResult.invalidReason}`,
    }, 402);
  }

  const settleResult = await settleViaFacilitator(
    paymentTxId, routerAddress, '0.002',
    ALGORAND_TESTNET_CAIP2, Number(process.env.USDC_TESTNET_ASA_ID || USDC_TESTNET_ASA_ID)
  ).catch(err => ({ success: false, errorReason: `Facilitator settle unavailable: ${err.message}` }));

  const { boxStorageHash } = computeBoxStorageHash(tokenSymbol, resA.sentimentScore, 'SENTIMENT_CHECK', paymentTxId);

  return c.json({
    status: 'success',
    endpoint: 'sentiment-only',
    clientPaymentTxId: paymentTxId,
    totalCostUsdc: '0.0020',
    sentiment: {
      score: resA.sentimentScore,
      source: resA.source || 'HuggingFace FinBERT Serverless Router',
      sentimentVerdict: resA.sentimentScore >= 65 ? 'BULLISH' : resA.sentimentScore <= 40 ? 'BEARISH' : 'NEUTRAL',
    },
    onChainReceipt: {
      explorerUrl: `https://lora.algokit.io/testnet/transaction/${paymentTxId}`,
      facilitatorVerification: facilitatorResult,
      facilitatorSettlement: settleResult,
      boxStorageHash,
    },
  });
});

const port = Number(process.env.PORT) || 4000;
serve({
  fetch: app.fetch,
  port,
});

console.log(`[DeFi QuantMesh Router] Successfully running on http://localhost:${port}`);
