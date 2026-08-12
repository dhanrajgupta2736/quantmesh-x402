"""
QuantMesh AI Content / Plagiarism Detector Agent
Uses statistical text analysis to estimate probability of AI-generated content.
No external API needed — pure computation.
"""

import re
import math
from collections import Counter
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="QuantMesh Content Detector Agent")


class ContentInput(BaseModel):
    text: str
    checkPlagiarism: bool = False


def compute_burstiness(sentences: list[str]) -> float:
    """Burstiness: variance in sentence lengths. AI text tends to be uniform (low burstiness)."""
    if len(sentences) < 3:
        return 0.5
    lengths = [len(s.split()) for s in sentences if len(s.split()) > 2]
    if not lengths:
        return 0.5
    mean = sum(lengths) / len(lengths)
    variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
    std_dev = math.sqrt(variance)
    burstiness = min(1.0, std_dev / 12.0)
    return round(burstiness, 3)


def compute_vocabulary_richness(words: list[str]) -> float:
    """Type-Token Ratio (TTR): unique words / total words. AI text tends to be repetitive."""
    if not words:
        return 0.5
    unique = len(set(words))
    total = len(words)
    ttr = unique / total
    return round(ttr, 3)


def compute_repetition_score(text: str) -> float:
    """Detect repeated phrases (3-gram frequency). High repetition → likely AI."""
    words = text.lower().split()
    if len(words) < 10:
        return 0.0
    trigrams = [" ".join(words[i:i+3]) for i in range(len(words) - 2)]
    counter = Counter(trigrams)
    repeated = sum(1 for count in counter.values() if count > 1)
    ratio = repeated / max(1, len(trigrams))
    return round(min(1.0, ratio * 5), 3)


def compute_sentence_starter_diversity(sentences: list[str]) -> float:
    """AI text often starts sentences with similar patterns."""
    if len(sentences) < 5:
        return 0.5
    starters = [s.strip().split()[0].lower() if s.strip().split() else "" for s in sentences]
    unique_starters = len(set(starters))
    diversity = unique_starters / len(starters)
    return round(diversity, 3)


def analyze_content(text: str) -> dict:
    """Analyze text for AI-generated content probability."""
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 5]
    words = [w.lower() for w in re.findall(r'\b[a-zA-Z]+\b', text)]
    
    if len(words) < 20:
        return {
            "aiProbability": 0.5,
            "verdict": "INSUFFICIENT_TEXT",
            "confidence": 10,
            "metrics": {},
            "note": "Need at least 20 words for meaningful analysis.",
        }
    
    burstiness = compute_burstiness(sentences)
    ttr = compute_vocabulary_richness(words)
    repetition = compute_repetition_score(text)
    starter_diversity = compute_sentence_starter_diversity(sentences)
    
    avg_sent_len = sum(len(s.split()) for s in sentences) / max(1, len(sentences))
    
    ai_signals = []
    
    burstiness_signal = 1.0 - burstiness
    ai_signals.append(burstiness_signal * 0.30)
    
    ai_signals.append(repetition * 0.20)
    
    starter_signal = 1.0 - starter_diversity
    ai_signals.append(starter_signal * 0.20)
    
    sent_lengths = [len(s.split()) for s in sentences if len(s.split()) > 2]
    if sent_lengths:
        mean_len = sum(sent_lengths) / len(sent_lengths)
        len_variance = sum((l - mean_len) ** 2 for l in sent_lengths) / len(sent_lengths)
        len_uniformity = max(0, 1.0 - (math.sqrt(len_variance) / 10.0))
    else:
        len_uniformity = 0.5
    ai_signals.append(len_uniformity * 0.15)
    
    ttr_signal = abs(ttr - 0.55) * 2
    ai_signals.append(min(1.0, ttr_signal) * 0.15)
    
    ai_probability = sum(ai_signals)
    ai_probability = max(0.05, min(0.95, ai_probability))
    
    if ai_probability >= 0.75:
        verdict = "LIKELY_AI_GENERATED"
    elif ai_probability >= 0.55:
        verdict = "POSSIBLY_AI_GENERATED"
    elif ai_probability >= 0.35:
        verdict = "MIXED_SIGNALS"
    else:
        verdict = "LIKELY_HUMAN_WRITTEN"
    
    confidence = min(85, 30 + len(words) // 10)
    
    return {
        "aiProbability": round(ai_probability, 3),
        "verdict": verdict,
        "confidence": confidence,
        "metrics": {
            "burstiness": burstiness,
            "vocabularyRichness": ttr,
            "repetitionScore": repetition,
            "sentenceStarterDiversity": starter_diversity,
            "avgSentenceLength": round(avg_sent_len, 1),
            "sentenceLengthUniformity": round(len_uniformity, 3),
        },
        "wordCount": len(words),
        "sentenceCount": len(sentences),
    }


@app.post("/agent/content-detect")
async def detect_content(payload: ContentInput):
    """Analyze text for AI-generated content."""
    if not payload.text or len(payload.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Text too short (min 50 chars).")
    if len(payload.text) > 50000:
        raise HTTPException(status_code=400, detail="Text too long (max 50,000 chars).")
    
    return analyze_content(payload.text)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "content-detector"}
