import algosdk from 'algosdk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const ROUTER_MNEMONIC = process.env.ROUTER_MNEMONIC || '';
if (!ROUTER_MNEMONIC) {
    console.error('ROUTER_MNEMONIC not found in .env');
    process.exit(1);
}

const routerAccount = algosdk.mnemonicToSecretKey(ROUTER_MNEMONIC.trim());
const USDC_TESTNET_ASA_ID = 10458941;

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN || '',
  process.env.ALGOD_SERVER || 'https://testnet-api.algonode.cloud',
  process.env.ALGOD_PORT || '443'
);

async function main() {
    console.log("Generating Worker E wallet...");
    const workerE = algosdk.generateAccount();
    const workerEAddress = workerE.addr;
    const workerEMnemonic = algosdk.secretKeyToMnemonic(workerE.sk);
    console.log(`Worker E Address: ${workerEAddress}`);
    console.log(`Worker E Mnemonic: ${workerEMnemonic}`);

    console.log("\nFunding Worker E wallet with 0.3 ALGO from Router...");
    try {
        const params = await algodClient.getTransactionParams().do();
        const fundTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: routerAccount.addr,
            sender: routerAccount.addr,
            to: workerEAddress,
            receiver: workerEAddress,
            amount: 300000, // 0.3 ALGO in microAlgos
            suggestedParams: params,
        } as any);

        const signedFundTxn = fundTxn.signTxn(routerAccount.sk);
        const { txid: fundTxid } = await algodClient.sendRawTransaction(signedFundTxn).do();
        console.log(`Fund TxID: ${fundTxid}`);
        await algosdk.waitForConfirmation(algodClient, fundTxid, 4);
        console.log("Funding confirmed.");

        console.log("\nOpting Worker E into USDC ASA (10458941)...");
        const optInParams = await algodClient.getTransactionParams().do();
        const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
            from: workerEAddress,
            sender: workerEAddress,
            to: workerEAddress,
            receiver: workerEAddress,
            amount: 0,
            assetIndex: USDC_TESTNET_ASA_ID,
            suggestedParams: optInParams,
        } as any);

        const signedOptInTxn = optInTxn.signTxn(workerE.sk);
        const { txid: optInTxid } = await algodClient.sendRawTransaction(signedOptInTxn).do();
        console.log(`Opt-in TxID: ${optInTxid}`);
        await algosdk.waitForConfirmation(algodClient, optInTxid, 4);
        console.log("Opt-in confirmed.");
        
        console.log("\nWallet generation and setup complete.");

        // Append to .env automatically
        const envPath = path.join(__dirname, '.env');
        const envAddition = `\n# Worker E: Regime Classifier\nWORKER_E_URL=http://localhost:5003/agent/regime\nWORKER_E_PAYOUT_ADDR=${workerEAddress}\nWORKER_E_MNEMONIC="${workerEMnemonic}"\n`;
        fs.appendFileSync(envPath, envAddition);
        console.log("Added WORKER_E config to .env");
    } catch (err) {
        console.error("Error setting up wallet:", err);
    }
}

main();
