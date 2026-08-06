// One-time setup script — opts all 4 worker wallets into USDC TestNet ASA
// Run once before the first real payout attempt.
// Before running: fund each address with TestNet ALGO first.
// Usage: node optin-workers.js

const algosdk = require('algosdk');

const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '443');
const USDC_TESTNET_ASA_ID = 10458941;

const workers = [
  { role: 'WORKER_A', mnemonic: 'chapter kid jacket group oven below abandon cute theory donkey bulb smart uphold craft noble warrior wisdom like open exist acid decade goddess absorb celery' },
  { role: 'WORKER_B', mnemonic: 'solid athlete arrest satoshi maze forest permit face logic this forum fury false initial oven seed gap half about section raw vocal happy abandon fiction' },
  { role: 'WORKER_C', mnemonic: 'pioneer spy jar detect clock tennis clarify leopard track mushroom sniff amount miracle kidney trade lyrics kangaroo country bullet comfort top thunder rotate abandon crisp' },
  { role: 'WORKER_D', mnemonic: 'syrup crawl news forest road endless height rapid boss hawk blade razor kingdom tomorrow goddess north diamond master harbor proof ball donor duty abstract forum' },
];

async function optInWorker(role, mnemonic) {
  const account = algosdk.mnemonicToSecretKey(mnemonic);
  const params = await algodClient.getTransactionParams().do();

  const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
    from: account.addr,
    sender: account.addr,
    to: account.addr,
    receiver: account.addr,
    amount: 0,
    assetIndex: USDC_TESTNET_ASA_ID,
    suggestedParams: params,
  });

  const signedTxn = optInTxn.signTxn(account.sk);
  const { txid } = await algodClient.sendRawTransaction(signedTxn).do();
  await algosdk.waitForConfirmation(algodClient, txid, 8);
  console.log(`${role} (${account.addr}) opted in — txId: ${txid}`);
}

(async () => {
  for (const w of workers) {
    try {
      await optInWorker(w.role, w.mnemonic);
    } catch (err) {
      console.error(`${w.role} failed:`, err.message);
      console.error('Common cause: this address has no TestNet ALGO yet — fund it first.');
    }
  }
})();
