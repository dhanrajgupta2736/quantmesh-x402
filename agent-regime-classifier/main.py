import os
import hashlib
import asyncio
import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Worker E: Risk & Regime Classifier")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Standard token pairs on Binance
BINANCE_PAIRS = {
    "BTC": "BTCUSDT",
    "ETH": "ETHUSDT",
    "SOL": "SOLUSDT",
    "ALGO": "ALGOUSDT",
    "AVAX": "AVAXUSDT",
    "PEPE": "PEPEUSDT",
    "LINK": "LINKUSDT",
    "DOGE": "DOGEUSDT",
    "SUI": "SUIUSDT"
}

def generate_fallback_regime(token: str):
    """Deterministic fallback if Binance API fails."""
    h = hashlib.sha256(f"regime-fallback-{token}-v1".encode()).hexdigest()
    val = int(h[:4], 16)
    
    volatility = 0.02 + (val % 50) / 1000.0  # 0.02 to 0.07
    
    if val % 4 == 0:
        regime = "TRENDING_BULLISH"
        score = 80
        pos = "2-3% of portfolio"
    elif val % 4 == 1:
        regime = "TRENDING_BEARISH"
        score = 25
        pos = "0-1% of portfolio (hedge)"
    elif val % 4 == 2:
        regime = "RANGING"
        score = 50
        pos = "1-2% of portfolio (scalp)"
    else:
        regime = "HIGH_VOLATILITY"
        score = 30
        pos = "0.5-1% of portfolio (reduce exposure)"
        
    stop_loss = round(volatility * 100 * 1.5, 1)
    stop_loss = max(1.5, min(12.0, stop_loss))
    
    return {
        "regime": regime,
        "volatilityIndex": round(volatility, 3),
        "suggestedPositionSize": pos,
        "stopLossLevel": f"-{stop_loss}%",
        "regimeScore": score,
        "confidencePct": 45,
        "adx": round(20 + (val % 20), 1),
        "atr": round(volatility, 4),
        "trendDirection": "UNKNOWN",
        "source": "deterministic_fallback"
    }

async def fetch_klines(symbol: str):
    url = f"https://api.binance.com/api/v3/klines?symbol={symbol}&interval=1h&limit=30"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, timeout=5.0)
        resp.raise_for_status()
        return resp.json()

def calculate_atr(klines):
    """Calculate 14-period ATR."""
    if len(klines) < 15:
        return 0.01
    
    true_ranges = []
    for i in range(1, len(klines)):
        high = float(klines[i][2])
        low = float(klines[i][3])
        prev_close = float(klines[i-1][4])
        
        tr = max(high - low, abs(high - prev_close), abs(low - prev_close))
        true_ranges.append(tr)
        
    # Simple moving average of TR for the last 14 periods
    atr = sum(true_ranges[-14:]) / 14
    return atr

def calculate_adx_simplified(klines):
    """Simplified ADX calculation for trend strength (0-100)."""
    # A full ADX requires Wilder's Smoothing, this is a proxy for the hackathon
    if len(klines) < 15:
        return 20.0
        
    closes = [float(k[4]) for k in klines]
    highs = [float(k[2]) for k in klines]
    lows = [float(k[3]) for k in klines]
    
    # Calculate directional movement proxy
    up_moves = sum(1 for i in range(1, len(closes)) if closes[i] > closes[i-1])
    down_moves = sum(1 for i in range(1, len(closes)) if closes[i] < closes[i-1])
    
    total_moves = up_moves + down_moves
    if total_moves == 0:
        return 20.0
        
    # The more one-sided the movement, the stronger the trend
    directional_imbalance = abs(up_moves - down_moves) / total_moves
    
    # Scale to typical ADX range (10-50 usually, above 25 is trending)
    adx_proxy = 10 + (directional_imbalance * 40)
    return adx_proxy

