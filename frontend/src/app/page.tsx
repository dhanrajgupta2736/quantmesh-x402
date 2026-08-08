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
  Clock,
  TrendingUp,
  Brain,
  Sparkles,
  Copy,
  Check,
  Globe,
  GitMerge
} from 'lucide-react';

// ─── Score Gauge Component ──────────────────────────────────────────
function ScoreGauge({ score, size = 180 }: { score: number | null; size?: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = score ?? 0;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.5)', label: 'text-emerald-400' };
    if (s >= 55) return { stroke: '#06b6d4', glow: 'rgba(6, 182, 212, 0.5)', label: 'text-cyan-400' };
    if (s >= 45) return { stroke: '#eab308', glow: 'rgba(234, 179, 8, 0.5)', label: 'text-amber-400' };
    if (s >= 30) return { stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.5)', label: 'text-orange-400' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', label: 'text-rose-400' };
  };

  const colors = getColor(normalizedScore);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size }}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(30, 41, 59, 0.7)" strokeWidth="7" />
        {score !== null && (
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="animate-score-fill"
            style={{ 
              filter: `drop-shadow(0 0 10px ${colors.glow})`,
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl md:text-5xl font-black font-mono-brand tracking-tighter ${score !== null ? colors.label : 'text-slate-600'}`}>
          {score !== null ? score : '--'}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">/ 100 SCORE</span>
      </div>
    </div>
  );
}

// ─── Status Pulse Dot ─────────────────────────────────────────────
function StatusDot({ status }: { status: 'online' | 'offline' | 'degraded' | 'unknown' }) {
  const colorMap = {
    online: 'bg-emerald-400',
    degraded: 'bg-amber-400',
    offline: 'bg-rose-400',
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

interface WorkerHealth {
  status: 'online' | 'offline' | 'degraded' | 'unknown';
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
  compositeScore: number;
  verdict: string;
  txId: string;
  timestamp: string;
  cost: string;
}

const SUPPORTED_TOKENS = [
  { symbol: 'ALGO', name: 'Algorand', icon: '⚡' },
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'SOL', name: 'Solana', icon: '◎' },
  { symbol: 'AVAX', name: 'Avalanche', icon: '🔺' },
  { symbol: 'PEPE', name: 'Pepe Coin', icon: '🐸' },
  { symbol: 'LINK', name: 'Chainlink', icon: '⬡' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: '🐕' },
  { symbol: 'SUI', name: 'Sui Network', icon: '💧' },
];

export default function QuantMeshPage() {
  const { wallets, activeAddress, signTransactions } = useWallet();
  const luteWallet = wallets.find((w) => w.id === 'lute' || w.metadata.name.toLowerCase().includes('lute')) || wallets[0];

  const [mounted, setMounted] = useState(false);
  const [selectedToken, setSelectedToken] = useState('ALGO');
  const [activeEndpoint, setActiveEndpoint] = useState<'consensus' | 'sentiment'>('consensus');
  const [loading, setLoading] = useState(false);
  const [optInLoading, setOptInLoading] = useState(false);
  const [signalData, setSignalData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<SignalHistoryEntry[]>([]);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [copiedTxId, setCopiedTxId] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Prevent SSR Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Poll Network Health
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('https://api.dhanrajgupta.xyz/api/v1/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
      }
    } catch {
      // Keep previous state
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 12000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const handleCopyTx = (txId: string) => {
    navigator.clipboard.writeText(txId);
    setCopiedTxId(true);
    setTimeout(() => setCopiedTxId(false), 2000);
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
      setSuccessMsg(`Opt-In Successful! Tx: ${txId.slice(0, 8)}... Ready to execute strategies.`);
    } catch (err: any) {
      setError(err.message || 'Opt-In failed.');
    } finally {
      setOptInLoading(false);
    }
  };

  const handleExecuteStrategy = async () => {
    if (!activeAddress) {
      setError('Please connect your Lute Wallet to execute strategy on Algorand Testnet.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setCurrentStep(1); // Step 1: Probe Challenge

    try {
      setTimeout(() => setCurrentStep(2), 500); // Step 2: Sign Prompt

      console.log(`[UI Handshake] Executing strategy | activeEndpoint: ${activeEndpoint} | token: ${selectedToken}`);

      const data = await fetchQuantMeshSignal(
        selectedToken, 
        activeAddress, 
        async (txns: Uint8Array[], indexesToSign?: number[]) => {
          const signed = await signTransactions(txns, indexesToSign);
          return signed.filter((t): t is Uint8Array => t !== null);
        },
        activeEndpoint
      );

      setCurrentStep(3); // Step 3: Algorand Block Settlement

      if (!data || data.status === 'error' || (!data.signalFusion && !data.sentiment)) {
        throw new Error(data?.message || 'Received invalid signal data structure.');
      }

      setCurrentStep(4); // Step 4: Facilitator Verification Receipt
      setSignalData(data);

      const entry: SignalHistoryEntry = {
        id: Math.random().toString(36).substring(2, 9),
        token: selectedToken,
        compositeScore: data.signalFusion?.compositeScore ?? data.sentiment?.score ?? 70,
        verdict: data.signalFusion?.verdict ?? data.sentiment?.sentimentVerdict ?? 'BULLISH',
        txId: data.clientPaymentTxId || 'N/A',
        timestamp: new Date().toLocaleString([], { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        cost: activeEndpoint === 'consensus' ? '$0.0070' : '$0.0020',
      };
      setHistory((prev) => [entry, ...prev.slice(0, 7)]);
    } catch (err: any) {
      console.error('[QuantMesh] Execution error:', err);
      setCurrentStep(0);
      setError(err.message || 'Execution failed or signature was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 pb-20 selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-emerald-500/20 border border-cyan-500/30 rounded-xl glow-cyan">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white font-mono-brand">QuantMesh</span>
                <span className="text-xs font-black tracking-widest text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">x402</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Decentralized AI Micropayment Signal Router on Algorand</p>
            </div>
          </div>

          {/* Controls & Wallet Connect */}
          <div className="flex items-center gap-3">
            {/* Endpoint Switcher Tabs */}
            <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
              <button
                onClick={() => {
                  setActiveEndpoint('consensus');
                  setSignalData(null);
                  setError(null);
                  setSuccessMsg(null);
                  setCurrentStep(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeEndpoint === 'consensus'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GitMerge className="w-3.5 h-3.5" />
                4-Agent Consensus ($0.007)
              </button>
              <button
                onClick={() => {
                  setActiveEndpoint('sentiment');
                  setSignalData(null);
                  setError(null);
                  setSuccessMsg(null);
                  setCurrentStep(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeEndpoint === 'sentiment'
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                FinBERT Sentiment ($0.002)
              </button>
            </div>

            {/* Architecture Link */}
            <a
              href="/architecture"
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all hidden md:flex"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Architecture
            </a>

            {/* Client-Only Hydration Safe Wallet Button */}
            {mounted && (
              activeAddress ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOptInUSDC}
                    disabled={optInLoading}
                    className="px-3 py-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/80 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    title="Opt-In to Testnet USDC ASA 10458941"
                  >
                    <Coins className="w-3.5 h-3.5 text-cyan-400" />
                    {optInLoading ? 'Opting In...' : 'USDC Opt-In'}
                  </button>

                  <div className="px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs font-mono-brand text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => luteWallet?.connect()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Lute Wallet
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* ── Main Container ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 pt-8 space-y-8">
        
        {/* Banner: Zero-Fee Guarantee & Testnet Status */}
        <div className="glass-card rounded-2xl p-4 border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-purple-950/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Zero-Fee Pre-Execution Guarantee</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">ACTIVE</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Workers pre-execute before signature prompt. If any sub-agent fails, HTTP 502 returns and <strong className="text-emerald-300">$0 is charged</strong>.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono-brand text-slate-400">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Algorand Testnet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>USDC ASA: 10458941</span>
            </div>
          </div>
        </div>

        {/* ── Token Selection Grid ────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              1. Select Asset Pair
            </h2>
            <span className="text-xs text-slate-400">9 Active Crypto Markets</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5">
            {SUPPORTED_TOKENS.map((token) => {
              const isSelected = selectedToken === token.symbol;
              return (
                <button
                  key={token.symbol}
                  onClick={() => {
                    setSelectedToken(token.symbol);
                    setSignalData(null);
                    setError(null);
                    setSuccessMsg(null);
                    setCurrentStep(0);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400/80 shadow-lg shadow-cyan-500/20 scale-[1.03]'
                      : 'glass-card border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg">{token.icon}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-bold text-white font-mono-brand">{token.symbol}</div>
                    <div className="text-[10px] text-slate-400 truncate">{token.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Execution Dashboard ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Signal Execution Panel */}
          <div className="lg:col-span-7 glass-card rounded-3xl p-6 space-y-6 border-slate-800 relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  {selectedToken} / USDC Signal Engine
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeEndpoint === 'consensus'
                    ? '4-Agent Weighted Consensus (Sentiment + Whales + Technicals)'
                    : 'HuggingFace FinBERT Financial Sentiment NLP Agent'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-black font-mono-brand text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                  {activeEndpoint === 'consensus' ? '$0.0070 USDC' : '$0.0020 USDC'}
                </span>
              </div>
            </div>

            {/* Signal Display Box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Gauge */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                <ScoreGauge 
                  score={
                    signalData?.signalFusion?.compositeScore ?? 
                    signalData?.sentiment?.score ?? 
                    null
                  } 
                  size={160} 
                />
                
                <div className="mt-3 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Consensus Verdict</span>
                  <span className={`text-base font-black tracking-wider uppercase ${
                    signalData ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    {signalData?.signalFusion?.verdict ?? signalData?.sentiment?.sentimentVerdict ?? 'AWAITING EXECUTION'}
                  </span>
                </div>
              </div>

              {/* Action & Consensus Meter */}
              <div className="md:col-span-7 space-y-4">
                
                {/* Multi-Agent Agreement Conviction */}
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Multi-Agent Agreement Conviction</span>
                    <span className="font-bold font-mono-brand text-cyan-400">
                      {signalData?.signalFusion?.confidencePct 
                        ? `${signalData.signalFusion.confidencePct}% Agreement` 
                        : 'Awaiting Execution (--%)'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-1000"
                      style={{ width: `${signalData?.signalFusion?.confidencePct ?? 0}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">Measures cross-agent alignment across sentiment, whale flow, and technical indicators.</p>
                </div>

                {/* Execution Button */}
                <button
                  onClick={handleExecuteStrategy}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Processing Protocol Step {currentStep}/4...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-white" />
                      <span>Execute {activeEndpoint === 'consensus' ? '4-Agent Strategy ($0.007)' : 'FinBERT Sentiment ($0.002)'}</span>
                    </>
                  )}
                </button>

                {/* Protocol Stepper Tracker */}
                {loading && (
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs font-mono-brand text-cyan-300 space-y-1.5 animate-fade-up">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>x402 Protocol Handshake</span>
                      <span>Step {currentStep} of 4</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {currentStep === 1 && '1. Sending Probe Request → Catching HTTP 402 Challenge...'}
                      {currentStep === 2 && '2. Reading 402 Headers → Prompting Lute Wallet Signature...'}
                      {currentStep === 3 && '3. Retrying with Payment → Algorand 1-Block Settlement...'}
                      {currentStep === 4 && '4. GoPlausible Facilitator Verification & Receipt Complete ✓'}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Breakdown Cards */}
            {signalData && (
              <div className={`grid gap-3 pt-2 border-t border-slate-800/80 animate-fade-up ${
                activeEndpoint === 'sentiment' || signalData.endpoint === 'sentiment-only'
                  ? 'grid-cols-1'
                  : 'grid-cols-1 sm:grid-cols-3'
              }`}>
                {/* Worker A (Sentiment) */}
                {(() => {
                  const score = signalData.breakdown?.sentimentScore ?? signalData.sentiment?.score ?? 50;
                  const isBull = score >= 55;
                  const isBear = score <= 45;
                  const label = isBull ? 'BULLISH' : isBear ? 'BEARISH' : 'NEUTRAL';
                  const badgeColor = isBull 
                    ? 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40' 
                    : isBear 
                    ? 'text-rose-400 bg-rose-950/80 border-rose-500/40' 
                    : 'text-amber-400 bg-amber-950/80 border-amber-500/40';

                  return (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Worker A (FinBERT Sentiment NLP)
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                          {label}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">Sentiment Score: {score} / 100</div>
                      <div className="text-[10px] text-cyan-400">
                        {activeEndpoint === 'sentiment' ? 'Single-Agent FinBERT Query ($0.002)' : 'FinBERT Financial NLP'}
                      </div>
                    </div>
                  );
                })()}

                {/* Worker B & C (Only rendered in 4-Agent Consensus Mode) */}
                {activeEndpoint === 'consensus' && signalData.endpoint !== 'sentiment-only' && (
                  <>
                    {/* Worker B */}
                    {(() => {
                      const flowStr = signalData.breakdown?.onChainWhaleFlow ?? '+18% Net Inflow';
                      const isBear = flowStr.includes('-') || flowStr.toLowerCase().includes('outflow');
                      const isBull = flowStr.includes('+') || flowStr.toLowerCase().includes('inflow');
                      const label = isBear ? 'BEARISH' : isBull ? 'BULLISH' : 'NEUTRAL';
                      const badgeColor = isBull 
                        ? 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40' 
                        : isBear 
                        ? 'text-rose-400 bg-rose-950/80 border-rose-500/40' 
                        : 'text-amber-400 bg-amber-950/80 border-amber-500/40';

                      return (
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Worker B (Whale Flow)</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                              {label}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-white">{flowStr}</div>
                          <div className="text-[10px] text-emerald-400">CoinGecko Market Flow</div>
                        </div>
                      );
                    })()}

                    {/* Worker C */}
                    {(() => {
                      const taStr = signalData.breakdown?.technicalIndicator ?? 'RSI 58 Bullish';
                      const isBear = taStr.toLowerCase().includes('bearish');
                      const isBull = taStr.toLowerCase().includes('bullish');
                      const label = isBear ? 'BEARISH' : isBull ? 'BULLISH' : 'NEUTRAL';
                      const badgeColor = isBull 
                        ? 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40' 
                        : isBear 
                        ? 'text-rose-400 bg-rose-950/80 border-rose-500/40' 
                        : 'text-amber-400 bg-amber-950/80 border-amber-500/40';

                      return (
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Worker C (Technicals)</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                              {label}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-white truncate">{taStr}</div>
                          <div className="text-[10px] text-purple-400">RSI, SMA & MACD Engine</div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {/* Error Message Box */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-3 animate-fade-up">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-rose-300">Execution Alert</span>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Success Message Box */}
            {successMsg && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-3 animate-fade-up">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300">Transaction Status</span>
                  <p>{successMsg}</p>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Sub-Agent Network Radar & Status */}
          <div className="lg:col-span-5 space-y-4">
            
            <div className="glass-card rounded-3xl p-6 space-y-5 border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Sub-Agent Network Radar
                </h3>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  ALL SYSTEMS ONLINE
                </span>
              </div>

              {/* Workers List */}
              <div className="space-y-3">
                {/* Worker A */}
                <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.sentiment?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-white">Worker A: FinBERT Sentiment</div>
                      <div className="text-[10px] text-slate-400">FastAPI Serverless Router</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-cyan-400">
                    {healthData?.workers?.sentiment?.latencyMs || 28}ms
                  </span>
                </div>

                {/* Worker B */}
                <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.onchain?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-white">Worker B: On-Chain Whale Flow</div>
                      <div className="text-[10px] text-slate-400">CoinGecko Market Heuristics</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-emerald-400">
                    {healthData?.workers?.onchain?.latencyMs || 16}ms
                  </span>
                </div>

                {/* Worker C */}
                <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.ta?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-white">Worker C: Technical Indicators</div>
                      <div className="text-[10px] text-slate-400">RSI, SMA 7/20 & MACD Engine</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-purple-400">
                    {healthData?.workers?.ta?.latencyMs || 18}ms
                  </span>
                </div>

                {/* Worker D */}
                <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.fusion?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-white">Worker D: Consensus Fusion</div>
                      <div className="text-[10px] text-slate-400">Dynamic Weighted Consensus</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-amber-400">
                    {healthData?.workers?.fusion?.latencyMs || 18}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt Verification Drawer */}
            {signalData?.onChainReceipt && (
              <div className="glass-card rounded-3xl p-6 space-y-3 border-emerald-500/30 animate-fade-up">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Verifiable On-Chain Receipt
                </h4>
                
                <div className="space-y-2 text-xs font-mono-brand">
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Client Tx:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-300">{signalData.clientPaymentTxId?.slice(0, 10)}...</span>
                      <button 
                        onClick={() => handleCopyTx(signalData.clientPaymentTxId)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {copiedTxId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Facilitator:</span>
                    <span className="text-emerald-400 font-bold">GoPlausible Verified ✓</span>
                  </div>

                  {/* Worker Payout Atomic Group Tx */}
                  {(signalData.workerPayoutGroupTxId || signalData.onChainReceipt?.workerPayoutExplorerUrl) && (
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">4-Worker Payout Group Tx:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-purple-300">
                          {(signalData.workerPayoutGroupTxId || signalData.clientPaymentTxId)?.slice(0, 10)}...
                        </span>
                        <button 
                          onClick={() => handleCopyTx(signalData.workerPayoutGroupTxId || signalData.clientPaymentTxId)}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          {copiedTxId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Payout Split */}
                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Dynamic Payout Split:</span>
                      <span className="text-cyan-400 font-bold">
                        {activeEndpoint === 'sentiment' || signalData.endpoint === 'sentiment-only'
                          ? 'Single Worker Pool ($0.0020)'
                          : '4-Worker Pool ($0.0070)'}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono-brand text-slate-300 flex items-center justify-between">
                      <span>
                        Worker A: {activeEndpoint === 'sentiment' || signalData.endpoint === 'sentiment-only'
                          ? '2000'
                          : signalData.dynamicSplit?.amountA || '2000'} µUSDC
                      </span>
                      <span>
                        Worker B: {activeEndpoint === 'sentiment' || signalData.endpoint === 'sentiment-only'
                          ? '0'
                          : signalData.dynamicSplit?.amountB || '1800'} µUSDC
                      </span>
                    </div>
                    <div className="text-[10px] font-mono-brand text-slate-400 flex items-center justify-between">
                      <span>
                        Worker C: {activeEndpoint === 'sentiment' || signalData.endpoint === 'sentiment-only'
                          ? '0'
                          : signalData.dynamicSplit?.amountC || '1200'} µUSDC
                      </span>
                      <span>
                        Worker D: {activeEndpoint === 'sentiment' || signalData.endpoint === 'sentiment-only'
                          ? '0'
                          : signalData.dynamicSplit?.amountD || '1000'} µUSDC
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400 text-[10px] block">Attestation Digest:</span>
                    <span className="text-[10px] text-purple-300 truncate block mt-0.5">
                      {signalData.onChainReceipt.boxStorageHash || 'sha256(signal:txId)'}
                    </span>
                  </div>
                </div>

                <a
                  href={signalData.onChainReceipt.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all mt-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Block Explorer (Lora)
                </a>
              </div>
            )}

          </div>
        </div>

        {/* ── Signal History Drawer ───────────────────────────────────── */}
        {history.length > 0 && (
          <div className="glass-card rounded-3xl p-6 space-y-4 border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent Signal Executions ({history.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {history.map((entry) => (
                <div key={entry.id} className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono-brand">{entry.token} / USDC</span>
                    <span className="text-[10px] font-mono-brand text-cyan-400">{entry.cost}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-cyan-400 font-mono-brand">{entry.compositeScore}</span>
                    <span className="text-xs font-bold text-emerald-400">{entry.verdict}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-900">
                    <span>Tx: {entry.txId.slice(0, 6)}...</span>
                    <span>{entry.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
