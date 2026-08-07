import algosdk from 'algosdk';

const ROUTER_GATEWAY = 'https://api.dhanrajgupta.xyz/api/v1/orchestrate';
const TESTNET_USDC_ASA = 10458941;

// Fallback constants — used ONLY if the 402 challenge headers are missing.
// The correct x402 flow reads these from the server's 402 response.
const FALLBACK_PAY_TO = '4DTSNS35EP24IFWIGXSG5NSD3GDDTPHNVGEXSHG67JDEHUHUNFR3KJGPO4';
const FALLBACK_PRICE_USDC = '0.007';
const FALLBACK_WORKER_PAYOUT_ADDRESSES = {
  A: '3VX4MDC3ZRJWCJIYRACWDZLKMP5OOI7UTDUDFYSJO2ESCIYDRFVQFEY55U',
  B: '4PIEYCWYYCPUIFNCLPP4BQ37PVFA23EF3GBYIK7VWE3QWZARC5RRTEVEIE',
  C: 'U55BSD7ZWOIP4ZSLAYU4MX344DJBPONX4YWI3PFWPVMV34TELFBZYG3E6E',
  D: 'B47KV6MF637THQAU6B6VM4JEQTKYFTJBUIYKCZPQ4E2QD6K67RV4XV5C6U',
};

export async function optInToUSDCAssest(
  userAddress: string,
  signTransactions: (txns: Uint8Array[]) => Promise<Uint8Array[]>
) {
  const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
  const params = await algodClient.getTransactionParams().do();

  const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: userAddress,
    sender: userAddress,
    to: userAddress,
    receiver: userAddress,
    assetIndex: TESTNET_USDC_ASA,
    amount: 0,
    suggestedParams: params,
  } as any);

  const signedTxns = await signTransactions([optInTxn.toByte()]);
  if (!signedTxns || signedTxns.length === 0) {
    throw new Error('Opt-in transaction cancelled by user.');
  }

  const sendRes = await algodClient.sendRawTransaction(signedTxns[0]).do();
  await algosdk.waitForConfirmation(algodClient, sendRes.txid, 4);
  return sendRes.txid;
}