@app.get("/agent/regime")
async def get_regime(token: str = Query(..., description="Token symbol (e.g. BTC, ALGO)")):
    token_upper = token.upper()
    
    if token_upper in ("USDC", "USDT"):
        raise HTTPException(status_code=400, detail="Stablecoins are not applicable for regime classification.")
        
    if token_upper not in BINANCE_PAIRS:
        return generate_fallback_regime(token_upper)
        
    symbol = BINANCE_PAIRS[token_upper]
    
    try:
        klines = await fetch_klines(symbol)
        
        current_price = float(klines[-1][4])
        
        # Calculate indicators
        atr = calculate_atr(klines)
        adx = calculate_adx_simplified(klines)
        
        # Simple SMA for trend direction
        closes = [float(k[4]) for k in klines]
        sma_20 = sum(closes[-20:]) / 20 if len(closes) >= 20 else current_price
        
        # Volatility Index (normalized ATR)
        volatility_index = atr / current_price if current_price > 0 else 0
        
        # Determine Regime
        if adx > 25 and current_price > sma_20:
            regime = "TRENDING_BULLISH"
            trend_dir = "BULLISH"
        elif adx > 25 and current_price < sma_20:
            regime = "TRENDING_BEARISH"
            trend_dir = "BEARISH"
        elif adx < 20 and volatility_index < 0.03:
            regime = "RANGING"
            trend_dir = "NEUTRAL"
        elif adx < 20 and volatility_index >= 0.03:
            regime = "VOLATILE_RANGE"
            trend_dir = "NEUTRAL"
        elif volatility_index >= 0.05:
            regime = "HIGH_VOLATILITY"
            trend_dir = "UNKNOWN"
        else:
            regime = "LOW_VOLATILITY"
            trend_dir = "UNKNOWN"
            
        # Determine Position Size
        if regime == "TRENDING_BULLISH":
            if volatility_index < 0.03:
                pos_size = "3-5% of portfolio"
            elif volatility_index < 0.06:
                pos_size = "2-3% of portfolio"
            else:
                pos_size = "1-2% of portfolio"
        elif regime == "TRENDING_BEARISH":
            pos_size = "0-1% of portfolio (hedge)"
        elif regime == "RANGING":
            pos_size = "1-2% of portfolio (scalp)"
        elif regime == "VOLATILE_RANGE":
            pos_size = "0.5-1% of portfolio"
        elif regime == "HIGH_VOLATILITY":
            pos_size = "0.5-1% of portfolio (reduce exposure)"
        else:
            pos_size = "2-4% of portfolio"
            
        # Stop Loss Calculation
        stop_loss_pct = round(volatility_index * 100 * 1.5, 1)
        stop_loss_pct = max(1.5, min(12.0, stop_loss_pct))
        
        # Regime Score for Fusion (0-100)
        if regime == "TRENDING_BULLISH":
            score = 70 + min(20, adx - 25)
        elif regime == "TRENDING_BEARISH":
            score = max(15, 40 - (adx - 25))
        elif regime == "RANGING":
            score = 45 + (10 if volatility_index < 0.03 else 0)
        elif regime in ("HIGH_VOLATILITY", "VOLATILE_RANGE"):
            score = max(20, 35 - int(volatility_index * 100))
        else:
            score = 50
            
        score = round(max(0, min(100, score)))
        
        return {
            "regime": regime,
            "volatilityIndex": round(volatility_index, 3),
            "suggestedPositionSize": pos_size,
            "stopLossLevel": f"-{stop_loss_pct}%",
            "regimeScore": score,
            "confidencePct": 85,  # Real data has higher confidence
            "adx": round(adx, 1),
            "atr": round(atr, 4),
            "trendDirection": trend_dir,
            "source": "binance_live"
        }
        
    except Exception as e:
        print(f"Error fetching data for {token}: {e}")
        return generate_fallback_regime(token_upper)

@app.get("/health")
async def health():
    return {"status": "ok", "agent": "regime-classifier"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5003, reload=True)
