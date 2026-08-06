import algosdk from 'algosdk';

const ROUTER_GATEWAY = 'https://api.dhanrajgupta.xyz/api/v1/orchestrate';
const TESTNET_USDC_ASA = 10458941;
const DEFAULT_PAY_TO = '4DTSNS35EP24IFWIGXSG5NSD3GDDTPHNVGEXSHG67JDEHUHUNFR3KJGPO4';
const SIGNAL_PRICE_USDC = '0.007';

const WORKER_PAYOUT_ADDRESSES = {
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
  signTransactions: (txns: Uint8Array[]) => Promise<Uint8Array[]>
) {
  const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

  const payTo = DEFAULT_PAY_TO;
  const amountInBaseUnits = Math.round(parseFloat(SIGNAL_PRICE_USDC) * 1_000_000); // 7000

  // 1. Fetch account info + tx params IN PARALLEL for speed
  const [accountInfo, params] = await Promise.all([
    algodClient.accountInformation(userAddress).do().catch(() => null),
    algodClient.getTransactionParams().do(),
  ]);

  // 2. Detect USDC balance (handles algosdk v3 BigInt + camelCase)
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

  // 3. Build Unified 5-Txn Atomic Group (Client -> Router + Router -> 4 Workers)
  let txn0: algosdk.Transaction;

  if (hasUsdcOptIn && usdcBalance >= amountInBaseUnits) {
    console.log(`[x402] Building USDC ASA Transfer for 5-Txn Group...`);
    txn0 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: userAddress,
      sender: userAddress,
      to: payTo,
      receiver: payTo,
      assetIndex: TESTNET_USDC_ASA,
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

  // Worker payouts: $0.002, $0.002, $0.001, $0.001 USDC
  const workerPayouts = [
    { to: WORKER_PAYOUT_ADDRESSES.A, amount: 2000 },
    { to: WORKER_PAYOUT_ADDRESSES.B, amount: 2000 },
    { to: WORKER_PAYOUT_ADDRESSES.C, amount: 1000 },
    { to: WORKER_PAYOUT_ADDRESSES.D, amount: 1000 },
  ];

  const workerTxns: algosdk.Transaction[] = workerPayouts.map(p =>
    algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: payTo,
      sender: payTo,
      to: p.to,
      receiver: p.to,
      amount: p.amount,
      assetIndex: TESTNET_USDC_ASA,
      suggestedParams: params,
    } as any)
  );

  const group5Txns = [txn0, ...workerTxns];
  algosdk.assignGroupID(group5Txns);

  // 4. Prompt user to sign Txn 0 in Lute
  let signedTxns: (Uint8Array | null)[];
  try {
    signedTxns = await signTransactions(group5Txns.map(t => t.toByte()));
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

  const signedClientTxnBase64 = Buffer.from(signedTxns[0]).toString('base64');
  const unsignedWorkerTxnsBase64 = workerTxns.map(t => Buffer.from(t.toByte()).toString('base64'));

  // 5. Send single paid + atomic payout payload to orchestrator
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

  return paidData;
}
