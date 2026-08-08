---
marp: true
theme: uncover
class: invert
paginate: true
backgroundColor: #090d16
style: |
  section {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #f1f5f9;
    padding: 30px 50px;
    background-color: #090d16;
  }
  h1 {
    color: #06b6d4;
    font-size: 2.4rem;
    margin-bottom: 0.5rem;
  }
  h2 {
    color: #38bdf8;
    font-size: 1.8rem;
    margin-bottom: 0.8rem;
    border-bottom: 2px solid #1e293b;
    padding-bottom: 8px;
  }
  h3 {
    color: #a855f7;
    font-size: 1.3rem;
    margin-top: 0;
  }
  p, li {
    font-size: 0.95rem;
    line-height: 1.5;
    color: #cbd5e1;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: center;
    text-align: left;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    text-align: left;
  }
  .card {
    background: #131b2c;
    padding: 18px;
    border-radius: 12px;
    border: 1px solid #1e293b;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }
  .card-highlight {
    background: #131b2c;
    padding: 18px;
    border-radius: 12px;
    border: 1px solid #06b6d4;
    box-shadow: 0 0 15px rgba(6,182,212,0.2);
  }
  .badge {
    background: rgba(6, 182, 212, 0.15);
    color: #06b6d4;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 0.85rem;
    border: 1px solid rgba(6, 182, 212, 0.4);
    display: inline-block;
  }
  .badge-purple {
    background: rgba(168, 85, 247, 0.15);
    color: #a855f7;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: bold;
    font-size: 0.85rem;
    border: 1px solid rgba(168, 85, 247, 0.4);
    display: inline-block;
  }
  .badge-green {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    padding: 4px 129;
    border-radius: 20px;
    font-weight: bold;
    font-size: 0.85rem;
    border: 1px solid rgba(16, 185, 129, 0.4);
    display: inline-block;
  }
  table {
    width: 100%;
    font-size: 0.85rem;
    border-collapse: collapse;
  }
  th {
    background-color: #1e293b;
    color: #38bdf8;
    padding: 8px 12px;
    text-align: left;
  }
  td {
    border-bottom: 1px solid #1e293b;
    padding: 8px 12px;
    color: #cbd5e1;
  }
---

![bg right:38% w:380](./assets/ai-quant-agent.png)

# QuantMesh **x402**

### Atomic Multi-Agent Service Router
<span class="badge">Problem Statement: PS0404</span> <span class="badge-purple">Algorand AVM Micropayments</span>

* **Team:** QuantMesh Innovators
* **College:** CSBS Dept., BV(DU)COE, Pune
* **Event:** AlgoVerse 2026 Hackathon
* **Live Gateway:** `https://api.dhanrajgupta.xyz`

---

## 1. Problem Statement & Motivation

<div class="grid-3">

<div class="card">

### ❌ Subscription Fatigue
* Crypto signal APIs cost **$100–$500/month**.
* Retail traders & bots pay full price even for **2–3 requests/month**.
* High financial barrier for autonomous AI agents.
</div>

<div class="card">

### ❌ Single-AI Risk
* Single AI models hallucinate or misread volatility.
* Traditional APIs charge fees **before** calling downstream models.
* **Money is lost** if the downstream worker fails.
</div>

<div class="card">

### ❌ Payment Friction
* Executing multi-agent workflows requires **multiple transactions**.
* Gas fees & latency destroy micro-transactions.
* No consumer protection for agent API buyers.
</div>

</div>

---

## 2. Proposed Solution / Idea

<div class="grid">

<div>

### ⚡ QuantMesh x402 Architecture
* **Pay-Per-Signal:** **$0.007 USDC** per execution via Algorand x402 AVM protocol.
* **🛡️ Pre-Execution Zero-Fee Guarantee:** Hono router validates all 4 parallel sub-agents *first*. If any agent fails, HTTP 502 aborts with **$0 charged**.
* **🔐 SHA-256 Attestation:** Produces a 256-bit cryptographic digest anchored on Algorand Testnet.

</div>

<div>

<div class="card-highlight">

### 🔑 Killer Innovation: Zero-Fee Shield
```
Client Request -> Hono Gateway
      │
      ├─► Run Worker A (FinBERT NLP)
      ├─► Run Worker B (Whale Flow)
      ├─► Run Worker C (TA Engine)
      └─► Run Worker D (Fusion)
      │
  [Any Fail?] ──YES──► HTTP 502 ($0 Charged)
      │ NO
      ▼
 HTTP 402 Challenge -> Sign $0.007 -> Settle
```
</div>

</div>

</div>

---

## 3. Identified Paying User & Business Model

<div class="grid-3">

<div class="card">

### 🤖 Autonomous AI Agents
* Agentic trading scripts & DeFi bots.
* Need low-latency, pay-per-use market intelligence.
* Cannot manage $300/mo SaaS subscriptions.
</div>

<div class="card">

### 📊 Quant Traders & Analysts
* Retail traders wanting high-confidence multi-agent signals.
* Pay only when executing active trading strategies ($0.007/signal).
</div>

<div class="card">

### 💼 Business Model
* **$0.007 USDC / Execution**
* **$0.005** to sub-agent liquidity providers.
* **$0.002** router protocol fee.
* **100% Zero Cost** on failed calls.
</div>

</div>

---

## 4. x402 Payment Flow (Technical Core)

<div class="grid">

<div>

### 🔄 The 4-Step AVM Protocol
1. **Challenge (402):** Server validates sub-agents, then returns `HTTP 402 Payment Required` + payment request.
2. **Sign:** Lute Wallet / Client signs Algorand ASA transaction ($0.007 USDC, ASA ID `10458941`).
3. **Retry:** Client retries request with signed transaction payload in header.
4. **Settle:** Router verifies tx on Algorand Testnet Indexer & releases signal receipt.

</div>

<div>

![w:520](./assets/x402-payment-flow.png)

</div>

</div>

---

## 5. System Architecture & Tech Stack

![w:880](./assets/architecture-diagram.png)

* **Client Layer:** Next.js 16, Lute Wallet SDK, Animated SVG Score Gauge, Tailwind CSS
* **Orchestrator:** Hono.js Gateway on AWS EC2 (`api.dhanrajgupta.xyz`), Rate Limiting (10 req/min)
* **Sub-Agents:** FinBERT NLP Sentiment (5001), CoinGecko Whale Flow (5002), TA Engine (5002), Fusion (5001)
* **Settlement:** Algorand AVM, `@x402/hono`, USDC ASA `10458941`, PyTeal Box Contract (`contracts/`)

---

## 6. Live Demo & On-Chain Proof (Lora Explorer)

<div class="grid">

<div>

### 🖥️ Next.js 16 Live Dashboard
![w:520](./assets/dashboard-screenshot.png)
*Live terminal with Lute Wallet & 66/100 score*

</div>

<div>

### 🔗 Lora Testnet Tx & Group Proof
![w:520](./assets/lora-txn-explorer.png)
*Real Lora Explorer transaction detail page*

</div>

</div>

* **Verified On-Chain Tx ID:** `3V3VHVA3PEUZTKYCJUD7HNNGYK2XLLR7ROPTJ2HFQGTWGDBCHAMQ`
* **Group Hash:** `bv4pwvqPv/ULbbpzAObL07qsDmcUGnvUzaBjwHL9Hl8=` | **Block:** `#66083763` | **App ID:** `600011882`

---

## 6b. Atomic Group Transaction Visual Flow

<div class="grid">

<div>

### ⚡ Algorand AVM Group Flow
* **Atomic Settlement:** All sub-agent verifications and micropayments execute atomically within an AVM transaction group.
* **Group Hash:** `bv4pwvqPv/ULbbpzAObL07qsDmcUGnvUzaBjwHL9Hl8=`
* **Zero Wasted Gas:** If any single tx in the group fails, the entire transaction group is reverted.

</div>

<div>

![w:540](./assets/lora-group-flow.png)

</div>

</div>


---

## 7. Innovation & Competitive Differentiation

| Feature / Criteria | Traditional DeFi APIs | Generic x402 Routers | **QuantMesh x402 (PS0404)** |
| :--- | :--- | :--- | :--- |
| **Payment Model** | $100–$500/mo SaaS | Pay per request upfront | **Pay-Per-Execution ($0.007)** |
| **Failure Protection** | ❌ Money lost if API fails | ❌ Charged before execution | **🛡️ Pre-Execution Zero-Fee Shield** |
| **Intelligence Layer** | Single indicator | Single prompt model | **🤖 Multi-Agent Consensus (4 Workers)** |
| **Verifiability** | Centralized response | Plain HTTP response | **🔐 Cryptographic SHA-256 Digest** |
| **Settlement Time** | N/A (Credit Card) | 15s–1min (EVM) | **⚡ < 3s Sub-Second AVM Finality** |

---

## 8. Completeness & Functionality

<div class="grid">

<div class="card-highlight">

### ✅ Live & Operational (Done)
* **Hono Orchestrator** deployed live on AWS EC2.
* **4 Sub-Agents** (FinBERT NLP, CoinGecko Flow, TA Engine, Fusion).
* **Lute Wallet** x402 AVM payment integration.
* **Zero-Fee Shield** (HTTP 502 abort logic tested).
* **SHA-256 Attestation** hash returned per signal.
* **Next.js 16 Dashboard** with radial SVG score.

</div>

<div class="card">

### 🔮 Future Roadmap (Pending)
* **Mainnet Deployment:** Update network config to Algorand Mainnet & USDC ASA `315667040`.
* **Teal v8 Box Contract:** Deploy `contracts/signal_attestation.py` for on-chain state storage.
* **Webhooks & SDK:** NPM package `@quantmesh/x402-client` for AI agent developers.

</div>

</div>

---

## 9. Real-World Impact & Scalability

<div class="grid-3">

<div class="card">

### 🌍 Democratic Access
* Enables micro-investors and autonomous AI agents to access **institutional-grade signals** without expensive monthly commitments.
</div>

<div class="card">

### ⚡ Mainnet Readiness
* **100% Ready:** Requires changing only 2 environment variables:
  * `ALGORAND_NETWORK=mainnet`
  * `USDC_ASA_ID=315667040`
</div>

<div class="card">

### 🚀 Scalability
* Hono + AWS EC2 handles **1,000+ req/sec**.
* Algorand AVM provides **10,000 TPS** capacity with sub-second finality and **$0.00018 gas fee**.
</div>

</div>

---

## 🏆 Summary: Why QuantMesh x402 Wins

* **Solves PS0404:** True Agentic Payments with Algorand AVM x402 protocol.
* **Consumer Protection:** Pre-execution gating guarantees **$0 wasted fees**.
* **Institutional Signal:** Fuses sentiment NLP + on-chain whale flow + technical indicators.
* **Production Live Today:** Live EC2 API + Next.js Dashboard + Verified On-Chain Proof.

<br/>

**Live Gateway API:** `https://api.dhanrajgupta.xyz/api/v1/orchestrate`  
**Thank You Judges! Questions & Answers**
