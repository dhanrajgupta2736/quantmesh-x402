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

    // 3. Inspect user's account info on-chain BEFORE signing to pick USDC ASA vs Native ALGO payment
    let hasUsdcOptIn = false;
    let usdcBalance = 0;

    try {
      const accountInfo = await algodClient.accountInformation(userAddress).do();
      const usdcAsset = accountInfo.assets?.find((a: any) => a['asset-id'] === TESTNET_USDC_ASA);
      if (usdcAsset) {
        hasUsdcOptIn = true;
        usdcBalance = Number(usdcAsset.amount || 0);
      }
    } catch {
      console.warn('[x402] Could not fetch account info, defaulting to ALGO micropayment');
    }

    let txnToSign: algosdk.Transaction;

    if (hasUsdcOptIn && usdcBalance >= amountInBaseUnits) {
      console.log(`[x402] User has ${usdcBalance} USDC. Creating USDC ASA Transfer Txn...`);
      txnToSign = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: userAddress,
        sender: userAddress,
        to: payTo,
        receiver: payTo,
        assetIndex: TESTNET_USDC_ASA,
        amount: amountInBaseUnits,
        suggestedParams: params,
      } as any);
    } else {
      console.log(`[x402] Creating Native ALGO Micropayment Txn (7000 microAlgos = 0.007 ALGO)...`);
      txnToSign = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: userAddress,
        sender: userAddress,
        to: payTo,
        receiver: payTo,
        amount: amountInBaseUnits,
        suggestedParams: params,
      } as any);
    }

    // 4. Prompt user to sign via Lute Wallet
    const signedTxns = await signTransactions([txnToSign.toByte()]);
    if (!signedTxns || signedTxns.length === 0) {
      throw new Error('Transaction signing was cancelled by user.');
    }

    // 5. Broadcast signed transaction to Algorand Testnet node
    let paymentTxId = '';
    try {
      const sendRes = await algodClient.sendRawTransaction(signedTxns[0]).do();
      paymentTxId = sendRes.txid;
      console.log(`[x402] On-chain payment broadcasted: ${paymentTxId}. Waiting for block confirmation...`);
      await algosdk.waitForConfirmation(algodClient, paymentTxId, 4);
    } catch (broadcastErr: any) {
      console.error('[x402] Broadcast Error:', broadcastErr);
      const rawMsg = broadcastErr?.response?.body?.message || broadcastErr?.message || '';
      throw new Error(`Algorand Node Error: ${rawMsg || 'Failed to submit transaction to blockchain.'}`);
    }

    // 6. Re-send request to orchestrator with proof of transaction header
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
