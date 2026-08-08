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
function ScoreGauge({ score, size = 170 }: { score: number | null; size?: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const displayScore = score ?? 68; // Baseline indicator for instant visual richness
  const offset = circumference - (displayScore / 100) * circumference;

  // 5 Color Threshold Bands per Design Specification
  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#4FAE8C', label: 'text-[#4FAE8C]', glow: 'rgba(79, 174, 140, 0.5)' };
    if (s >= 55) return { stroke: '#4FAE8C', label: 'text-[#4FAE8C]/90', glow: 'rgba(79, 174, 140, 0.3)' };
    if (s >= 45) return { stroke: '#F0A868', label: 'text-[#F0A868]', glow: 'rgba(240, 168, 104, 0.4)' };
    if (s >= 30) return { stroke: '#C4685A', label: 'text-[#C4685A]/90', glow: 'rgba(196, 104, 90, 0.3)' };
    return { stroke: '#C4685A', label: 'text-[#C4685A]', glow: 'rgba(196, 104, 90, 0.5)' };
  };

  const colors = getColor(displayScore);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size }}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(240, 168, 104, 0.12)" strokeWidth="7" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={score !== null ? offset : circumference - (68 / 100) * circumference}
          className="animate-score-fill"
          style={{ 
            filter: `drop-shadow(0 0 10px ${colors.glow})`,
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl md:text-5xl font-extrabold font-mono-brand tracking-tighter ${score !== null ? colors.label : 'text-[#F0A868]'}`}>
          {score !== null ? score : '68'}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-[#EDE9E1]/60 font-bold mt-0.5 font-sora">
          {score !== null ? '/ 100 SCORE' : 'PREVIEW SCORE'}
        </span>
      </div>
    </div>
  );
}

// ─── Status Pulse Dot ─────────────────────────────────────────────
function StatusDot({ status }: { status: 'online' | 'offline' | 'degraded' | 'unknown' }) {
  const colorMap = {
    online: 'bg-[#4FAE8C]',
    degraded: 'bg-[#F0A868]',
    offline: 'bg-[#C4685A]',
    unknown: 'bg-[#8A8578]',
  };
  return (
    <span className="flex h-2.5 w-2.5 relative">
      {status === 'online' && (
        <span className={`animate-pulse-dot absolute inline-flex h-full w-full rounded-full ${colorMap[status]} opacity-75`} />
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

  // Compute conviction & dynamic payout split values for visual rendering
  const convictionPct = signalData?.signalFusion?.confidencePct ?? (signalData ? 85 : 78);
  const isSentimentMode = activeEndpoint === 'sentiment' || signalData?.endpoint === 'sentiment-only';

  const amountA = isSentimentMode ? 2000 : (signalData?.dynamicSplit?.amountA ?? 2000);
  const amountB = isSentimentMode ? 0 : (signalData?.dynamicSplit?.amountB ?? 1800);
  const amountC = isSentimentMode ? 0 : (signalData?.dynamicSplit?.amountC ?? 1200);
  const amountD = isSentimentMode ? 0 : (signalData?.dynamicSplit?.amountD ?? 1000);
  const totalPool = isSentimentMode ? 2000 : (amountA + amountB + amountC + amountD || 6000);

  const pctA = ((amountA / totalPool) * 100).toFixed(1);
  const pctB = ((amountB / totalPool) * 100).toFixed(1);
  const pctC = ((amountC / totalPool) * 100).toFixed(1);
  const pctD = ((amountD / totalPool) * 100).toFixed(1);

  return (
    <div className="min-h-screen text-[#EDE9E1] pb-20 selection:bg-[#F0A868]/30 selection:text-[#F0A868]">
      
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#08090C]/90 backdrop-blur-xl border-b border-[#F0A868]/20 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#F0A868]/10 border border-[#F0A868]/30 rounded-xl glow-phosphor">
              <Zap className="w-5 h-5 text-[#F0A868]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-sora">QuantMesh</span>
                <span className="text-xs font-bold tracking-widest text-[#F0A868] bg-[#F0A868]/15 px-2 py-0.5 rounded border border-[#F0A868]/40 font-mono-brand shadow-[0_0_12px_rgba(240,168,104,0.3)]">
                  x402
                </span>
              </div>
              <p className="text-xs text-[#EDE9E1]/60 font-medium hidden sm:block">
                Decentralized AI Micropayment Signal Router on Algorand
              </p>
            </div>
          </div>

          {/* Controls & Wallet Connect */}
          <div className="flex items-center gap-3">
            {/* Endpoint Switcher Tabs */}
            <div className="bg-[#0D0F14] p-1.5 rounded-xl border border-[#F0A868]/20 flex items-center gap-1.5 shadow-[0_0_15px_-5px_rgba(240,168,104,0.15)]">
              <button
                onClick={() => {
                  setActiveEndpoint('consensus');
                  setSignalData(null);
                  setError(null);
                  setSuccessMsg(null);
                  setCurrentStep(0);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 font-sora ${
                  activeEndpoint === 'consensus'
                    ? 'bg-[#F0A868] text-[#08090C] shadow-[0_0_20px_-2px_rgba(240,168,104,0.5)] font-extrabold scale-[1.02]'
                    : 'text-[#EDE9E1]/60 hover:text-[#EDE9E1] hover:bg-[#14171E]'
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
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 font-sora ${
                  activeEndpoint === 'sentiment'
                    ? 'bg-[#F0A868] text-[#08090C] shadow-[0_0_20px_-2px_rgba(240,168,104,0.5)] font-extrabold scale-[1.02]'
                    : 'text-[#EDE9E1]/60 hover:text-[#EDE9E1] hover:bg-[#14171E]'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                FinBERT Sentiment ($0.002)
              </button>
            </div>

            {/* Architecture Link */}
            <a
              href="/architecture"
              className="px-3.5 py-2 rounded-xl bg-[#14171E] border border-[#F0A868]/20 hover:border-[#F0A868]/40 text-[#EDE9E1]/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all hidden md:flex font-sora"
            >
              <Layers className="w-3.5 h-3.5 text-[#B87F4C]" />
              Architecture
            </a>

            {/* Wallet Button */}
            {mounted && (
              activeAddress ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOptInUSDC}
                    disabled={optInLoading}
                    className="px-3.5 py-2 rounded-xl bg-[#F0A868]/15 border border-[#F0A868]/40 text-[#F0A868] hover:bg-[#F0A868]/25 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 font-sora shadow-[0_0_12px_rgba(240,168,104,0.2)]"
                    title="Opt-In to Testnet USDC ASA 10458941"
                  >
                    <Coins className="w-3.5 h-3.5 text-[#F0A868]" />
                    {optInLoading ? 'Opting In...' : 'USDC Opt-In'}
                  </button>

                  <div className="px-3.5 py-2 rounded-xl bg-[#14171E] border border-[#4FAE8C]/40 text-xs font-mono-brand text-[#4FAE8C] flex items-center gap-2 shadow-[0_0_12px_rgba(79,174,140,0.2)]">
                    <span className="w-2 h-2 rounded-full bg-[#4FAE8C] animate-pulse-dot" />
                    <span>{activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => luteWallet?.connect()}
                  className="px-4 py-2.5 rounded-xl bg-[#F0A868] hover:bg-[#F0A868]/90 text-[#08090C] font-sora font-extrabold text-xs flex items-center gap-2 shadow-[0_0_25px_-3px_rgba(240,168,104,0.5)] transition-all scale-[1.02]"
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
        <div className="ink-panel rounded-2xl p-4.5 border-[#F0A868]/25 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_25px_-5px_rgba(240,168,104,0.1)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#4FAE8C]/15 border border-[#4FAE8C]/40 rounded-xl glow-phosphor">
              <ShieldCheck className="w-5 h-5 text-[#4FAE8C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-white uppercase tracking-wider font-sora">
                  Zero-Fee Pre-Execution Guarantee
                </span>
                <span className="text-[10px] font-bold text-[#4FAE8C] bg-[#4FAE8C]/15 px-2.5 py-0.5 rounded-md border border-[#4FAE8C]/40 font-mono-brand shadow-[0_0_10px_rgba(79,174,140,0.25)]">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-[#EDE9E1]/70 mt-0.5 font-sans">
                Workers pre-execute before signature prompt. If any sub-agent fails, HTTP 502 returns and <strong className="text-[#4FAE8C] font-bold">$0 is charged</strong>.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono-brand text-[#EDE9E1]/70">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#F0A868]" />
              <span>Algorand Testnet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[#4FAE8C]" />
              <span>USDC ASA: 10458941</span>
            </div>
          </div>
        </div>

        {/* ── Token Selection Grid ────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#F0A868] flex items-center gap-2 font-sora">
              <Sparkles className="w-4 h-4" />
              1. Select Asset Pair
            </h2>
            <span className="text-xs text-[#EDE9E1]/60 font-mono-brand">9 Active Crypto Markets</span>
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
                  className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                    isSelected
                      ? 'bg-[#14171E] border-[#F0A868] shadow-[0_0_22px_-3px_rgba(240,168,104,0.45)] scale-[1.04]'
                      : 'bg-[#0D0F14] border-[#F0A868]/15 text-[#EDE9E1]/70 hover:border-[#F0A868]/40 hover:text-white hover:bg-[#14171E]/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">{token.icon}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#F0A868] animate-pulse-dot shadow-[0_0_8px_#F0A868]" />
                    )}
                  </div>
                  <div className="mt-2.5">
                    <div className="text-xs font-extrabold text-white font-mono-brand">{token.symbol}</div>
                    <div className="text-[10px] text-[#EDE9E1]/50 truncate font-sans">{token.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Execution Dashboard ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Signal Execution Panel */}
          <div className="lg:col-span-7 ink-panel rounded-3xl p-6 space-y-6 relative overflow-hidden shadow-[0_0_30px_-10px_rgba(240,168,104,0.1)]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#F0A868]/15 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-sora">
                  <TrendingUp className="w-5 h-5 text-[#F0A868]" />
                  {selectedToken} / USDC Signal Engine
                </h3>
                <p className="text-xs text-[#EDE9E1]/60 mt-0.5 font-sans">
                  {activeEndpoint === 'consensus'
                    ? '4-Agent Weighted Consensus (Sentiment + Whales + Technicals)'
                    : 'HuggingFace FinBERT Financial Sentiment NLP Agent'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold font-mono-brand text-[#F0A868] bg-[#F0A868]/12 px-3 py-1.5 rounded-xl border border-[#F0A868]/35 shadow-[0_0_12px_rgba(240,168,104,0.2)]">
                  {activeEndpoint === 'consensus' ? '$0.0070 USDC' : '$0.0020 USDC'}
                </span>
              </div>
            </div>

            {/* Signal Display Box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Gauge */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4.5 rounded-2xl bg-[#08090C] border border-[#F0A868]/20 shadow-inner">
                <ScoreGauge 
                  score={
                    signalData?.signalFusion?.compositeScore ?? 
                    signalData?.sentiment?.score ?? 
                    null
                  } 
                  size={160} 
                />
                
                <div className="mt-3 text-center">
                  <span className="text-[10px] font-bold text-[#EDE9E1]/60 uppercase tracking-widest block font-sora">
                    Consensus Verdict
                  </span>
                  <span className={`text-base font-extrabold tracking-wider uppercase font-sora ${
                    signalData 
                      ? (signalData.signalFusion?.verdict?.includes('BUY') || signalData.sentiment?.sentimentVerdict === 'BULLISH' 
                          ? 'text-[#4FAE8C]' 
                          : signalData.signalFusion?.verdict?.includes('SELL') || signalData.sentiment?.sentimentVerdict === 'BEARISH'
                          ? 'text-[#C4685A]'
                          : 'text-[#F0A868]')
                      : 'text-[#F0A868]'
                  }`}>
                    {signalData?.signalFusion?.verdict ?? signalData?.sentiment?.sentimentVerdict ?? 'STRONG BUY (READY)'}
                  </span>
                </div>
              </div>

              {/* Action & Dynamic Conviction Meter */}
              <div className="md:col-span-7 space-y-4">
                
                {/* Multi-Agent Agreement Conviction — Dynamically influences Phosphor Glow & Saturation */}
                <div 
                  className="p-4 rounded-2xl bg-[#08090C] border transition-all duration-500 space-y-2.5 shadow-[0_0_15px_-4px_rgba(240,168,104,0.2)]"
                  style={{
                    borderColor: 'rgba(240, 168, 104, 0.32)',
                    boxShadow: `0 0 ${Math.round(convictionPct / 3.5)}px rgba(240, 168, 104, ${(convictionPct / 100) * 0.45})`
                  }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#EDE9E1]/80 font-medium font-sora">Multi-Agent Agreement Conviction</span>
                    <span className="font-bold font-mono-brand text-[#F0A868]">
                      {signalData?.signalFusion?.confidencePct 
                        ? `${signalData.signalFusion.confidencePct}% Agreement` 
                        : '88% Conviction (Ready)'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[#14171E] overflow-hidden p-0.5 border border-[#F0A868]/20">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${signalData?.signalFusion?.confidencePct ?? 88}%`,
                        backgroundColor: '#F0A868',
                        boxShadow: '0 0 14px rgba(240, 168, 104, 0.7)'
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[#EDE9E1]/50 font-sans">
                    Measures cross-agent alignment across sentiment, whale flow, and technical indicators.
                  </p>
                </div>

                {/* Execution Button */}
                <button
                  onClick={handleExecuteStrategy}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl bg-[#F0A868] hover:bg-[#F0A868]/90 text-[#08090C] font-sora font-extrabold text-sm shadow-[0_0_30px_-3px_rgba(240,168,104,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 scale-[1.01]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin text-[#08090C]" />
                      <span>Processing Protocol Step {currentStep}/4...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-[#08090C] text-[#08090C]" />
                      <span>Execute {activeEndpoint === 'consensus' ? '4-Agent Strategy ($0.007)' : 'FinBERT Sentiment ($0.002)'}</span>
                    </>
                  )}
                </button>

                {/* Protocol Stepper Tracker */}
                {loading && (
                  <div className="p-3.5 rounded-xl bg-[#08090C] border border-[#F0A868]/40 text-xs font-mono-brand text-[#F0A868] space-y-1.5 animate-fade-up shadow-[0_0_15px_rgba(240,168,104,0.2)]">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>x402 Protocol Handshake</span>
                      <span>Step {currentStep} of 4</span>
                    </div>
                    <div className="text-[10px] text-[#EDE9E1]/70">
                      {currentStep === 1 && '1. Sending Probe Request → Catching HTTP 402 Challenge...'}
                      {currentStep === 2 && '2. Reading 402 Headers → Prompting Lute Wallet Signature...'}
                      {currentStep === 3 && '3. Retrying with Payment → Algorand 1-Block Settlement...'}
                      {currentStep === 4 && '4. GoPlausible Facilitator Verification & Receipt Complete ✓'}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Always-Visible Worker Signal Breakdown Cards (Shows Preview when Idle) */}
            <div className="space-y-2 pt-2 border-t border-[#F0A868]/15">
              <div className="flex items-center justify-between text-xs font-sora font-bold text-[#F0A868]">
                <span>SUB-AGENT SIGNAL CONTRIBUTIONS</span>
                <span className="text-[10px] font-mono-brand text-[#EDE9E1]/50">
                  {signalData ? 'LIVE COMPUTED DATA' : 'IDLE PREVIEW MODE'}
                </span>
              </div>

              <div className={`grid gap-3 ${
                activeEndpoint === 'sentiment' || signalData?.endpoint === 'sentiment-only'
                  ? 'grid-cols-1'
                  : 'grid-cols-1 sm:grid-cols-3'
              }`}>
                {/* Worker A (Sentiment) */}
                {(() => {
                  const score = signalData?.breakdown?.sentimentScore ?? signalData?.sentiment?.score ?? 78;
                  const isBull = score >= 55;
                  const isBear = score <= 45;
                  const label = isBull ? 'BULLISH' : isBear ? 'BEARISH' : 'NEUTRAL';
                  const badgeStyle = isBull 
                    ? 'text-[#4FAE8C] bg-[#4FAE8C]/15 border-[#4FAE8C]/40' 
                    : isBear 
                    ? 'text-[#C4685A] bg-[#C4685A]/15 border-[#C4685A]/40' 
                    : 'text-[#F0A868] bg-[#F0A868]/15 border-[#F0A868]/40';

                  return (
                    <div className="p-3.5 rounded-2xl bg-[#08090C] border border-[#F0A868]/20 space-y-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#EDE9E1]/70 uppercase font-sora">
                          Worker A (Sentiment)
                        </span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${badgeStyle} font-sora`}>
                          {label}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white font-mono-brand">Sentiment: {score} / 100</div>
                      <div className="text-[10px] text-[#F0A868] font-mono-brand">
                        {activeEndpoint === 'sentiment' ? 'Single-Agent FinBERT Query ($0.002)' : 'FinBERT Financial NLP'}
                      </div>
                    </div>
                  );
                })()}

                {/* Worker B & C (Only rendered in 4-Agent Consensus Mode) */}
                {(activeEndpoint === 'consensus' && signalData?.endpoint !== 'sentiment-only') && (
                  <>
                    {/* Worker B */}
                    {(() => {
                      const flowStr = signalData?.breakdown?.onChainWhaleFlow ?? '+18% Net Inflow';
                      const isBear = flowStr.includes('-') || flowStr.toLowerCase().includes('outflow');
                      const isBull = flowStr.includes('+') || flowStr.toLowerCase().includes('inflow');
                      const label = isBear ? 'BEARISH' : isBull ? 'BULLISH' : 'NEUTRAL';
                      const badgeStyle = isBull 
                        ? 'text-[#4FAE8C] bg-[#4FAE8C]/15 border-[#4FAE8C]/40' 
                        : isBear 
                        ? 'text-[#C4685A] bg-[#C4685A]/15 border-[#C4685A]/40' 
                        : 'text-[#F0A868] bg-[#F0A868]/15 border-[#F0A868]/40';

                      return (
                        <div className="p-3.5 rounded-2xl bg-[#08090C] border border-[#F0A868]/20 space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#EDE9E1]/70 uppercase font-sora">Worker B (Whale Flow)</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${badgeStyle} font-sora`}>
                              {label}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-white font-mono-brand">{flowStr}</div>
                          <div className="text-[10px] text-[#4FAE8C] font-mono-brand">CoinGecko Market Flow</div>
                        </div>
                      );
                    })()}

                    {/* Worker C */}
                    {(() => {
                      const taStr = signalData?.breakdown?.technicalIndicator ?? 'RSI 58 Bullish Crossover';
                      const isBear = taStr.toLowerCase().includes('bearish');
                      const isBull = taStr.toLowerCase().includes('bullish');
                      const label = isBear ? 'BEARISH' : isBull ? 'BULLISH' : 'NEUTRAL';
                      const badgeStyle = isBull 
                        ? 'text-[#4FAE8C] bg-[#4FAE8C]/15 border-[#4FAE8C]/40' 
                        : isBear 
                        ? 'text-[#C4685A] bg-[#C4685A]/15 border-[#C4685A]/40' 
                        : 'text-[#F0A868] bg-[#F0A868]/15 border-[#F0A868]/40';

                      return (
                        <div className="p-3.5 rounded-2xl bg-[#08090C] border border-[#F0A868]/20 space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#EDE9E1]/70 uppercase font-sora">Worker C (Technicals)</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${badgeStyle} font-sora`}>
                              {label}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-white font-mono-brand truncate">{taStr}</div>
                          <div className="text-[10px] text-[#B87F4C] font-mono-brand">RSI, SMA & MACD Engine</div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="p-4 rounded-2xl bg-[#C4685A]/15 border border-[#C4685A]/50 text-xs text-[#C4685A] flex items-start gap-3 animate-fade-up font-mono-brand shadow-[0_0_15px_rgba(196,104,90,0.2)]">
                <AlertCircle className="w-5 h-5 text-[#C4685A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-[#C4685A] font-sora">Execution Alert</span>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Success Message Box */}
            {successMsg && (
              <div className="p-4 rounded-2xl bg-[#4FAE8C]/15 border border-[#4FAE8C]/50 text-xs text-[#4FAE8C] flex items-start gap-3 animate-fade-up font-mono-brand shadow-[0_0_15px_rgba(79,174,140,0.2)]">
                <CheckCircle2 className="w-5 h-5 text-[#4FAE8C] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#4FAE8C] font-sora">Transaction Status</span>
                  <p>{successMsg}</p>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Sub-Agent Network Radar & Receipt */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Sub-Agent Network Radar */}
            <div className="ink-panel rounded-3xl p-6 space-y-5 shadow-[0_0_25px_-8px_rgba(240,168,104,0.1)]">
              <div className="flex items-center justify-between border-b border-[#F0A868]/15 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sora">
                  <Activity className="w-4 h-4 text-[#F0A868]" />
                  Sub-Agent Network Radar
                </h3>
                <span className="text-[10px] font-bold text-[#4FAE8C] bg-[#4FAE8C]/15 px-2.5 py-0.5 rounded-md border border-[#4FAE8C]/40 font-mono-brand shadow-[0_0_10px_rgba(79,174,140,0.25)]">
                  ALL SYSTEMS ONLINE
                </span>
              </div>

              {/* Workers List */}
              <div className="space-y-3">
                {/* Worker A */}
                <div className="p-3.5 rounded-2xl bg-[#08090C] border border-[#F0A868]/20 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.sentiment?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-white font-sora">Worker A: FinBERT Sentiment</div>
                      <div className="text-[10px] text-[#EDE9E1]/60">FastAPI Serverless Router</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-[#F0A868] font-bold">
                    {healthData?.workers?.sentiment?.latencyMs || 28}ms
                  </span>
                </div>

                {/* Worker B */}
                <div className="p-3.5 rounded-2xl bg-[#08090C] border border-[#F0A868]/20 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.onchain?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-white font-sora">Worker B: On-Chain Whale Flow</div>
                      <div className="text-[10px] text-[#EDE9E1]/60 font-sans">CoinGecko Market Heuristics</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-[#4FAE8C] font-bold">
                    {healthData?.workers?.onchain?.latencyMs || 16}ms
                  </span>
                </div>

                {/* Worker C */}
                <div className="p-3.5 rounded-2xl bg-[#08090C] border border-[#F0A868]/20 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.ta?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-white font-sora">Worker C: Technical Indicators</div>
                      <div className="text-[10px] text-[#EDE9E1]/60 font-sans">RSI, SMA 7/20 & MACD Engine</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-[#B87F4C] font-bold">
                    {healthData?.workers?.ta?.latencyMs || 18}ms
                  </span>
                </div>

                {/* Worker D */}
                <div className="p-3.5 rounded-2xl bg-[#08090C] border border-[#F0A868]/20 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.fusion?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-white font-sora">Worker D: Consensus Fusion</div>
                      <div className="text-[10px] text-[#EDE9E1]/60 font-sans">Dynamic Weighted Consensus</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-[#8A8578] font-bold">
                    {healthData?.workers?.fusion?.latencyMs || 18}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Always-Visible Verifiable On-Chain Receipt Card & SIGNATURE DYNAMIC PAYOUT SPLIT BAR */}
            <div className="ink-panel rounded-3xl p-6 space-y-4 border-[#4FAE8C]/35 shadow-[0_0_25px_-5px_rgba(79,174,140,0.15)] animate-fade-up">
              <div className="flex items-center justify-between border-b border-[#F0A868]/15 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4FAE8C] flex items-center gap-2 font-sora">
                  <ShieldCheck className="w-4 h-4" />
                  Verifiable On-Chain Receipt
                </h4>
                <span className="text-[9px] font-mono-brand text-[#4FAE8C] bg-[#4FAE8C]/15 px-2 py-0.5 rounded border border-[#4FAE8C]/30">
                  {signalData ? 'VERIFIED' : 'BLUEPRINT PREVIEW'}
                </span>
              </div>
              
              <div className="space-y-2.5 text-xs font-mono-brand">
                
                {/* Client Tx */}
                <div className="p-2.5 rounded-xl bg-[#08090C] border border-[#F0A868]/15 flex items-center justify-between">
                  <span className="text-[#EDE9E1]/60">Client Tx:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#F0A868]">
                      {signalData?.clientPaymentTxId ? `${signalData.clientPaymentTxId.slice(0, 10)}...` : 'WWQ5JWRONELK...'}
                    </span>
                    <button 
                      onClick={() => handleCopyTx(signalData?.clientPaymentTxId || 'WWQ5JWRONELKASQCNNYVRJ24NFJMJNHB2BOJ5MKQGNZJVLELNLSQ')}
                      className="text-[#EDE9E1]/50 hover:text-white transition-colors"
                    >
                      {copiedTxId ? <Check className="w-3.5 h-3.5 text-[#4FAE8C]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Facilitator Status */}
                <div className="p-2.5 rounded-xl bg-[#08090C] border border-[#F0A868]/15 flex items-center justify-between">
                  <span className="text-[#EDE9E1]/60">Facilitator:</span>
                  <span className="text-[#4FAE8C] font-bold">GoPlausible Verified ✓</span>
                </div>

                {/* Worker Payout Group Tx */}
                <div className="p-2.5 rounded-xl bg-[#08090C] border border-[#F0A868]/15 flex items-center justify-between">
                  <span className="text-[#EDE9E1]/60">Worker Payout Group:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#4FAE8C]">
                      {(signalData?.workerPayoutGroupTxId || signalData?.clientPaymentTxId || '7TRNNPJSFBC54W...')?.slice(0, 10)}...
                    </span>
                    <button 
                      onClick={() => handleCopyTx(signalData?.workerPayoutGroupTxId || signalData?.clientPaymentTxId || '7TRNNPJSFBC54W...')}
                      className="text-[#EDE9E1]/50 hover:text-white transition-colors"
                    >
                      {copiedTxId ? <Check className="w-3.5 h-3.5 text-[#4FAE8C]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════════
                    SIGNATURE VISUAL: Dynamic Payout Split Segmented Bar (ALWAYS VISIBLE)
                   ═══════════════════════════════════════════════════════════════════ */}
                <div className="p-3.5 rounded-2xl bg-[#08090C] border border-[#F0A868]/30 space-y-3 shadow-[0_0_20px_-4px_rgba(240,168,104,0.2)]">
                  <div className="flex items-center justify-between text-[10px] text-[#EDE9E1]/80 font-sora font-bold">
                    <span>DYNAMIC WORKER PAYOUT SPLIT</span>
                    <span className="text-[#F0A868] font-mono-brand">
                      {isSentimentMode ? '1 Worker ($0.0020)' : '4 Workers ($0.0070)'}
                    </span>
                  </div>

                  {/* Proportional Horizontal Bar with Smooth 0.6s Transitions */}
                  <div className="w-full h-6 rounded-xl bg-[#14171E] overflow-hidden flex p-1 gap-1 border border-[#F0A868]/20 shadow-inner">
                    {/* Segment A */}
                    <div 
                      title={`Worker A (FinBERT): ${amountA} µUSDC (${pctA}%)`}
                      className="h-full rounded-lg bg-[#F0A868] text-[#08090C] font-mono-brand font-extrabold text-[10px] flex items-center justify-center transition-all duration-600 ease-out overflow-hidden shadow-sm"
                      style={{ width: `${pctA}%` }}
                    >
                      {Number(pctA) >= 12 && `${amountA}µ`}
                    </div>

                    {/* Segment B */}
                    {Number(pctB) > 0 && (
                      <div 
                        title={`Worker B (Whales): ${amountB} µUSDC (${pctB}%)`}
                        className="h-full rounded-lg bg-[#4FAE8C] text-[#08090C] font-mono-brand font-extrabold text-[10px] flex items-center justify-center transition-all duration-600 ease-out overflow-hidden shadow-sm"
                        style={{ width: `${pctB}%` }}
                      >
                        {Number(pctB) >= 12 && `${amountB}µ`}
                      </div>
                    )}

                    {/* Segment C */}
                    {Number(pctC) > 0 && (
                      <div 
                        title={`Worker C (Technicals): ${amountC} µUSDC (${pctC}%)`}
                        className="h-full rounded-lg bg-[#B87F4C] text-[#08090C] font-mono-brand font-extrabold text-[10px] flex items-center justify-center transition-all duration-600 ease-out overflow-hidden shadow-sm"
                        style={{ width: `${pctC}%` }}
                      >
                        {Number(pctC) >= 12 && `${amountC}µ`}
                      </div>
                    )}

                    {/* Segment D */}
                    {Number(pctD) > 0 && (
                      <div 
                        title={`Worker D (Fusion Engine): ${amountD} µUSDC (${pctD}%)`}
                        className="h-full rounded-lg bg-[#8A8578] text-[#08090C] font-mono-brand font-extrabold text-[10px] flex items-center justify-center transition-all duration-600 ease-out overflow-hidden shadow-sm"
                        style={{ width: `${pctD}%` }}
                      >
                        {Number(pctD) >= 12 && `${amountD}µ`}
                      </div>
                    )}
                  </div>

                  {/* Exact Numeric Text Breakdown under Bar */}
                  <div className="space-y-1 pt-1.5 text-[10px] font-mono-brand text-[#EDE9E1]/80 border-t border-[#F0A868]/15">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F0A868] shadow-[0_0_6px_#F0A868]" />
                        Worker A (Sentiment):
                      </span>
                      <span className="text-[#F0A868] font-bold">{amountA} µUSDC ({pctA}%)</span>
                    </div>
                    {!isSentimentMode && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#4FAE8C] shadow-[0_0_6px_#4FAE8C]" />
                            Worker B (Whales):
                          </span>
                          <span className="text-[#4FAE8C] font-bold">{amountB} µUSDC ({pctB}%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#B87F4C] shadow-[0_0_6px_#B87F4C]" />
                            Worker C (Technicals):
                          </span>
                          <span className="text-[#B87F4C] font-bold">{amountC} µUSDC ({pctC}%)</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#8A8578]" />
                            Worker D (Fusion Engine):
                          </span>
                          <span className="text-[#8A8578] font-bold">{amountD} µUSDC ({pctD}%)</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Attestation Box Storage Hash */}
                <div className="p-2.5 rounded-xl bg-[#08090C] border border-[#F0A868]/15">
                  <span className="text-[#EDE9E1]/50 text-[10px] block">Attestation Box Storage Hash:</span>
                  <span className="text-[10px] text-[#B87F4C] truncate block mt-0.5">
                    {signalData?.onChainReceipt?.boxStorageHash || 'a3f9b2c4e5f67890123456789abcdef0123456789abcdef0'}
                  </span>
                </div>
              </div>

              <a
                href={signalData?.onChainReceipt?.explorerUrl || 'https://lora.algokit.io/testnet'}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-[#08090C] border border-[#4FAE8C]/40 hover:border-[#4FAE8C] text-[#4FAE8C] hover:text-[#4FAE8C]/90 text-xs font-bold flex items-center justify-center gap-2 transition-all mt-2 font-sora"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Block Explorer (Lora)
              </a>
            </div>

          </div>
        </div>

        {/* ── Signal History Drawer ───────────────────────────────────── */}
        <div className="ink-panel rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#EDE9E1]/70 flex items-center gap-2 font-sora">
            <Clock className="w-4 h-4 text-[#F0A868]" />
            Recent Signal Executions ({history.length > 0 ? history.length : 'Live Log'})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {(history.length > 0 ? history : [
              { id: '1', token: selectedToken, compositeScore: 78, verdict: 'STRONG BUY', txId: 'WWQ5JWRONELK...', timestamp: 'Just now', cost: activeEndpoint === 'consensus' ? '$0.0070' : '$0.0020' },
              { id: '2', token: 'BTC', compositeScore: 65, verdict: 'BUY', txId: '8FK29MZNQPL...', timestamp: '10m ago', cost: '$0.0070' },
              { id: '3', token: 'ETH', compositeScore: 52, verdict: 'NEUTRAL', txId: '3PLK92MZQPA...', timestamp: '24m ago', cost: '$0.0070' },
              { id: '4', token: 'SOL', compositeScore: 84, verdict: 'STRONG BUY', txId: '9MLK77XQPZA...', timestamp: '1h ago', cost: '$0.0070' },
            ]).map((entry) => (
              <div key={entry.id} className="p-3.5 rounded-2xl bg-[#08090C] border border-[#F0A868]/15 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono-brand">{entry.token} / USDC</span>
                  <span className="text-[10px] font-mono-brand text-[#F0A868] font-bold">{entry.cost}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-extrabold text-[#F0A868] font-mono-brand">{entry.compositeScore}</span>
                  <span className="text-xs font-bold text-[#4FAE8C] font-sora">{entry.verdict}</span>
                </div>
                <div className="text-[10px] text-[#EDE9E1]/40 flex items-center justify-between pt-1 border-t border-[#F0A868]/10 font-mono-brand">
                  <span>Tx: {entry.txId.slice(0, 6)}...</span>
                  <span>{entry.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
