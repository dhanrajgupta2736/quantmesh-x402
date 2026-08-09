import os
from typing import Optional

import httpx
from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="QuantMesh Sentiment + Fusion Agent")

HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "")
HF_MODEL_URL = "https://router.huggingface.co/hf-inference/models/ProsusAI/finbert"

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
    "PEPE": [
        "Meme token trading volumes surge as community sentiment turns bullish.",
        "On-chain whale addresses accumulate significant PEPE positions.",
        "High volatility expected as PEPE approaches key resistance technical levels.",
    ],
    "LINK": [
        "Chainlink oracle integrations expand rapidly across major L1 and L2 chains.",
        "Cross-Chain Interoperability Protocol (CCIP) adoption boosts LINK demand.",
        "Technical indicators suggest a breakout formation for Chainlink.",
    ],
    "SUI": [
        "Sui network throughput hits record peak following mainnet upgrades.",
        "DApp ecosystem TVL on Sui grows rapidly amid gaming partnerships.",
        "Traders monitor key Sui token unlock schedules for near-term impact.",
    ],
    "DOGE": [
        "Dogecoin social sentiment spikes alongside elevated retail trading volume.",
        "Whale transaction alerts signal large transfers between active exchanges.",
        "DOGE price tests key psychological support as market momentum builds.",
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
    if token.upper() == "USDC":
        raise HTTPException(status_code=400, detail="USDC is a stablecoin; sentiment analysis is not applicable.")
    token_key = token.upper()
    headlines = HEADLINE_SEEDS.get(token_key, DEFAULT_SEEDS)

    async with httpx.AsyncClient() as client:
        results = [await score_text_with_finbert(client, h) for h in headlines]

    valid_results = [r for r in results if r is not None]

    if not valid_results:
        # No HF token set, or live call fallback: compute realistic seed-hash score
        base_score = sum(ord(c) for c in token_key) % 35 + 48 # deterministic per token [48..83]
        return {"sentimentScore": base_score, "source": "fallback"}

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
    sentiment = payload.sentimentScore
    onchain = payload.onChainScore if payload.onChainScore is not None else 50
    ta = payload.taScore if payload.taScore is not None else 50

    # --- Dynamic Adaptive Weights ---
    # Scores far from 50 (neutral) carry stronger signal conviction,
    # so we weight them higher. A score of 20 or 80 is a strong signal;
    # a score of 50 is wishy-washy and gets down-weighted.
    def signal_strength(score: float) -> float:
        """Returns 0.0-1.0 measuring how far from neutral (50) this score is."""
        return abs(score - 50) / 50.0

    str_s = signal_strength(sentiment)
    str_o = signal_strength(onchain)
    str_t = signal_strength(ta)

    # Base weights: equal starting point
    w_s = 0.33 + 0.15 * str_s   # sentiment: 0.33 to 0.48
    w_o = 0.34 + 0.15 * str_o   # onchain:   0.34 to 0.49
    w_t = 0.33 + 0.15 * str_t   # ta:        0.33 to 0.48

    # Penalise workers that returned no real data (used default 50)
    if payload.onChainScore is None:
        w_o *= 0.5
    if payload.taScore is None:
        w_t *= 0.5

    # Normalise so weights sum to 1.0
    total_w = w_s + w_o + w_t
    w_s /= total_w
    w_o /= total_w
    w_t /= total_w

    composite = round(sentiment * w_s + onchain * w_o + ta * w_t)

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

    # --- Real-time Confidence Score ---
    # Based on two factors:
    #   1) Inter-agent agreement (low variance = high confidence)
    #   2) Data availability (more real inputs = higher confidence)
    scores = [sentiment, onchain, ta]
    mean = sum(scores) / len(scores)
    variance = sum((s - mean) ** 2 for s in scores) / len(scores)
    std_dev = variance ** 0.5  # 0 = perfect agreement, ~33 = max disagreement

    # Agreement factor: 100% when all agents agree, drops as they diverge
    # std_dev of 0 → 1.0 agreement, std_dev of 30+ → ~0.0 agreement
    agreement = max(0.0, 1.0 - (std_dev / 30.0))

    # Data availability factor
    real_inputs = 1 + sum([
        payload.onChainScore is not None,
        payload.taScore is not None,
    ])
    availability = real_inputs / 3.0  # 0.33 to 1.0

    # Final confidence: weighted combination (70% agreement, 30% availability)
    confidence = round((agreement * 0.70 + availability * 0.30) * 100)
    confidence = max(10, min(99, confidence))  # clamp to 10-99%

    return {
        "compositeScore": composite,
        "verdict": verdict,
        "confidencePct": confidence,
        "weights": {
            "sentiment": round(w_s, 3),
            "onchain": round(w_o, 3),
            "ta": round(w_t, 3),
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok", "hf_token_configured": bool(HF_API_TOKEN)}

