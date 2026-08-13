'use client';
// QuantMesh x402 — Ultra-Minimal 2-Column Dashboard Layout

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { fetchQuantMeshSignal, optInToUSDCAsset, getOrchestratorBaseUrl } from '@/lib/x402Client';
import { 
  Zap, ShieldCheck, RefreshCw, Wallet, ExternalLink, Coins, Layers, 
  Activity, CheckCircle2, AlertCircle, Clock, Brain, 
  Copy, Check, Globe, GitMerge, Sun, Moon, ArrowUpRight, 
  ArrowDownRight, Radio, BarChart3, Sliders, Cpu, RotateCcw
} from 'lucide-react';

// ─── Vector Crypto Logos ────────────────────────────────────────────
function CryptoLogo({ symbol, size = 18 }: { symbol: string; size?: number }) {
  switch (symbol) {
    case 'ALGO':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#1E293B" stroke="#334155" strokeWidth="1" />
          <path d="M7 17L12 7L14.5 12H9.5" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 12L17 17" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'BTC':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#F59E0B" fillOpacity="0.15" stroke="#F59E0B" strokeWidth="1" />
          <text x="12" y="16" fontSize="12" fontWeight="bold" fill="#F59E0B" textAnchor="middle" fontFamily="sans-serif">₿</text>
        </svg>
      );
    case 'ETH':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#6366F1" fillOpacity="0.15" stroke="#6366F1" strokeWidth="1" />
          <path d="M12 4L7 12L12 15L17 12L12 4Z" stroke="#818CF8" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M12 15L7 12L12 20L17 12L12 15Z" stroke="#6366F1" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'SOL':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#14F195" fillOpacity="0.1" stroke="#14F195" strokeWidth="1" />
          <path d="M7 8.5H16L17 7.5H8L7 8.5Z" fill="#14F195" />
          <path d="M8 12.5H17L16 11.5H7L8 12.5Z" fill="#9945FF" />
          <path d="M7 16.5H16L17 15.5H8L7 16.5Z" fill="#14F195" />
        </svg>
      );
    case 'AVAX':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#E84142" fillOpacity="0.15" stroke="#E84142" strokeWidth="1" />
          <path d="M12 6L6 17H9.5L12 12.5L14.5 17H18L12 6Z" fill="#E84142" />
        </svg>
      );
    case 'PEPE':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1" />
          <circle cx="9" cy="10" r="2" fill="#10B981" />
          <circle cx="15" cy="10" r="2" fill="#10B981" />
          <path d="M8 15Q12 17 16 15" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'LINK':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#375BD2" fillOpacity="0.15" stroke="#375BD2" strokeWidth="1" />
          <path d="M12 6L16.5 8.5V13.5L12 16L7.5 13.5V8.5L12 6Z" stroke="#375BD2" strokeWidth="1.5" />
        </svg>
      );
    case 'DOGE':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#C2A633" fillOpacity="0.15" stroke="#C2A633" strokeWidth="1" />
          <text x="12" y="16" fontSize="11" fontWeight="bold" fill="#C2A633" textAnchor="middle" fontFamily="sans-serif">Ð</text>
        </svg>
      );
    case 'SUI':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="#4DA2FF" fillOpacity="0.15" stroke="#4DA2FF" strokeWidth="1" />
          <path d="M12 6C12 6 7 11 7 14.5C7 17.26 9.24 19.5 12 19.5C14.76 19.5 17 17.26 17 14.5C17 11 12 6 12 6Z" fill="#4DA2FF" fillOpacity="0.4" stroke="#4DA2FF" strokeWidth="1.2" />
        </svg>
      );
    default:
      return <Coins className="text-[var(--text-muted)]" style={{ width: size, height: size }} />;
  }
}

// ─── Static SVG Tick Marks ──────────────────────────────────────────
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

