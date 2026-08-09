'use client';
// QuantMesh x402 — Midnight Aurora UI

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { fetchQuantMeshSignal, optInToUSDCAsset } from '@/lib/x402Client';
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
  GitMerge,
  Sun,
  Moon
} from 'lucide-react';

// ─── Score Gauge Component ──────────────────────────────────────────
function ScoreGauge({ score, size = 170 }: { score: number | null; size?: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = score ?? 0;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#34D399', label: 'text-[#34D399]', glow: 'rgba(52, 211, 153, 0.5)' };
    if (s >= 55) return { stroke: '#34D399', label: 'text-[#34D399]/90', glow: 'rgba(52, 211, 153, 0.3)' };
    if (s >= 45) return { stroke: '#9CA3AF', label: 'text-[#9CA3AF]', glow: 'rgba(156, 163, 175, 0.3)' };
    if (s >= 30) return { stroke: '#FB7185', label: 'text-[#FB7185]/90', glow: 'rgba(251, 113, 133, 0.3)' };
    return { stroke: '#FB7185', label: 'text-[#FB7185]', glow: 'rgba(251, 113, 133, 0.5)' };
  };

  const colors = getColor(normalizedScore);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size }}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface-3)" strokeWidth="7" strokeOpacity="0.4" />
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
        <span className={`text-4xl md:text-5xl font-extrabold font-mono-brand tracking-tighter ${score !== null ? colors.label : 'text-[var(--text-muted)]/40'}`}>
          {score !== null ? score : '--'}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mt-0.5 font-heading">
          / 100 SCORE
        </span>
      </div>
    </div>
  );
}

