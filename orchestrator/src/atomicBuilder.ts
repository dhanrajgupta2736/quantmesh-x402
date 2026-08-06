import algosdk from 'algosdk';

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN || '',
  process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  process.env.ALGOD_PORT || '443'
);

export interface AtomicPayoutConfig {
  senderAddress: string;
  workerAAddress: string;
  workerBAddress: string;
  workerCAddress: string;
  workerDAddress: string;
  usdcAssetId: number;
}

export async function buildAtomicPaymentGroup(config: AtomicPayoutConfig) {
  const params = await algodClient.getTransactionParams().do();
  
  // Micro-USDC payments (6 decimals: 2000 = $0.0020 USDC)
  const payouts = [
    { to: config.workerAAddress, amount: 2000 }, // Agent A: $0.0020
    { to: config.workerBAddress, amount: 2000 }, // Agent B: $0.0020
    { to: config.workerCAddress, amount: 1000 }, // Agent C: $0.0010
    { to: config.workerDAddress, amount: 1000 }, // Agent D: $0.0010
  ];

  const txns: algosdk.Transaction[] = payouts.map(payout =>
    algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: config.senderAddress,
      sender: config.senderAddress,
      to: payout.to,
      receiver: payout.to,
      amount: payout.amount,
      assetIndex: config.usdcAssetId,
      suggestedParams: params,
    } as any)
  );

  // Group the transactions atomically (All-or-Nothing execution)
  algosdk.assignGroupID(txns);

  return txns;
}

export interface Unified5TxnConfig {
  userAddress: string;
  routerAddress: string;
  workerAAddress: string;
  workerBAddress: string;
  workerCAddress: string;
  workerDAddress: string;
  usdcAssetId: number;
  clientAmountUsdcUnits?: number; // default 7000 ($0.007)
  isUsdc?: boolean;
}

export async function buildUnified5TxnGroup(config: Unified5TxnConfig) {
  const params = await algodClient.getTransactionParams().do();
  const clientAmt = config.clientAmountUsdcUnits || 7000;

  // Txn 0: Client -> Router ($0.007 USDC or ALGO fallback)
  let txn0: algosdk.Transaction;
  if (config.isUsdc !== false) {
    txn0 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: config.userAddress,
      sender: config.userAddress,
      to: config.routerAddress,
      receiver: config.routerAddress,
      assetIndex: config.usdcAssetId,
      amount: clientAmt,
      suggestedParams: params,
    } as any);
  } else {
    txn0 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: config.userAddress,
      sender: config.userAddress,
      to: config.routerAddress,
      receiver: config.routerAddress,
      amount: clientAmt,
      suggestedParams: params,
    } as any);
  }

  // Txns 1-4: Router -> 4 Workers
  const payouts = [
    { to: config.workerAAddress, amount: 2000 },
    { to: config.workerBAddress, amount: 2000 },
    { to: config.workerCAddress, amount: 1000 },
    { to: config.workerDAddress, amount: 1000 },
  ];

  const workerTxns: algosdk.Transaction[] = payouts.map(p =>
    algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: config.routerAddress,
      sender: config.routerAddress,
      to: p.to,
      receiver: p.to,
      amount: p.amount,
      assetIndex: config.usdcAssetId,
      suggestedParams: params,
    } as any)
  );

  const allTxns = [txn0, ...workerTxns];
  algosdk.assignGroupID(allTxns);

  return allTxns;
}

export async function signAndSubmitAtomicGroup(
  txns: algosdk.Transaction[],
  routerSecretKey: Uint8Array
): Promise<{ workerPayoutGroupTxId: string; groupHash: string; confirmedRound: number }> {
  const signedTxns = txns.map(txn => txn.signTxn(routerSecretKey));
  const { txid } = await algodClient.sendRawTransaction(signedTxns).do();
  const confirmed = await algosdk.waitForConfirmation(algodClient, txid, 8);
  const confirmedRound =
    (confirmed as any)['confirmed-round'] ?? (confirmed as any).confirmedRound ?? 0;
  
  let groupHash = '';
  if (txns[0] && txns[0].group) {
    groupHash = Buffer.from(txns[0].group).toString('base64');
  }
  return { workerPayoutGroupTxId: txid, groupHash, confirmedRound };
}

export async function signAndSubmitUnifiedGroup(
  signedClientTxn: Uint8Array,
  workerTxns: algosdk.Transaction[],
  routerSecretKey: Uint8Array
): Promise<{ txId: string; groupHash: string; confirmedRound: number }> {
  const signedWorkerTxns = workerTxns.map(txn => txn.signTxn(routerSecretKey));
  const fullSignedGroup = [signedClientTxn, ...signedWorkerTxns];
  
  const { txid } = await algodClient.sendRawTransaction(fullSignedGroup).do();
  const confirmed = await algosdk.waitForConfirmation(algodClient, txid, 8);
  const confirmedRound =
    (confirmed as any)['confirmed-round'] ?? (confirmed as any).confirmedRound ?? 0;

  let groupHash = '';
  if (workerTxns[0] && workerTxns[0].group) {
    groupHash = Buffer.from(workerTxns[0].group).toString('base64');
  }

  return { txId: txid, groupHash, confirmedRound };
}
