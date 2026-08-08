import algosdk from 'algosdk';

const ROUTER_GATEWAY = 'https://api.dhanrajgupta.xyz/api/v1/orchestrate';
const TESTNET_USDC_ASA = 10458941;



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
  signTransactions: (txns: Uint8Array[], indexesToSign?: number[]) => Promise<Uint8Array[]>,
  endpointType: 'consensus' | 'sentiment' = 'consensus'
) {
  const targetGateway = endpointType === 'sentiment'
    ? 'https://api.dhanrajgupta.xyz/api/v1/sentiment-only'
    : 'https://api.dhanrajgupta.xyz/api/v1/orchestrate';

  const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', 443);

  // ═══════════════════════════════════════════════════════════════════
  // x402 STEP 1: PROBE — Send request without payment to get 402 challenge
  // ═══════════════════════════════════════════════════════════════════
  console.log(`[x402] Step 1: Probing ${endpointType} endpoint for 402 payment challenge...`);
  const probeRes = await fetch(targetGateway, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenSymbol }),
  });

  if (probeRes.ok) {
    const data = await probeRes.json();
    if (data.status === 'success') return data;
  }

  if (probeRes.status !== 402) {
    const errBody = await probeRes.json().catch(() => ({}));
    throw new Error(errBody.message || `Unexpected server response: ${probeRes.status}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // x402 STEP 2: READ 402 CHALLENGE — Extract live payment parameters from server response
  // ═══════════════════════════════════════════════════════════════════
  console.log(`[x402] Step 2: Reading 402 challenge parameters for ${endpointType}...`);
  const challengeBody = await probeRes.json().catch(() => ({}));

  // Read payTo, price, and asset parameters directly from HTTP 402 headers & body (Host compliant pattern)
  const payTo = probeRes.headers.get('x-payment-pay-to') || challengeBody.payTo || '4DTSNS35EP24IFWIGXSG5NSD3GDDTPHNVGEXSHG67JDEHUHUNFR3KJGPO4';
  const priceStr =
    probeRes.headers.get('x-payment-price') ||
    challengeBody.priceUsdc ||
    (endpointType === 'sentiment' ? '0.002' : '0.007');
  const usdcAsaId = challengeBody.usdcAsaId || TESTNET_USDC_ASA;
  const amountInBaseUnits = Math.round(parseFloat(priceStr) * 1_000_000);
  console.log(`[x402] Live 402 Challenge Read -> Endpoint: ${endpointType} | PayTo: ${payTo} | Price: $${priceStr} USDC (${amountInBaseUnits} µUSDC)`);

  // ═══════════════════════════════════════════════════════════════════
  // x402 STEP 3: SIGN — Build clean payment transaction & prompt Lute
  // ═══════════════════════════════════════════════════════════════════
  const [accountInfo, params] = await Promise.all([
    algodClient.accountInformation(userAddress).do().catch(() => null),
    algodClient.getTransactionParams().do(),
  ]);

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
    }
  }

  if (!hasUsdcOptIn) {
    throw new Error(`USDC Opt-In Required: Please click 'USDC Opt-In' in the header to opt into Testnet USDC ASA (${usdcAsaId}).`);
  }

  if (usdcBalance < amountInBaseUnits) {
    const reqAmountStr = (amountInBaseUnits / 1_000_000).toFixed(4);
    const currentBalanceStr = (usdcBalance / 1_000_000).toFixed(4);
    throw new Error(`Insufficient USDC Balance: Strategy execution requires $${reqAmountStr} USDC (ASA ${usdcAsaId}), but your balance is $${currentBalanceStr} USDC.`);
  }

  const txn0 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: userAddress,
    sender: userAddress,
    to: payTo,
    receiver: payTo,
    assetIndex: usdcAsaId,
    amount: amountInBaseUnits,
    suggestedParams: params,
  } as any);

  console.log('[x402] Prompting Lute Wallet to sign payment transaction...');
  let signedTxns: Uint8Array[];
  try {
    signedTxns = await signTransactions([txn0.toByte()]);
  } catch (signErr: any) {
    console.error('[x402] Wallet signing error:', signErr);
    throw new Error(
      signErr?.message?.includes('User rejected')
        ? 'Transaction was rejected by user.'
        : `Wallet error: ${signErr?.message || 'Could not connect to Lute Wallet.'}`
    );
  }

  if (!signedTxns || !signedTxns[0]) {
    throw new Error('Transaction signing was cancelled by user.');
  }

  // Submit client payment to Algorand Testnet
  console.log('[x402] Submitting payment transaction to Algorand Testnet...');
  const sendRes = await algodClient.sendRawTransaction(signedTxns[0]).do();
  const paymentTxId = sendRes.txid;

  console.log(`[x402] Payment transaction submitted! TxId: ${paymentTxId}. Waiting for 1-block confirmation...`);
  await algosdk.waitForConfirmation(algodClient, paymentTxId, 4);

  // ═══════════════════════════════════════════════════════════════════
  // x402 STEP 4: RETRY — Send request with verified payment transaction ID
  // ═══════════════════════════════════════════════════════════════════
  console.log(`[x402] Step 4: Retrying request to ${endpointType} with verified paymentTxId: ${paymentTxId}...`);
  const paidRes = await fetch(targetGateway, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-payment-txn-id': paymentTxId,
    },
    body: JSON.stringify({
      tokenSymbol,
      clientPaymentTxId: paymentTxId,
    }),
  });

  const paidData = await paidRes.json().catch(() => ({}));

  if (!paidRes.ok || paidData.status === 'error') {
    throw new Error(paidData.message || `Payment verification failed: ${paidRes.statusText}`);
  }

  console.log('[x402] ✅ Full x402 protocol execution complete!');
  return paidData;
}
