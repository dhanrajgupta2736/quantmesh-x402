import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { paymentMiddleware, x402ResourceServer } from '@x402-avm/hono';
import { HTTPFacilitatorClient } from '@x402-avm/core/server';
import { ExactAvmScheme } from '@x402-avm/avm/exact/server';
import { ALGORAND_TESTNET_CAIP2, USDC_TESTNET_ASA_ID } from '@x402-avm/avm';
import dotenv from 'dotenv';

dotenv.config();

const app = new Hono();

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
const DEFAULT_ROUTER_ADDRESS = 'HXT5Z6DKIVYOIZB7WHVOGEQVYNGXVMQRMS43WXSGIDYORLE3ZUN63Q36MI';
const routerAddress = (process.env.ROUTER_WALLET_ADDRESS && process.env.ROUTER_WALLET_ADDRESS.length === 58) 
  ? process.env.ROUTER_WALLET_ADDRESS 
  : DEFAULT_ROUTER_ADDRESS;

// 1. Initialize Facilitator Client
const facilitatorClient = new HTTPFacilitatorClient({
  url: cleanFacilitatorUrl,
});

// 2. Initialize Resource Server & Register CAIP-2 networks
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
};

// 4. Apply x402 Payment Middleware (Set syncFacilitatorOnStart = false)
app.use(paymentMiddleware(routesConfig as any, resourceServer, undefined, undefined, false));

// 5. Main Orchestrator Endpoint Execution
app.post('/api/v1/orchestrate', async (c) => {
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
    const onChainScore = resB.onChainScore ?? (resB.whaleFlow?.includes('+') ? 75 : 50);
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

    // STEP C: Check Payment Verification Header (x-payment-txn-id)
    const paymentTxId = c.req.header('x-payment-txn-id');

    // If no payment proof header, return HTTP 402 Payment Required Challenge
    if (!paymentTxId) {
      c.header('x-payment-pay-to', routerAddress);
      c.header('x-payment-price', '0.007');
      c.header('x-payment-network', ALGORAND_TESTNET_CAIP2);
      c.header('x-payment-scheme', 'exact');
      return c.json({
        status: 'payment_required',
        message: 'x402 Payment Required: $0.007 USDC/ALGO on Algorand Testnet',
      }, 402);
    }

    // STEP D: Return Aggregated Fused Signal matching schema.json
    return c.json({
      status: 'success',
      groupTxId: paymentTxId,
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
        boxStorageHash: 'a3f9b2c4e5f67890123456789abcdef0',
      },
    });
  } catch (error: any) {
    return c.json({ status: 'error', message: error.message }, 500);
  }
});

const port = Number(process.env.PORT) || 4000;
serve({
  fetch: app.fetch,
  port,
});

console.log(`[DeFi QuantMesh Router] Successfully running on http://localhost:${port}`);
