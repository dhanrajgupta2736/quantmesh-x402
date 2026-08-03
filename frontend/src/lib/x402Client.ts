import algosdk from 'algosdk';

const ROUTER_GATEWAY = 'https://api.dhanrajgupta.xyz/api/v1/orchestrate';
const TESTNET_USDC_ASA = 10458941;
const DEFAULT_PAY_TO = 'HXT5Z6DKIVYOIZB7WHVOGEQVYNGXVMQRMS43WXSGIDYORLE3ZUN63Q36MI';

export async function fetchQuantMeshSignal(
  tokenSymbol: string,
  userAddress: string,
  signTransactions: (txns: Uint8Array[]) => Promise<Uint8Array[]>
) {
  const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

  // 1. Initial request to gateway (Triggers HTTP 402 Payment Challenge)
  const initialRes = await fetch(ROUTER_GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenSymbol }),
  });

  const initialData = await initialRes.json().catch(() => ({}));

  // If worker pipeline failed pre-execution (502) or error returned
  if (initialRes.status === 502 || initialData.status === 'error') {
    throw new Error(initialData.message || 'Worker agents failed to respond.');
  }

  // 2. Parse x402 Payment Required headers
  if (initialRes.status === 402) {
    let payTo = initialRes.headers.get('x-payment-pay-to') || DEFAULT_PAY_TO;
    if (!payTo || payTo.length !== 58 || payTo.includes('YOUR_ROUTER')) {
      payTo = DEFAULT_PAY_TO;
    }

    const priceUsdc = initialRes.headers.get('x-payment-price') || '0.007';

    // 3. Build Algorand Testnet ASA Transfer Txn ($0.007 USDC = 7000 base units)
    const params = await algodClient.getTransactionParams().do();
    const amountInBaseUnits = Math.round(parseFloat(priceUsdc) * 1_000_000); // 6 decimals

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: userAddress,
      sender: userAddress,
      to: payTo,
      receiver: payTo,
      assetIndex: TESTNET_USDC_ASA,
      amount: amountInBaseUnits,
      suggestedParams: params,
    } as any);

    // 4. Prompt user to sign via Lute Wallet
    const signedTxns = await signTransactions([txn.toByte()]);
    if (!signedTxns || signedTxns.length === 0) {
      throw new Error('Transaction signing was cancelled by user.');
    }

    // 5. Broadcast signed transaction to Algorand Testnet node
    let paymentTxId = '';
    try {
      const sendRes = await algodClient.sendRawTransaction(signedTxns).do();
      paymentTxId = sendRes.txid;
      console.log(`[x402] On-chain payment broadcasted to Algorand: ${paymentTxId}`);
    } catch (broadcastErr: any) {
      const stx = algosdk.decodeSignedTransaction(signedTxns[0]);
      paymentTxId = stx.txn.txID();
    }

    // 6. Re-send request with proof of transaction header
    const paidRes = await fetch(ROUTER_GATEWAY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-payment-txn-id': paymentTxId,
      },
      body: JSON.stringify({ tokenSymbol }),
    });

    const paidData = await paidRes.json().catch(() => ({}));

    if (!paidRes.ok || paidData.status === 'error') {
      throw new Error(paidData.message || `Payment verification failed: ${paidRes.statusText}`);
    }

    return paidData;
  }

  return initialData;
}
