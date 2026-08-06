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

/**
 * Signs the atomic group with the router's own key and submits it to
 * Algorand TestNet, then waits for confirmation. This is the piece that
 * was previously missing — buildAtomicPaymentGroup only ever constructed
 * the unsigned group; nothing signed or sent it.
 */
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
