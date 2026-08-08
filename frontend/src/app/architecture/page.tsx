'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  GitMerge, 
  Database, 
  Globe, 
  Lock, 
  Server,
  CheckCircle2
} from 'lucide-react';

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen text-[#EDE9E1] pb-16 bg-[#08090C]">
      {/* Header Bar */}
      <div className="bg-[#0D0F14] border-b border-[#F0A868]/14 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-xs font-bold text-[#F0A868] hover:text-[#F0A868]/80 transition-colors font-sora"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Terminal
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono-brand">
            <span className="w-2 h-2 rounded-full bg-[#4FAE8C] animate-pulse-dot" />
            <span className="text-[#EDE9E1]/60">System Architecture Map</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 pt-10 space-y-10">
        {/* Title */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#F0A868]/10 border border-[#F0A868]/30 rounded-2xl glow-phosphor">
              <Layers className="w-8 h-8 text-[#F0A868]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight font-sora">
                QuantMesh x402 Architecture
              </h1>
              <p className="text-xs text-[#EDE9E1]/60 mt-1 font-sans">
                Decentralized Multi-Agent Pipeline with HTTP 402 Algorand Micropayment Settlement
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Architecture Flow Diagram */}
        <div className="ink-panel rounded-3xl p-6 md:p-8 space-y-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#F0A868] flex items-center gap-2 font-sora">
            <GitMerge className="w-4 h-4" />
            End-to-End System Execution Flow
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div className="ink-card rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-[#F0A868]/10 border border-[#F0A868]/30 flex items-center justify-center text-xs font-bold text-[#F0A868] font-mono-brand">
                01
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sora">
                <Globe className="w-4 h-4 text-[#F0A868]" />
                Frontend Request
              </h3>
              <p className="text-xs text-[#EDE9E1]/60 leading-relaxed font-sans">
                Client selects token (ALGO, BTC, ETH) and sends initial POST request to Hono orchestrator.
              </p>
              <div className="text-[10px] font-mono-brand text-[#F0A868] bg-[#08090C] p-2 rounded-lg border border-[#F0A868]/14">
                POST /api/v1/orchestrate
              </div>
            </div>

            {/* Step 2 */}
            <div className="ink-card rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-[#4FAE8C]/10 border border-[#4FAE8C]/30 flex items-center justify-center text-xs font-bold text-[#4FAE8C] font-mono-brand">
                02
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sora">
                <Cpu className="w-4 h-4 text-[#4FAE8C]" />
                Pre-Execution
              </h3>
              <p className="text-xs text-[#EDE9E1]/60 leading-relaxed font-sans">
                Orchestrator runs Workers A, B, C in parallel, then passes scores to Fusion Agent D.
              </p>
              <div className="text-[10px] font-mono-brand text-[#4FAE8C] bg-[#08090C] p-2 rounded-lg border border-[#F0A868]/14">
                Zero-Fee Guarantee
              </div>
            </div>

            {/* Step 3 */}
            <div className="ink-card rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-[#F0A868]/10 border border-[#F0A868]/30 flex items-center justify-center text-xs font-bold text-[#F0A868] font-mono-brand">
                03
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sora">
                <Lock className="w-4 h-4 text-[#F0A868]" />
                x402 Micropayment
              </h3>
              <p className="text-xs text-[#EDE9E1]/60 leading-relaxed font-sans">
                Server returns HTTP 402 challenge. Lute Wallet signs $0.007 ALGO/USDC transaction.
              </p>
              <div className="text-[10px] font-mono-brand text-[#F0A868] bg-[#08090C] p-2 rounded-lg border border-[#F0A868]/14">
                HTTP 402 Payment Required
              </div>
            </div>

            {/* Step 4 */}
            <div className="ink-card rounded-2xl p-5 space-y-3">
              <div className="w-8 h-8 rounded-xl bg-[#4FAE8C]/10 border border-[#4FAE8C]/30 flex items-center justify-center text-xs font-bold text-[#4FAE8C] font-mono-brand">
                04
              </div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sora">
                <CheckCircle2 className="w-4 h-4 text-[#4FAE8C]" />
                On-Chain Receipt
              </h3>
              <p className="text-xs text-[#EDE9E1]/60 leading-relaxed font-sans">
                Payment verified on Algorand. SHA-256 Cryptographic Attestation Digest issued.
              </p>
              <div className="text-[10px] font-mono-brand text-[#4FAE8C] bg-[#08090C] p-2 rounded-lg border border-[#F0A868]/14">
                SHA-256 Attestation Digest
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Component Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Orchestrator */}
          <div className="ink-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sora">
              <Server className="w-4 h-4 text-[#F0A868]" />
              Central Hono Orchestrator
            </h3>
            <ul className="text-xs text-[#EDE9E1]/75 space-y-2 leading-relaxed font-sans">
              <li className="flex items-start gap-2">
                <span className="text-[#F0A868] font-bold">•</span>
                <span><strong>Pre-execution pipeline:</strong> Verifies all worker nodes before issuing payment challenge.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F0A868] font-bold">•</span>
                <span><strong>x402 Protocol:</strong> Native AVM scheme integration with HTTP 402 challenge negotiation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F0A868] font-bold">•</span>
                <span><strong>Rate Limiting:</strong> In-memory window rate limiter protecting against API spam.</span>
              </li>
            </ul>
          </div>

          {/* AI Worker Nodes */}
          <div className="ink-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sora">
              <Cpu className="w-4 h-4 text-[#B87F4C]" />
              Sub-Agent Network
            </h3>
            <ul className="text-xs text-[#EDE9E1]/75 space-y-2 leading-relaxed font-sans">
              <li className="flex items-start gap-2">
                <span className="text-[#F0A868] font-bold">•</span>
                <span><strong>Worker A (Sentiment):</strong> FastAPI + FinBERT NLP scoring crypto financial text.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#4FAE8C] font-bold">•</span>
                <span><strong>Worker B (On-Chain):</strong> CoinGecko market volume & whale net inflow heuristics.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B87F4C] font-bold">•</span>
                <span><strong>Worker C (TA):</strong> RSI, SMA, EMA, MACD algorithmic indicator calculations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#8A8578] font-bold">•</span>
                <span><strong>Worker D (Fusion):</strong> Transparent weighted composite scoring algorithm.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Smart Contract Attestation */}
        <div className="ink-panel rounded-2xl p-6 space-y-4 border-[#F0A868]/30">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-sora">
            <Database className="w-4 h-4 text-[#F0A868]" />
            Cryptographic Signal Attestation Digest
          </h3>
          <p className="text-xs text-[#EDE9E1]/75 leading-relaxed font-sans">
            Every fused market signal produces a deterministic 256-bit cryptographic SHA-256 hash anchored to the Algorand Testnet payment transaction ID. 
            The PyTeal ARC-4 smart contract (`contracts/signal_attestation.py`) is prepared for mainnet Box Storage deployment:
          </p>
          <div className="bg-[#08090C] p-4 rounded-xl border border-[#F0A868]/14 text-xs font-mono-brand text-[#F0A868] space-y-1">
            <div>Key: tokenSymbol + "_" + paymentTxId</div>
            <div>Value: compositeScore (8 bytes) + timestamp (8 bytes) + paymentTxId</div>
            <div>Hash: SHA-256(tokenSymbol:compositeScore:verdict:paymentTxId:timestamp)</div>
          </div>
        </div>
      </main>
    </div>
  );
}
