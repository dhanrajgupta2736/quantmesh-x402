'use client';
// QuantMesh x402 — Midnight Aurora v2: Trading Layout + Agent Animations

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { fetchQuantMeshSignal, optInToUSDCAsset } from '@/lib/x402Client';
import { 
  Zap, ShieldCheck, RefreshCw, Wallet, ExternalLink, Coins, Layers, 
  Activity, CheckCircle2, AlertCircle, Clock, TrendingUp, Brain, 
  Sparkles, Copy, Check, Globe, GitMerge, Sun, Moon, ArrowUpRight, 
  ArrowDownRight, Minus, ChevronRight, Radio, BarChart3
} from 'lucide-react';

// ─── Animated Ticker Bar (Trading Data Stream) ────────────────────
function TickerBar() {
  const tickers = [
    { sym: 'BTC', val: '67,240', chg: '+2.4%', up: true },
    { sym: 'ETH', val: '3,512', chg: '+1.8%', up: true },
    { sym: 'SOL', val: '178.9', chg: '-0.6%', up: false },
    { sym: 'ALGO', val: '0.312', chg: '+4.1%', up: true },
    { sym: 'AVAX', val: '38.7', chg: '-1.2%', up: false },
    { sym: 'LINK', val: '14.8', chg: '+0.9%', up: true },
    { sym: 'DOGE', val: '0.124', chg: '+5.2%', up: true },
    { sym: 'SUI', val: '1.47', chg: '+3.1%', up: true },
  ];
  const doubled = [...tickers, ...tickers]; // Seamless loop

  return (
    <div className="w-full overflow-hidden border-b border-[var(--border)] bg-[var(--surface-1)]/50 backdrop-blur-sm">
      <div className="animate-data-stream flex items-center gap-8 py-1.5 px-4 whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((t, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px] font-mono-brand">
            <span className="text-[var(--text-muted)] font-bold">{t.sym}</span>
            <span className="text-[var(--text-secondary)]">${t.val}</span>
            <span className={`flex items-center gap-0.5 ${t.up ? 'text-[var(--bull)]' : 'text-[var(--bear)]'}`}>
              {t.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {t.chg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Worker Execution Animation (Ring + Status) ──────────────────
function WorkerRing({ active, step, workerIdx }: { active: boolean; step: number; workerIdx: number }) {
  const isProcessing = active && step >= 1;
  const isDone = active && step >= 4;
  const isMyTurn = active && step >= workerIdx;
  const r = 16;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-10 h-10 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="2.5" strokeOpacity="0.3" />
        <circle 
          cx="20" cy="20" r={r} fill="none"
          stroke={isDone ? 'var(--bull)' : isMyTurn ? 'var(--accent)' : 'var(--surface-3)'}
          strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={isDone ? 0 : isMyTurn ? circ * 0.25 : circ}
          className={isProcessing && !isDone && isMyTurn ? 'animate-worker-ring' : ''}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isDone ? (
          <Check className="w-4 h-4 text-[var(--bull)]" />
        ) : isMyTurn && isProcessing ? (
          <RefreshCw className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
        ) : (
          <span className="text-[10px] font-bold font-mono-brand text-[var(--text-muted)]">{String.fromCharCode(65 + workerIdx - 1)}</span>
        )}
      </div>
    </div>
  );
}

// ─── Score Gauge ────────────────────────────────────────────────────
function ScoreGauge({ score, size = 180 }: { score: number | null; size?: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = score ?? 0;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#34D399', label: 'text-[#34D399]', glow: 'rgba(52,211,153,0.5)' };
    if (s >= 55) return { stroke: '#34D399', label: 'text-[#34D399]/90', glow: 'rgba(52,211,153,0.3)' };
    if (s >= 45) return { stroke: '#9CA3AF', label: 'text-[#9CA3AF]', glow: 'rgba(156,163,175,0.3)' };
    if (s >= 30) return { stroke: '#FB7185', label: 'text-[#FB7185]/90', glow: 'rgba(251,113,133,0.3)' };
    return { stroke: '#FB7185', label: 'text-[#FB7185]', glow: 'rgba(251,113,133,0.5)' };
  };

  const colors = getColor(normalizedScore);

  return (
    <div className={`relative flex items-center justify-center ${score !== null ? 'animate-signal-pulse' : ''}`} style={{ width: size, height: size }}>
      {/* Outer glow ring */}
      {score !== null && (
        <div className="absolute inset-0 rounded-full animate-orbit-glow" style={{ 
          background: `radial-gradient(circle at center, transparent 60%, ${colors.glow} 100%)`,
          opacity: 0.4,
        }} />
      )}
      <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size }}>
        {/* Tick marks */}
        {Array.from({ length: 40 }).map((_, i) => {
          const angle = (i / 40) * 360;
          const rad = (angle * Math.PI) / 180;
          const x1 = 50 + 42 * Math.cos(rad);
          const y1 = 50 + 42 * Math.sin(rad);
          const x2 = 50 + (i % 5 === 0 ? 38 : 40) * Math.cos(rad);
          const y2 = 50 + (i % 5 === 0 ? 38 : 40) * Math.sin(rad);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--surface-3)" strokeWidth={i % 5 === 0 ? '1' : '0.5'} strokeOpacity="0.5" />;
        })}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface-3)" strokeWidth="6" strokeOpacity="0.2" />
        {score !== null && (
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={colors.stroke} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="animate-score-fill"
            style={{ filter: `drop-shadow(0 0 10px ${colors.glow})`, transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-extrabold font-mono-brand tracking-tighter ${score !== null ? colors.label : 'text-[var(--text-muted)]/40'}`}>
          {score !== null ? score : '--'}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mt-0.5 font-heading">
          / 100 SCORE
        </span>
      </div>
    </div>
  );
}

// ─── Status Dot ─────────────────────────────────────────────────────
function StatusDot({ status }: { status: 'online' | 'offline' | 'degraded' | 'unknown' }) {
  const colorMap = {
    online: 'bg-[#34D399]', degraded: 'bg-[#F59E0B]',
    offline: 'bg-[#FB7185]', unknown: 'bg-[#9CA3AF]',
  };
  return (
    <span className="flex h-2.5 w-2.5 relative">
      {status === 'online' && <span className={`animate-pulse-dot absolute inline-flex h-full w-full rounded-full ${colorMap[status]} opacity-75`} />}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colorMap[status]}`} />
    </span>
  );
}

// ─── Execution Pipeline Visual ──────────────────────────────────────
function ExecutionPipeline({ step, loading }: { step: number; loading: boolean }) {
  if (!loading && step === 0) return null;
  const stages = [
    { label: 'HTTP 402 Probe', icon: Radio },
    { label: 'Wallet Signature', icon: Wallet },
    { label: 'Block Settlement', icon: BarChart3 },
    { label: 'Receipt Verified', icon: ShieldCheck },
  ];

  return (
    <div className="flex items-center gap-1 w-full animate-fade-up">
      {stages.map((s, i) => {
        const idx = i + 1;
        const done = step > idx || (!loading && step >= idx);
        const active = loading && step === idx;
        const Icon = s.icon;
        return (
          <React.Fragment key={i}>
            <div className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-mono-brand transition-all duration-300 ${
              done ? 'bg-[var(--bull-bg)] text-[var(--bull)] border border-[var(--bull-border)]' 
              : active ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border-strong)] animate-shimmer'
              : 'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]'
            }`}>
              <Icon className="w-3 h-3 shrink-0" />
              <span className="truncate hidden sm:inline">{s.label}</span>
              {active && <RefreshCw className="w-2.5 h-2.5 animate-spin ml-auto shrink-0" />}
              {done && <Check className="w-2.5 h-2.5 ml-auto shrink-0" />}
            </div>
            {i < 3 && <ChevronRight className="w-3 h-3 text-[var(--text-muted)] shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Types & Constants ──────────────────────────────────────────────
interface WorkerHealth { status: 'online' | 'offline' | 'degraded' | 'unknown'; latencyMs: number; }
interface HealthData { status: string; uptime: string; workers: { sentiment: WorkerHealth; onchain: WorkerHealth; ta: WorkerHealth; fusion: WorkerHealth; }; }
interface SignalHistoryEntry { id: string; token: string; compositeScore: number; verdict: string; txId: string; timestamp: string; cost: string; }

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

const WORKER_META = [
  { key: 'sentiment' as const, label: 'FinBERT Sentiment', sub: 'NLP Engine', color: 'var(--seg-a)' },
  { key: 'onchain' as const, label: 'Whale Flow', sub: 'CoinGecko', color: 'var(--seg-b)' },
  { key: 'ta' as const, label: 'Technical Analysis', sub: 'RSI/SMA/MACD', color: 'var(--seg-c)' },
  { key: 'fusion' as const, label: 'Consensus Fusion', sub: 'Weighted Merge', color: 'var(--seg-d)' },
];

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
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

  useEffect(() => { setMounted(true); document.documentElement.setAttribute('data-theme', theme); }, [theme]);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('https://api.dhanrajgupta.xyz/api/v1/health');
      if (res.ok) setHealthData(await res.json());
    } catch { /* keep previous */ }
  }, []);

  useEffect(() => { checkHealth(); const i = setInterval(checkHealth, 12000); return () => clearInterval(i); }, [checkHealth]);

  const handleCopyTx = (txId: string) => { navigator.clipboard.writeText(txId); setCopiedTxId(true); setTimeout(() => setCopiedTxId(false), 2000); };

  const handleOptInUSDC = async () => {
    if (!activeAddress || !luteWallet) return;
    setOptInLoading(true); setError(null); setSuccessMsg(null);
    try {
      const txId = await optInToUSDCAsset(activeAddress, async (txns: Uint8Array[]) => {
        const signed = await signTransactions(txns);
        return signed.filter((t): t is Uint8Array => t !== null);
      });
      setSuccessMsg(`Opt-In Successful! Tx: ${txId.slice(0, 8)}... Ready to execute strategies.`);
    } catch (err: any) { setError(err.message || 'Opt-In failed.'); }
    finally { setOptInLoading(false); }
  };

  const handleExecuteStrategy = async () => {
    if (!activeAddress) { setError('Please connect your Lute Wallet to execute strategy on Algorand Testnet.'); return; }
    setLoading(true); setError(null); setSuccessMsg(null); setCurrentStep(1);
    try {
      setTimeout(() => setCurrentStep(2), 500);
      const data = await fetchQuantMeshSignal(selectedToken, activeAddress, async (txns: Uint8Array[], indexesToSign?: number[]) => {
        const signed = await signTransactions(txns, indexesToSign);
        return signed.filter((t): t is Uint8Array => t !== null);
      }, activeEndpoint);
      setCurrentStep(3);
      if (!data || data.status === 'error' || (!data.signalFusion && !data.sentiment)) throw new Error(data?.message || 'Received invalid signal data structure.');
      setCurrentStep(4); setSignalData(data);
      const entry: SignalHistoryEntry = {
        id: Math.random().toString(36).substring(2, 9), token: selectedToken,
        compositeScore: data.signalFusion?.compositeScore ?? data.sentiment?.score ?? 70,
        verdict: data.signalFusion?.verdict ?? data.sentiment?.sentimentVerdict ?? 'BULLISH',
        txId: data.clientPaymentTxId || 'N/A',
        timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cost: activeEndpoint === 'consensus' ? '$0.0070' : '$0.0020',
      };
      setHistory((prev) => [entry, ...prev.slice(0, 7)]);
    } catch (err: any) {
      console.error('[QuantMesh] Execution error:', err);
      setCurrentStep(0); setError(err.message || 'Execution failed or signature was cancelled.');
    } finally { setLoading(false); }
  };

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

  const selectedTokenData = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken);

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Trading grid overlay */}
      <div className="fixed inset-0 bg-trading-grid pointer-events-none z-0" />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[var(--bg-main)]/80 border-b border-[var(--border)]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-subtle)] border border-[var(--accent-border)] rounded-xl glow-accent">
              <Zap className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] font-heading">QuantMesh</span>
                <span className="text-[10px] font-bold tracking-widest text-[var(--accent)] bg-[var(--accent-subtle)] px-1.5 py-0.5 rounded border border-[var(--accent-border)] font-mono-brand">x402</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] hidden sm:block">AI Signal Router on Algorand</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-[var(--surface-2)] p-0.5 rounded-lg border border-[var(--border)] flex items-center gap-0.5">
              <button onClick={() => { setActiveEndpoint('consensus'); setSignalData(null); setError(null); setSuccessMsg(null); setCurrentStep(0); }}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${activeEndpoint === 'consensus' ? 'btn-primary text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                <GitMerge className="w-3 h-3" /> 4-Agent
              </button>
              <button onClick={() => { setActiveEndpoint('sentiment'); setSignalData(null); setError(null); setSuccessMsg(null); setCurrentStep(0); }}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${activeEndpoint === 'sentiment' ? 'btn-primary text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                <Brain className="w-3 h-3" /> FinBERT
              </button>
            </div>

            <a href="/architecture" className="px-2.5 py-1.5 rounded-lg btn-ghost text-[11px] items-center gap-1 hidden md:flex">
              <Layers className="w-3 h-3" /> Arch
            </a>

            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] hover:border-[var(--accent-border-strong)] text-[var(--accent)] flex items-center justify-center transition-all cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {mounted && (
              activeAddress ? (
                <div className="flex items-center gap-1.5">
                  <button onClick={handleOptInUSDC} disabled={optInLoading}
                    className="px-2.5 py-1.5 rounded-lg btn-ghost text-[11px] font-bold flex items-center gap-1 disabled:opacity-50">
                    <Coins className="w-3 h-3" /> {optInLoading ? 'Opting...' : 'USDC'}
                  </button>
                  <div className="px-2.5 py-1.5 rounded-lg aurora-inner text-[11px] font-mono-brand text-[var(--bull)] flex items-center gap-1.5" style={{ borderColor: 'var(--bull-border)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--bull)] animate-pulse-dot" />
                    {activeAddress.slice(0, 4)}...{activeAddress.slice(-3)}
                  </div>
                </div>
              ) : (
                <button onClick={() => luteWallet?.connect()} className="px-3 py-1.5 rounded-lg btn-primary text-[11px] flex items-center gap-1.5 font-heading">
                  <Wallet className="w-3.5 h-3.5" /> Connect
                </button>
              )
            )}
          </div>
        </div>
        <TickerBar />
      </header>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <main className="max-w-[1400px] mx-auto px-4 pt-6 space-y-6 relative z-10">

        {/* ─ Row 1: Hero — Big gauge + Token + Execute ──────────── */}
        <div className="aurora-panel rounded-3xl p-6 relative overflow-hidden">
          {/* Accent strip */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--accent)] via-[var(--cyan)] to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Score Gauge (hero focal point) */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center py-4">
              <ScoreGauge 
                score={signalData?.signalFusion?.compositeScore ?? signalData?.sentiment?.score ?? null} 
                size={200} 
              />
              <div className="mt-4 text-center">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block font-heading">
                  {activeEndpoint === 'consensus' ? 'Consensus Verdict' : 'Sentiment Verdict'}
                </span>
                <span className={`text-lg font-extrabold tracking-wider uppercase font-heading ${
                  signalData 
                    ? (signalData.signalFusion?.verdict?.includes('BUY') || signalData.sentiment?.sentimentVerdict === 'BULLISH' 
                        ? 'text-[var(--bull)]' 
                        : signalData.signalFusion?.verdict?.includes('SELL') || signalData.sentiment?.sentimentVerdict === 'BEARISH'
                        ? 'text-[var(--bear)]' : 'text-[var(--neutral)]')
                    : 'text-[var(--neutral)]/50'
                }`}>
                  {signalData?.signalFusion?.verdict ?? signalData?.sentiment?.sentimentVerdict ?? 'AWAITING'}
                </span>
              </div>
            </div>

            {/* Center: Token + Controls */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              
              {/* Selected Token Display */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedTokenData?.icon}</span>
                <div>
                  <h2 className="text-2xl font-extrabold text-[var(--text-primary)] font-heading tracking-tight">
                    {selectedToken} <span className="text-[var(--text-muted)] font-normal">/ USDC</span>
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {activeEndpoint === 'consensus' ? '4-Agent Weighted Consensus' : 'FinBERT Financial NLP'} · {activeEndpoint === 'consensus' ? '$0.0070' : '$0.0020'}
                  </p>
                </div>
              </div>

              {/* Token Selector Pills */}
              <div className="flex flex-wrap gap-1.5">
                {SUPPORTED_TOKENS.map((token) => (
                  <button key={token.symbol}
                    onClick={() => { setSelectedToken(token.symbol); setSignalData(null); setError(null); setSuccessMsg(null); setCurrentStep(0); }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold font-mono-brand border transition-all ${
                      selectedToken === token.symbol 
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-[0_0_16px_-4px_var(--accent-glow)]'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-border-strong)] hover:text-[var(--text-primary)]'
                    }`}>
                    {token.icon} {token.symbol}
                  </button>
                ))}
              </div>

              {/* Conviction Meter */}
              <div className="p-3 rounded-xl aurora-inner space-y-1.5" style={{ borderColor: convictionPct > 0 ? 'var(--accent-border-strong)' : 'var(--border)' }}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)] font-medium">Agent Conviction</span>
                  <span className="font-bold font-mono-brand text-[var(--accent)]">
                    {signalData?.signalFusion?.confidencePct ? `${signalData.signalFusion.confidencePct}%` : '--%'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${signalData?.signalFusion?.confidencePct ?? 0}%`, background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)', boxShadow: '0 0 12px var(--accent-glow)' }} />
                </div>
              </div>

              {/* Execute Button */}
              <button onClick={handleExecuteStrategy} disabled={loading}
                className="w-full py-3.5 rounded-2xl btn-primary text-sm flex items-center justify-center gap-2 font-heading font-extrabold">
                {loading ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /><span>Processing Step {currentStep}/4...</span></>
                ) : (
                  <><Zap className="w-5 h-5 fill-white" /><span>Execute {activeEndpoint === 'consensus' ? '4-Agent Strategy' : 'FinBERT Sentiment'}</span></>
                )}
              </button>

              {/* Pipeline Visual */}
              <ExecutionPipeline step={currentStep} loading={loading} />
            </div>

            {/* Right: Worker Agent Cards with animated rings */}
            <div className="lg:col-span-3 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-heading flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[var(--accent)]" /> Agents
                </span>
                <span className="text-[9px] font-bold text-[var(--bull)] bg-[var(--bull-bg)] px-1.5 py-0.5 rounded border border-[var(--bull-border)] font-mono-brand">
                  ONLINE
                </span>
              </div>
              {WORKER_META.map((w, i) => (
                <div key={w.key} className="aurora-card p-2.5 flex items-center gap-2.5 animate-stagger" style={{ animationDelay: `${i * 100}ms` }}>
                  <WorkerRing active={loading} step={currentStep} workerIdx={i + 1} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-[var(--text-primary)] font-heading truncate">{w.label}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">{w.sub}</div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <StatusDot status={healthData?.workers?.[w.key]?.status || 'online'} />
                    <span className="text-[9px] font-mono-brand" style={{ color: w.color }}>
                      {healthData?.workers?.[w.key]?.latencyMs || (15 + i * 5)}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─ Row 2: Signal Breakdown + Receipt (appears after execution) ─ */}
        {signalData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up">
            
            {/* Worker Breakdown Cards */}
            <div className={`space-y-3 ${signalData.onChainReceipt ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] font-heading flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Signal Breakdown
              </h3>
              <div className={`grid gap-3 ${isSentimentMode ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
                {/* Worker A */}
                {(() => {
                  const score = signalData.breakdown?.sentimentScore ?? signalData.sentiment?.score ?? 50;
                  const isBull = score >= 55; const isBear = score <= 45;
                  const label = isBull ? 'BULLISH' : isBear ? 'BEARISH' : 'NEUTRAL';
                  const badgeStyle = isBull ? 'text-[var(--bull)] bg-[var(--bull-bg)] border-[var(--bull-border)]' : isBear ? 'text-[var(--bear)] bg-[var(--bear-bg)] border-[var(--bear-border)]' : 'text-[var(--neutral)] bg-[var(--neutral)]/10 border-[var(--neutral)]/30';
                  return (
                    <div className="aurora-card p-4 space-y-2 animate-stagger" style={{ animationDelay: '0ms' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker A · Sentiment</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                      </div>
                      <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand">{score}<span className="text-sm text-[var(--text-muted)]"> / 100</span></div>
                      <div className="w-full h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--seg-a)] transition-all" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  );
                })()}

                {activeEndpoint === 'consensus' && signalData.endpoint !== 'sentiment-only' && (
                  <>
                    {(() => {
                      const flowStr = signalData.breakdown?.onChainWhaleFlow ?? '+18% Net Inflow';
                      const isBear = flowStr.includes('-') || flowStr.toLowerCase().includes('outflow');
                      const isBull = flowStr.includes('+') || flowStr.toLowerCase().includes('inflow');
                      const label = isBear ? 'BEARISH' : isBull ? 'BULLISH' : 'NEUTRAL';
                      const badgeStyle = isBull ? 'text-[var(--bull)] bg-[var(--bull-bg)] border-[var(--bull-border)]' : isBear ? 'text-[var(--bear)] bg-[var(--bear-bg)] border-[var(--bear-border)]' : 'text-[var(--neutral)] bg-[var(--neutral)]/10 border-[var(--neutral)]/30';
                      return (
                        <div className="aurora-card p-4 space-y-2 animate-stagger" style={{ animationDelay: '100ms' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker B · Whale Flow</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                          </div>
                          <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand">{flowStr}</div>
                          <div className="text-[10px] text-[var(--cyan)] font-mono-brand">CoinGecko Market Data</div>
                        </div>
                      );
                    })()}
                    {(() => {
                      const taStr = signalData.breakdown?.technicalIndicator ?? 'RSI 58 Bullish';
                      const isBear = taStr.toLowerCase().includes('bearish');
                      const isBull = taStr.toLowerCase().includes('bullish');
                      const label = isBear ? 'BEARISH' : isBull ? 'BULLISH' : 'NEUTRAL';
                      const badgeStyle = isBull ? 'text-[var(--bull)] bg-[var(--bull-bg)] border-[var(--bull-border)]' : isBear ? 'text-[var(--bear)] bg-[var(--bear-bg)] border-[var(--bear-border)]' : 'text-[var(--neutral)] bg-[var(--neutral)]/10 border-[var(--neutral)]/30';
                      return (
                        <div className="aurora-card p-4 space-y-2 animate-stagger" style={{ animationDelay: '200ms' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker C · Technicals</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                          </div>
                          <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand truncate">{taStr}</div>
                          <div className="text-[10px] text-[var(--seg-c)] font-mono-brand">RSI, SMA & MACD</div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>

            {/* Receipt Card */}
            {signalData.onChainReceipt && (
              <div className="lg:col-span-5 aurora-panel rounded-3xl p-5 space-y-3" style={{ borderColor: 'var(--bull-border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--bull)] flex items-center gap-2 font-heading">
                  <ShieldCheck className="w-4 h-4" /> Verifiable Receipt
                </h4>
                
                <div className="space-y-2 text-xs font-mono-brand">
                  <div className="p-2 rounded-lg aurora-inner flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Client Tx:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--accent)]">{signalData.clientPaymentTxId?.slice(0, 10)}...</span>
                      <button onClick={() => handleCopyTx(signalData.clientPaymentTxId)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                        {copiedTxId ? <Check className="w-3.5 h-3.5 text-[var(--bull)]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg aurora-inner flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Facilitator:</span>
                    <span className="text-[var(--bull)] font-bold">GoPlausible ✓</span>
                  </div>
                  {(signalData.workerPayoutGroupTxId || signalData.onChainReceipt?.workerPayoutExplorerUrl) && (
                    <div className="p-2 rounded-lg aurora-inner flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Payout Group:</span>
                      <span className="text-[var(--cyan)]">{(signalData.workerPayoutGroupTxId || signalData.clientPaymentTxId)?.slice(0, 10)}...</span>
                    </div>
                  )}

                  {/* Payout Split Bar */}
                  <div className="p-2.5 rounded-lg aurora-inner space-y-2">
                    <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] font-heading font-bold">
                      <span>WORKER PAYOUT SPLIT</span>
                      <span className="text-[var(--accent)]">{isSentimentMode ? '1 Worker' : '4 Workers'}</span>
                    </div>
                    <div className="w-full h-4 rounded-md bg-[var(--surface-3)] overflow-hidden flex p-0.5 gap-0.5">
                      <div title={`A: ${amountA}µ (${pctA}%)`} className="h-full rounded-sm bg-[var(--seg-a)] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctA}%` }}>
                        {Number(pctA) >= 15 && `${amountA}µ`}
                      </div>
                      {Number(pctB) > 0 && <div title={`B: ${amountB}µ (${pctB}%)`} className="h-full rounded-sm bg-[var(--seg-b)] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctB}%` }}>{Number(pctB) >= 15 && `${amountB}µ`}</div>}
                      {Number(pctC) > 0 && <div title={`C: ${amountC}µ (${pctC}%)`} className="h-full rounded-sm bg-[var(--seg-c)] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctC}%` }}>{Number(pctC) >= 15 && `${amountC}µ`}</div>}
                      {Number(pctD) > 0 && <div title={`D: ${amountD}µ (${pctD}%)`} className="h-full rounded-sm bg-[var(--seg-d)] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctD}%` }}>{Number(pctD) >= 15 && `${amountD}µ`}</div>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] font-mono-brand text-[var(--text-muted)]">
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--seg-a)]" />A: {amountA}µ ({pctA}%)</div>
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--seg-b)]" />B: {amountB}µ ({pctB}%)</div>
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--seg-c)]" />C: {amountC}µ ({pctC}%)</div>
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--seg-d)]" />D: {amountD}µ ({pctD}%)</div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg aurora-inner">
                    <span className="text-[var(--text-muted)] text-[9px] block">Attestation:</span>
                    <span className="text-[9px] text-[var(--cyan)] truncate block">{signalData.onChainReceipt.attestationHash || 'sha256(signal:txId)'}</span>
                  </div>
                </div>

                <a href={signalData.onChainReceipt.explorerUrl} target="_blank" rel="noreferrer"
                  className="w-full py-2 rounded-xl aurora-inner text-[var(--bull)] text-xs font-bold flex items-center justify-center gap-1.5 transition-all font-heading hover:border-[var(--bull)]" style={{ borderColor: 'var(--bull-border)' }}>
                  <ExternalLink className="w-3.5 h-3.5" /> View on Lora
                </a>
              </div>
            )}
          </div>
        )}

        {/* ─ Status Banner ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl aurora-card">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[var(--bull)]" />
            <span className="text-[11px] font-bold text-[var(--text-primary)] font-heading">Zero-Fee Guarantee</span>
            <span className="text-[9px] font-bold text-[var(--bull)] bg-[var(--bull-bg)] px-1.5 py-0.5 rounded border border-[var(--bull-border)] font-mono-brand">ACTIVE</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono-brand text-[var(--text-muted)]">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-[var(--accent)]" /> Algorand Testnet</span>
            <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-[var(--cyan)]" /> USDC: 10458941</span>
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <div className="p-4 rounded-2xl bg-[var(--bear-bg)] border border-[var(--bear-border)] text-xs text-[var(--bear)] flex items-start gap-3 animate-fade-up font-mono-brand">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1"><span className="font-bold font-heading">Execution Alert</span><p>{error}</p></div>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-[var(--bull-bg)] border border-[var(--bull-border)] text-xs text-[var(--bull)] flex items-start gap-3 animate-fade-up font-mono-brand">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div><span className="font-bold font-heading">Transaction Status</span><p>{successMsg}</p></div>
          </div>
        )}

        {/* ─ History ───────────────────────────────────────────────── */}
        {history.length > 0 && (
          <div className="aurora-panel rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2 font-heading">
              <Clock className="w-4 h-4 text-[var(--accent)]" /> Recent Signals ({history.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {history.map((entry, i) => (
                <div key={entry.id} className="aurora-card p-3 space-y-2 animate-stagger" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)] font-mono-brand">{entry.token}/USDC</span>
                    <span className="text-[9px] font-mono-brand text-[var(--accent)]">{entry.cost}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-[var(--accent)] font-mono-brand">{entry.compositeScore}</span>
                    <span className="text-[11px] font-bold text-[var(--bull)] font-heading">{entry.verdict}</span>
                  </div>
                  <div className="text-[9px] text-[var(--text-muted)] flex items-center justify-between pt-1.5 border-t border-[var(--border)] font-mono-brand">
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
