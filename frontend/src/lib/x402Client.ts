import algosdk from 'algosdk';

const ROUTER_GATEWAY = 'https://api.dhanrajgupta.xyz/api/v1/orchestrate';
const TESTNET_USDC_ASA = 10458941;

export async function fetchQuantMeshSignal(
  tokenSymbol: string,
  userAddress: string,
  signTransactions: (txns: Uint8Array[]) => Promise<Uint8Array[]>
) {
  // 1. Initial request to gateway (Triggers HTTP 402 Payment Challenge)
  const initialRes = await fetch(ROUTER_GATEWAY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenSymbol }),
  });

  // If worker pipeline failed pre-execution
  if (initialRes.status === 502) {
    const errorData = await initialRes.json();
    throw new Error(errorData.message || 'Worker agents failed to respond.');
  }

  // 2. Parse x402 Payment Required headers
  if (initialRes.status === 402) {
    const payTo = initialRes.headers.get('x-payment-pay-to') || 'HXT5Z6DKIVYOIZB7WHVOGEQVYNGXVMQRMS43WXSGIDYORLE3ZUN63Q36MI';
    const priceUsdc = initialRes.headers.get('x-payment-price') || '0.007';

    // 3. Build Algorand Testnet ASA Transfer Txn ($0.007 USDC = 7000 base units)
    const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);
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
    const stx = algosdk.decodeSignedTransaction(signedTxns[0]);
    const paymentTxId = stx.txn.txID();

    // 5. Re-send request with proof of transaction header
    const paidRes = await fetch(ROUTER_GATEWAY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-payment-txn-id': paymentTxId,
      },
      body: JSON.stringify({ tokenSymbol }),
    });

    if (!paidRes.ok) {
      throw new Error(`Payment verification failed: ${paidRes.statusText}`);
    }

    return await paidRes.json();
  }

  return await initialRes.json();
}