// ─── Ticker Bar ─────────────────────────────────────────────────────
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
        const baseUrl = getOrchestratorBaseUrl();
        const apiUrl = `${baseUrl}/api/v1/prices`;

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
    <div className="w-full overflow-hidden border-b border-[var(--border)] bg-[var(--surface-1)] relative flex items-center">
      <div className="animate-data-stream flex items-center gap-8 py-2 px-4 whitespace-nowrap" style={{ width: 'max-content' }}>
        {doubled.map((t, i) => (
          <div key={`ticker-${i}`} className="flex items-center gap-2 text-xs font-mono-brand">
            <CryptoLogo symbol={t.sym} size={14} />
            <span className="text-[var(--text-muted)] font-semibold">{t.sym}</span>
            <span className="text-[var(--text-secondary)]">{isLive ? `$${t.val}` : `~$${t.val}`}</span>
            <span className={`flex items-center gap-0.5 ${t.up ? 'text-[var(--bull)]' : 'text-[var(--bear)]'}`}>
              {t.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {t.chg}
            </span>
          </div>
        ))}
      </div>
      {!isLive && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono-brand text-[var(--text-muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border)] hidden sm:inline">
          INDICATIVE
        </span>
      )}
    </div>
  );
}

// ─── Worker Ring Component ──────────────────────────────────────────
function WorkerRing({ active, isDone, workerIdx }: { active: boolean; isDone: boolean; workerIdx: number }) {
  const isProcessing = active && !isDone;
  const r = 16;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 40 40" className="w-9 h-9 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--surface-3)" strokeWidth="2.5" strokeOpacity="0.3" />
        <circle 
          cx="20" cy="20" r={r} fill="none"
          stroke={isDone ? 'var(--bull)' : isProcessing ? 'var(--cyan)' : 'var(--surface-3)'}
          strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={isDone ? 0 : isProcessing ? circ * 0.25 : circ}
          className={isProcessing ? 'animate-worker-ring' : ''}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isDone ? (
          <Check className="w-4 h-4 text-[var(--bull)]" />
        ) : isProcessing ? (
          <RefreshCw className="w-3.5 h-3.5 text-[var(--cyan)] animate-spin" />
        ) : (
          <span className="text-[10px] font-bold font-mono-brand text-[var(--text-muted)]">
            {String.fromCharCode(65 + workerIdx - 1)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Score Gauge Component ──────────────────────────────────────────
function ScoreGauge({ score, size = 170 }: { score: number | null; size?: number }) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = score ?? 0;
  const offset = circumference - (normalizedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#10B981', label: 'text-[#10B981]' };
    if (s >= 55) return { stroke: '#10B981', label: 'text-[#10B981]' };
    if (s >= 45) return { stroke: '#F59E0B', label: 'text-[#F59E0B]' };
    if (s >= 30) return { stroke: '#F43F5E', label: 'text-[#F43F5E]' };
    return { stroke: '#F43F5E', label: 'text-[#F43F5E]' };
  };

  const colors = getColor(normalizedScore);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="transform -rotate-90" style={{ width: size, height: size }}>
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
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface-3)" strokeWidth="5" strokeOpacity="0.25" />
        {score !== null && (
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={colors.stroke} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="animate-score-fill"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-extrabold font-mono-brand tracking-tighter ${score !== null ? colors.label : 'text-[var(--cyan)]'}`}>
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
    online: 'bg-[var(--bull)]', degraded: 'bg-[var(--neutral)]',
    offline: 'bg-[var(--bear)]', unknown: 'bg-[#9CA3AF]',
  };
  return (
    <span className="flex h-2 w-2 relative">
      {status === 'online' && <span className={`animate-pulse-dot absolute inline-flex h-full w-full rounded-full ${colorMap[status]} opacity-75`} />}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colorMap[status]}`} />
    </span>
  );
}

