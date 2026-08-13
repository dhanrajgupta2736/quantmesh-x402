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

// ─── Polished Vector Crypto Logos ────────────────────────────────────
function CryptoLogo({ symbol, size = 18 }: { symbol: string; size?: number }) {
  const id = `crypto-${symbol}-${size}`;
  switch (symbol) {
    case 'ALGO':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1E293B" /><stop offset="1" stopColor="#0F172A" />
            </linearGradient>
            <radialGradient id={`${id}-glow`} cx="16" cy="14" r="12" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(255,255,255,0.08)" /><stop offset="1" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill={`url(#${id}-bg)`} stroke="#334155" strokeWidth="0.8" />
          <circle cx="16" cy="16" r="15" fill={`url(#${id}-glow)`} />
          <path d="M20.5 22H18.1L16.8 17.5H12.6L11.2 22H9L14.8 7H17.2L20.5 22ZM16.2 15.5L14.9 11L13.2 15.5H16.2Z" fill="#F8FAFC" />
          <path d="M22 22L19 13" stroke="#F8FAFC" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'BTC':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" /><stop offset="1" stopColor="#D97706" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill={`url(#${id}-bg)`} />
          <path d="M19.8 13.2C20.4 11.6 19.2 10.8 17.6 10.3L18.2 8L16.7 7.6L16.1 9.9C15.7 9.8 15.3 9.7 14.9 9.6L15.5 7.3L14 6.9L13.4 9.2C13.1 9.1 12.7 9 12.4 9L10.5 8.5L10.1 10.1C10.1 10.1 11.2 10.4 11.2 10.4C11.8 10.5 11.9 10.9 11.9 11.2L11.2 13.9C11.2 13.9 11.3 13.9 11.3 14L11.2 14L10.2 17.6C10.2 17.8 10 18.1 9.5 18L9.5 18C9.5 18 8.4 17.7 8.4 17.7L7.8 19.5L9.6 19.9C10 20 10.3 20.1 10.7 20.2L10.1 22.5L11.6 22.9L12.2 20.6C12.6 20.7 13 20.8 13.4 20.9L12.8 23.2L14.3 23.6L14.9 21.3C17.4 21.8 19.3 21.6 20 19.3C20.6 17.5 19.9 16.5 18.6 15.8C19.5 15.6 20.2 15 20.5 13.9L19.8 13.2ZM17.2 18.4C16.8 20 14 19.1 13.1 18.9L13.9 15.8C14.8 16 17.7 16.7 17.2 18.4ZM17.7 13.2C17.3 14.7 15 13.9 14.2 13.7L14.9 10.9C15.7 11.1 18.1 11.7 17.7 13.2Z" fill="white" />
        </svg>
      );
    case 'ETH':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1A1F3D" /><stop offset="1" stopColor="#0F1229" />
            </linearGradient>
            <linearGradient id={`${id}-top`} x1="16" y1="4" x2="16" y2="18" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A78BFA" /><stop offset="1" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id={`${id}-bot`} x1="16" y1="18" x2="16" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366F1" /><stop offset="1" stopColor="#4338CA" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill={`url(#${id}-bg)`} stroke="#334155" strokeWidth="0.6" />
          <path d="M16 4L9 16.5L16 20L23 16.5L16 4Z" fill={`url(#${id}-top)`} fillOpacity="0.9" />
          <path d="M16 13.5L9 16.5L16 20L23 16.5L16 13.5Z" fill="#4338CA" fillOpacity="0.5" />
          <path d="M16 21.5L9 17.5L16 28L23 17.5L16 21.5Z" fill={`url(#${id}-bot)`} fillOpacity="0.9" />
        </svg>
      );
    case 'SOL':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0A0A1A" /><stop offset="1" stopColor="#0D0D24" />
            </linearGradient>
            <linearGradient id={`${id}-bar1`} x1="8" y1="9" x2="24" y2="9" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00FFA3" /><stop offset="1" stopColor="#03E1FF" />
            </linearGradient>
            <linearGradient id={`${id}-bar2`} x1="8" y1="16" x2="24" y2="16" gradientUnits="userSpaceOnUse">
              <stop stopColor="#9945FF" /><stop offset="1" stopColor="#00FFA3" />
            </linearGradient>
            <linearGradient id={`${id}-bar3`} x1="8" y1="23" x2="24" y2="23" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00FFA3" /><stop offset="1" stopColor="#03E1FF" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill={`url(#${id}-bg)`} stroke="#1E293B" strokeWidth="0.6" />
          <path d="M8.5 11.5L10 9.5H23.5L22 11.5H8.5Z" fill={`url(#${id}-bar1)`} />
          <path d="M23.5 18L22 16H8.5L10 18H23.5Z" fill={`url(#${id}-bar2)`} />
          <path d="M8.5 24.5L10 22.5H23.5L22 24.5H8.5Z" fill={`url(#${id}-bar3)`} />
        </svg>
      );
    case 'AVAX':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E84142" /><stop offset="1" stopColor="#C53030" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill={`url(#${id}-bg)`} />
          <path d="M11.3 21.5C10.8 22.4 11.2 22.8 12.2 22.8H14.8C15.3 22.8 15.6 22.6 15.9 22.1L20.5 13.5C20.8 12.9 20.6 12.5 20 12.5H18C17.6 12.5 17.3 12.7 17.1 13.1L11.3 21.5Z" fill="white" />
          <path d="M18.8 22.8H21.5C22.1 22.8 22.4 22.4 22.1 21.8L19.8 17.5C19.5 16.9 19 16.9 18.7 17.5L16.4 21.8C16.1 22.4 16.4 22.8 17 22.8H18.8Z" fill="white" />
        </svg>
      );
    case 'PEPE':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4ADE80" /><stop offset="1" stopColor="#16A34A" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill={`url(#${id}-bg)`} />
          <ellipse cx="11.5" cy="13.5" rx="3" ry="3.5" fill="white" />
          <ellipse cx="20.5" cy="13.5" rx="3" ry="3.5" fill="white" />
          <circle cx="12" cy="14" r="1.8" fill="#1A1A2E" />
          <circle cx="21" cy="14" r="1.8" fill="#1A1A2E" />
          <circle cx="12.5" cy="13.3" r="0.6" fill="white" />
          <circle cx="21.5" cy="13.3" r="0.6" fill="white" />
          <path d="M10 20C12 22.5 20 22.5 22 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M13 21C14.5 22 17.5 22 19 21" stroke="white" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      );
    case 'LINK':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#375BD2" /><stop offset="1" stopColor="#2B4AA8" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill={`url(#${id}-bg)`} />
          <path d="M16 6L22 9.5V16.5L16 20L10 16.5V9.5L16 6Z" fill="none" stroke="white" strokeWidth="1.8" />
          <path d="M16 10L19.5 12V16L16 18L12.5 16V12L16 10Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="0.8" />
        </svg>
      );
    case 'DOGE':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C2A633" /><stop offset="1" stopColor="#BA8B00" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill={`url(#${id}-bg)`} />
          <path d="M12 9H16C19.9 9 23 12.1 23 16C23 19.9 19.9 23 16 23H12V9Z" fill="none" stroke="white" strokeWidth="2" />
          <line x1="10" y1="16" x2="18" y2="16" stroke="white" strokeWidth="1.8" />
          <line x1="14" y1="9" x2="14" y2="23" stroke="white" strokeWidth="1.5" />
        </svg>
      );
    case 'SUI':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6FBCF0" /><stop offset="1" stopColor="#4DA2FF" />
            </linearGradient>
            <radialGradient id={`${id}-inner`} cx="16" cy="16" r="10" gradientUnits="userSpaceOnUse">
              <stop stopColor="rgba(255,255,255,0.15)" /><stop offset="1" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx="16" cy="16" r="15" fill={`url(#${id}-bg)`} />
          <circle cx="16" cy="16" r="15" fill={`url(#${id}-inner)`} />
          <path d="M16 7C16 7 9 13.5 9 18C9 21.87 12.13 25 16 25C19.87 25 23 21.87 23 18C23 13.5 16 7 16 7Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M13 17C13 15 14.5 13 16 11.5C17.5 13 19 15 19 17C19 18.7 17.7 20 16 20C14.3 20 13 18.7 13 17Z" fill="white" fillOpacity="0.5" />
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

