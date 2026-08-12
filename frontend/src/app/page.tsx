'use client';
// QuantMesh x402 — Midnight Aurora v3: Hydration Fixed + All 4 Workers Animated + Amber Neutral Score

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { fetchQuantMeshSignal, optInToUSDCAsset } from '@/lib/x402Client';
import { 
  Zap, ShieldCheck, RefreshCw, Wallet, ExternalLink, Coins, Layers, 
  Activity, CheckCircle2, AlertCircle, Clock, TrendingUp, Brain, 
  Sparkles, Copy, Check, Globe, GitMerge, Sun, Moon, ArrowUpRight, 
  ArrowDownRight, ChevronRight, Radio, BarChart3
} from 'lucide-react';

// ─── Static Deterministic SVG Tick Marks (Hydration Mismatch Prevention) ───
const STATIC_TICK_MARKS = Array.from({ length: 40 }).map((_, i) => {
  const angle = (i / 40) * 360;
  const rad = (angle * Math.PI) / 180;
  return {
    key: i,
    x1: Number((50 + 42 * Math.cos(rad)).toFixed(2)),
    y1: Number((50 + 42 * Math.sin(rad)).toFixed(2)),
    x2: Number((50 + (i % 5 === 0 ? 38 : 40) * Math.cos(rad)).toFixed(2)),
    y2: Number((50 + (i % 5 === 0 ? 38 : 40) * Math.sin(rad)).toFixed(2)),
    isMajor: i % 5 === 0,
  };
});

// ─── Animated Ticker Bar (Trading Data Stream) ────────────────────
function TickerBar() {
  const [isLive, setIsLive] = useState(false);
  const [tickers, setTickers] = useState([
    { sym: 'BTC', val: '67,240', chg: '+2.4%', up: true },
    { sym: 'ETH', val: '3,512', chg: '+1.8%', up: true },
    { sym: 'SOL', val: '178.9', chg: '-0.6%', up: false },
    { sym: 'ALGO', val: '0.312', chg: '+4.1%', up: true },
    { sym: 'AVAX', val: '38.7', chg: '-1.2%', up: false },
    { sym: 'LINK', val: '14.8', chg: '+0.9%', up: true },
    { sym: 'DOGE', val: '0.124', chg: '+5.2%', up: true },
    { sym: 'SUI', val: '1.47', chg: '+3.1%', up: true },
  ]);

  useEffect(() => {
    let isMounted = true;
    async function fetchLivePrices() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL 
          ? `${process.env.NEXT_PUBLIC_ORCHESTRATOR_URL}/api/v1/prices`
          : 'https://api.dhanrajgupta.xyz/api/v1/prices';

        const res = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
        if (res.ok && isMounted) {
          const body = await res.json();
          const data = body.tickers || body;
          if (Array.isArray(data)) {
            const mapped = data.map((d: any) => {
              const sym = d.symbol.replace('USDT', '');
              const price = parseFloat(d.lastPrice);
              const valStr = price >= 10 ? price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : price.toFixed(3);
              const pct = parseFloat(d.priceChangePercent);
              const up = pct >= 0;
              const chgStr = `${up ? '+' : ''}${pct.toFixed(1)}%`;
              return { sym, val: valStr, chg: chgStr, up };
            });
            if (mapped.length > 0) {
              setTickers(mapped);
              setIsLive(true);
            }
          }
        } else if (isMounted) {
          setIsLive(false);
        }
      } catch {
        if (isMounted) setIsLive(false);
      }
    }

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 15000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const doubled = [...tickers, ...tickers];

  return (
    <div className="w-full overflow-hidden border-b border-[var(--border)] bg-[var(--surface-1)]/50 backdrop-blur-sm relative flex items-center">
      <div className="animate-data-stream flex items-center gap-8 py-1.5 px-4 whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((t, i) => (
          <div key={`ticker-${i}`} className="flex items-center gap-2 text-[11px] font-mono-brand">
            <span className="text-[var(--text-muted)] font-bold">{t.sym}</span>
            <span className="text-[var(--text-secondary)]">{isLive ? `$${t.val}` : `~${t.val}`}</span>
            <span className={`flex items-center gap-0.5 ${t.up ? 'text-[var(--bull)]' : 'text-[var(--bear)]'}`}>
              {t.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {t.chg}
            </span>
          </div>
        ))}
      </div>
      {!isLive && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono-brand text-[var(--text-muted)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded border border-[var(--border)] hidden sm:inline">
          INDICATIVE
        </span>
      )}
    </div>
  );
}

