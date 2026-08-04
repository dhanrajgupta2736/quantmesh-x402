'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  PlusCircle,
  Clock,
  TrendingUp,
  Brain,
  BarChart3,
  GitMerge,
  ArrowRight,
  Code2,
  Globe,
  ChevronDown,
  ChevronUp,
  Heart,
} from 'lucide-react';

// ─── Score Gauge Component ──────────────────────────────────────────
function ScoreGauge({ score, size = 180 }: { score: number | null; size?: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = score ?? 0;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)', label: 'text-emerald-400' };
    if (s >= 55) return { stroke: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', label: 'text-cyan-400' };
    if (s >= 45) return { stroke: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', label: 'text-yellow-400' };
    if (s >= 30) return { stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.4)', label: 'text-orange-400' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', label: 'text-red-400' };
  };

  const colors = getColor(normalizedScore);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size }}>
        {/* Background track */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="6" />
        {/* Score arc */}
        {score !== null && (
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="animate-score-fill"
            style={{ 
              filter: `drop-shadow(0 0 8px ${colors.glow})`,
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl md:text-5xl font-black font-mono-brand ${score !== null ? colors.label : 'text-slate-600'}`}>
          {score !== null ? score : '--'}
        </span>
        <span className="text-xs text-slate-500 font-medium mt-0.5">/100</span>
      </div>
    </div>
  );
}

// ─── Worker Status Dot ─────────────────────────────────────────────
function StatusDot({ status }: { status: 'online' | 'offline' | 'degraded' | 'unknown' }) {
  const colorMap = {
    online: 'bg-emerald-400',
    degraded: 'bg-yellow-400',
    offline: 'bg-red-400',
    unknown: 'bg-slate-500',
  };
  return (
    <span className="flex h-2.5 w-2.5 relative">
      {status === 'online' && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorMap[status]} opacity-75`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colorMap[status]}`} />
    </span>
  );
}

// ─── Types ──────────────────────────────────────────────────────────
interface WorkerHealth {
  status: 'online' | 'offline' | 'degraded';
  latencyMs: number;
}

interface HealthData {
  status: string;
  uptime: string;
  workers: {
    sentiment: WorkerHealth;
    onchain: WorkerHealth;
    ta: WorkerHealth;
    fusion: WorkerHealth;
  };
}

interface SignalHistoryEntry {
  id: string;
  token: string;
  score: number;
  verdict: string;
  confidence: number;
  txId: string;
  explorerUrl: string;
  timestamp: number;
}

// ─── Main Page ─────────────────────────────────────────────────────
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
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [signalHistory, setSignalHistory] = useState<SignalHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Load history from localStorage
    try {
      const saved = localStorage.getItem('quantmesh_history');
      if (saved) setSignalHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // Poll health endpoint every 30s
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('https://api.dhanrajgupta.xyz/api/v1/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch {
      // silently ignore health check failures
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

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

      // Add to history
      const entry: SignalHistoryEntry = {
        id: crypto.randomUUID(),
        token: tokenSymbol,
        score: data.signalFusion.compositeScore,
        verdict: data.signalFusion.verdict,
        confidence: data.signalFusion.confidencePct,
        txId: data.groupTxId,
        explorerUrl: data.onChainReceipt?.explorerUrl || '',
        timestamp: Date.now(),
      };
      const updated = [entry, ...signalHistory].slice(0, 50);
      setSignalHistory(updated);
      localStorage.setItem('quantmesh_history', JSON.stringify(updated));
    } catch (err: any) {
      setError(err.message || 'Execution failed.');
    } finally {
      setLoading(false);
    }
  };

  const tokens = [
    { value: 'ALGO', label: 'ALGO / USDC', icon: '◆' },
    { value: 'BTC', label: 'BTC / USDC', icon: '₿' },
    { value: 'ETH', label: 'ETH / USDC', icon: 'Ξ' },
    { value: 'SOL', label: 'SOL / USDC', icon: '◎' },
    { value: 'AVAX', label: 'AVAX / USDC', icon: '▲' },
    { value: 'PEPE', label: 'PEPE / USDC', icon: '🐸' },
    { value: 'LINK', label: 'LINK / USDC', icon: '⬡' },
    { value: 'DOGE', label: 'DOGE / USDC', icon: 'Ð' },
    { value: 'SUI', label: 'SUI / USDC', icon: '〜' },
  ];

  const steps = [
    { icon: Coins, title: 'Select Token', desc: 'Choose from 9 supported crypto pairs', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { icon: Wallet, title: 'Pay $0.007', desc: 'Atomic micropayment via Lute Wallet', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { icon: Brain, title: 'AI Agents Analyze', desc: '4 workers run sentiment, on-chain & TA', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { icon: TrendingUp, title: 'Receive Signal', desc: 'Fused score with on-chain receipt', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const getWorkerStatus = (key: 'sentiment' | 'onchain' | 'ta' | 'fusion'): WorkerHealth => {
    return healthData?.workers?.[key] || { status: 'unknown' as any, latencyMs: 0 };
  };

  return (
    <div className="min-h-screen text-slate-100">
      {/* ─── Top Status Bar ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-purple-950/60 border-b border-cyan-500/15 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="font-semibold text-cyan-300">Algorand Testnet</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Pre-Execution Gated • Zero-Fee Guarantee</span>
            {healthData && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">Uptime: <span className="text-cyan-400 font-mono-brand">{healthData.uptime}</span></span>
              </>
            )}
          </div>
          <button 
            onClick={() => setShowFaucetGuide(!showFaucetGuide)}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            <Coins className="w-3.5 h-3.5" />
            Testnet Faucet
          </button>
        </div>
      </div>

      {/* Faucet Guide Drawer */}
      {showFaucetGuide && (
        <div className="bg-amber-950/25 border-b border-amber-500/25 px-4 py-4 animate-fade-up">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="space-y-1.5">
              <h4 className="font-bold text-amber-300 flex items-center gap-2 text-sm">
                <Coins className="w-4 h-4 text-amber-400" />
                Algorand Testnet Setup:
              </h4>
              <p className="text-slate-300 leading-relaxed">
                1. Connect Lute Wallet → 2. Fund with Testnet ALGO & USDC (ASA <strong>10458941</strong>) → 3. Click <strong>Opt-In</strong> → 4. Execute Strategy ($0.007)
              </p>
            </div>
            <button 
              onClick={() => setShowFaucetGuide(false)}
              className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─── Header ────────────────────────────────────────────── */}
      <header className="max-w-7xl mx-auto px-4 pt-10 pb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="p-3.5 bg-gradient-to-br from-cyan-500/15 via-slate-900/50 to-purple-500/15 border border-cyan-500/25 rounded-2xl glow-cyan animate-float">
            <Zap className="w-9 h-9 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                QuantMesh <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">x402</span>
              </h1>
              <span className="bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                v1.0 AVM
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Decentralized AI Micropayment Signal Router on Algorand
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-slate-900/80 border border-slate-700/60 p-1 rounded-xl">
            <select
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              className="bg-transparent text-xs font-bold px-3 py-2.5 text-cyan-300 focus:outline-none cursor-pointer font-mono-brand"
            >
              {tokens.map(t => (
                <option key={t.value} value={t.value} className="bg-slate-900 text-white">
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleConnectWallet}
            className="flex items-center gap-2.5 bg-gradient-to-r from-slate-800/90 to-slate-800/60 hover:from-slate-700/90 hover:to-slate-700/60 border border-cyan-500/25 hover:border-cyan-500/40 text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg text-slate-200"
          >
            <Wallet className="w-4 h-4 text-cyan-400" />
            {mounted && activeAddress ? (
              <span className="text-cyan-300 font-mono-brand">
                {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
              </span>
            ) : (
              'Connect Lute Wallet'
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 space-y-10 pb-20">

        {/* ─── How It Works ──────────────────────────────────── */}
        <section>
          <button 
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-300 transition-colors mb-4"
          >
            <GitMerge className="w-4 h-4 text-purple-400" />
            How It Works
            {showHowItWorks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showHowItWorks && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up">
              {steps.map((step, i) => (
                <div key={i} className="step-card glass-card rounded-2xl p-5 space-y-3 relative">
                  {i < steps.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 z-10" />
                  )}
                  <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 font-mono-brand">STEP {i + 1}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-0.5">{step.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Main Grid ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Hero Card: Score + Action */}
          <div className="lg:col-span-2 glass-card glass-card-hover rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col justify-between space-y-6">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/[0.06] rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-purple-500/[0.06] rounded-full blur-3xl pointer-events-none" />

            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Fused Market Signal
                </span>
              </div>
              <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Pre-Execution Gated
              </span>
            </div>

            {/* Score Gauge + Verdict + Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ScoreGauge score={signalData?.signalFusion?.compositeScore ?? null} />
                <div className="text-center sm:text-left space-y-2">
                  <p className={`text-xl font-bold tracking-wide ${signalData?.signalFusion ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {signalData?.signalFusion?.verdict || 'Awaiting Execution'}
                  </p>
                  {signalData?.signalFusion?.confidencePct !== undefined && (
                    <p className="text-xs text-slate-400 font-mono-brand">
                      Confidence: {signalData.signalFusion.confidencePct}%
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {tokenSymbol} / USDC
                  </p>
                </div>
              </div>

              <button
                onClick={handleExecuteStrategy}
                disabled={loading}
                className="w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer text-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                    <span>Signing Transaction...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-slate-950" />
                    <span>Execute Strategy ($0.007)</span>
                  </>
                )}
              </button>
            </div>

            {/* Success / Error Messages */}
            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs rounded-xl flex items-center gap-3 animate-fade-up">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <div className="font-bold">{successMsg}</div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-xl flex flex-col gap-3 animate-fade-up">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="font-bold">{error}</div>
                </div>
                {error.includes('opted-in') && (
                  <button
                    onClick={handleOptInUSDC}
                    disabled={optInLoading}
                    className="self-start flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-xl transition-all text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {optInLoading ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Opting-in...</span></>
                    ) : (
                      <><PlusCircle className="w-3.5 h-3.5" /><span>Opt-In to USDC ASA 10458941</span></>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Bottom bar */}
            <div className="pt-4 border-t border-slate-800/50 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Single-Gated Payment Guarantee</span>
              </div>
              <span className="font-mono-brand text-cyan-400/80">$0.0070 USDC per call</span>
            </div>
          </div>

          {/* ─── Right: Worker Status Cards ──────────────────── */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Sub-Agent Network
              {healthData && (
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  healthData.status === 'healthy' 
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                    : 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                }`}>
                  {healthData.status === 'healthy' ? 'All Online' : 'Degraded'}
                </span>
              )}
            </h3>

            {/* Worker A */}
            <div className="glass-card glass-card-hover rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={getWorkerStatus('sentiment').status as any} />
                  <span className="text-xs text-slate-400 font-medium">Worker A — FinBERT Sentiment</span>
                </div>
                <div className="flex items-center gap-2">
                  {getWorkerStatus('sentiment').latencyMs > 0 && (
                    <span className="text-[9px] font-mono-brand text-slate-500">{getWorkerStatus('sentiment').latencyMs}ms</span>
                  )}
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">FastAPI</span>
                </div>
              </div>
              <div className="text-xl font-bold text-white font-mono-brand">
                {signalData?.breakdown?.sentimentScore !== undefined ? `${signalData.breakdown.sentimentScore}% Bullish` : '--'}
              </div>
            </div>

            {/* Worker B */}
            <div className="glass-card glass-card-hover rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={getWorkerStatus('onchain').status as any} />
                  <span className="text-xs text-slate-400 font-medium">Worker B — Whale Flow</span>
                </div>
                <div className="flex items-center gap-2">
                  {getWorkerStatus('onchain').latencyMs > 0 && (
                    <span className="text-[9px] font-mono-brand text-slate-500">{getWorkerStatus('onchain').latencyMs}ms</span>
                  )}
                  <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">n8n</span>
                </div>
              </div>
              <div className="text-xl font-bold text-white font-mono-brand">
                {signalData?.breakdown?.onChainWhaleFlow || '--'}
              </div>
            </div>

            {/* Worker C */}
            <div className="glass-card glass-card-hover rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={getWorkerStatus('ta').status as any} />
                  <span className="text-xs text-slate-400 font-medium">Worker C — Technical Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  {getWorkerStatus('ta').latencyMs > 0 && (
                    <span className="text-[9px] font-mono-brand text-slate-500">{getWorkerStatus('ta').latencyMs}ms</span>
                  )}
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">n8n</span>
                </div>
              </div>
              <div className="text-xl font-bold text-white font-mono-brand">
                {signalData?.breakdown?.technicalIndicator || '--'}
              </div>
            </div>

            {/* Worker D (Fusion) */}
            <div className="glass-card glass-card-hover rounded-2xl p-5 space-y-3 border-cyan-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={getWorkerStatus('fusion').status as any} />
                  <span className="text-xs text-slate-400 font-medium">Worker D — Fusion Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  {getWorkerStatus('fusion').latencyMs > 0 && (
                    <span className="text-[9px] font-mono-brand text-slate-500">{getWorkerStatus('fusion').latencyMs}ms</span>
                  )}
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">FastAPI</span>
                </div>
              </div>
              <div className="text-sm font-medium text-slate-300">
                {signalData?.signalFusion ? (
                  <span className="font-mono-brand">
                    W<sub>s</sub>=0.30 × W<sub>o</sub>=0.35 × W<sub>t</sub>=0.35
                  </span>
                ) : (
                  <span className="text-slate-500">Weighted composite awaiting input</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── On-Chain Receipt ──────────────────────────────── */}
        {signalData?.onChainReceipt && (
          <div className="glass-card rounded-3xl p-6 md:p-8 space-y-4 animate-fade-up border-cyan-500/25">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Verified On-Chain x402 Settlement Receipt</h3>
              </div>
              <span className="text-xs font-mono-brand text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
                x402 Verified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono-brand bg-slate-950/50 p-4 rounded-2xl border border-slate-800/60">
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Transaction ID</span>
                <div className="text-slate-200 break-all text-[11px]">{signalData.groupTxId}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Cost</span>
                <div className="text-emerald-400 font-bold">{signalData.totalCostUsdc} USDC</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Box Storage Hash</span>
                <div className="text-slate-200 break-all text-[11px]">{signalData.onChainReceipt.boxStorageHash}</div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <a
                href={signalData.onChainReceipt.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span>View on AlgoKit Lora Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* ─── Transaction History ───────────────────────────── */}
        {signalHistory.length > 0 && (
          <section>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-300 transition-colors mb-4"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              Signal History ({signalHistory.length})
              {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showHistory && (
              <div className="glass-card rounded-2xl overflow-hidden animate-fade-up">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/60">
                        <th className="px-4 py-3 text-left text-slate-500 uppercase tracking-wider font-semibold">Time</th>
                        <th className="px-4 py-3 text-left text-slate-500 uppercase tracking-wider font-semibold">Token</th>
                        <th className="px-4 py-3 text-left text-slate-500 uppercase tracking-wider font-semibold">Score</th>
                        <th className="px-4 py-3 text-left text-slate-500 uppercase tracking-wider font-semibold">Verdict</th>
                        <th className="px-4 py-3 text-left text-slate-500 uppercase tracking-wider font-semibold">Confidence</th>
                        <th className="px-4 py-3 text-right text-slate-500 uppercase tracking-wider font-semibold">Explorer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signalHistory.map((entry) => (
                        <tr key={entry.id} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3 text-slate-400 font-mono-brand whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 font-bold text-white">{entry.token}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold font-mono-brand ${
                              entry.score >= 70 ? 'text-emerald-400' : 
                              entry.score >= 45 ? 'text-cyan-400' : 'text-red-400'
                            }`}>
                              {entry.score}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              entry.verdict.includes('BUY') ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                              entry.verdict === 'NEUTRAL' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                              'text-red-400 bg-red-500/10 border-red-500/20'
                            }`}>
                              {entry.verdict}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono-brand">{entry.confidence}%</td>
                          <td className="px-4 py-3 text-right">
                            <a href={entry.explorerUrl} target="_blank" rel="noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 transition-colors">
                              <ExternalLink className="w-3.5 h-3.5 inline" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ─── Tech Stack Grid ───────────────────────────────── */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Architecture Stack
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: 'Next.js 16', desc: 'Frontend', color: 'border-slate-600' },
              { name: 'Hono.js', desc: 'Orchestrator', color: 'border-orange-500/30' },
              { name: 'x402 AVM', desc: 'Payment Protocol', color: 'border-purple-500/30' },
              { name: 'Algorand', desc: 'Blockchain', color: 'border-cyan-500/30' },
              { name: 'FinBERT', desc: 'NLP Sentiment', color: 'border-amber-500/30' },
              { name: 'n8n Cloud', desc: 'Worker Automation', color: 'border-pink-500/30' },
            ].map((tech) => (
              <div key={tech.name} className={`glass-card rounded-xl p-3 text-center border ${tech.color} space-y-1`}>
                <div className="text-xs font-bold text-white">{tech.name}</div>
                <div className="text-[10px] text-slate-500">{tech.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/50 bg-slate-950/80 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-500" />
            <span className="font-bold text-slate-400">QuantMesh x402</span>
            <span className="text-slate-700">•</span>
            <span>Built for AlgoVerse 2026 Hackathon (PS0404)</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/dhanrajgupta2736/quantmesh-x402" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
              <Code2 className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <a href="https://api.dhanrajgupta.xyz/api/v1/health" target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors">
              <Globe className="w-4 h-4" />
              <span>API</span>
            </a>
            <span className="flex items-center gap-1 text-slate-600">
              Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> on Algorand
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
