"""
QuantMesh On-Chain Analytics & Technical Analysis Worker Agent
Uses CoinGecko API for market data and Algorand Indexer for whale flow detection.
"""

import os
import math
import hashlib
from typing import Optional

import httpx
from fastapi import FastAPI, Query
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="QuantMesh On-Chain & TA Agent")

COINGECKO_API_KEY = os.environ.get("COINGECKO_API_KEY", "")
CMC_API_KEY = os.environ.get("CMC_API_KEY", "")
ALGORAND_INDEXER = "https://testnet-idx.algonode.cloud"

# CoinGecko ID mapping
COINGECKO_IDS = {
    "ALGO": "algorand",
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "AVAX": "avalanche-2",
    "PEPE": "pepe",
    "LINK": "chainlink",
    "DOGE": "dogecoin",
    "SUI": "sui",
    "USDC": "usd-coin",
}


async def fetch_coingecko_market(client: httpx.AsyncClient, token: str) -> Optional[dict]:
    """Fetch market data from CoinGecko API."""
    cg_id = COINGECKO_IDS.get(token.upper())
    if not cg_id:
        return None

    headers = {}
    base_url = "https://api.coingecko.com/api/v3"

    if COINGECKO_API_KEY:
        headers["x-cg-demo-key"] = COINGECKO_API_KEY

    try:
        resp = await client.get(
            f"{base_url}/coins/{cg_id}",
            params={
                "localization": "false",
                "tickers": "false",
                "market_data": "true",
                "community_data": "false",
                "developer_data": "false",
                "sparkline": "false",
            },
            headers=headers,
            timeout=12.0,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"[OnChain] CoinGecko fetch failed: {e}")
        return None


async def fetch_coingecko_ohlc(client: httpx.AsyncClient, token: str) -> Optional[list]:
    """Fetch OHLC candle data from CoinGecko (1-day, hourly candles)."""
    cg_id = COINGECKO_IDS.get(token.upper())
    if not cg_id:
        return None

    headers = {}
    if COINGECKO_API_KEY:
        headers["x-cg-demo-key"] = COINGECKO_API_KEY

    try:
        resp = await client.get(
            f"https://api.coingecko.com/api/v3/coins/{cg_id}/ohlc",
            params={"vs_currency": "usd", "days": "1"},
            headers=headers,
            timeout=12.0,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"[OnChain] CoinGecko OHLC failed: {e}")
        return None


def compute_rsi(closes: list[float], period: int = 14) -> Optional[float]:
    """Compute RSI from a list of closing prices."""
    if len(closes) < period + 1:
        return None

    gains = []
    losses = []
    for i in range(1, len(closes)):
        delta = closes[i] - closes[i - 1]
        if delta > 0:
            gains.append(delta)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(delta))

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0:
        return 100.0

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return round(rsi, 1)


def compute_sma(values: list[float], period: int) -> Optional[float]:
    """Compute Simple Moving Average."""
    if len(values) < period:
        return None
    return sum(values[-period:]) / period


def compute_ema(values: list[float], period: int) -> Optional[float]:
    """Compute Exponential Moving Average."""
    if len(values) < period:
        return None
    multiplier = 2 / (period + 1)
    ema = sum(values[:period]) / period
    for price in values[period:]:
        ema = (price - ema) * multiplier + ema
    return round(ema, 4)


def analyze_technicals(ohlc_data: list) -> dict:
    """Compute technical indicators from OHLC candle data."""
    if not ohlc_data or len(ohlc_data) < 5:
        return {"taSignal": "Insufficient data", "taScore": 50}

    closes = [candle[4] for candle in ohlc_data]  # [timestamp, open, high, low, close]
    current_price = closes[-1]

    rsi = compute_rsi(closes)
    sma_short = compute_sma(closes, 7)
    sma_long = compute_sma(closes, 20)
    ema_12 = compute_ema(closes, 12)
    ema_26 = compute_ema(closes, 26)

    signals = []
    score = 50  # neutral baseline

    # RSI analysis
    if rsi is not None:
        if rsi > 70:
            signals.append(f"RSI {rsi} - Overbought")
            score -= 10
        elif rsi < 30:
            signals.append(f"RSI {rsi} - Oversold")
            score += 15
        elif rsi > 50:
            signals.append(f"RSI {rsi} - Bullish Momentum")
            score += 8
        else:
            signals.append(f"RSI {rsi} - Bearish Pressure")
            score -= 5

    # SMA Crossover
    if sma_short is not None and sma_long is not None:
        if sma_short > sma_long:
            signals.append("SMA 7/20 Golden Cross")
            score += 10
        else:
            signals.append("SMA 7/20 Death Cross")
            score -= 8

    # MACD (EMA12 - EMA26)
    if ema_12 is not None and ema_26 is not None:
        macd = ema_12 - ema_26
        if macd > 0:
            signals.append("MACD Bullish")
            score += 7
        else:
            signals.append("MACD Bearish")
            score -= 7

    # Price vs SMA
    if sma_short is not None and current_price > sma_short:
        score += 5

    score = max(0, min(100, score))
    primary_signal = signals[0] if signals else "Neutral"
    indicator_text = " | ".join(signals[:2]) if signals else "No clear signal"

    return {
        "taSignal": indicator_text,
        "taScore": score,
        "rsi": rsi,
        "smaShort": round(sma_short, 2) if sma_short else None,
        "smaLong": round(sma_long, 2) if sma_long else None,
        "currentPrice": round(current_price, 6),
    }