// ─── Worker Execution Animation (All 4 Active Simultaneously) ────
function WorkerRing({ active, isDone, workerIdx }: { active: boolean; isDone: boolean; workerIdx: number }) {
  const isProcessing = active && !isDone;
  const r = 16;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 40 40" className="w-10 h-10 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="2.5" strokeOpacity="0.3" />
        <circle 
          cx="20" cy="20" r={r} fill="none"
          stroke={isDone ? '#34D399' : isProcessing ? '#06B6D4' : 'var(--surface-3)'}
          strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={isDone ? 0 : isProcessing ? circ * 0.25 : circ}
          className={isProcessing ? 'animate-worker-ring' : ''}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isDone ? (
          <Check className="w-4 h-4 text-[#34D399]" />
        ) : isProcessing ? (
          <RefreshCw className="w-3.5 h-3.5 text-[#06B6D4] animate-spin" />
        ) : (
          <span className="text-[10px] font-bold font-mono-brand text-[var(--text-muted)]">
            {String.fromCharCode(65 + workerIdx - 1)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Score Gauge Component with Vibrant Colors ──────────────────────
function ScoreGauge({ score, size = 190 }: { score: number | null; size?: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = score ?? 0;
  const offset = circumference - (normalizedScore / 100) * circumference;

  // Vibrant color spectrum: Emerald (Bull) -> Amber Gold (Neutral) -> Crimson (Bear)
  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#34D399', label: 'text-[#34D399]', glow: 'rgba(52,211,153,0.5)' };
    if (s >= 55) return { stroke: '#10B981', label: 'text-[#10B981]', glow: 'rgba(16,185,129,0.4)' };
    if (s >= 45) return { stroke: '#F59E0B', label: 'text-[#F59E0B]', glow: 'rgba(245,158,11,0.5)' }; // Vibrant Amber Gold
    if (s >= 30) return { stroke: '#F43F5E', label: 'text-[#F43F5E]', glow: 'rgba(244,63,94,0.4)' };
    return { stroke: '#FB7185', label: 'text-[#FB7185]', glow: 'rgba(251,113,133,0.5)' };
  };

  const colors = getColor(normalizedScore);

  return (
    <div className={`relative flex items-center justify-center ${score !== null ? 'animate-signal-pulse' : ''}`} style={{ width: size, height: size }}>
      {/* Outer glow ring */}
      {score !== null && (
        <div className="absolute inset-0 rounded-full animate-orbit-glow" style={{ 
          background: `radial-gradient(circle at center, transparent 60%, ${colors.glow} 100%)`,
          opacity: 0.5,
        }} />
      )}
      <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size }}>
        {/* Precomputed Tick marks */}
        {STATIC_TICK_MARKS.map((tick) => (
          <line 
            key={tick.key} 
            x1={tick.x1} 
            y1={tick.y1} 
            x2={tick.x2} 
            y2={tick.y2} 
            stroke="var(--surface-3)" 
            strokeWidth={tick.isMajor ? '1' : '0.5'} 
            strokeOpacity="0.5" 
          />
        ))}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface-3)" strokeWidth="6" strokeOpacity="0.25" />
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
        <span className={`text-5xl font-extrabold font-mono-brand tracking-tighter ${score !== null ? colors.label : 'text-[#06B6D4]'}`}>
          {score !== null ? score : '--'}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-bold mt-0.5 font-heading">
          / 100 SCORE
        </span>
      </div>
    </div>
  );
}

// ─── Status Dot Component ───────────────────────────────────────────
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

