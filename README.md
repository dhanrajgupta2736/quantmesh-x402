# QuantMesh x402 Monorepo

Welcome to the **QuantMesh x402** monorepo workspace.

## 🏗 Repository Structure

```
/quantmesh-x402-monorepo
  ├── /frontend                 # Member 1: Next.js Dashboard & x402 Client Flow
  ├── /orchestrator             # Member 2: Hono Router & algosdk Atomic Group Builder
  ├── /agent-sentiment-fusion   # Member 3: Python FastAPI (FinBERT NLP + Gemini Fusion)
  ├── /agent-onchain-ta         # Member 4: Python FastAPI (Algorand Indexer + TA-Lib)
  ├── /workflows                # n8n Visual Automation & Data Webhooks
  ├── schema.json               # Master API Contract (Locked)
  └── README.md
```

---

## 🧩 Components Overview

- **`/frontend`**: Next.js Dashboard & x402 Client Flow.
- **`/orchestrator`**: Hono Router & `algosdk` Atomic Group Builder.
- **`/agent-sentiment-fusion`**: Python FastAPI microservice (FinBERT NLP + Gemini Fusion).
- **`/agent-onchain-ta`**: Python FastAPI microservice (Algorand Indexer + TA-Lib).
- **`/workflows`**: n8n Visual Automation & Data Webhooks.
- **`schema.json`**: Master API Contract defining request/response specifications.