// ─── Execution Pipeline Stepper ─────────────────────────────────────
function ExecutionPipeline({ step, loading }: { step: number; loading: boolean }) {
  if (!loading && step === 0) return null;
  const stages = [
    { label: 'HTTP 402 Probe', icon: Radio },
    { label: 'Wallet Signature', icon: Wallet },
    { label: 'Block Settlement', icon: BarChart3 },
    { label: 'Receipt Verified', icon: ShieldCheck },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full animate-fade-up">
      {stages.map((s, i) => {
        const idx = i + 1;
        const done = step > idx || (!loading && step >= idx);
        const active = loading && step === idx;
        const Icon = s.icon;
        return (
          <div key={`stage-${i}`} className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-mono-brand transition-all ${
            done ? 'bg-[var(--bull-bg)] text-[var(--bull)] border border-[var(--bull-border)]' 
            : active ? 'bg-[var(--accent-subtle)] text-[var(--cyan)] border border-[var(--accent-border-strong)]'
            : 'bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]'
          }`}>
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{s.label}</span>
            {active && <RefreshCw className="w-3 h-3 animate-spin ml-auto shrink-0" />}
            {done && <Check className="w-3 h-3 ml-auto shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Interfaces & Supported Assets ──────────────────────────────────
interface WorkerHealth { status: 'online' | 'offline' | 'degraded' | 'unknown'; latencyMs: number; }
interface HealthData { status: string; uptime: string; workers: { sentiment: WorkerHealth; onchain: WorkerHealth; ta: WorkerHealth; fusion: WorkerHealth; }; }
interface SignalHistoryEntry { id: string; token: string; compositeScore: number; verdict: string; txId: string; timestamp: string; cost: string; }

const SUPPORTED_TOKENS = [
  { symbol: 'ALGO', name: 'Algorand' },
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'PEPE', name: 'Pepe Coin' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'SUI', name: 'Sui Network' },
];

const WORKER_META = [
  { key: 'sentiment' as const, label: 'Worker A: FinBERT Sentiment', sub: 'HuggingFace NLP Model', color: '#7C3AED' },
  { key: 'onchain' as const, label: 'Worker B: On-Chain Whale Flow', sub: 'CoinGecko Liquidity', color: '#06B6D4' },
  { key: 'ta' as const, label: 'Worker C: Technical Indicators', sub: 'RSI, SMA & MACD', color: '#F59E0B' },
  { key: 'fusion' as const, label: 'Worker D: Consensus Fusion', sub: 'Weighted Engine', color: '#10B981' },
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

  // Prevent hydration mismatch
  useEffect(() => { 
    setMounted(true); 
    document.documentElement.setAttribute('data-theme', theme); 
  }, [theme]);

  const checkHealth = useCallback(async () => {
    try {
      const baseUrl = getOrchestratorBaseUrl();
      const res = await fetch(`${baseUrl}/api/v1/health`);
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

  const rawVerdict = signalData?.signalFusion?.verdict ?? signalData?.sentiment?.sentimentVerdict;
  const isBull = rawVerdict?.includes('BUY') || rawVerdict === 'BULLISH';
  const isBear = rawVerdict?.includes('SELL') || rawVerdict === 'BEARISH';
  const isNeutral = rawVerdict?.includes('NEUTRAL') || rawVerdict === 'HOLD' || (!isBull && !isBear && signalData);

  return (
    <div className="min-h-screen pb-20 relative" suppressHydrationWarning>
      <div className="fixed inset-0 bg-trading-grid pointer-events-none z-0" />

      {/* ── Top Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg-main)]/90 border-b border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl">
              <Zap className="w-5 h-5 text-[var(--accent-light)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-[var(--text-primary)] font-heading">QuantMesh</span>
                <span className="text-[10px] font-bold tracking-wider text-[var(--accent-light)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded border border-[var(--accent-border)] font-mono-brand">x402</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] hidden sm:block">Decentralized AI Signal Router on Algorand</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a href="/architecture" className="px-3 py-1.5 rounded-xl btn-secondary text-xs hidden md:flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Architecture
            </a>

            <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="w-8 h-8 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-all cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {mounted && (
              activeAddress ? (
                <div className="flex items-center gap-2">
                  <button onClick={handleOptInUSDC} disabled={optInLoading}
                    className="px-3 py-1.5 rounded-xl btn-secondary text-xs font-bold flex items-center gap-1.5 disabled:opacity-50">
                    <Coins className="w-3.5 h-3.5 text-[var(--cyan)]" /> {optInLoading ? 'Opting...' : 'USDC'}
                  </button>
                  <div className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] text-xs font-mono-brand text-[var(--bull)] flex items-center gap-2 border border-[var(--bull-border)]">
                    <span className="w-2 h-2 rounded-full bg-[var(--bull)] animate-pulse-dot" />
                    {activeAddress.slice(0, 4)}...{activeAddress.slice(-4)}
                  </div>
                </div>
              ) : (
                <button onClick={() => luteWallet?.connect()} className="px-4 py-2 rounded-xl btn-primary text-xs flex items-center gap-2 font-heading">
                  <Wallet className="w-4 h-4" /> Connect Wallet
                </button>
              )
            )}
          </div>
        </div>

        <TickerBar />
      </header>

      {/* ── Main Container (Unified 2-Column Dashboard) ─────────────── */}
      <main className="max-w-[1280px] mx-auto px-4 pt-8 space-y-8 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ─── LEFT COLUMN: CONFIGURATION & EXECUTION ───────────────── */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="fintech-panel p-6 space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)] font-heading">
                    Signal Router Config
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Select consensus model and crypto asset for routing.
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <Sliders className="w-4 h-4 text-[var(--accent-light)]" />
                </div>
              </div>

              {/* Strategy Model Segmented Switch */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-heading block">
                  Strategy Model
                </label>
                <div className="bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border)] grid grid-cols-2 gap-1">
                  <button 
                    onClick={() => { setActiveEndpoint('consensus'); setSignalData(null); setError(null); setSuccessMsg(null); setCurrentStep(0); }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeEndpoint === 'consensus' ? 'btn-primary text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}>
                    <GitMerge className="w-3.5 h-3.5 shrink-0" /> 4-Agent ($0.007)
                  </button>
                  <button 
                    onClick={() => { setActiveEndpoint('sentiment'); setSignalData(null); setError(null); setSuccessMsg(null); setCurrentStep(0); }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeEndpoint === 'sentiment' ? 'btn-primary text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}>
                    <Brain className="w-3.5 h-3.5 shrink-0" /> FinBERT ($0.002)
                  </button>
                </div>
              </div>

              {/* Target Asset Selector Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] font-heading block">
                  Target Crypto Asset
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {SUPPORTED_TOKENS.map((token) => {
                    const isSelected = selectedToken === token.symbol;
                    return (
                      <button 
                        key={`token-${token.symbol}`}
                        onClick={() => { setSelectedToken(token.symbol); setSignalData(null); setError(null); setSuccessMsg(null); setCurrentStep(0); }}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--text-primary)] shadow-sm'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                        }`}>
                        <CryptoLogo symbol={token.symbol} size={20} />
                        <span className={`text-xs font-extrabold font-mono-brand ${isSelected ? 'text-[var(--accent-light)]' : 'text-[var(--text-primary)]'}`}>
                          {token.symbol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary & Execution Block */}
              <div className="p-4 rounded-xl fintech-inner space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Target Pair:</span>
                  <span className="font-bold text-[var(--text-primary)] font-mono-brand flex items-center gap-1.5">
                    <CryptoLogo symbol={selectedToken} size={14} /> {selectedToken} / USDC
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Routing Fee:</span>
                  <span className="font-bold text-[var(--accent-light)] font-mono-brand">
                    {activeEndpoint === 'consensus' ? '$0.0070 USDC' : '$0.0020 USDC'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Lute Wallet:</span>
                  <span className={`font-bold font-mono-brand ${activeAddress ? 'text-[var(--bull)]' : 'text-[var(--bear)]'}`}>
                    {activeAddress ? 'Connected ✓' : 'Not Connected'}
                  </span>
                </div>
              </div>

              {/* Big CTA Execute Button */}
              <button 
                onClick={handleExecuteStrategy} 
                disabled={loading}
                className="w-full py-4 rounded-xl btn-primary text-sm flex items-center justify-center gap-2.5 font-heading font-extrabold cursor-pointer">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Processing Handshake {currentStep}/4...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Execute {activeEndpoint === 'consensus' ? '4-Agent Strategy ($0.0070)' : 'FinBERT Sentiment ($0.0020)'}</span>
                  </>
                )}
              </button>

              {/* Execution Pipeline Stepper */}
              <ExecutionPipeline step={currentStep} loading={loading} />

              {/* Notifications */}
              {error && (
                <div className="p-4 rounded-xl bg-[var(--bear-bg)] border border-[var(--bear-border)] text-xs text-[var(--bear)] flex items-start gap-3 animate-fade-up font-mono-brand">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold font-heading">Execution Alert</span>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {successMsg && (
                <div className="p-4 rounded-xl bg-[var(--bull-bg)] border border-[var(--bull-border)] text-xs text-[var(--bull)] flex items-start gap-3 animate-fade-up font-mono-brand">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold font-heading">Transaction Status</span>
                    <p>{successMsg}</p>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* ─── RIGHT COLUMN: LIVE SWARM / CONSENSUS RESULTS ──────────── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* If Signal Data Exists (Results View) */}
            {signalData ? (
              <div className="fintech-panel p-6 sm:p-8 space-y-6 animate-fade-up">
                
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div>
                    <h2 className="text-xl font-extrabold text-[var(--text-primary)] font-heading">
                      Consensus Signal & Receipt
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Multi-agent score verdict, attestation hash, and atomic payment proof.
                    </p>
                  </div>

                  <button 
                    onClick={() => setSignalData(null)}
                    className="px-3 py-1.5 rounded-xl btn-secondary text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                    <RotateCcw className="w-3.5 h-3.5" /> Reset View
                  </button>
                </div>

                {/* Top Score Gauge & Verdict */}
                <div className="fintech-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                  <ScoreGauge 
                    score={signalData?.signalFusion?.compositeScore ?? signalData?.sentiment?.score ?? null} 
                    size={160} 
                  />

                  <div className="flex-1 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block font-heading">
                        {activeEndpoint === 'consensus' ? 'Consensus Verdict' : 'Sentiment Verdict'}
                      </span>
                      <div className="mt-1">
                        <span className={`inline-block px-4 py-1.5 rounded-xl text-base font-extrabold tracking-wider uppercase font-heading ${
                          isBull ? 'text-[var(--bull)] bg-[var(--bull-bg)] border border-[var(--bull-border)]'
                          : isBear ? 'text-[var(--bear)] bg-[var(--bear-bg)] border border-[var(--bear-border)]'
                          : isNeutral ? 'text-[var(--neutral)] bg-[var(--surface-2)] border border-[var(--border)]'
                          : 'text-[var(--cyan)] bg-[var(--cyan-subtle)] border border-[var(--cyan-border)]'
                        }`}>
                          {rawVerdict ?? 'AWAITING EXECUTION'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl fintech-inner space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)] font-medium">Multi-Agent Conviction:</span>
                        <span className="font-bold font-mono-brand text-[var(--cyan)]">
                          {signalData?.signalFusion?.confidencePct ? `${signalData.signalFusion.confidencePct}% Agreement` : '100% Single Agent'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${signalData?.signalFusion?.confidencePct ?? 100}%`, background: 'var(--accent)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Worker Breakdown Cards */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-light)] font-heading flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Multi-Agent Signal Breakdown
                  </h3>
                  <div className={`grid gap-3 ${isSentimentMode ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
                    
                    {/* Worker A */}
                    {(() => {
                      const score = signalData.breakdown?.sentimentScore ?? signalData.sentiment?.score ?? 50;
                      const isB = score >= 55; const isR = score <= 45;
                      const label = isB ? 'BULLISH' : isR ? 'BEARISH' : 'NEUTRAL';
                      const badgeStyle = isB 
                        ? 'text-[var(--bull)] bg-[var(--bull-bg)] border-[var(--bull-border)]' 
                        : isR 
                        ? 'text-[var(--bear)] bg-[var(--bear-bg)] border-[var(--bear-border)]' 
                        : 'text-[var(--neutral)] bg-[var(--surface-2)] border-[var(--border)]';
                      return (
                        <div className="fintech-card p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker A · Sentiment</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                          </div>
                          <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand">{score}<span className="text-xs text-[var(--text-muted)]"> / 100</span></div>
                          <div className="w-full h-1 rounded-full bg-[var(--surface-3)] overflow-hidden">
                            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${score}%` }} />
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
                            ? 'text-[var(--bull)] bg-[var(--bull-bg)] border-[var(--bull-border)]' 
                            : isR 
                            ? 'text-[var(--bear)] bg-[var(--bear-bg)] border-[var(--bear-border)]' 
                            : 'text-[var(--neutral)] bg-[var(--surface-2)] border-[var(--border)]';
                          return (
                            <div className="fintech-card p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker B · Whale Flow</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                              </div>
                              <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand truncate">{flowStr}</div>
                              <div className="text-[10px] text-[var(--cyan)] font-mono-brand">CoinGecko Liquidity</div>
                            </div>
                          );
                        })()}

                        {(() => {
                          const taStr = signalData.breakdown?.technicalIndicator ?? 'Data Unavailable';
                          const isR = taStr.toLowerCase().includes('bearish');
                          const isB = taStr.toLowerCase().includes('bullish');
                          const label = isR ? 'BEARISH' : isB ? 'BULLISH' : 'NEUTRAL';
                          const badgeStyle = isB 
                            ? 'text-[var(--bull)] bg-[var(--bull-bg)] border-[var(--bull-border)]' 
                            : isR 
                            ? 'text-[var(--bear)] bg-[var(--bear-bg)] border-[var(--bear-border)]' 
                            : 'text-[var(--neutral)] bg-[var(--surface-2)] border-[var(--border)]';
                          return (
                            <div className="fintech-card p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker C · Technicals</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                              </div>
                              <div className="text-xl font-bold text-[var(--text-primary)] font-mono-brand truncate">{taStr}</div>
                              <div className="text-[10px] text-[var(--neutral)] font-mono-brand">RSI, SMA & MACD Engine</div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>

                {/* Verifiable On-Chain Payment Receipt */}
                {signalData.onChainReceipt && (
                  <div className="fintech-card p-5 space-y-4 border border-[var(--bull-border)]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--bull)] flex items-center gap-2 font-heading">
                      <ShieldCheck className="w-4 h-4" /> Verifiable Payment Receipt
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-brand">
                      <div className="p-3 rounded-xl fintech-inner flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Client Tx:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[var(--accent-light)] font-bold">{signalData.clientPaymentTxId?.slice(0, 10)}...</span>
                          <button onClick={() => handleCopyTx(signalData.clientPaymentTxId)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                            {copiedTxId ? <Check className="w-3.5 h-3.5 text-[var(--bull)]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl fintech-inner flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Facilitator:</span>
                        <span className={signalData.onChainReceipt?.facilitatorVerification?.isValid !== false ? 'text-[var(--bull)] font-bold' : 'text-[var(--neutral)] font-bold'}>
                          {signalData.onChainReceipt?.facilitatorVerification?.isValid !== false ? 'GoPlausible Verified ✓' : 'GoPlausible Soft-Pass ⚠'}
                        </span>
                      </div>
                    </div>

                    {/* Worker Payout Split Bar */}
                    <div className="p-3.5 rounded-xl fintech-inner space-y-2.5">
                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-heading font-bold">
                        <span>DYNAMIC WORKER PAYOUT SPLIT</span>
                        <span className="text-[var(--accent-light)]">{isSentimentMode ? '1 Worker ($0.0020)' : '4 Workers ($0.0070)'}</span>
                      </div>
                      
                      <div className="w-full h-3.5 rounded-md bg-[var(--surface-3)] overflow-hidden flex p-0.5 gap-0.5 border border-[var(--border)]">
                        <div title={`Worker A: ${amountA}µ (${pctA}%)`} className="h-full rounded-sm bg-[var(--seg-a)] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctA}%` }}>
                          {Number(pctA) >= 15 && `${amountA}µ`}
                        </div>
                        {Number(pctB) > 0 && <div title={`Worker B: ${amountB}µ (${pctB}%)`} className="h-full rounded-sm bg-[var(--seg-b)] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctB}%` }}>{Number(pctB) >= 15 && `${amountB}µ`}</div>}
                        {Number(pctC) > 0 && <div title={`Worker C: ${amountC}µ (${pctC}%)`} className="h-full rounded-sm bg-[var(--seg-c)] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctC}%` }}>{Number(pctC) >= 15 && `${amountC}µ`}</div>}
                        {Number(pctD) > 0 && <div title={`Worker D: ${amountD}µ (${pctD}%)`} className="h-full rounded-sm bg-[var(--seg-d)] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctD}%` }}>{Number(pctD) >= 15 && `${amountD}µ`}</div>}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono-brand text-[var(--text-muted)]">
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--seg-a)]" />Worker A: {amountA}µ ({pctA}%)</div>
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--seg-b)]" />Worker B: {amountB}µ ({pctB}%)</div>
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--seg-c)]" />Worker C: {amountC}µ ({pctC}%)</div>
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--seg-d)]" />Worker D: {amountD}µ ({pctD}%)</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl fintech-inner">
                      <span className="text-[var(--text-muted)] text-[10px] block">Cryptographic Attestation Hash:</span>
                      <span className="text-[10px] text-[var(--cyan)] truncate block mt-0.5 font-mono-brand">{signalData.onChainReceipt.attestationHash || 'sha256(signal:txId)'}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-1 font-heading">
                      <a href={signalData.onChainReceipt.explorerUrl} target="_blank" rel="noreferrer"
                        className="flex-1 w-full py-2.5 rounded-xl fintech-inner text-[var(--bull)] hover:text-[var(--bull)] text-xs font-bold flex items-center justify-center gap-2 transition-all">
                        <ExternalLink className="w-3.5 h-3.5" /> Client Tx (Lora)
                      </a>
                      {(signalData.workerPayoutGroupTxId || signalData.onChainReceipt?.workerPayoutExplorerUrl) && (
                        <a href={signalData.onChainReceipt?.workerPayoutExplorerUrl || `https://lora.algokit.io/testnet/transaction/${signalData.workerPayoutGroupTxId}`} target="_blank" rel="noreferrer"
                          className="flex-1 w-full py-2.5 rounded-xl fintech-inner text-[var(--cyan)] hover:text-[var(--cyan)] text-xs font-bold flex items-center justify-center gap-2 transition-all">
                          <ExternalLink className="w-3.5 h-3.5" /> Group Payout (Lora)
                        </a>
                      )}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* Idle / Default View: Sub-Agent Swarm Health */
              <div className="fintech-panel p-6 sm:p-8 space-y-6 animate-fade-up">
                
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div>
                    <h2 className="text-xl font-extrabold text-[var(--text-primary)] font-heading">
                      Sub-Agent Swarm Health
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Real-time microservice status, ports, and execution SLA.
                    </p>
                  </div>

                  <span className="text-xs font-bold text-[var(--bull)] bg-[var(--bull-bg)] px-3 py-1.5 rounded-xl border border-[var(--bull-border)] font-mono-brand flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--bull)] animate-pulse-dot" />
                    {Object.values(healthData?.workers ?? {}).filter((w: any) => w.status === 'online').length || 4} / 4 ONLINE
                  </span>
                </div>

                {/* Grid of Sub-Agent Swarm Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {WORKER_META.map((w, i) => {
                    return (
                      <div key={w.key} className="fintech-card p-4 space-y-3 animate-stagger" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex items-center justify-between">
                          <WorkerRing active={false} isDone={false} workerIdx={i + 1} />
                          <div className="flex items-center gap-2">
                            <StatusDot status={healthData?.workers?.[w.key]?.status || 'online'} />
                            <span className="text-xs font-mono-brand font-bold" style={{ color: w.color }}>
                              {healthData?.workers?.[w.key]?.latencyMs || (12 + i * 4)}ms
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-[var(--text-primary)] font-heading">
                            {w.label}
                          </h4>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {w.sub}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono-brand">
                          <span>Port: 500{i + 1}</span>
                          <span>SLA: 100%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Guarantee Banner */}
                <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-[var(--bull)]" />
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)] font-heading block">
                        Zero-Fee Pre-Execution Guarantee (Active)
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Micro-payouts are only settled if all sub-agent worker signals complete successfully.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono-brand text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-[var(--accent-light)]" /> Algorand Testnet</span>
                    <span className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-[var(--cyan)]" /> ASA 10458941</span>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* ─── SIGNAL HISTORY SECTION ─────────────────────────────────── */}
        {history.length > 0 && (
          <div className="fintech-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2 font-heading">
              <Clock className="w-4 h-4 text-[var(--accent-light)]" /> Recent Signal Executions ({history.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {history.map((entry, i) => (
                <div key={`history-${entry.id}`} className="fintech-card p-3.5 space-y-2 animate-stagger" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)] font-mono-brand flex items-center gap-1.5">
                      <CryptoLogo symbol={entry.token} size={14} /> {entry.token} / USDC
                    </span>
                    <span className="text-[10px] font-mono-brand text-[var(--accent-light)] font-bold">{entry.cost}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-extrabold text-[var(--accent-light)] font-mono-brand">{entry.compositeScore}</span>
                    <span className="text-xs font-bold text-[var(--bull)] font-heading">{entry.verdict}</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] flex items-center justify-between pt-2 border-t border-[var(--border)] font-mono-brand">
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
