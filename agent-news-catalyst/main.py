"""
QuantMesh News Catalyst Detector Agent
Fetches latest crypto news from CryptoPanic and classifies catalyst type via keyword matching.
"""

import os
import re
from typing import Optional

import httpx
from fastapi import FastAPI, Query, HTTPException
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="QuantMesh News Catalyst Agent")

CRYPTOPANIC_AUTH_TOKEN = os.environ.get("CRYPTOPANIC_AUTH_TOKEN", "")

# Keyword-based catalyst classification (no NLP needed)
CATALYST_PATTERNS = {
    "LISTING": [
        r"\blisting\b", r"\blisted\b", r"\bcoinbase\b", r"\bbinance\s+list",
        r"\bkraken\b.*\blist", r"\bexchange\s+launch",
    ],
    "PARTNERSHIP": [
        r"\bpartner", r"\bcollaboration\b", r"\bintegrat", r"\balliance\b",
        r"\bjoint\s+venture", r"\bteam\s+up",
    ],
    "HACK": [
        r"\bhack", r"\bexploit", r"\bbreach\b", r"\bstolen\b", r"\bdrain",
        r"\bvulnerabilit", r"\brug\s*pull",
    ],
    "REGULATION": [
        r"\bregulat", r"\bSEC\b", r"\bcompliance\b", r"\bban\b", r"\blawsuit",
        r"\blegislat", r"\bCFTC\b", r"\bcourt\b",
    ],
    "UPGRADE": [
        r"\bupgrade\b", r"\bfork\b", r"\bmainnet\b", r"\btestnet\b",
        r"\bprotocol\s+update", r"\bv2\b", r"\blaunch",
    ],
    "WHALE": [
        r"\bwhale\b", r"\blarge\s+transfer", r"\binstitutional\b",
        r"\baccumulat", r"\bdump",
    ],
}

# Sentiment weight per catalyst type
CATALYST_SENTIMENT = {
    "LISTING": +20,
    "PARTNERSHIP": +15,
    "UPGRADE": +12,
    "WHALE": +5,
    "REGULATION": -10,
    "HACK": -25,
    "GENERAL": 0,
}

COINGECKO_TO_CRYPTOPANIC = {
    "ALGO": "ALGO",
    "BTC": "BTC",
    "ETH": "ETH",
    "SOL": "SOL",
    "AVAX": "AVAX",
    "LINK": "LINK",
    "DOGE": "DOGE",
    "SUI": "SUI",
    "PEPE": "PEPE",
}


def classify_headline(title: str) -> tuple[str, int]:
    """Classify a headline into a catalyst type and return (type, strength)."""
    title_lower = title.lower()
    for catalyst_type, patterns in CATALYST_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, title_lower):
                return catalyst_type, abs(CATALYST_SENTIMENT[catalyst_type])
    return "GENERAL", 0


async def fetch_cryptopanic_news(
    client: httpx.AsyncClient, token: str
) -> Optional[list[dict]]:
    """Fetch latest news from CryptoPanic API."""
    if not CRYPTOPANIC_AUTH_TOKEN:
        return None
    
    currency = COINGECKO_TO_CRYPTOPANIC.get(token.upper(), token.upper())
    try:
        resp = await client.get(
            "https://cryptopanic.com/api/free/v2/posts/",
            params={
                "auth_token": CRYPTOPANIC_AUTH_TOKEN,
                "currencies": currency,
                "kind": "news",
                "public": "true",
            },
            timeout=6.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("results", [])[:10]
    except Exception as e:
        print(f"[News] CryptoPanic fetch failed: {e}")
        return None


@app.get("/agent/news")
async def get_news(token: str = Query(default="ALGO")):
    """Worker F — News Catalyst Detector."""
    if token.upper() == "USDC":
        raise HTTPException(status_code=400, detail="USDC is a stablecoin.")
    
    async with httpx.AsyncClient() as client:
        articles = await fetch_cryptopanic_news(client, token)
    
    if not articles:
        return {
            "catalystType": "NO_DATA",
            "catalystStrength": 0,
            "newsScore": 50,
            "headlines": [],
            "source": "fallback",
        }
    
    classified = []
    catalyst_counts = {}
    total_sentiment_shift = 0
    
    for article in articles:
        title = article.get("title", "")
        cat_type, strength = classify_headline(title)
        sentiment_shift = CATALYST_SENTIMENT.get(cat_type, 0)
        total_sentiment_shift += sentiment_shift
        catalyst_counts[cat_type] = catalyst_counts.get(cat_type, 0) + 1
        classified.append({
            "title": title[:120],
            "catalystType": cat_type,
            "strength": strength,
            "url": article.get("url", ""),
            "publishedAt": article.get("published_at", ""),
        })
    
    non_general = {k: v for k, v in catalyst_counts.items() if k != "GENERAL"}
    dominant = max(non_general, key=non_general.get) if non_general else "GENERAL"
    
    news_score = max(5, min(95, 50 + int(total_sentiment_shift / max(1, len(articles)) * 5)))
    
    dominant_strength = max(
        (item["strength"] for item in classified if item["catalystType"] == dominant),
        default=0,
    )
    
    return {
        "catalystType": dominant,
        "catalystStrength": dominant_strength,
        "newsScore": news_score,
        "headlineCount": len(articles),
        "catalystBreakdown": catalyst_counts,
        "headlines": classified[:5],
        "source": "cryptopanic_live",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "cryptopanic_configured": bool(CRYPTOPANIC_AUTH_TOKEN),
    }
