'use client';

import React, { useState } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { fetchQuantMeshSignal } from '@/lib/x402Client';
import { ShieldCheck, Zap, RefreshCw, Wallet } from 'lucide-react';

export default function TerminalPage() {
  const { activeAddress, wallets, signTransactions } = useWallet();
  const [tokenSymbol, setTokenSymbol] = useState('ALGO');
  const [loading, setLoading] = useState(false);
  const [signalData, setSignalData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleExecuteStrategy = async () => {
    if (!activeAddress || !luteWallet) {
      setError('Please connect your Lute Wallet first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchQuantMeshSignal(tokenSymbol, activeAddress, async (txns: Uint8Array[]) => {
        const signed = await signTransactions(txns);
        return signed.filter((t): t is Uint8Array => t !== null);
      });
      setSignalData(data);
    } catch (err: any) {
      setError(err.message || 'Execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <Zap className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">QuantMesh <span className="text-cyan-400">x402</span></h1>
            <p className="text-xs text-slate-400">Algorand AVM Micropayment Signal Router</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={tokenSymbol}
            onChange={(e) => setTokenSymbol(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALGO">ALGO / USDC</option>
            <option value="PEPE">PEPE / USDC</option>
          </select>

          <button
            onClick={handleConnectWallet}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <Wallet className="w-4 h-4 text-cyan-400" />
            {activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'Connect Lute Wallet'}
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero Card */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fused Signal Radar</span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Pre-Execution Pipeline Active
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-2">
            <div>
              <div className="text-5xl font-black text-white tracking-tight">
                {signalData ? `${signalData.signalFusion.compositeScore}/100` : '--/100'}
              </div>
              <p className="text-sm font-semibold text-emerald-400 mt-1">
                {signalData ? signalData.signalFusion.verdict : 'Awaiting Strategy Execution'}
              </p>
            </div>

            <button
              onClick={handleExecuteStrategy}
              disabled={loading}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Requesting Challenge...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Execute Strategy ($0.007 USDC)
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Worker Metrics Grid */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Worker A — Sentiment Agent</span>
            <div className="text-lg font-bold text-white mt-1">
              {signalData ? `${signalData.breakdown.sentimentScore}% Bullish` : '--'}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Worker B — On-Chain Whale Agent (n8n)</span>
            <div className="text-lg font-bold text-white mt-1">
              {signalData ? signalData.breakdown.onChainWhaleFlow : '--'}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400">Worker C — Technical Analysis Agent (n8n)</span>
            <div className="text-lg font-bold text-white mt-1">
              {signalData ? signalData.breakdown.technicalIndicator : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* On-Chain Receipt Drawer */}
      {signalData && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Verified On-Chain x402 Receipt
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-400">
            <div>Group Tx ID: <span className="text-slate-200">{signalData.groupTxId}</span></div>
            <div>Box Storage Hash: <span className="text-slate-200">{signalData.onChainReceipt.boxStorageHash}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
