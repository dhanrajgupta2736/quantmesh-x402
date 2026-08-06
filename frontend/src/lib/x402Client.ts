import algosdk from 'algosdk';

const ROUTER_GATEWAY = 'https://api.dhanrajgupta.xyz/api/v1/orchestrate';
const TESTNET_USDC_ASA = 10458941;
const DEFAULT_PAY_TO = '4DTSNS35EP24IFWIGXSG5NSD3GDDTPHNVGEXSHG67JDEHUHUNFR3KJGPO4';
const SIGNAL_PRICE_USDC = '0.007';

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

  // ── INSTANT WALLET POPUP ──────────────────────────────────────────
  // We skip the initial 402 challenge and build the transaction immediately
  // since we already know: price=$0.007, payTo=router address, asset=USDC.
  // This saves 5-15s of worker pre-execution latency before the popup.

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

  // 3. Build transaction (USDC if available, ALGO fallback)
  let txnToSign: algosdk.Transaction;

  if (hasUsdcOptIn && usdcBalance >= amountInBaseUnits) {
    console.log(`[x402] Building USDC ASA Transfer...`);
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
    console.log(`[x402] Building Native ALGO Micropayment (fallback)...`);
    txnToSign = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: userAddress,
      sender: userAddress,
      to: payTo,
      receiver: payTo,
      amount: amountInBaseUnits,
      suggestedParams: params,
    } as any);
  }

  // 4. INSTANT wallet popup — no server round-trip needed
  let signedTxns: Uint8Array[];
  try {
    signedTxns = await signTransactions([txnToSign.toByte()]);
  } catch (signErr: any) {
    // Lute can go stale — this gives the user a clear message
    throw new Error(
      signErr?.message?.includes('User rejected')
        ? 'Transaction was rejected by user.'
        : `Wallet error: ${signErr?.message || 'Could not connect to Lute. Please refresh the page.'}`
    );
  }
  if (!signedTxns || signedTxns.length === 0) {
    throw new Error('Transaction signing was cancelled by user.');
  }

  // 5. Broadcast and wait for confirmation
  let paymentTxId = '';
  try {
    const sendRes = await algodClient.sendRawTransaction(signedTxns[0]).do();
    paymentTxId = sendRes.txid;
    console.log(`[x402] Broadcasted: ${paymentTxId}. Awaiting confirmation...`);
    await algosdk.waitForConfirmation(algodClient, paymentTxId, 4);
  } catch (broadcastErr: any) {
    console.error('[x402] Broadcast Error:', broadcastErr);
    const rawMsg = broadcastErr?.response?.body?.message || broadcastErr?.message || '';
    throw new Error(`Algorand Node Error: ${rawMsg || 'Failed to submit transaction.'}`);
  }

  // 6. Send ONLY the paid request to orchestrator (workers execute once, not twice)
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