export async function fetchQuantMeshSignal(
  tokenSymbol: string,
  userAddress: string,
  signTransactions: (txns: Uint8Array[], indexesToSign?: number[]) => Promise<Uint8Array[]>
) {
  const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

  // ═══════════════════════════════════════════════════════════════════
  // x402 STEP 1: PROBE — Send request without payment to get 402 challenge
  // ═══════════════════════════════════════════════════════════════════
  console.log('[x402] Step 1: Probing orchestrator for 402 payment challenge...');
  const probeRes = await fetch(ROUTER_GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenSymbol }),
  });

  // If the probe returns 200 (somehow already paid), return directly
  if (probeRes.ok) {
    const data = await probeRes.json();
    if (data.status === 'success') return data;
  }

  // If we got something other than 402, it's an error
  if (probeRes.status !== 402) {
    const errBody = await probeRes.json().catch(() => ({}));
    throw new Error(errBody.message || `Unexpected server response: ${probeRes.status}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // x402 STEP 2: READ 402 CHALLENGE — Extract payment parameters from
  // the server's response headers and body (not hardcoded constants)
  // ═══════════════════════════════════════════════════════════════════
  console.log('[x402] Step 2: Reading 402 challenge headers...');
  const payTo = probeRes.headers.get('x-payment-pay-to') || FALLBACK_PAY_TO;
  const priceStr = probeRes.headers.get('x-payment-price') || FALLBACK_PRICE_USDC;
  const network = probeRes.headers.get('x-payment-network') || '';
  const scheme = probeRes.headers.get('x-payment-scheme') || 'exact';

  // Read worker payout addresses from the 402 response body
  const challengeBody = await probeRes.json().catch(() => ({}));
  const workerAddresses = challengeBody.workerPayoutAddresses || FALLBACK_WORKER_PAYOUT_ADDRESSES;
  const usdcAsaId = challengeBody.usdcAsaId || TESTNET_USDC_ASA;

  const amountInBaseUnits = Math.round(parseFloat(priceStr) * 1_000_000);

  console.log(`[x402] 402 Challenge received:`, {
    payTo: payTo.slice(0, 12) + '...',
    price: priceStr,
    network,
    scheme,
    amountInBaseUnits,
    workerAddresses: Object.keys(workerAddresses),
  });

  // ═══════════════════════════════════════════════════════════════════
  // x402 STEP 3: SIGN — Build 5-Txn atomic group using server-provided
  // values, then prompt user to sign in Lute Wallet
  // ═══════════════════════════════════════════════════════════════════

  // 3a. Fetch account info + tx params IN PARALLEL for speed
  const [accountInfo, params] = await Promise.all([
    algodClient.accountInformation(userAddress).do().catch(() => null),
    algodClient.getTransactionParams().do(),
  ]);

  // 3b. Detect USDC balance (handles algosdk v3 BigInt + camelCase)
  let hasUsdcOptIn = false;
  let usdcBalance = 0;

  if (accountInfo) {
    const assets = accountInfo.assets || [];
    const usdcAsset = assets.find((a: any) => {
      const id = Number(a['asset-id'] ?? a.assetId ?? 0);
      return id === TESTNET_USDC_ASA;
    });
    if (usdcAsset) {
      hasUsdcOptIn = true;
      usdcBalance = Number(usdcAsset.amount ?? 0);
      console.log(`[x402] USDC detected: balance=${usdcBalance} micro-USDC`);
    }
  }

  // 3c. Build Unified 5-Txn Atomic Group using server-provided addresses
  let txn0: algosdk.Transaction;

  if (hasUsdcOptIn && usdcBalance >= amountInBaseUnits) {
    console.log(`[x402] Building USDC ASA Transfer for 5-Txn Group...`);
    txn0 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: userAddress,
      sender: userAddress,
      to: payTo,
      receiver: payTo,
      assetIndex: usdcAsaId,
      amount: amountInBaseUnits,
      suggestedParams: params,
    } as any);
  } else {
    console.log(`[x402] Building Native ALGO Micropayment for 5-Txn Group...`);
    txn0 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: userAddress,
      sender: userAddress,
      to: payTo,
      receiver: payTo,
      amount: amountInBaseUnits,
      suggestedParams: params,
    } as any);
  }

  // Worker payouts using server-provided addresses
  const workerPayouts = [
    { to: workerAddresses.A, amount: 2000 },
    { to: workerAddresses.B, amount: 2000 },
    { to: workerAddresses.C, amount: 1000 },
    { to: workerAddresses.D, amount: 1000 },
  ];

  const workerTxns: algosdk.Transaction[] = workerPayouts.map(p =>
    algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: payTo,
      sender: payTo,
      to: p.to,
      receiver: p.to,
      amount: p.amount,
      assetIndex: usdcAsaId,
      suggestedParams: params,
    } as any)
  );

  const group5Txns = [txn0, ...workerTxns];
  algosdk.assignGroupID(group5Txns);

  // 3d. Prompt user to sign Txn 0 in Lute
  let signedTxns: (Uint8Array | null)[];
  try {
    signedTxns = await signTransactions(group5Txns.map(t => t.toByte()), [0]);
  } catch (signErr: any) {
    throw new Error(
      signErr?.message?.includes('User rejected')
        ? 'Transaction was rejected by user.'
        : `Wallet error: ${signErr?.message || 'Could not connect to Lute. Please refresh the page.'}`
    );
  }

  if (!signedTxns || !signedTxns[0]) {
    throw new Error('Transaction signing was cancelled by user.');
  }

  // ═══════════════════════════════════════════════════════════════════
  // x402 STEP 4: RETRY — Re-send the request with payment proof
  // (the "automatic retry" per x402 Rule 2)
  // ═══════════════════════════════════════════════════════════════════
  console.log('[x402] Step 4: Retrying with signed payment proof...');

  const signedClientTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
  const unsignedWorkerTxnsBase64 = workerTxns.map(t => Buffer.from(t.toByte()).toString('base64'));

  const paidRes = await fetch(ROUTER_GATEWAY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tokenSymbol,
      unifiedGroup: {
        signedClientTxn: signedClientTxnBase64,
        unsignedWorkerTxns: unsignedWorkerTxnsBase64,
      },
    }),
  });

  const paidData = await paidRes.json().catch(() => ({}));

  if (!paidRes.ok || paidData.status === 'error') {
    throw new Error(paidData.message || `Payment verification failed: ${paidRes.statusText}`);
  }

  console.log('[x402] ✅ Full x402 flow complete: Challenge → Sign → Retry → Receipt');
  return paidData;
}