// ─── Execution Pipeline Stepper Visual ──────────────────────────────
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
          <React.Fragment key={`stage-${i}`}>
            <div className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-mono-brand transition-all duration-300 ${
              done ? 'bg-[var(--bull-bg)] text-[#34D399] border border-[#34D399]/40' 
              : active ? 'bg-[var(--accent-subtle)] text-[#06B6D4] border border-[#06B6D4]/50 animate-shimmer'
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

// ─── Interfaces & Supported Assets ──────────────────────────────────
interface WorkerHealth { status: 'online' | 'offline' | 'degraded' | 'unknown'; latencyMs: number; }
interface HealthData { 
  status: string; 
  uptime: string; 
  workers: { 
    sentiment: WorkerHealth; 
    onchain: WorkerHealth; 
    ta: WorkerHealth; 
    fusion: WorkerHealth; 
    regime: WorkerHealth;
    news: WorkerHealth;
    feargreed: WorkerHealth;
    funding: WorkerHealth;
  }; 
}
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
  { key: 'sentiment' as const, label: 'Worker A: FinBERT Sentiment', sub: 'HuggingFace NLP Model', color: '#8B5CF6' },
  { key: 'onchain' as const, label: 'Worker B: On-Chain Whale Flow', sub: 'CoinGecko Liquidity', color: '#06B6D4' },
  { key: 'ta' as const, label: 'Worker C: Technical Indicators', sub: 'RSI, SMA & MACD', color: '#F59E0B' },
  { key: 'fusion' as const, label: 'Worker D: Consensus Fusion', sub: 'Weighted Engine', color: '#10B981' },
  { key: 'regime' as const, label: 'Worker E: Market Regime', sub: 'Binance ADX & Volatility', color: '#EC4899' },
  { key: 'news' as const, label: 'Worker F: News Catalyst', sub: 'CryptoPanic Classifier', color: '#F97316' },
  { key: 'feargreed' as const, label: 'Worker G: Fear & Greed', sub: 'Alternative.me Indicator', color: '#EF4444' },
  { key: 'funding' as const, label: 'Worker H: Funding & Perps', sub: 'Binance Futures Engine', color: '#14B8A6' },
];

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
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

  // Standalone tools state
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users WHERE name LIKE '%john%' ORDER BY created_at");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  const [contentText, setContentText] = useState("QuantMesh is an autonomous decentralized network of paid AI worker agents on Algorand. Each agent specializes in a distinct market intelligence task.");
  const [contentResult, setContentResult] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => { 
    setMounted(true); 
    document.documentElement.setAttribute('data-theme', theme); 
  }, [theme]);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch('https://api.dhanrajgupta.xyz/api/v1/health');
      if (res.ok) setHealthData(await res.json());
    } catch { /* keep previous */ }
  }, []);

  useEffect(() => { checkHealth(); const i = setInterval(checkHealth, 12000); return () => clearInterval(i); }, [checkHealth]);

  const handleCopyTx = (txId: string) => { 
    navigator.clipboard.writeText(txId); 
    setCopiedTxId(true); 
    setTimeout(() => setCopiedTxId(false), 2000); 
  };

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

  const handleTestSql = async () => {
    setSqlLoading(true); setSqlResult(null);
    try {
      const res = await fetch('https://api.dhanrajgupta.xyz/api/v1/sql-optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery }),
      });
      const data = await res.json();
      setSqlResult(data);
    } catch (err: any) {
      setSqlResult({ status: 'error', message: err.message });
    } finally { setSqlLoading(false); }
  };

  const handleTestContent = async () => {
    setContentLoading(true); setContentResult(null);
    try {
      const res = await fetch('https://api.dhanrajgupta.xyz/api/v1/content-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: contentText }),
      });
      const data = await res.json();
      setContentResult(data);
    } catch (err: any) {
      setContentResult({ status: 'error', message: err.message });
    } finally { setContentLoading(false); }
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

  // Verdict Helper with Vibrant Colors
  const rawVerdict = signalData?.signalFusion?.verdict ?? signalData?.sentiment?.sentimentVerdict;
  const isBull = rawVerdict?.includes('BUY') || rawVerdict === 'BULLISH';
  const isBear = rawVerdict?.includes('SELL') || rawVerdict === 'BEARISH';
  const isNeutral = rawVerdict?.includes('NEUTRAL') || rawVerdict === 'HOLD' || (!isBull && !isBear && signalData);

  return (
    <div className="min-h-screen pb-20 relative" suppressHydrationWarning>
      {/* Trading grid background overlay */}
      <div className="fixed inset-0 bg-trading-grid pointer-events-none z-0" />

      {/* ── Top Header ──────────────────────────────────────────────── */}
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
                <GitMerge className="w-3 h-3" /> 4-Agent ($0.007)
              </button>
              <button onClick={() => { setActiveEndpoint('sentiment'); setSignalData(null); setError(null); setSuccessMsg(null); setCurrentStep(0); }}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 ${activeEndpoint === 'sentiment' ? 'btn-primary text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                <Brain className="w-3 h-3" /> FinBERT ($0.002)
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
                  <div className="px-2.5 py-1.5 rounded-lg aurora-inner text-[11px] font-mono-brand text-[#34D399] flex items-center gap-1.5 border border-[#34D399]/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse-dot" />
                    {activeAddress.slice(0, 4)}...{activeAddress.slice(-3)}
                  </div>
                </div>
              ) : (
                <button onClick={() => luteWallet?.connect()} className="px-3 py-1.5 rounded-lg btn-primary text-[11px] flex items-center gap-1.5 font-heading">
                  <Wallet className="w-3.5 h-3.5" /> Connect Wallet
                </button>
              )
            )}
          </div>
        </div>
        <TickerBar />
      </header>

      {/* ── Main Container ──────────────────────────────────────────── */}
      <main className="max-w-[1400px] mx-auto px-4 pt-6 space-y-6 relative z-10">

        {/* ─ Row 1: Hero Dashboard Panel ──────────────────────────────── */}
        <div className="aurora-panel rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[var(--accent)] via-[var(--cyan)] to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Score Gauge Focal Point */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center py-2">
              <ScoreGauge 
                score={signalData?.signalFusion?.compositeScore ?? signalData?.sentiment?.score ?? null} 
                size={200} 
              />
              <div className="mt-4 text-center">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block font-heading">
                  {activeEndpoint === 'consensus' ? 'Consensus Verdict' : 'Sentiment Verdict'}
                </span>
                <div className="mt-1">
                  <span className={`inline-block px-3 py-1 rounded-xl text-base font-extrabold tracking-wider uppercase font-heading ${
                    isBull ? 'text-[#34D399] bg-[#34D399]/10 border border-[#34D399]/40 shadow-[0_0_12px_rgba(52,211,153,0.3)]'
                    : isBear ? 'text-[#FB7185] bg-[#FB7185]/10 border border-[#FB7185]/40 shadow-[0_0_12px_rgba(251,113,133,0.3)]'
                    : isNeutral ? 'text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/40 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/30'
                  }`}>
                    {rawVerdict ?? 'AWAITING EXECUTION'}
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Token Selector & Execution Controls */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              
              {/* Asset Header */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedTokenData?.icon}</span>
                <div>
                  <h2 className="text-2xl font-extrabold text-[var(--text-primary)] font-heading tracking-tight">
                    {selectedToken} <span className="text-[var(--text-muted)] font-normal">/ USDC</span>
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {activeEndpoint === 'consensus' ? '4-Agent Weighted Consensus' : 'FinBERT Financial Sentiment'} · {activeEndpoint === 'consensus' ? '$0.0070 USDC' : '$0.0020 USDC'}
                  </p>
                </div>
              </div>

              {/* Asset Selection Pills */}
              <div className="flex flex-wrap gap-1.5">
                {SUPPORTED_TOKENS.map((token) => (
                  <button key={`token-${token.symbol}`}
                    onClick={() => { setSelectedToken(token.symbol); setSignalData(null); setError(null); setSuccessMsg(null); setCurrentStep(0); }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold font-mono-brand border transition-all cursor-pointer ${
                      selectedToken === token.symbol 
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-[0_0_16px_-4px_var(--accent-glow)] scale-[1.03]'
                        : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-border-strong)] hover:text-[var(--text-primary)]'
                    }`}>
                    {token.icon} {token.symbol}
                  </button>
                ))}
              </div>

              {/* Agent Conviction Bar */}
              <div className="p-3 rounded-xl aurora-inner space-y-1.5" style={{ borderColor: convictionPct > 0 ? 'var(--accent-border-strong)' : 'var(--border)' }}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)] font-medium">Multi-Agent Conviction</span>
                  <span className="font-bold font-mono-brand text-[#06B6D4]">
                    {signalData?.signalFusion?.confidencePct ? `${signalData.signalFusion.confidencePct}% Agreement` : 'Awaiting (--%)'}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${signalData?.signalFusion?.confidencePct ?? 0}%`, background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)', boxShadow: '0 0 12px var(--accent-glow)' }} />
                </div>
              </div>

              {/* Execution CTA Button */}
              <button onClick={handleExecuteStrategy} disabled={loading}
                className="w-full py-3.5 rounded-2xl btn-primary text-sm flex items-center justify-center gap-2 font-heading font-extrabold cursor-pointer">
                {loading ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /><span>Processing Handshake {currentStep}/4...</span></>
                ) : (
                  <><Zap className="w-5 h-5 fill-white" /><span>Execute {activeEndpoint === 'consensus' ? '4-Agent Strategy ($0.007)' : 'FinBERT Sentiment ($0.002)'}</span></>
                )}
              </button>

              {/* Protocol Stepper */}
              <ExecutionPipeline step={currentStep} loading={loading} />
            </div>

            {/* Right: Worker Agent Status (All 8 animate during execution!) */}
            <div className="lg:col-span-3 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-heading flex items-center gap-1.5">
                  <Activity className="w-3 h-3 text-[var(--accent)]" /> Sub-Agent Swarm
                </span>
                <span className="text-[9px] font-bold text-[#34D399] bg-[#34D399]/10 px-1.5 py-0.5 rounded border border-[#34D399]/30 font-mono-brand">
                  {Object.values(healthData?.workers ?? {}).filter((w: any) => w.status === 'online').length || 4} ONLINE
                </span>
              </div>
              
              <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {WORKER_META.map((w, i) => {
                  const isWorkerDone = Boolean(signalData);
                  const isWorkerActive = loading;

                  return (
                    <div key={w.key} className="aurora-card p-2.5 flex items-center gap-2.5 animate-stagger shrink-0" style={{ animationDelay: `${i * 80}ms` }}>
                      <WorkerRing active={isWorkerActive} isDone={isWorkerDone} workerIdx={i + 1} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-[var(--text-primary)] font-heading truncate">{w.label}</div>
                        <div className="text-[9px] text-[var(--text-muted)] truncate">{w.sub}</div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <StatusDot status={healthData?.workers?.[w.key]?.status || 'online'} />
                        <span className="text-[9px] font-mono-brand font-bold" style={{ color: w.color }}>
                          {healthData?.workers?.[w.key]?.latencyMs || (12 + i * 4)}ms
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* ─ Row 2: Breakdown Cards & Receipt ─────────────────────────── */}
        {signalData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up">
            
            {/* Worker Breakdown Cards */}
            <div className={`space-y-3 ${signalData.onChainReceipt ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] font-heading flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Multi-Agent Signal Breakdown
              </h3>
              <div className={`grid gap-3 ${isSentimentMode ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'}`}>
                {/* Worker A */}
                {(() => {
                  const score = signalData.breakdown?.sentimentScore ?? signalData.sentiment?.score ?? 50;
                  const isB = score >= 55; const isR = score <= 45;
                  const label = isB ? 'BULLISH' : isR ? 'BEARISH' : 'NEUTRAL';
                  const badgeStyle = isB 
                    ? 'text-[#34D399] bg-[#34D399]/10 border-[#34D399]/40' 
                    : isR 
                    ? 'text-[#FB7185] bg-[#FB7185]/10 border-[#FB7185]/40' 
                    : 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/40';
                  return (
                    <div className="aurora-card p-4 space-y-2 animate-stagger" style={{ animationDelay: '0ms' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker A · Sentiment</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                      </div>
                      <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand">{score}<span className="text-sm text-[var(--text-muted)]"> / 100</span></div>
                      <div className="w-full h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
                        <div className="h-full rounded-full bg-[#8B5CF6] transition-all" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Worker B & C */}
                {activeEndpoint === 'consensus' && signalData.endpoint !== 'sentiment-only' && (
                  <>
                    {(() => {
                      const flowStr = signalData.breakdown?.onChainWhaleFlow ?? 'Data Unavailable';
                      const isR = flowStr.includes('-') || flowStr.toLowerCase().includes('outflow');
                      const isB = flowStr.includes('+') || flowStr.toLowerCase().includes('inflow');
                      const label = isR ? 'BEARISH' : isB ? 'BULLISH' : 'NEUTRAL';
                      const badgeStyle = isB 
                        ? 'text-[#34D399] bg-[#34D399]/10 border-[#34D399]/40' 
                        : isR 
                        ? 'text-[#FB7185] bg-[#FB7185]/10 border-[#FB7185]/40' 
                        : 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/40';
                      return (
                        <div className="aurora-card p-4 space-y-2 animate-stagger" style={{ animationDelay: '100ms' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker B · Whale Flow</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                          </div>
                          <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand">{flowStr}</div>
                          <div className="text-[10px] text-[#06B6D4] font-mono-brand">CoinGecko Liquidity</div>
                        </div>
                      );
                    })()}
                    {(() => {
                      const taStr = signalData.breakdown?.technicalIndicator ?? 'Data Unavailable';
                      const isR = taStr.toLowerCase().includes('bearish');
                      const isB = taStr.toLowerCase().includes('bullish');
                      const label = isR ? 'BEARISH' : isB ? 'BULLISH' : 'NEUTRAL';
                      const badgeStyle = isB 
                        ? 'text-[#34D399] bg-[#34D399]/10 border-[#34D399]/40' 
                        : isR 
                        ? 'text-[#FB7185] bg-[#FB7185]/10 border-[#FB7185]/40' 
                        : 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/40';
                      return (
                        <div className="aurora-card p-4 space-y-2 animate-stagger" style={{ animationDelay: '200ms' }}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker C · Technicals</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                          </div>
                          <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand truncate">{taStr}</div>
                          <div className="text-[10px] text-[#F59E0B] font-mono-brand">RSI, SMA & MACD Engine</div>
                        </div>
                      );
                    })()}

                    {/* Worker E: Regime */}
                    {signalData.breakdown?.regime && (
                      <div className="aurora-card p-4 space-y-2 animate-stagger" style={{ animationDelay: '250ms' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker E · Regime</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-[#EC4899] bg-[#EC4899]/10 border-[#EC4899]/40 font-heading">
                            {signalData.breakdown.regime}
                          </span>
                        </div>
                        <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand">
                          {signalData.breakdown.suggestedPositionSize || '2-4% Position'}
                        </div>
                        <div className="text-[10px] text-[#EC4899] font-mono-brand">
                          Stop Loss: {signalData.breakdown.stopLossLevel || '-1.5%'}
                        </div>
                      </div>
                    )}

                    {/* Worker F: News Catalyst */}
                    {signalData.breakdown?.newsCatalyst && (
                      <div className="aurora-card p-4 space-y-2 animate-stagger" style={{ animationDelay: '300ms' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker F · News</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-[#F97316] bg-[#F97316]/10 border-[#F97316]/40 font-heading">
                            {signalData.breakdown.newsCatalyst}
                          </span>
                        </div>
                        <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand">
                          {signalData.breakdown.newsScore !== null ? `${signalData.breakdown.newsScore} / 100` : 'Neutral Catalyst'}
                        </div>
                        <div className="text-[10px] text-[#F97316] font-mono-brand">CryptoPanic News Classifier</div>
                      </div>
                    )}

                    {/* Worker G: Fear & Greed */}
                    {signalData.breakdown?.fearGreedIndex !== undefined && signalData.breakdown?.fearGreedIndex !== null && (
                      <div className="aurora-card p-4 space-y-2 animate-stagger" style={{ animationDelay: '350ms' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker G · Fear & Greed</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/40 font-heading">
                            {signalData.breakdown.fearGreedClassification || 'Neutral'}
                          </span>
                        </div>
                        <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand">
                          Index: {signalData.breakdown.fearGreedIndex} <span className="text-xs text-[var(--text-muted)]">/ 100</span>
                        </div>
                        <div className="text-[10px] text-[#EF4444] font-mono-brand">Alternative.me Sentiment</div>
                      </div>
                    )}

                    {/* Worker H: Funding Rate */}
                    {signalData.breakdown?.liquidationPressure && (
                      <div className="aurora-card p-4 space-y-2 animate-stagger" style={{ animationDelay: '400ms' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker H · Funding</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/40 font-heading">
                            {signalData.breakdown.liquidationPressure}
                          </span>
                        </div>
                        <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand">
                          {signalData.breakdown.fundingRate !== null ? `${signalData.breakdown.fundingRate}%` : 'Spot Asset'}
                        </div>
                        <div className="text-[10px] text-[#14B8A6] font-mono-brand">Binance Futures Perps</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Receipt Card */}
            {signalData.onChainReceipt && (
              <div className="lg:col-span-5 aurora-panel rounded-3xl p-5 space-y-3 border border-[#34D399]/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#34D399] flex items-center gap-2 font-heading">
                  <ShieldCheck className="w-4 h-4" /> Verifiable Payment Receipt
                </h4>
                
                <div className="space-y-2 text-xs font-mono-brand">
                  <div className="p-2 rounded-lg aurora-inner flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Client Tx:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#8B5CF6]">{signalData.clientPaymentTxId?.slice(0, 10)}...</span>
                      <button onClick={() => handleCopyTx(signalData.clientPaymentTxId)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                        {copiedTxId ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg aurora-inner flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Facilitator:</span>
                    <span className={signalData.onChainReceipt?.facilitatorVerification?.isValid !== false ? 'text-[#34D399] font-bold' : 'text-[#FBBF24] font-bold'}>
                      {signalData.onChainReceipt?.facilitatorVerification?.isValid !== false
                        ? 'GoPlausible Verified ✓'
                        : 'GoPlausible Soft-Pass ⚠'}
                    </span>
                  </div>
                  {(signalData.workerPayoutGroupTxId || signalData.onChainReceipt?.workerPayoutExplorerUrl) && (
                    <div className="p-2 rounded-lg aurora-inner flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Payout Group:</span>
                      <div className="flex items-center gap-1.5">
                        <a 
                          href={signalData.onChainReceipt?.workerPayoutExplorerUrl || `https://lora.algokit.io/testnet/transaction/${signalData.workerPayoutGroupTxId}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[#06B6D4] hover:underline flex items-center gap-1 font-mono-brand font-bold"
                          title="View Worker Payout Group Transaction on Lora Explorer"
                        >
                          {(signalData.workerPayoutGroupTxId || signalData.clientPaymentTxId)?.slice(0, 10)}...
                          <ExternalLink className="w-3 h-3 text-[#06B6D4]" />
                        </a>
                        <button onClick={() => handleCopyTx(signalData.workerPayoutGroupTxId || signalData.clientPaymentTxId)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                          {copiedTxId ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Worker Payout Split Bar */}
                  <div className="p-2.5 rounded-lg aurora-inner space-y-2">
                    <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] font-heading font-bold">
                      <span>DYNAMIC WORKER PAYOUT SPLIT</span>
                      <span className="text-[#8B5CF6]">{isSentimentMode ? '1 Worker ($0.0020)' : '4 Workers ($0.0070)'}</span>
                    </div>
                    <div className="w-full h-4 rounded-md bg-[var(--surface-3)] overflow-hidden flex p-0.5 gap-0.5 border border-[var(--border)]">
                      <div title={`Worker A: ${amountA}µ (${pctA}%)`} className="h-full rounded-sm bg-[#8B5CF6] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctA}%` }}>
                        {Number(pctA) >= 15 && `${amountA}µ`}
                      </div>
                      {Number(pctB) > 0 && <div title={`Worker B: ${amountB}µ (${pctB}%)`} className="h-full rounded-sm bg-[#06B6D4] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctB}%` }}>{Number(pctB) >= 15 && `${amountB}µ`}</div>}
                      {Number(pctC) > 0 && <div title={`Worker C: ${amountC}µ (${pctC}%)`} className="h-full rounded-sm bg-[#F59E0B] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctC}%` }}>{Number(pctC) >= 15 && `${amountC}µ`}</div>}
                      {Number(pctD) > 0 && <div title={`Worker D: ${amountD}µ (${pctD}%)`} className="h-full rounded-sm bg-[#10B981] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctD}%` }}>{Number(pctD) >= 15 && `${amountD}µ`}</div>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] font-mono-brand text-[var(--text-muted)]">
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />Worker A: {amountA}µ ({pctA}%)</div>
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />Worker B: {amountB}µ ({pctB}%)</div>
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />Worker C: {amountC}µ ({pctC}%)</div>
                      <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />Worker D: {amountD}µ ({pctD}%)</div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg aurora-inner">
                    <span className="text-[var(--text-muted)] text-[9px] block">Attestation Hash:</span>
                    <span className="text-[9px] text-[#06B6D4] truncate block mt-0.5">{signalData.onChainReceipt.attestationHash || 'sha256(signal:txId)'}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 font-heading">
                  <a href={signalData.onChainReceipt.explorerUrl} target="_blank" rel="noreferrer"
                    className="flex-1 w-full py-2 rounded-xl aurora-inner text-[#34D399] hover:text-[#34D399]/90 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:border-[#34D399]" style={{ borderColor: 'rgba(52,211,153,0.4)' }}>
                    <ExternalLink className="w-3 h-3" /> Client Tx (Lora)
                  </a>
                  {(signalData.workerPayoutGroupTxId || signalData.onChainReceipt?.workerPayoutExplorerUrl) && (
                    <a href={signalData.onChainReceipt?.workerPayoutExplorerUrl || `https://lora.algokit.io/testnet/transaction/${signalData.workerPayoutGroupTxId}`} target="_blank" rel="noreferrer"
                      className="flex-1 w-full py-2 rounded-xl aurora-inner text-[#06B6D4] hover:text-[#06B6D4]/90 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:border-[#06B6D4]" style={{ borderColor: 'rgba(6,182,212,0.4)' }}>
                      <ExternalLink className="w-3 h-3" /> Group Payout (Lora)
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─ Row 3: Standalone Paid x402 Agent Micro-Services ────────────── */}
        <div className="aurora-panel rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[var(--accent-subtle)] border border-[var(--accent-border)] rounded-xl">
                <Sparkles className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[var(--text-primary)] font-heading">Standalone Paid x402 Micro-Services</h3>
                <p className="text-xs text-[var(--text-muted)]">Independent specialized AI agents accessible via pay-per-use endpoints</p>
              </div>
            </div>
            <span className="text-[10px] font-bold font-mono-brand text-[#06B6D4] bg-[#06B6D4]/10 px-2.5 py-1 rounded-lg border border-[#06B6D4]/30 hidden sm:inline">
              x402 Micro-Paid Services
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SQL Optimizer Tool */}
            <div className="aurora-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[var(--text-primary)] font-heading flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#06B6D4]" /> SQL Query Optimizer Agent
                </span>
                <span className="text-[9px] font-bold font-mono-brand text-[#34D399] bg-[#34D399]/10 px-1.5 py-0.5 rounded border border-[#34D399]/30">ONLINE</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Rule-based query analyzer for missing indexes, SELECT *, and wildcard bottlenecks.</p>
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl aurora-inner font-mono-brand text-xs text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]"
                placeholder="Enter SQL Query..."
              />
              <button
                onClick={handleTestSql}
                disabled={sqlLoading}
                className="w-full py-2.5 rounded-xl btn-primary text-xs font-bold font-heading flex items-center justify-center gap-2 cursor-pointer"
              >
                {sqlLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
                Analyze SQL Query
              </button>

              {sqlResult && (
                <div className="p-3 rounded-xl aurora-inner space-y-2 text-xs font-mono-brand animate-fade-up">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">Optimization Score:</span>
                    <span className="font-bold text-[#34D399]">{sqlResult.optimizationScore} / 100</span>
                  </div>
                  {sqlResult.issues?.map((issue: any, idx: number) => (
                    <div key={`sql-issue-${idx}`} className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-[#FB7185]">{issue.title}</span>
                        <span className="text-[var(--text-muted)]">{issue.severity}</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)]">{issue.suggestion}</p>
                    </div>
                  ))}
                  {sqlResult.indexSuggestions?.map((idxSugg: any, idx: number) => (
                    <div key={`sql-idx-${idx}`} className="text-[10px] text-[#06B6D4]">
                      💡 {idxSugg.suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content Detector Tool */}
            <div className="aurora-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[var(--text-primary)] font-heading flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#8B5CF6]" /> AI Content & Plagiarism Detector
                </span>
                <span className="text-[9px] font-bold font-mono-brand text-[#34D399] bg-[#34D399]/10 px-1.5 py-0.5 rounded border border-[#34D399]/30">ONLINE</span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">Measures text burstiness, vocabulary richness (TTR), and sentence length patterns.</p>
              <textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl aurora-inner font-mono-brand text-xs text-[var(--text-primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]"
                placeholder="Enter text to analyze..."
              />
              <button
                onClick={handleTestContent}
                disabled={contentLoading}
                className="w-full py-2.5 rounded-xl btn-primary text-xs font-bold font-heading flex items-center justify-center gap-2 cursor-pointer"
              >
                {contentLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                Detect AI Content
              </button>

              {contentResult && (
                <div className="p-3 rounded-xl aurora-inner space-y-2 text-xs font-mono-brand animate-fade-up">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-muted)]">AI Probability:</span>
                    <span className="font-bold text-[#8B5CF6]">{(contentResult.aiProbability * 100).toFixed(1)}% ({contentResult.verdict})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-[var(--text-muted)]">
                    <div>Burstiness: <span className="text-[var(--text-primary)]">{contentResult.metrics?.burstiness}</span></div>
                    <div>Vocab Richness (TTR): <span className="text-[var(--text-primary)]">{contentResult.metrics?.vocabularyRichness}</span></div>
                    <div>Avg Sent Length: <span className="text-[var(--text-primary)]">{contentResult.metrics?.avgSentenceLength} w</span></div>
                    <div>Confidence: <span className="text-[var(--text-primary)]">{contentResult.confidence}%</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─ Zero Fee Status Banner ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl aurora-card">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#34D399]" />
            <span className="text-[11px] font-bold text-[var(--text-primary)] font-heading">Zero-Fee Pre-Execution Guarantee</span>
            <span className="text-[9px] font-bold text-[#34D399] bg-[#34D399]/10 px-1.5 py-0.5 rounded border border-[#34D399]/30 font-mono-brand">ACTIVE</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono-brand text-[var(--text-muted)]">
            <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-[#8B5CF6]" /> Algorand Testnet</span>
            <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-[#06B6D4]" /> USDC ASA: 10458941</span>
          </div>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="p-4 rounded-2xl bg-[var(--bear-bg)] border border-[#FB7185]/40 text-xs text-[#FB7185] flex items-start gap-3 animate-fade-up font-mono-brand">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1"><span className="font-bold font-heading">Execution Alert</span><p>{error}</p></div>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-[var(--bull-bg)] border border-[#34D399]/40 text-xs text-[#34D399] flex items-start gap-3 animate-fade-up font-mono-brand">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div><span className="font-bold font-heading">Transaction Status</span><p>{successMsg}</p></div>
          </div>
        )}

        {/* ─ Signal History ─────────────────────────────────────────── */}
        {history.length > 0 && (
          <div className="aurora-panel rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2 font-heading">
              <Clock className="w-4 h-4 text-[#8B5CF6]" /> Recent Signal Executions ({history.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {history.map((entry, i) => (
                <div key={`history-${entry.id}`} className="aurora-card p-3 space-y-2 animate-stagger" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)] font-mono-brand">{entry.token} / USDC</span>
                    <span className="text-[9px] font-mono-brand text-[#8B5CF6]">{entry.cost}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-[#8B5CF6] font-mono-brand">{entry.compositeScore}</span>
                    <span className="text-[11px] font-bold text-[#34D399] font-heading">{entry.verdict}</span>
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