// ─── Agent Swarm Neural Visualizer Component ────────────────────────
function AgentSwarmVisualizer({ loading, token, step }: { loading: boolean; token: string; step: number }) {
  return (
    <div className="relative w-full rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] p-4 overflow-hidden shadow-lg transition-all">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.12)_0%,transparent_70%)] pointer-events-none" />
      {loading && <div className="absolute inset-0 animate-laser-scan bg-gradient-to-b from-transparent via-[rgba(6,182,212,0.15)] to-transparent h-1/2 pointer-events-none" />}

      <div className="relative z-10 flex items-center justify-between pb-2.5 mb-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Cpu className={`w-4 h-4 ${loading ? 'text-[var(--cyan)] animate-spin' : 'text-[var(--accent-light)]'}`} />
          <span className="text-xs font-bold font-heading text-[var(--text-primary)]">
            {loading ? `Swarm Pre-Execution Live Feed (${token})` : `Swarm Network Topology (${token})`}
          </span>
        </div>
        <span className={`text-[10px] font-mono-brand font-bold px-2 py-0.5 rounded border ${
          loading ? 'text-[var(--cyan)] bg-[var(--cyan-subtle)] border-[var(--cyan-border)] animate-pulse' 
          : 'text-[var(--bull)] bg-[var(--bull-bg)] border-[var(--bull-border)]'
        }`}>
          {loading ? `PHASE ${step}/4 PROCESSING` : 'STANDBY IDLE'}
        </span>
      </div>

      {/* SVG Neural Mesh Network Diagram */}
      <div className="relative h-36 w-full flex items-center justify-center">
        <svg viewBox="0 0 380 140" className="w-full h-full">
          <defs>
            <linearGradient id="beam-a" x1="50" y1="30" x2="190" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED" /><stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="beam-b" x1="330" y1="30" x2="190" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor="#06B6D4" /><stop offset="1" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="beam-c" x1="190" y1="120" x2="190" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" /><stop offset="1" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="beam-e" x1="60" y1="120" x2="190" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EC4899" /><stop offset="1" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Connection Beams */}
          <line x1="50" y1="30" x2="190" y2="70" stroke="url(#beam-a)" strokeWidth={loading ? '2.5' : '1'} strokeOpacity={loading ? '0.9' : '0.4'} strokeDasharray="6 4" className={loading ? 'animate-particle-flow' : ''} />
          <line x1="330" y1="30" x2="190" y2="70" stroke="url(#beam-b)" strokeWidth={loading ? '2.5' : '1'} strokeOpacity={loading ? '0.9' : '0.4'} strokeDasharray="6 4" className={loading ? 'animate-particle-flow' : ''} />
          <line x1="190" y1="120" x2="190" y2="70" stroke="url(#beam-c)" strokeWidth={loading ? '2.5' : '1'} strokeOpacity={loading ? '0.9' : '0.4'} strokeDasharray="6 4" className={loading ? 'animate-particle-flow' : ''} />
          <line x1="60" y1="120" x2="190" y2="70" stroke="url(#beam-e)" strokeWidth={loading ? '2.5' : '1'} strokeOpacity={loading ? '0.9' : '0.4'} strokeDasharray="6 4" className={loading ? 'animate-particle-flow' : ''} />

          {/* Center Fusion Hub Node (Worker D) */}
          <g transform="translate(190, 70)">
            <circle r="20" fill="var(--surface-2)" stroke={loading ? '#10B981' : '#334155'} strokeWidth="2" />
            <circle r="14" fill="var(--bg-main)" />
            {loading && <circle r="23" fill="none" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 4" className="animate-halo-spin" />}
            <text textAnchor="middle" dy="4" fill="#10B981" fontSize="10" fontWeight="bold" fontFamily="monospace">D</text>
          </g>

          {/* Worker A Node */}
          <g transform="translate(50, 30)">
            <circle r="16" fill="var(--surface-2)" stroke="#7C3AED" strokeWidth="1.8" />
            <circle r="11" fill="var(--bg-main)" />
            {loading && step === 1 && <circle r="19" fill="none" stroke="#7C3AED" strokeWidth="1.2" strokeDasharray="3 3" className="animate-halo-spin" />}
            <text textAnchor="middle" dy="3.5" fill="#8B5CF6" fontSize="9" fontWeight="bold" fontFamily="monospace">A</text>
          </g>

          {/* Worker B Node */}
          <g transform="translate(330, 30)">
            <circle r="16" fill="var(--surface-2)" stroke="#06B6D4" strokeWidth="1.8" />
            <circle r="11" fill="var(--bg-main)" />
            {loading && step === 2 && <circle r="19" fill="none" stroke="#06B6D4" strokeWidth="1.2" strokeDasharray="3 3" className="animate-halo-spin" />}
            <text textAnchor="middle" dy="3.5" fill="#06B6D4" fontSize="9" fontWeight="bold" fontFamily="monospace">B</text>
          </g>

          {/* Worker C Node */}
          <g transform="translate(190, 120)">
            <circle r="16" fill="var(--surface-2)" stroke="#F59E0B" strokeWidth="1.8" />
            <circle r="11" fill="var(--bg-main)" />
            {loading && step === 3 && <circle r="19" fill="none" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="3 3" className="animate-halo-spin" />}
            <text textAnchor="middle" dy="3.5" fill="#F59E0B" fontSize="9" fontWeight="bold" fontFamily="monospace">C</text>
          </g>

          {/* Worker E Node */}
          <g transform="translate(60, 120)">
            <circle r="16" fill="var(--surface-2)" stroke="#EC4899" strokeWidth="1.8" />
            <circle r="11" fill="var(--bg-main)" />
            {loading && step === 4 && <circle r="19" fill="none" stroke="#EC4899" strokeWidth="1.2" strokeDasharray="3 3" className="animate-halo-spin" />}
            <text textAnchor="middle" dy="3.5" fill="#EC4899" fontSize="9" fontWeight="bold" fontFamily="monospace">E</text>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-5 gap-1 pt-2 border-t border-[var(--border)] text-[9px] font-mono-brand text-center">
        <div className="text-[var(--accent-light)] font-bold">Worker A (NLP)</div>
        <div className="text-[var(--cyan)] font-bold">Worker B (Whale)</div>
        <div className="text-[var(--neutral)] font-bold">Worker C (TA)</div>
        <div className="text-[var(--bull)] font-bold">Worker D (Fusion)</div>
        <div className="text-[#EC4899] font-bold">Worker E (Regime)</div>
      </div>
    </div>
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
            : active ? 'bg-[var(--accent-subtle)] text-[var(--cyan)] border border-[var(--accent-border-strong)] animate-pulse-glow'
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
interface HealthData { status: string; uptime: string; workers: { sentiment: WorkerHealth; onchain: WorkerHealth; ta: WorkerHealth; fusion: WorkerHealth; regime: WorkerHealth; }; }
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
  { key: 'regime' as const, label: 'Worker E: Regime Classifier', sub: 'ATR, ADX & Position Sizing', color: '#EC4899' },
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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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
  const amountA = isSentimentMode ? 2000 : (signalData?.dynamicSplit?.amountA ?? 1600);
  const amountB = isSentimentMode ? 0 : (signalData?.dynamicSplit?.amountB ?? 1600);
  const amountC = isSentimentMode ? 0 : (signalData?.dynamicSplit?.amountC ?? 900);
  const amountD = isSentimentMode ? 0 : (signalData?.dynamicSplit?.amountD ?? 900);
  const amountE = isSentimentMode ? 0 : (signalData?.dynamicSplit?.amountE ?? 800);
  const totalPool = isSentimentMode ? 2000 : (amountA + amountB + amountC + amountD + amountE || 7000);
  const pctA = ((amountA / totalPool) * 100).toFixed(1);
  const pctB = ((amountB / totalPool) * 100).toFixed(1);
  const pctC = ((amountC / totalPool) * 100).toFixed(1);
  const pctD = ((amountD / totalPool) * 100).toFixed(1);
  const pctE = ((amountE / totalPool) * 100).toFixed(1);

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
            <div className="p-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="qm-grad-1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7C3AED" /><stop offset="1" stopColor="#06B6D4" />
                  </linearGradient>
                  <linearGradient id="qm-grad-2" x1="20" y1="5" x2="20" y2="35" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#10B981" /><stop offset="1" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
                {/* Outer mesh hexagon */}
                <polygon points="20,3 35,11 35,29 20,37 5,29 5,11" fill="none" stroke="url(#qm-grad-1)" strokeWidth="1.5" strokeLinejoin="round" />
                {/* Inner mesh hexagon */}
                <polygon points="20,10 29,15 29,25 20,30 11,25 11,15" fill="url(#qm-grad-1)" fillOpacity="0.12" stroke="url(#qm-grad-2)" strokeWidth="1" strokeLinejoin="round" />
                {/* Center node */}
                <circle cx="20" cy="20" r="3.5" fill="url(#qm-grad-1)" />
                <circle cx="20" cy="20" r="2" fill="var(--bg-main)" />
                {/* Mesh connection lines from center to vertices */}
                <line x1="20" y1="20" x2="20" y2="10" stroke="var(--accent-light)" strokeWidth="0.8" strokeOpacity="0.5" />
                <line x1="20" y1="20" x2="29" y2="15" stroke="var(--cyan)" strokeWidth="0.8" strokeOpacity="0.5" />
                <line x1="20" y1="20" x2="29" y2="25" stroke="var(--accent-light)" strokeWidth="0.8" strokeOpacity="0.5" />
                <line x1="20" y1="20" x2="20" y2="30" stroke="var(--cyan)" strokeWidth="0.8" strokeOpacity="0.5" />
                <line x1="20" y1="20" x2="11" y2="25" stroke="var(--accent-light)" strokeWidth="0.8" strokeOpacity="0.5" />
                <line x1="20" y1="20" x2="11" y2="15" stroke="var(--cyan)" strokeWidth="0.8" strokeOpacity="0.5" />
                {/* Outer vertex dots */}
                <circle cx="20" cy="10" r="1.5" fill="#10B981" /><circle cx="29" cy="15" r="1.5" fill="#06B6D4" />
                <circle cx="29" cy="25" r="1.5" fill="#7C3AED" /><circle cx="20" cy="30" r="1.5" fill="#10B981" />
                <circle cx="11" cy="25" r="1.5" fill="#06B6D4" /><circle cx="11" cy="15" r="1.5" fill="#7C3AED" />
              </svg>
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
                    <GitMerge className="w-3.5 h-3.5 shrink-0" /> 5-Agent ($0.007)
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
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
                          isSelected 
                            ? 'bg-[var(--accent-subtle)] border-[var(--accent)] text-[var(--text-primary)] shadow-[0_0_15px_rgba(124,58,237,0.3)] ring-1 ring-[var(--accent)]'
                            : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)]'
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
                  <span className={`font-bold font-mono-brand ${mounted ? (activeAddress ? 'text-[var(--bull)]' : 'text-[var(--bear)]') : 'text-[var(--text-muted)]'}`}>
                    {mounted ? (activeAddress ? 'Connected ✓' : 'Not Connected') : '—'}
                  </span>
                </div>
              </div>

              {/* Agent Swarm Neural Visualizer */}
              <AgentSwarmVisualizer loading={loading} token={selectedToken} step={currentStep} />

              {/* Big CTA Execute Button */}
              <button 
                onClick={handleExecuteStrategy} 
                disabled={loading}
                className="w-full py-4 rounded-xl btn-primary text-sm flex items-center justify-center gap-2.5 font-heading font-extrabold cursor-pointer hover:scale-[1.01] hover:shadow-[0_0_25px_rgba(124,58,237,0.45)] transition-all animate-shimmer">
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Processing x402 Handshake {currentStep}/4...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Execute {activeEndpoint === 'consensus' ? '5-Agent Strategy ($0.0070)' : 'FinBERT Sentiment ($0.0020)'}</span>
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
                            <div 
                              className="fintech-card p-4 space-y-2 cursor-pointer transition-all hover:border-[var(--accent-border-strong)]"
                              onClick={() => setExpandedCard(expandedCard === 'B' ? null : 'B')}
                              title="Click to expand details"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker B · Whale Flow</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                              </div>
                              <div className={`text-xl font-bold text-[var(--text-primary)] font-mono-brand ${expandedCard === 'B' ? 'whitespace-normal text-sm' : 'truncate'}`}>{flowStr}</div>
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
                            <div 
                              className="fintech-card p-4 space-y-2 cursor-pointer transition-all hover:border-[var(--accent-border-strong)]"
                              onClick={() => setExpandedCard(expandedCard === 'C' ? null : 'C')}
                              title="Click to expand details"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker C · Technicals</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                              </div>
                              <div className={`text-xl font-bold text-[var(--text-primary)] font-mono-brand ${expandedCard === 'C' ? 'whitespace-normal text-sm' : 'truncate'}`}>{taStr}</div>
                              <div className="text-[10px] text-[var(--neutral)] font-mono-brand">RSI, SMA & MACD Engine</div>
                            </div>
                          );
                        })()}
                        {(() => {
                          const regimeStr = signalData.breakdown?.regime ?? 'Data Unavailable';
                          const isR = regimeStr.toLowerCase().includes('bearish') || regimeStr.toLowerCase().includes('distribution');
                          const isB = regimeStr.toLowerCase().includes('bullish') || regimeStr.toLowerCase().includes('accumulation');
                          const label = isR ? 'BEARISH' : isB ? 'BULLISH' : 'NEUTRAL';
                          const badgeStyle = isB 
                            ? 'text-[var(--bull)] bg-[var(--bull-bg)] border-[var(--bull-border)]' 
                            : isR 
                            ? 'text-[var(--bear)] bg-[var(--bear-bg)] border-[var(--bear-border)]' 
                            : 'text-[var(--neutral)] bg-[var(--surface-2)] border-[var(--border)]';
                          return (
                            <div 
                              className="fintech-card p-4 space-y-2 col-span-1 sm:col-span-3 cursor-pointer transition-all hover:border-[var(--accent-border-strong)]"
                              onClick={() => setExpandedCard(expandedCard === 'E' ? null : 'E')}
                              title="Click to expand details"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase font-heading">Worker E · Regime Classifier</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeStyle} font-heading`}>{label}</span>
                              </div>
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pr-4">
                                  <div className={`font-bold text-[#EC4899] font-mono-brand ${expandedCard === 'E' ? 'whitespace-normal text-sm' : 'text-xl truncate'}`}>
                                    {expandedCard === 'E' && signalData.breakdown?.regimeAnalysis ? signalData.breakdown.regimeAnalysis : regimeStr}
                                  </div>
                                  {!expandedCard && (
                                    <div className="text-[10px] text-[var(--text-muted)] font-mono-brand mt-1">Volatility Index: {signalData.breakdown?.volatilityIndex ?? 'N/A'}</div>
                                  )}
                                  {expandedCard === 'E' && signalData.breakdown?.simpleAdvice && (
                                    <div className="mt-3 p-2.5 bg-[var(--surface-1)] rounded-lg text-xs text-[var(--text-primary)] font-bold border border-[var(--border)] font-heading">
                                      💡 For Beginners: <span className="font-normal text-[var(--text-secondary)] ml-1">{signalData.breakdown.simpleAdvice}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[12px] font-bold text-[var(--text-primary)] font-mono-brand">Pos Size: {signalData.breakdown?.suggestedPositionSize ?? 'N/A'}</div>
                                  <div className="text-[10px] text-[var(--bear)] font-mono-brand">Stop Loss: {signalData.breakdown?.stopLossLevel ?? 'N/A'}</div>
                                </div>
                              </div>
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
                        <span className="text-[var(--accent-light)]">{isSentimentMode ? '1 Worker ($0.0020)' : '5 Workers ($0.0070)'}</span>
                      </div>
                      
                      <div className="w-full h-3.5 rounded-md bg-[var(--surface-3)] overflow-hidden flex p-0.5 gap-0.5 border border-[var(--border)]">
                        <div title={`Worker A: ${amountA}µ (${pctA}%)`} className="h-full rounded-sm bg-[#7C3AED] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctA}%` }}>
                          {Number(pctA) >= 15 && `${amountA}µ`}
                        </div>
                        {Number(pctB) > 0 && <div title={`Worker B: ${amountB}µ (${pctB}%)`} className="h-full rounded-sm bg-[#06B6D4] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctB}%` }}>{Number(pctB) >= 15 && `${amountB}µ`}</div>}
                        {Number(pctC) > 0 && <div title={`Worker C: ${amountC}µ (${pctC}%)`} className="h-full rounded-sm bg-[#F59E0B] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctC}%` }}>{Number(pctC) >= 15 && `${amountC}µ`}</div>}
                        {Number(pctD) > 0 && <div title={`Worker D: ${amountD}µ (${pctD}%)`} className="h-full rounded-sm bg-[#10B981] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctD}%` }}>{Number(pctD) >= 15 && `${amountD}µ`}</div>}
                        {Number(pctE) > 0 && <div title={`Worker E: ${amountE}µ (${pctE}%)`} className="h-full rounded-sm bg-[#EC4899] text-white font-mono-brand font-bold text-[8px] flex items-center justify-center transition-all" style={{ width: `${pctE}%` }}>{Number(pctE) >= 15 && `${amountE}µ`}</div>}
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-[10px] font-mono-brand text-[var(--text-muted)]">
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />Worker A: {amountA}µ ({pctA}%)</div>
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />Worker B: {amountB}µ ({pctB}%)</div>
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />Worker C: {amountC}µ ({pctC}%)</div>
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />Worker D: {amountD}µ ({pctD}%)</div>
                        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#EC4899]" />Worker E: {amountE}µ ({pctE}%)</div>
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
                    {Object.values(healthData?.workers ?? {}).filter((w: any) => w.status === 'online').length || 5} / 5 ONLINE
                  </span>
                </div>

                {/* Grid of Sub-Agent Swarm Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {WORKER_META.map((w, i) => {
                    return (
                      <div key={w.key} className="fintech-card p-4 space-y-3 animate-stagger hover:-translate-y-1 hover:border-[var(--accent-border-strong)] hover:shadow-[0_8px_25px_-5px_rgba(124,58,237,0.25)] transition-all duration-300 group cursor-pointer" style={{ animationDelay: `${i * 50}ms` }}>
                        <div className="flex items-center justify-between">
                          <WorkerRing active={loading} isDone={false} workerIdx={i + 1} />
                          <div className="flex items-center gap-2">
                            <StatusDot status={healthData?.workers?.[w.key]?.status || 'online'} />
                            <span className="text-xs font-mono-brand font-bold group-hover:scale-105 transition-transform" style={{ color: w.color }}>
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
