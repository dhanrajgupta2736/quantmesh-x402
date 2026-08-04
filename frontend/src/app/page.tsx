'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { fetchQuantMeshSignal, optInToUSDCAssest } from '@/lib/x402Client';
import { 
  Zap, 
  ShieldCheck, 
  RefreshCw, 
  Wallet, 
  ExternalLink, 
  Coins, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  PlusCircle
} from 'lucide-react';

export default function TerminalPage() {
  const { activeAddress, wallets, signTransactions } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState('ALGO');
  const [loading, setLoading] = useState(false);
  const [optInLoading, setOptInLoading] = useState(false);
  const [signalData, setSignalData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showFaucetGuide, setShowFaucetGuide] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const luteWallet = wallets.find((w) => w.id === 'lute');

  const handleConnectWallet = async () => {
    if (luteWallet) {
      if (luteWallet.isConnected) {
        await luteWallet.disconnect();
      } else {
        await luteWallet.connect();
      }
    }
  };

  const handleOptInUSDC = async () => {
    if (!activeAddress || !luteWallet) return;
    setOptInLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const txId = await optInToUSDCAssest(activeAddress, async (txns: Uint8Array[]) => {
        const signed = await signTransactions(txns);
        return signed.filter((t): t is Uint8Array => t !== null);
      });
      setSuccessMsg(`Opt-In Successful! Confirmed Tx: ${txId.slice(0, 8)}... Now you can execute strategy.`);
    } catch (err: any) {
      setError(err.message || 'Opt-In failed.');
    } finally {
      setOptInLoading(false);
    }
  };

  const handleExecuteStrategy = async () => {
    if (!activeAddress || !luteWallet) {
      setError('Please connect your Lute Wallet to execute strategy on Algorand Testnet.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await fetchQuantMeshSignal(tokenSymbol, activeAddress, async (txns: Uint8Array[]) => {
        const signed = await signTransactions(txns);
        return signed.filter((t): t is Uint8Array => t !== null);
      });

      if (!data || data.status === 'error' || !data.signalFusion) {
        throw new Error(data?.message || 'Received invalid signal data structure.');
      }

      setSignalData(data);
    } catch (err: any) {
      setError(err.message || 'Execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 pb-16">
      {/* Top Banner / Faucet Helper */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-purple-950/80 border-b border-cyan-500/20 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="font-medium text-cyan-300">Algorand Testnet Active</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Pre-Execution Verification Enabled (Zero fee if workers fail)</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFaucetGuide(!showFaucetGuide)}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              <Coins className="w-3.5 h-3.5" />
              Testnet Faucet Info
            </button>
          </div>
        </div>
      </div>

      {/* Testnet Faucet Drawer Modal */}
      {showFaucetGuide && (
        <div className="bg-amber-950/30 border-b border-amber-500/30 px-4 py-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-amber-400" />
                Algorand Testnet Setup:
              </h4>
              <p className="text-slate-300">
                1. Connect Lute Wallet <br />
                2. Fund your address with Testnet ALGO & USDC (ASA ID <strong>10458941</strong>) <br />
                3. Click <strong>Opt-In to USDC ASA 10458941</strong> below <br />
                4. Click <strong>Execute Strategy ($0.007 USDC)</strong> to submit real on-chain transaction!
              </p>
            </div>
            <button 
              onClick={() => setShowFaucetGuide(false)}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Terminal Header */}
      <header className="max-w-7xl mx-auto px-4 pt-8 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500/20 via-slate-900 to-purple-500/20 border border-cyan-500/30 rounded-2xl glow-cyan">
            <Zap className="w-8 h-8 text-cyan-400 animate-pulse-glow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                QuantMesh <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">x402</span>
              </h1>
              <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                v1.0 AVM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Decentralized AI Micropayment Signal Router on Algorand
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <select
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              className="bg-transparent text-xs font-bold px-3 py-2 text-cyan-300 focus:outline-none cursor-pointer"
            >
              <option value="ALGO" className="bg-slate-900 text-white">ALGO / USDC</option>
              <option value="BTC" className="bg-slate-900 text-white">BTC / USDC</option>
              <option value="ETH" className="bg-slate-900 text-white">ETH / USDC</option>
              <option value="SOL" className="bg-slate-900 text-white">SOL / USDC</option>
              <option value="AVAX" className="bg-slate-900 text-white">AVAX / USDC</option>
              <option value="PEPE" className="bg-slate-900 text-white">PEPE / USDC</option>
              <option value="LINK" className="bg-slate-900 text-white">LINK / USDC</option>
              <option value="DOGE" className="bg-slate-900 text-white">DOGE / USDC</option>
              <option value="SUI" className="bg-slate-900 text-white">SUI / USDC</option>
            </select>
          </div>

          <button
            onClick={handleConnectWallet}
            className="flex items-center gap-2.5 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 border border-cyan-500/30 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg text-slate-200"
          >
            <Wallet className="w-4 h-4 text-cyan-400" />
            {mounted && activeAddress ? (
              <span className="text-cyan-300 font-mono">
                {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
              </span>
            ) : (
              'Connect Lute Wallet'
            )}
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 pt-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Hero Card: Fused Signal Radar */}
          <div className="lg:col-span-2 glass-card glass-card-hover rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-between space-y-8">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Fused Market Signal Radar
                </span>
              </div>
              <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Pre-Execution Gated
              </span>
            </div>

            {/* Score & Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-4">
              <div className="space-y-2">
                <div className="text-6xl md:text-7xl font-black tracking-tight text-white font-mono">
                  {signalData?.signalFusion?.compositeScore !== undefined ? (
                    <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
                      {signalData.signalFusion.compositeScore}
                    </span>
                  ) : (
                    <span className="text-slate-600">--</span>
                  )}
                  <span className="text-2xl text-slate-500 font-sans font-normal">/100</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${signalData?.signalFusion ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
                  <p className="text-base font-bold text-emerald-400 tracking-wide">
                    {signalData?.signalFusion?.verdict || 'Awaiting Strategy Execution'}
                  </p>
                  {signalData?.signalFusion?.confidencePct !== undefined && (
                    <span className="text-xs text-slate-400 font-mono">
                      ({signalData.signalFusion.confidencePct}% confidence)
                    </span>
                  )}
                </div>
              </div>

              {/* Primary Action Button */}
              <button
                onClick={handleExecuteStrategy}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                    <span>Signing Transaction...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-slate-950" />
                    <span>Execute Strategy ($0.007 USDC)</span>
                  </>
                )}
              </button>
            </div>

            {/* Success Message Display */}
            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <div className="font-bold">{successMsg}</div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl flex flex-col gap-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <div className="font-bold">{error}</div>
                </div>

                {/* Inline Opt-In Button when ASA 10458941 is not opted-in */}
                {error.includes('opted-in') && (
                  <button
                    onClick={handleOptInUSDC}
                    disabled={optInLoading}
                    className="self-start flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl transition-all text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {optInLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Opting-in via Lute Wallet...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Opt-In to USDC ASA 10458941 Now</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Micro details bar */}
            <div className="pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Single-Gated Payment Guarantee</span>
              </div>
              <span className="font-mono text-cyan-400">Standard Price: $0.0070 USDC / call</span>
            </div>
          </div>

          {/* Right Column: Worker Nodes Metrics */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Sub-Agent Network Status
            </h3>

            {/* Worker A */}
            <div className="glass-card glass-card-hover rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Worker A — LLM Sentiment</span>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">FastAPI</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {signalData?.breakdown?.sentimentScore !== undefined ? `${signalData.breakdown.sentimentScore}% Bullish` : '--'}
              </div>
            </div>

            {/* Worker B */}
            <div className="glass-card glass-card-hover rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Worker B — Whale Flow</span>
                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">n8n Cloud</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {signalData?.breakdown?.onChainWhaleFlow || '--'}
              </div>
            </div>

            {/* Worker C */}
            <div className="glass-card glass-card-hover rounded-2xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Worker C — Technical Analysis</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">n8n Cloud</span>
              </div>
              <div className="text-xl font-bold text-white font-mono">
                {signalData?.breakdown?.technicalIndicator || '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Verified On-Chain Receipt Card */}
        {signalData?.onChainReceipt && (
          <div className="glass-card rounded-3xl p-6 md:p-8 space-y-4 animate-in slide-in-from-bottom-4 duration-300 border-cyan-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Verified On-Chain x402 Settlement Receipt</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                x402 Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Group Transaction ID</span>
                <div className="text-slate-200 break-all">{signalData.groupTxId}</div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">State Storage Box Hash</span>
                <div className="text-slate-200 break-all">{signalData.onChainReceipt.boxStorageHash}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <a
                href={signalData.onChainReceipt.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>View Transaction on AlgoKit Lora Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
