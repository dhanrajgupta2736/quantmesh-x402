import os
from typing import Optional

import httpx
from fastapi import FastAPI, Query
from pydantic import BaseModel

app = FastAPI(title="QuantMesh Sentiment + Fusion Agent")

HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "")
HF_MODEL_URL = "https://api-inference.huggingface.co/models/ProsusAI/finbert"

# Small, curated set of realistic market-commentary style lines per token.
# These are illustrative phrasing (not scraped real news), used as stable
# input text for the FinBERT model so the demo doesn't depend on a live news
# feed staying up during judging. The scoring itself is a real model call.
HEADLINE_SEEDS = {
    "ALGO": [
        "Algorand shows steady on-chain activity amid broader crypto market volatility.",
        "Developer interest in Algorand's smart contract ecosystem continues to build.",
        "Traders remain divided on Algorand's near-term price direction after recent consolidation.",
    ],
    "SOL": [
        "Solana network activity remains strong as DeFi volumes hold up.",
        "Analysts flag continued institutional interest in the Solana ecosystem.",
        "Some traders express caution on Solana following a period of sharp price swings.",
    ],
    "BTC": [
        "Bitcoin holds key support levels as macro uncertainty persists.",
        "Institutional accumulation of Bitcoin continues according to on-chain trackers.",
        "Short-term traders remain cautious on Bitcoin amid mixed macro signals.",
    ],
    "ETH": [
        "Ethereum network upgrades continue to draw developer attention.",
        "Staking participation on Ethereum remains near record highs.",
        "Some analysts note short-term caution on Ethereum despite strong fundamentals.",
    ],
    "AVAX": [
        "Avalanche ecosystem growth continues with new protocol launches.",
        "On-chain metrics show steady activity across the Avalanche network.",
        "Traders remain watchful on Avalanche after a period of price consolidation.",
    ],
}

DEFAULT_SEEDS = [
    "The asset shows mixed signals amid broader crypto market conditions.",
    "Market participants remain watchful following recent price movement.",
    "On-chain activity for the asset has been relatively steady this week.",
]


async def score_text_with_finbert(client: httpx.AsyncClient, text: str) -> Optional[dict]:
    if not HF_API_TOKEN:
        return None
    try:
        resp = await client.post(
            HF_MODEL_URL,
            headers={"Authorization": f"Bearer {HF_API_TOKEN}"},
            json={"inputs": text},
            timeout=10.0,
        )
        resp.raise_for_status()
        data = resp.json()
        scores = {item["label"].lower(): item["score"] for item in data[0]}
        return scores
    except Exception:
        return None


@app.get("/agent/sentiment")
async def get_sentiment(token: str = Query(default="ALGO")):
    token_key = token.upper()
    headlines = HEADLINE_SEEDS.get(token_key, DEFAULT_SEEDS)

    async with httpx.AsyncClient() as client:
        results = [await score_text_with_finbert(client, h) for h in headlines]

    valid_results = [r for r in results if r is not None]

    if not valid_results:
        # No HF token set, or the live call failed — return a clearly-marked
        # neutral fallback instead of pretending this is a computed score.
        return {"sentimentScore": 50, "source": "fallback"}

    avg_positive = sum(r.get("positive", 0) for r in valid_results) / len(valid_results)
    avg_negative = sum(r.get("negative", 0) for r in valid_results) / len(valid_results)
    score = round(50 + (avg_positive - avg_negative) * 50)
    score = max(0, min(100, score))

    return {"sentimentScore": score, "source": "live"}


class FusionInput(BaseModel):
    token: str
    sentimentScore: float
    onChainWhaleFlow: Optional[str] = None
    onChainScore: Optional[float] = None
    technicalIndicator: Optional[str] = None
    taScore: Optional[float] = None


@app.post("/agent/fusion")
async def get_fusion(payload: FusionInput):
    # Transparent weighted-average fusion. A missing sub-score is treated as
    # neutral (50), which pulls the composite toward neutral rather than
    # silently dropping that input out of the average.
    sentiment = payload.sentimentScore
    onchain = payload.onChainScore if payload.onChainScore is not None else 50
    ta = payload.taScore if payload.taScore is not None else 50

    weights = {"sentiment": 0.30, "onchain": 0.35, "ta": 0.35}
    composite = round(
        sentiment * weights["sentiment"]
        + onchain * weights["onchain"]
        + ta * weights["ta"]
    )

    if composite >= 70:
        verdict = "STRONG BUY"
    elif composite >= 55:
        verdict = "BUY"
    elif composite >= 45:
        verdict = "NEUTRAL"
    elif composite >= 30:
        verdict = "SELL"
    else:
        verdict = "STRONG SELL"

    # Confidence reflects how many real (non-neutral-fallback) inputs went in.
    real_inputs = 1 + sum([
        payload.onChainScore is not None,
        payload.taScore is not None,
    ])
    confidence = round(50 + (real_inputs / 3) * 40)

    return {
        "compositeScore": composite,
        "verdict": verdict,
        "confidencePct": confidence,
    }


@app.get("/health")
async def health():
    return {"status": "ok", "hf_token_configured": bool(HF_API_TOKEN)}
