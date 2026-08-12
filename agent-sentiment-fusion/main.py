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
    regimeScore: Optional[float] = None
    newsScore: Optional[float] = None
    fearGreedScore: Optional[float] = None
    fundingScore: Optional[float] = None


@app.post("/agent/fusion")
async def get_fusion(payload: FusionInput):
    sentiment = payload.sentimentScore
    onchain = payload.onChainScore if payload.onChainScore is not None else 50
    ta = payload.taScore if payload.taScore is not None else 50

    # --- Dynamic Adaptive Weights ---
    def signal_strength(score: float) -> float:
        """Returns 0.0-1.0 measuring how far from neutral (50) this score is."""
        return abs(score - 50) / 50.0

    str_s = signal_strength(sentiment)
    str_o = signal_strength(onchain)
    str_t = signal_strength(ta)

    w_s = 0.33 + 0.15 * str_s
    w_o = 0.34 + 0.15 * str_o
    w_t = 0.33 + 0.15 * str_t

    if payload.onChainScore is None:
        w_o *= 0.5
    if payload.taScore is None:
        w_t *= 0.5

    total_w = w_s + w_o + w_t
    w_s /= total_w
    w_o /= total_w
    w_t /= total_w

    core_composite = sentiment * w_s + onchain * w_o + ta * w_t

    # --- Extra Workers (E, F, G, H) ---
    extra_scores = []
    if payload.regimeScore is not None:
        extra_scores.append(("regime", payload.regimeScore))
    if payload.newsScore is not None:
        extra_scores.append(("news", payload.newsScore))
    if payload.fearGreedScore is not None:
        extra_scores.append(("feargreed", payload.fearGreedScore))
    if payload.fundingScore is not None:
        extra_scores.append(("funding", payload.fundingScore))

    if extra_scores:
        # Core workers: 70% weight, Extra workers: 30% weight
        extra_avg = sum(s for _, s in extra_scores) / len(extra_scores)
        composite = round(core_composite * 0.70 + extra_avg * 0.30)
    else:
        composite = round(core_composite)

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
    all_scores = [sentiment, onchain, ta] + [s for _, s in extra_scores]
    mean = sum(all_scores) / len(all_scores)
    variance = sum((s - mean) ** 2 for s in all_scores) / len(all_scores)
    std_dev = variance ** 0.5

    agreement = max(0.0, 1.0 - (std_dev / 30.0))
    real_inputs = 1 + sum([
        payload.onChainScore is not None,
        payload.taScore is not None,
        payload.regimeScore is not None,
        payload.newsScore is not None,
        payload.fearGreedScore is not None,
        payload.fundingScore is not None,
    ])
    availability = real_inputs / 7.0

    confidence = round((agreement * 0.70 + availability * 0.30) * 100)
    confidence = max(10, min(99, confidence))

    weights_dict = {
        "sentiment": round(w_s * (0.70 if extra_scores else 1.0), 3),
        "onchain": round(w_o * (0.70 if extra_scores else 1.0), 3),
        "ta": round(w_t * (0.70 if extra_scores else 1.0), 3),
    }
    if extra_scores:
        extra_w = round(0.30 / len(extra_scores), 3)
        for name, _ in extra_scores:
            weights_dict[name] = extra_w

    return {
        "compositeScore": composite,
        "verdict": verdict,
        "confidencePct": confidence,
        "weights": weights_dict,
    }


@app.get("/health")
async def health():
    return {"status": "ok", "hf_token_configured": bool(HF_API_TOKEN)}