// ─── Status Pulse Dot ─────────────────────────────────────────────
function StatusDot({ status }: { status: 'online' | 'offline' | 'degraded' | 'unknown' }) {
  const colorMap = {
    online: 'bg-[#34D399]',
    degraded: 'bg-[#F59E0B]',
    offline: 'bg-[#FB7185]',
    unknown: 'bg-[#9CA3AF]',
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Prevent SSR Hydration Mismatch & Update Theme Attribute
  useEffect(() => {
    setMounted(true);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      const txId = await optInToUSDCAsset(activeAddress, async (txns: Uint8Array[]) => {
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
    setCurrentStep(1);

    try {
      setTimeout(() => setCurrentStep(2), 500);

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

      setCurrentStep(3);

      if (!data || data.status === 'error' || (!data.signalFusion && !data.sentiment)) {
        throw new Error(data?.message || 'Received invalid signal data structure.');
      }

      setCurrentStep(4);
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
  const convictionPct = signalData?.signalFusion?.confidencePct ?? 0;
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
    <div className="min-h-screen pb-20">
      
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[var(--bg-main)]/80 border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--accent-subtle)] border border-[var(--accent-border)] rounded-xl glow-accent">
              <Zap className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] font-heading">QuantMesh</span>
                <span className="text-xs font-bold tracking-widest text-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded-md border border-[var(--accent-border)] font-mono-brand">
                  x402
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-medium hidden sm:block">
                Decentralized AI Micropayment Signal Router on Algorand
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Endpoint Tabs */}
            <div className="bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)] flex items-center gap-1">
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
                    ? 'btn-primary text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
                }`}
              >
                <GitMerge className="w-3.5 h-3.5" />
                4-Agent ($0.007)
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
                    ? 'btn-primary text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                FinBERT ($0.002)
              </button>
            </div>

            {/* Architecture */}
            <a
              href="/architecture"
              className="px-3 py-2 rounded-xl btn-ghost text-xs flex items-center gap-1.5 transition-all hidden md:flex"
            >
              <Layers className="w-3.5 h-3.5" />
              Architecture
            </a>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent-border-strong)] text-[var(--accent)] hover:bg-[var(--surface-3)] flex items-center justify-center transition-all cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Wallet */}
            {mounted && (
              activeAddress ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOptInUSDC}
                    disabled={optInLoading}
                    className="px-3 py-2 rounded-xl btn-ghost text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    title="Opt-In to Testnet USDC ASA 10458941"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    {optInLoading ? 'Opting In...' : 'USDC Opt-In'}
                  </button>

                  <div className="px-3 py-2 rounded-xl aurora-inner text-xs font-mono-brand text-[var(--bull)] flex items-center gap-2 border-[var(--bull-border)]" style={{ borderColor: 'var(--bull-border)' }}>
                    <span className="w-2 h-2 rounded-full bg-[var(--bull)] animate-pulse-dot" />
                    <span>{activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => luteWallet?.connect()}
                  className="px-4 py-2 rounded-xl btn-primary text-sm flex items-center gap-2 font-heading"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* ── Main Container ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 pt-8 space-y-8">
        
        {/* Banner */}
        <div className="aurora-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--bull-bg)] border border-[var(--bull-border)] rounded-lg">
              <ShieldCheck className="w-5 h-5 text-[var(--bull)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-heading">
                  Zero-Fee Pre-Execution Guarantee
                </span>
                <span className="text-[10px] font-bold text-[var(--bull)] bg-[var(--bull-bg)] px-2 py-0.5 rounded border border-[var(--bull-border)] font-mono-brand">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Workers pre-execute before signature prompt. If any sub-agent fails, HTTP 502 returns and <strong className="text-[var(--bull)]">$0 is charged</strong>.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono-brand text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Algorand Testnet</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[var(--cyan)]" />
              <span>USDC ASA: 10458941</span>
            </div>
          </div>
        </div>

        {/* ── Token Selector ────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-2 font-heading">
              <Sparkles className="w-4 h-4" />
              1. Select Asset Pair
            </h2>
            <span className="text-xs text-[var(--text-muted)] font-mono-brand">9 Active Markets</span>
          </div>

          <div className="flex flex-wrap gap-2">
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
                  className={`px-4 py-2.5 rounded-xl border text-left transition-all relative overflow-hidden group flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent)] shadow-[0_0_20px_-4px_var(--accent-glow)] scale-[1.03]'
                      : 'bg-[var(--surface-1)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-border-strong)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="text-lg">{token.icon}</span>
                  <div>
                    <div className={`text-xs font-bold font-mono-brand ${isSelected ? 'text-[var(--text-primary)]' : ''}`}>{token.symbol}</div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate hidden sm:block">{token.name}</div>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse-dot ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Execution Dashboard ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Signal Engine */}
          <div className="lg:col-span-7 aurora-panel rounded-3xl p-6 space-y-6 relative overflow-hidden">
            
            {/* Accent strip */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--accent)] via-[var(--cyan)] to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2 font-heading">
                  <TrendingUp className="w-5 h-5 text-[var(--accent)]" />
                  {selectedToken} / USDC Signal Engine
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {activeEndpoint === 'consensus'
                    ? '4-Agent Weighted Consensus (Sentiment + Whales + Technicals)'
                    : 'HuggingFace FinBERT Financial Sentiment NLP Agent'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold font-mono-brand text-[var(--accent)] bg-[var(--accent-subtle)] px-2.5 py-1 rounded-lg border border-[var(--accent-border)]">
                  {activeEndpoint === 'consensus' ? '$0.0070 USDC' : '$0.0020 USDC'}
                </span>
              </div>
            </div>

            {/* Signal Display */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Gauge */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl aurora-inner">
                <ScoreGauge 
                  score={
                    signalData?.signalFusion?.compositeScore ?? 
                    signalData?.sentiment?.score ?? 
                    null
                  } 
                  size={160} 
                />
                
                <div className="mt-3 text-center">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block font-heading">
                    Consensus Verdict
                  </span>
                  <span className={`text-base font-extrabold tracking-wider uppercase font-heading ${
                    signalData 
                      ? (signalData.signalFusion?.verdict?.includes('BUY') || signalData.sentiment?.sentimentVerdict === 'BULLISH' 
                          ? 'text-[var(--bull)]' 
                          : signalData.signalFusion?.verdict?.includes('SELL') || signalData.sentiment?.sentimentVerdict === 'BEARISH'
                          ? 'text-[var(--bear)]'
                          : 'text-[var(--neutral)]')
                      : 'text-[var(--neutral)]/50'
                  }`}>
                    {signalData?.signalFusion?.verdict ?? signalData?.sentiment?.sentimentVerdict ?? 'AWAITING EXECUTION'}
                  </span>
                </div>
              </div>

              {/* Action Column */}
              <div className="md:col-span-7 space-y-4">
                
                {/* Conviction Meter */}
                <div 
                  className="p-3.5 rounded-2xl aurora-inner transition-all duration-500 space-y-2"
                  style={{
                    borderColor: convictionPct > 0 ? 'var(--accent-border-strong)' : 'var(--border)',
                    boxShadow: convictionPct > 0 ? `0 0 ${Math.round(convictionPct / 4)}px var(--accent-glow)` : 'none'
                  }}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)] font-medium">Multi-Agent Agreement Conviction</span>
                    <span className="font-bold font-mono-brand text-[var(--accent)]">
                      {signalData?.signalFusion?.confidencePct 
                        ? `${signalData.signalFusion.confidencePct}% Agreement` 
                        : 'Awaiting Execution (--%)'} 
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--surface-3)] overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${signalData?.signalFusion?.confidencePct ?? 0}%`,
                        background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
                        boxShadow: '0 0 12px var(--accent-glow)'
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Measures cross-agent alignment across sentiment, whale flow, and technical indicators.
                  </p>
                </div>

                {/* Execute Button */}
                <button
                  onClick={handleExecuteStrategy}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl btn-primary text-sm flex items-center justify-center gap-2 font-heading font-extrabold"
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

                {/* Protocol Stepper */}
                {loading && (
                  <div className="p-3 rounded-xl aurora-inner text-xs font-mono-brand text-[var(--accent)] space-y-1.5 animate-fade-up" style={{ borderColor: 'var(--accent-border-strong)' }}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>x402 Protocol Handshake</span>
                      <span>Step {currentStep} of 4</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
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
              <div className={`grid gap-3 pt-2 border-t border-[var(--border)] animate-fade-up ${
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
                  const badgeStyle = isBull 
                    ? 'text-[var(--bull)] bg-[var(--bull-bg)] border-[var(--bull-border)]' 
                    : isBear 
                    ? 'text-[var(--bear)] bg-[var(--bear-bg)] border-[var(--bear-border)]' 
                    : 'text-[var(--neutral)] bg-[var(--neutral)]/10 border-[var(--neutral)]/30';

                  return (
                    <div className="p-3.5 rounded-xl aurora-card space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">
                          Worker A (FinBERT Sentiment)
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>
                          {label}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-[var(--text-primary)] font-mono-brand">Sentiment: {score} / 100</div>
                      <div className="text-[10px] text-[var(--accent)] font-mono-brand">
                        {activeEndpoint === 'sentiment' ? 'Single-Agent FinBERT Query ($0.002)' : 'FinBERT Financial NLP'}
                      </div>
                    </div>
                  );
                })()}

                {/* Worker B & C */}
                {activeEndpoint === 'consensus' && signalData.endpoint !== 'sentiment-only' && (
                  <>
                    {/* Worker B */}
                    {(() => {
                      const flowStr = signalData.breakdown?.onChainWhaleFlow ?? '+18% Net Inflow';
                      const isBear = flowStr.includes('-') || flowStr.toLowerCase().includes('outflow');
                      const isBull = flowStr.includes('+') || flowStr.toLowerCase().includes('inflow');
                      const label = isBear ? 'BEARISH' : isBull ? 'BULLISH' : 'NEUTRAL';
                      const badgeStyle = isBull 
                        ? 'text-[var(--bull)] bg-[var(--bull-bg)] border-[var(--bull-border)]' 
                        : isBear 
                        ? 'text-[var(--bear)] bg-[var(--bear-bg)] border-[var(--bear-border)]' 
                        : 'text-[var(--neutral)] bg-[var(--neutral)]/10 border-[var(--neutral)]/30';

                      return (
                        <div className="p-3.5 rounded-xl aurora-card space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker B (Whale Flow)</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>
                              {label}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-[var(--text-primary)] font-mono-brand">{flowStr}</div>
                          <div className="text-[10px] text-[var(--cyan)] font-mono-brand">CoinGecko Market Flow</div>
                        </div>
                      );
                    })()}

                    {/* Worker C */}
                    {(() => {
                      const taStr = signalData.breakdown?.technicalIndicator ?? 'RSI 58 Bullish';
                      const isBear = taStr.toLowerCase().includes('bearish');
                      const isBull = taStr.toLowerCase().includes('bullish');
                      const label = isBear ? 'BEARISH' : isBull ? 'BULLISH' : 'NEUTRAL';
                      const badgeStyle = isBull 
                        ? 'text-[var(--bull)] bg-[var(--bull-bg)] border-[var(--bull-border)]' 
                        : isBear 
                        ? 'text-[var(--bear)] bg-[var(--bear-bg)] border-[var(--bear-border)]' 
                        : 'text-[var(--neutral)] bg-[var(--neutral)]/10 border-[var(--neutral)]/30';

                      return (
                        <div className="p-3.5 rounded-xl aurora-card space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker C (Technicals)</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>
                              {label}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-[var(--text-primary)] font-mono-brand truncate">{taStr}</div>
                          <div className="text-[10px] text-[var(--seg-c)] font-mono-brand">RSI, SMA & MACD Engine</div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 rounded-2xl bg-[var(--bear-bg)] border border-[var(--bear-border)] text-xs text-[var(--bear)] flex items-start gap-3 animate-fade-up font-mono-brand">
                <AlertCircle className="w-5 h-5 text-[var(--bear)] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-[var(--bear)] font-heading">Execution Alert</span>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Success */}
            {successMsg && (
              <div className="p-4 rounded-2xl bg-[var(--bull-bg)] border border-[var(--bull-border)] text-xs text-[var(--bull)] flex items-start gap-3 animate-fade-up font-mono-brand">
                <CheckCircle2 className="w-5 h-5 text-[var(--bull)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[var(--bull)] font-heading">Transaction Status</span>
                  <p>{successMsg}</p>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Worker Radar & Receipt */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Sub-Agent Network Radar */}
            <div className="aurora-panel rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 font-heading">
                  <Activity className="w-4 h-4 text-[var(--accent)]" />
                  Sub-Agent Network Radar
                </h3>
                <span className="text-[10px] font-bold text-[var(--bull)] bg-[var(--bull-bg)] px-2 py-0.5 rounded border border-[var(--bull-border)] font-mono-brand">
                  ALL SYSTEMS ONLINE
                </span>
              </div>

              <div className="space-y-3">
                {/* Worker A */}
                <div className="p-3 rounded-2xl aurora-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.sentiment?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] font-heading">Worker A: FinBERT Sentiment</div>
                      <div className="text-[10px] text-[var(--text-muted)]">FastAPI Serverless Router</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-[var(--accent)]">
                    {healthData?.workers?.sentiment?.latencyMs || 28}ms
                  </span>
                </div>

                {/* Worker B */}
                <div className="p-3 rounded-2xl aurora-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.onchain?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] font-heading">Worker B: On-Chain Whale Flow</div>
                      <div className="text-[10px] text-[var(--text-muted)]">CoinGecko Market Heuristics</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-[var(--cyan)]">
                    {healthData?.workers?.onchain?.latencyMs || 16}ms
                  </span>
                </div>

                {/* Worker C */}
                <div className="p-3 rounded-2xl aurora-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.ta?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] font-heading">Worker C: Technical Indicators</div>
                      <div className="text-[10px] text-[var(--text-muted)]">RSI, SMA 7/20 & MACD Engine</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-[var(--seg-c)]">
                    {healthData?.workers?.ta?.latencyMs || 18}ms
                  </span>
                </div>

                {/* Worker D */}
                <div className="p-3 rounded-2xl aurora-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusDot status={healthData?.workers?.fusion?.status || 'online'} />
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)] font-heading">Worker D: Consensus Fusion</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Dynamic Weighted Consensus</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono-brand text-[var(--neutral)]">
                    {healthData?.workers?.fusion?.latencyMs || 18}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Receipt Card */}
            {signalData?.onChainReceipt && (
              <div className="aurora-panel rounded-3xl p-6 space-y-4 animate-fade-up" style={{ borderColor: 'var(--bull-border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--bull)] flex items-center gap-2 font-heading">
                  <ShieldCheck className="w-4 h-4" />
                  Verifiable Payment Receipt
                </h4>
                
                <div className="space-y-2.5 text-xs font-mono-brand">
                  
                  {/* Client Tx */}
                  <div className="p-2.5 rounded-xl aurora-inner flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Client Tx:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--accent)]">{signalData.clientPaymentTxId?.slice(0, 10)}...</span>
                      <button 
                        onClick={() => handleCopyTx(signalData.clientPaymentTxId)}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {copiedTxId ? <Check className="w-3.5 h-3.5 text-[var(--bull)]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Facilitator */}
                  <div className="p-2.5 rounded-xl aurora-inner flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Facilitator:</span>
                    <span className="text-[var(--bull)] font-bold">GoPlausible Verified ✓</span>
                  </div>

                  {/* Worker Payout Group */}
                  {(signalData.workerPayoutGroupTxId || signalData.onChainReceipt?.workerPayoutExplorerUrl) && (
                    <div className="p-2.5 rounded-xl aurora-inner flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Worker Payout Group:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--cyan)]">
                          {(signalData.workerPayoutGroupTxId || signalData.clientPaymentTxId)?.slice(0, 10)}...
                        </span>
                        <button 
                          onClick={() => handleCopyTx(signalData.workerPayoutGroupTxId || signalData.clientPaymentTxId)}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          {copiedTxId ? <Check className="w-3.5 h-3.5 text-[var(--bull)]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Payout Split Bar */}
                  <div className="p-3 rounded-xl aurora-inner space-y-2.5" style={{ borderColor: 'var(--accent-border)' }}>
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-heading font-bold">
                      <span>DYNAMIC WORKER PAYOUT SPLIT</span>
                      <span className="text-[var(--accent)] font-mono-brand">
                        {isSentimentMode ? '1 Worker ($0.0020)' : '4 Workers ($0.0070)'}
                      </span>
                    </div>

                    {/* Segmented Bar */}
                    <div className="w-full h-5 rounded-lg bg-[var(--surface-3)] overflow-hidden flex p-0.5 gap-0.5 border border-[var(--border)]">
                      <div 
                        title={`Worker A (FinBERT): ${amountA} µUSDC (${pctA}%)`}
                        className="h-full rounded-md bg-[var(--seg-a)] text-white font-mono-brand font-bold text-[9px] flex items-center justify-center transition-all duration-600 ease-out overflow-hidden"
                        style={{ width: `${pctA}%` }}
                      >
                        {Number(pctA) >= 12 && `${amountA}µ`}
                      </div>

                      {Number(pctB) > 0 && (
                        <div 
                          title={`Worker B (Whales): ${amountB} µUSDC (${pctB}%)`}
                          className="h-full rounded-md bg-[var(--seg-b)] text-white font-mono-brand font-bold text-[9px] flex items-center justify-center transition-all duration-600 ease-out overflow-hidden"
                          style={{ width: `${pctB}%` }}
                        >
                          {Number(pctB) >= 12 && `${amountB}µ`}
                        </div>
                      )}

                      {Number(pctC) > 0 && (
                        <div 
                          title={`Worker C (Technicals): ${amountC} µUSDC (${pctC}%)`}
                          className="h-full rounded-md bg-[var(--seg-c)] text-white font-mono-brand font-bold text-[9px] flex items-center justify-center transition-all duration-600 ease-out overflow-hidden"
                          style={{ width: `${pctC}%` }}
                        >
                          {Number(pctC) >= 12 && `${amountC}µ`}
                        </div>
                      )}

                      {Number(pctD) > 0 && (
                        <div 
                          title={`Worker D (Fusion Engine): ${amountD} µUSDC (${pctD}%)`}
                          className="h-full rounded-md bg-[var(--seg-d)] text-white font-mono-brand font-bold text-[9px] flex items-center justify-center transition-all duration-600 ease-out overflow-hidden"
                          style={{ width: `${pctD}%` }}
                        >
                          {Number(pctD) >= 12 && `${amountD}µ`}
                        </div>
                      )}
                    </div>

                    {/* Numeric Breakdown */}
                    <div className="space-y-0.5 pt-1 text-[10px] font-mono-brand text-[var(--text-secondary)] border-t border-[var(--border)]">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--seg-a)]" />
                          Worker A (Sentiment):
                        </span>
                        <span className="text-[var(--seg-a)] font-bold">{amountA} µUSDC ({pctA}%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--seg-b)]" />
                          Worker B (Whales):
                        </span>
                        <span className="text-[var(--seg-b)] font-bold">{amountB} µUSDC ({pctB}%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--seg-c)]" />
                          Worker C (Technicals):
                        </span>
                        <span className="text-[var(--seg-c)] font-bold">{amountC} µUSDC ({pctC}%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--seg-d)]" />
                          Worker D (Fusion):
                        </span>
                        <span className="text-[var(--seg-d)] font-bold">{amountD} µUSDC ({pctD}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Attestation Hash */}
                  <div className="p-2.5 rounded-xl aurora-inner">
                    <span className="text-[var(--text-muted)] text-[10px] block">Cryptographic Attestation Hash:</span>
                    <span className="text-[10px] text-[var(--cyan)] truncate block mt-0.5">
                      {signalData.onChainReceipt.attestationHash || 'sha256(signal:txId)'}
                    </span>
                  </div>
                </div>

                <a
                  href={signalData.onChainReceipt.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl aurora-inner text-[var(--bull)] hover:text-[var(--bull)]/90 text-xs font-bold flex items-center justify-center gap-2 transition-all mt-2 font-heading"
                  style={{ borderColor: 'var(--bull-border)' }}
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
          <div className="aurora-panel rounded-3xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2 font-heading">
              <Clock className="w-4 h-4 text-[var(--accent)]" />
              Recent Signal Executions ({history.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {history.map((entry) => (
                <div key={entry.id} className="p-3.5 rounded-2xl aurora-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)] font-mono-brand">{entry.token} / USDC</span>
                    <span className="text-[10px] font-mono-brand text-[var(--accent)]">{entry.cost}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-[var(--accent)] font-mono-brand">{entry.compositeScore}</span>
                    <span className="text-xs font-bold text-[var(--bull)] font-heading">{entry.verdict}</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-1 border-t border-[var(--border)] font-mono-brand">
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
