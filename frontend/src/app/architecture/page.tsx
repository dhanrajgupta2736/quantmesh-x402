'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Zap, 
  ArrowLeft, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Activity, 
  GitMerge, 
  Database, 
  Globe, 
  Lock, 
  Server,
  Coins,
  CheckCircle2,
  ExternalLink,
  Code2
} from 'lucide-react';

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen text-slate-100 pb-16">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900/80 to-purple-950/60 border-b border-cyan-500/15 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Terminal
          </Link>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">System Architecture Map</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pt-10 space-y-10">
        {/* Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/25 rounded-2xl glow-purple">
              <Layers className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                QuantMesh x402 Architecture
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Decentralized Multi-Agent Pipeline with HTTP 402 Algorand Micropayment Settlement
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Architecture Flow Diagram */}
        <div className="glass-card rounded-3xl p-6 md:p-8 space-y-8 border-cyan-500/25">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <GitMerge className="w-4 h-4" />
            End-to-End System Execution Flow
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div className="glass-card rounded-2xl p-5 space-y-3 border-cyan-500/30 hover:border-cyan-400 transition-all">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-xs font-bold text-cyan-400 font-mono-brand">
                01
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Frontend Request
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Client selects token (ALGO, BTC, ETH) and sends initial POST request to Hono orchestrator.
              </p>
              <div className="text-[10px] font-mono-brand text-cyan-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                POST /api/v1/orchestrate
              </div>
            </div>

            {/* Step 2 */}
            <div className="glass-card rounded-2xl p-5 space-y-3 border-purple-500/30 hover:border-purple-400 transition-all">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-xs font-bold text-purple-400 font-mono-brand">
                02
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                Pre-Execution
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Orchestrator runs Workers A, B, C in parallel, then passes scores to Fusion Agent D.
              </p>
              <div className="text-[10px] font-mono-brand text-purple-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                Zero-Fee Guarantee
              </div>
            </div>

            {/* Step 3 */}
            <div className="glass-card rounded-2xl p-5 space-y-3 border-amber-500/30 hover:border-amber-400 transition-all">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-xs font-bold text-amber-400 font-mono-brand">
                03
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                x402 Micropayment
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Server returns HTTP 402 challenge. Lute Wallet signs $0.007 ALGO/USDC transaction.
              </p>
              <div className="text-[10px] font-mono-brand text-amber-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                HTTP 402 Payment Required
              </div>
            </div>

            {/* Step 4 */}
            <div className="glass-card rounded-2xl p-5 space-y-3 border-emerald-500/30 hover:border-emerald-400 transition-all">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-xs font-bold text-emerald-400 font-mono-brand">
                04
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                On-Chain Receipt
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Payment verified on Algorand. Cryptographic Box Storage Hash issued.
              </p>
              <div className="text-[10px] font-mono-brand text-emerald-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                SHA-256 Box Storage Hash
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Component Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Orchestrator */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              Central Hono Orchestrator
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Pre-execution pipeline:</strong> Verifies all worker nodes before issuing payment challenge.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>x402 Protocol:</strong> Native AVM scheme integration with HTTP 402 challenge negotiation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold">•</span>
                <span><strong>Rate Limiting:</strong> In-memory window rate limiter protecting against API spam.</span>
              </li>
            </ul>
          </div>

          {/* AI Worker Nodes */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Sub-Agent Network
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Worker A (Sentiment):</strong> FastAPI + FinBERT NLP scoring crypto financial text.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Worker B (On-Chain):</strong> CoinGecko market volume & whale net inflow heuristics.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Worker C (TA):</strong> RSI, SMA, EMA, MACD algorithmic indicator calculations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">•</span>
                <span><strong>Worker D (Fusion):</strong> Transparent weighted composite scoring algorithm.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Smart Contract Attestation */}
        <div className="glass-card rounded-2xl p-6 space-y-4 border-amber-500/20">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            Algorand Box Storage Signal Attestation
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every fused market signal produces a deterministic 256-bit cryptographic hash committed to Algorand Testnet. 
            The ARC-4 PyTeal smart contract provides immutable box storage entry verification:
          </p>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs font-mono-brand text-cyan-300 space-y-1">
            <div>Key: tokenSymbol + "_" + paymentTxId</div>
            <div>Value: compositeScore (8 bytes) + timestamp (8 bytes) + paymentTxId</div>
            <div>Hash: SHA-256(tokenSymbol:compositeScore:verdict:paymentTxId:timestamp)</div>
          </div>
        </div>
      </main>
    </div>
  );
}
