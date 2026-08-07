# ⚡ QuantMesh x402 — 1-Page Quick Summary (Hinglish)
> **AlgoVerse 2026 Hackathon (PS0404) | 60-Second Teammate Cheat Sheet**

---

### 💡 1. Ek Line Me Kya Hai?
QuantMesh x402 ek **Decentralized AI Market Signal Router** hai jo Algorand par chalta hai. Apan ne **$200/month subscription khatam kar di** — user har signal ke liye sirf **$0.007 (₹0.60 paise)** pay karta hai!

---

### 🎯 2. Sabse Bada Killer Feature: Zero-Fee Guarantee
* **Pre-Execution Gating:** User ka wallet tabhi pop-up hoga jab saare 4 AI bots 100% success respond karenge.
* **Fail-Safe:** Agar piche se ek bhi bot down hua, toh server `HTTP 502` dega aur **₹1 bhi nahi katega!**

---

### 🧠 3. Charo AI Sub-Agents (Dimag Kahan Hai?)
1. 🤖 **Worker A (Sentiment):** Financial news ko **FinBERT NLP (HuggingFace Router)** se analyze karke sentiment score nikalta hai.
2. 🐋 **Worker B (Whale Flow):** **CoinGecko Live API** se volume & market cap track karke Whale Net Inflow/Outflow batata hai.
3. 📈 **Worker C (Technical Engine):** Live OHLC candles parse karke **RSI**, **SMA 7/20 Golden/Death Cross**, **EMA**, aur **MACD** calculate karta hai.
4. 🎛️ **Worker D (Fusion Engine):** Math formula se final score generate karta hai ($30\% \text{ Sentiment} + 35\% \text{ Whale} + 35\% \text{ TA}$).

---

### ⚙️ 4. Kaam Kaise Karta Hai? (4-Step Flow)
```
[Select Token: ALGO/BTC] ──► [Click 'Execute Strategy'] ──► [4 Bots Run in 25ms]
                                                                    │
   [SHA-256 Attestation Receipt] ◄── [Lute Wallet Signs $0.007] ◄───┘ (All Passed OK)
```

---

### ⛓️ 5. On-Chain Attestation & Proof
* Every signal creates a **SHA-256 cryptographic attestation digest** (`sha256(token:score:verdict:txId:timestamp)`).
* Our **Attestation Engine** anchors this digest to the **Algorand payment transaction ID** for permanent auditability. PyTeal Box Storage contract (`contracts/signal_attestation.py`) prepared for mainnet deployment.

---

### 📊 6. Live Status & Mainnet Readiness
* **Live Server:** AWS EC2 (`https://api.dhanrajgupta.xyz`), 4 workers online with **17ms-29ms latency**.
* **Mainnet Switch:** Flip network flag to `algorand:mainnet` and USDC ASA ID to `315667040`. Zero code logic changes needed!

---
*QuantMesh x402 — Built for AlgoVerse 2026 (PS0404)*