def analyze_market_data(market_data: dict) -> dict:
    """Extract whale flow and on-chain metrics from CoinGecko market data."""
    if not market_data or "market_data" not in market_data:
        return {
            "whaleFlow": "Data unavailable",
            "onChainScore": 50,
            "volume24h": 0,
            "priceChange24h": 0,
            "marketCap": 0,
        }

    md = market_data["market_data"]

    price_change_24h = md.get("price_change_percentage_24h", 0) or 0
    price_change_7d = md.get("price_change_percentage_7d", 0) or 0
    volume_24h = md.get("total_volume", {}).get("usd", 0) or 0
    market_cap = md.get("market_cap", {}).get("usd", 0) or 0

    # Volume-to-Market Cap ratio (higher = more active)
    vol_mcap_ratio = (volume_24h / market_cap * 100) if market_cap > 0 else 0

    # On-chain score heuristic
    score = 50
    if price_change_24h > 5:
        score += 15
    elif price_change_24h > 2:
        score += 10
    elif price_change_24h > 0:
        score += 5
    elif price_change_24h < -5:
        score -= 15
    elif price_change_24h < -2:
        score -= 10
    elif price_change_24h < 0:
        score -= 5

    if vol_mcap_ratio > 15:
        score += 10  # very high trading activity
    elif vol_mcap_ratio > 8:
        score += 5

    if price_change_7d > 10:
        score += 8
    elif price_change_7d < -10:
        score -= 8

    score = max(0, min(100, score))

    # Whale flow interpretation
    if price_change_24h > 3 and vol_mcap_ratio > 10:
        whale_flow = f"+{round(vol_mcap_ratio, 1)}% Net Inflow (High Volume Accumulation)"
    elif price_change_24h > 0:
        whale_flow = f"+{round(vol_mcap_ratio, 1)}% Net Inflow"
    elif price_change_24h < -3 and vol_mcap_ratio > 10:
        whale_flow = f"-{round(vol_mcap_ratio, 1)}% Net Outflow (High Volume Distribution)"
    elif price_change_24h < 0:
        whale_flow = f"-{round(vol_mcap_ratio, 1)}% Net Outflow"
    else:
        whale_flow = f"{round(vol_mcap_ratio, 1)}% Neutral Flow"

    return {
        "whaleFlow": whale_flow,
        "onChainScore": score,
        "volume24h": round(volume_24h),
        "priceChange24h": round(price_change_24h, 2),
        "priceChange7d": round(price_change_7d, 2),
        "marketCap": round(market_cap),
        "volMcapRatio": round(vol_mcap_ratio, 2),
    }


# ─── On-Chain Whale Flow Endpoint (Worker B replacement) ─────────
@app.get("/agent/onchain")
async def get_onchain(token: str = Query(default="ALGO")):
    async with httpx.AsyncClient() as client:
        market_data = await fetch_coingecko_market(client, token)

    result = analyze_market_data(market_data)
    result["source"] = "live" if market_data else "fallback"
    return result


# ─── Technical Analysis Endpoint (Worker C replacement) ──────────
@app.get("/agent/ta")
async def get_ta(token: str = Query(default="ALGO")):
    async with httpx.AsyncClient() as client:
        ohlc_data = await fetch_coingecko_ohlc(client, token)

    result = analyze_technicals(ohlc_data)
    result["source"] = "live" if ohlc_data else "fallback"
    return result


# ─── Combined Analysis Endpoint ──────────────────────────────────
@app.get("/agent/combined")
async def get_combined(token: str = Query(default="ALGO")):
    async with httpx.AsyncClient() as client:
        market_data, ohlc_data = await asyncio_gather(
            fetch_coingecko_market(client, token),
            fetch_coingecko_ohlc(client, token),
        )

    onchain = analyze_market_data(market_data)
    ta = analyze_technicals(ohlc_data)

    return {
        "token": token.upper(),
        "onchain": onchain,
        "ta": ta,
    }


# ─── Health Check ────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "coingecko_key_configured": bool(COINGECKO_API_KEY),
        "cmc_key_configured": bool(CMC_API_KEY),
    }


# Needed for combined endpoint
import asyncio
asyncio_gather = asyncio.gather
