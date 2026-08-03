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
