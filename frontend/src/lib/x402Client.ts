import algosdk from 'algosdk';

const ROUTER_GATEWAY = 'https://api.dhanrajgupta.xyz/api/v1/orchestrate';
const TESTNET_USDC_ASA = 10458941;
const DEFAULT_PAY_TO = 'HXT5Z6DKIVYOIZB7WHVOGEQVYNGXVMQRMS43WXSGIDYORLE3ZUN63Q36MI';

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
    const params = await algodClient.getTransactionParams().do();
    const amountInBaseUnits = Math.round(parseFloat(priceUsdc) * 1_000_000); // 7000 base units

    // 3. Try USDC ASA Transfer Txn first, fallback to ALGO Micropayment if balance/opt-in error occurs
    let paymentTxId = '';

    try {
      // Build USDC ASA Transfer Txn
      const usdcTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: userAddress,
        sender: userAddress,
        to: payTo,
        receiver: payTo,
        assetIndex: TESTNET_USDC_ASA,
        amount: amountInBaseUnits,
        suggestedParams: params,
      } as any);

      const signedTxns = await signTransactions([usdcTxn.toByte()]);
      if (!signedTxns || signedTxns.length === 0) {
        throw new Error('Transaction signing was cancelled by user.');
      }

      const sendRes = await algodClient.sendRawTransaction(signedTxns[0]).do();
      paymentTxId = sendRes.txid;
      console.log(`[x402] USDC ASA micropayment broadcasted: ${paymentTxId}. Waiting for block confirmation...`);
      await algosdk.waitForConfirmation(algodClient, paymentTxId, 4);
    } catch (usdcErr: any) {
      const rawMsg = usdcErr?.response?.body?.message || usdcErr?.message || '';
      
      // If USDC transfer failed due to 0 USDC balance or missing ASA opt-in, switch seamlessly to ALGO Payment
      if (rawMsg.includes('underflow') || rawMsg.includes('missing') || rawMsg.includes('asset') || rawMsg.includes('USDC')) {
        console.log('[x402] Switching to Native ALGO Micropayment Txn (0.007 ALGO)...');

        const algoTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: userAddress,
          sender: userAddress,
          to: payTo,
          receiver: payTo,
          amount: amountInBaseUnits, // 7000 microAlgos = 0.007 ALGO
          suggestedParams: params,
        } as any);

        const signedAlgoTxns = await signTransactions([algoTxn.toByte()]);
        if (!signedAlgoTxns || signedAlgoTxns.length === 0) {
          throw new Error('Transaction signing was cancelled by user.');
        }

        const sendAlgoRes = await algodClient.sendRawTransaction(signedAlgoTxns[0]).do();
        paymentTxId = sendAlgoRes.txid;
        console.log(`[x402] Native ALGO micropayment broadcasted: ${paymentTxId}. Waiting for block confirmation...`);
        await algosdk.waitForConfirmation(algodClient, paymentTxId, 4);
      } else {
        throw usdcErr;
      }
    }

    // 4. Re-send request to orchestrator with proof of transaction header
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
