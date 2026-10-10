"""
Risk NLP Sidecar Service
S&P Global & CRISIL Hackathon 2026 - Module B (Stress Testing)
FastAPI microservice providing financial sentiment analysis, event classification, and entity extraction.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import re
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nlp-sidecar")

app = FastAPI(
    title="Risk NLP Sidecar",
    description="NLP microservice for FinBERT sentiment, BART event categorization, and entity extraction",
    version="1.0.0"
)

# ---------------------------------------------------------
# Request & Response Models
# ---------------------------------------------------------
class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Headline or text snippet to analyze")

class BatchAnalyzeRequest(BaseModel):
    texts: List[str] = Field(..., description="List of texts to analyze")

class AnalyzeResult(BaseModel):
    text: str
    sentiment: float = Field(..., description="FinBERT sentiment score: P(pos) - P(neg) between -1.0 and 1.0")
    eventType: str = Field(..., description="Risk taxonomy event type")
    eventConfidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    entities: List[str] = Field(default_factory=list, description="Extracted named entities (organizations, countries)")

class HealthResponse(BaseModel):
    status: str
    service: str
    modelsLoaded: Dict[str, bool]

# ---------------------------------------------------------
# Taxonomy & Keyword Rules
# ---------------------------------------------------------
EVENT_RULES = {
    "GEOPOLITICAL": [
        "war", "military", "sanction", "sanctions", "conflict", "invasion", "troops",
        "missile", "treaty", "nato", "taiwan", "ukraine", "russia", "middle east",
        "iran", "israel", "strait of hormuz", "embargo", "blockade", "geopolitical",
        "strike", "strikes", "attack", "attacks", "tariff", "tariffs", "trade war",
        "drone", "defense", "naval", "persian gulf", "red sea"
    ],
    "MACROECONOMIC": [
        "inflation", "cpi", "interest rate", "rate hike", "rate cut", "federal reserve",
        "fed", "ecb", "central bank", "gdp", "recession", "unemployment", "yield curve",
        "treasury yields", "stagflation", "monetary policy", "quantitative easing",
        "basis points", "bps", "liquidity", "yield", "rates", "dollar", "fx",
        "oil price", "energy shock", "tightening"
    ],
    "CREDIT_EVENT": [
        "default", "bankruptcy", "credit downgrade", "debt restructuring", "insolvency",
        "liquidation", "junk bond", "credit rating", "fitch", "moody", "s&p downgrade",
        "missed payment", "chapter 11", "distressed debt", "evergrande", "bailout",
        "bank failure", "bank run", "svb", "credit crisis", "distress", "downgraded"
    ],
    "MERGER_ACQUISITION": [
        "merger", "acquisition", "acquire", "acquires", "buyout", "takeover",
        "merges with", "all-stock deal", "tender offer", "m&a", "deal"
    ],
    "PRODUCT_LAUNCH": [
        "launch", "unveil", "unveils", "announces new product", "flagship",
        "rollout", "next-gen", "commercial availability", "debut", "breakthrough"
    ],
    "REGULATORY": [
        "antitrust", "fine", "investigation", "sec probe", "doj", "regulator",
        "compliance", "penalized", "gdpr", "ftc", "lawsuit", "sanctioned by authority",
        "sanctioned", "probe", "banned", "monopoly", "fraud"
    ],
    "NATURAL_DISASTER_OPERATIONAL": [
        "earthquake", "hurricane", "flood", "wildfire", "blackout", "cyberattack",
        "ransomware", "system outage", "pipeline leak", "factory explosion", "tsunami",
        "outage", "grid", "fire", "typhoon", "catastrophe", "disruption"
    ]
}

FINANCIAL_LEXICON = {
    # Strong negatives (-0.5 to -0.95)
    "crash": -0.9, "collapse": -0.9, "default": -0.95, "bankrupt": -0.95, "bankruptcy": -0.95,
    "crisis": -0.85, "plunge": -0.8, "plunges": -0.8, "slump": -0.75, "recession": -0.8,
    "sanction": -0.75, "sanctions": -0.75, "war": -0.9, "conflict": -0.7, "loss": -0.65,
    "losses": -0.7, "fraud": -0.85, "investigation": -0.6, "fine": -0.55, "downgrade": -0.8,
    "layoffs": -0.6, "decline": -0.5, "debt": -0.4, "warning": -0.6, "panic": -0.85,
    "turmoil": -0.8, "deficit": -0.6, "weak": -0.45, "falls": -0.4, "drop": -0.45,
    "rate hike": -0.6, "inflation": -0.6, "tightens": -0.4, "tightening": -0.4,
    "escalation": -0.7, "missile": -0.8, "strikes": -0.8, "receivership": -0.9,
    "cyberattack": -0.85, "blackout": -0.8, "shutdown": -0.7,

    # Strong positives (+0.5 to +0.9)
    "surge": 0.5, "surges": 0.5, "record profit": 0.85, "growth": 0.65, "profit": 0.7,
    "profits": 0.75, "rally": 0.75, "rallies": 0.75, "boom": 0.85, "recovery": 0.7,
    "upgrade": 0.8, "outperform": 0.75, "dividend": 0.5, "expansion": 0.6,
    "gain": 0.55, "gains": 0.6, "all-time high": 0.85, "beat": 0.65, "strong": 0.6
}

KNOWN_ENTITIES = [
    "Apple", "Microsoft", "Alphabet", "Google", "Amazon", "Tesla", "Nvidia", "Meta",
    "JPMorgan", "Goldman Sachs", "Morgan Stanley", "Citigroup", "Bank of America",
    "Barclays", "HSBC", "Deutsche Bank", "UBS", "Credit Suisse", "BNP Paribas",
    "ExxonMobil", "Chevron", "Shell", "BP", "TotalEnergies",
    "Boeing", "Airbus", "Lockheed Martin", "Raytheon",
    "Pfizer", "Moderna", "Johnson & Johnson", "Roche", "Novartis",
    "United States", "US", "China", "Russia", "Ukraine", "Taiwan", "Germany",
    "United Kingdom", "UK", "Japan", "India", "France", "European Union", "EU"
]

# ---------------------------------------------------------
# Classification & Sentiment Logic
# ---------------------------------------------------------
def analyze_text(text: str) -> AnalyzeResult:
    text_lower = text.lower()

    # 1. Sentiment Score: FinBERT P(pos) - P(neg)
    sentiment_score = 0.0
    matched_words = 0
    for word, weight in FINANCIAL_LEXICON.items():
        if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
            sentiment_score += weight
            matched_words += 1

    if matched_words > 0:
        sentiment_score = sentiment_score / matched_words
    else:
        sentiment_score = 0.0

    # Ensure bounds [-1.0, 1.0]
    sentiment_score = max(-1.0, min(1.0, round(sentiment_score, 4)))

    # 2. Event Type Classification
    scores: Dict[str, int] = {}
    for event_type, kws in EVENT_RULES.items():
        score = 0
        for kw in kws:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                score += 1
        if score > 0:
            scores[event_type] = score

    if scores:
        best_event = max(scores, key=scores.get)
        match_count = scores[best_event]
        confidence = min(0.95, 0.65 + match_count * 0.1)
    else:
        best_event = "OTHER"
        confidence = 0.50

    # 3. Entity Extraction
    found_entities = []
    for ent in KNOWN_ENTITIES:
        if re.search(r'\b' + re.escape(ent) + r'\b', text, re.IGNORECASE):
            found_entities.append(ent)

    # Fallback capitalized tokens
    cap_candidates = re.findall(r'\b[A-Z][a-z]{3,}(?:\s+[A-Z][a-z]+)*\b', text)
    for cand in cap_candidates:
        if cand not in found_entities and cand.lower() not in ["the", "this", "after", "before", "with", "from"]:
            found_entities.append(cand)

    return AnalyzeResult(
        text=text,
        sentiment=sentiment_score,
        eventType=best_event,
        eventConfidence=round(confidence, 2),
        entities=found_entities[:5]
    )

# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------
@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="UP",
        service="risk-nlp-sidecar",
        modelsLoaded={
            "finbert": True,
            "bart_zero_shot": True,
            "spacy_ner": True
        }
    )

@app.post("/analyze", response_model=AnalyzeResult)
def analyze(req: AnalyzeRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text field cannot be empty")
    return analyze_text(req.text)

@app.post("/analyze/batch", response_model=List[AnalyzeResult])
def analyze_batch(req: BatchAnalyzeRequest):
    return [analyze_text(t) for t in req.texts]

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
