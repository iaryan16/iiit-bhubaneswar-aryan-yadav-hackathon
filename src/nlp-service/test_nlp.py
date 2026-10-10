"""
Unit & Integration Tests for Risk NLP Sidecar
Validates FinBERT sentiment polarity, 70%+ accuracy on 20 labeled headlines, and entity extraction.
"""

import pytest
from app import analyze_text, health

LABELED_HEADLINES = [
    # Geopolitical
    ("Russia intensifies military strikes as Western allies impose new sanctions", "GEOPOLITICAL", -0.5),
    ("NATO troops mobilize along eastern border amid escalation fears", "GEOPOLITICAL", -0.5),
    ("Taiwan reports heightened naval activity and missile drills in strait", "GEOPOLITICAL", -0.5),
    
    # Macroeconomic
    ("Federal Reserve signals aggressive rate hike as inflation surges to 40-year high", "MACROECONOMIC", -0.5),
    ("ECB raises interest rates by 50 basis points to combat price pressures", "MACROECONOMIC", -0.3),
    ("US GDP contracts for second consecutive quarter entering technical recession", "MACROECONOMIC", -0.7),
    ("Treasury yields spike as central bank tightens monetary policy", "MACROECONOMIC", -0.4),
    
    # Credit Event
    ("Evergrande officially defaults on offshore dollar bonds following restructuring collapse", "CREDIT_EVENT", -0.8),
    ("Fitch downgrades sovereign credit rating to junk bond status amid default fears", "CREDIT_EVENT", -0.7),
    ("Retail giant files for Chapter 11 bankruptcy after missed debt payments", "CREDIT_EVENT", -0.8),
    ("Regional bank collapses into FDIC receivership amid liquidity insolvency", "CREDIT_EVENT", -0.9),

    # Merger & Acquisition
    ("Tech conglomerate announces $40 billion acquisition of semiconductor rival", "MERGER_ACQUISITION", 0.3),
    ("Global pharmaceutical firm merges with biotech pioneer in all-stock deal", "MERGER_ACQUISITION", 0.4),
    ("Private equity consortium completes buyout of enterprise cloud provider", "MERGER_ACQUISITION", 0.3),

    # Product Launch
    ("Apple unveils flagship next-gen AI smartphone in worldwide developer launch", "PRODUCT_LAUNCH", 0.6),
    ("EV manufacturer announces commercial availability of solid-state battery debut", "PRODUCT_LAUNCH", 0.5),

    # Regulatory
    ("DOJ and FTC file antitrust lawsuit seeking breakup of search monopoly", "REGULATORY", -0.6),
    ("European Commission penalizes social media company with $1.2B GDPR fine", "REGULATORY", -0.6),

    # Natural Disaster & Operational
    ("Catastrophic hurricane causes refinery shutdown and widespread pipeline leaks", "NATURAL_DISASTER_OPERATIONAL", -0.7),
    ("Major hospital network hit by ransomware cyberattack causing emergency blackout", "NATURAL_DISASTER_OPERATIONAL", -0.8)
]

def test_health():
    h = health()
    assert h.status == "UP"
    assert h.service == "risk-nlp-sidecar"

def test_sentiment_polarity_positive():
    res = analyze_text("Company reports record profit growth and all-time high earnings rally")
    assert res.sentiment > 0, f"Expected positive sentiment, got {res.sentiment}"

def test_sentiment_polarity_negative():
    res = analyze_text("Market crash worsens as major bank faces bankruptcy and default crisis")
    assert res.sentiment < 0, f"Expected negative sentiment, got {res.sentiment}"

def test_classification_accuracy_benchmark():
    correct = 0
    total = len(LABELED_HEADLINES)
    
    for headline, expected_event, expected_sentiment_sign in LABELED_HEADLINES:
        res = analyze_text(headline)
        if res.eventType == expected_event:
            correct += 1
        
        # Verify sentiment direction if non-zero
        if expected_sentiment_sign < 0:
            assert res.sentiment <= 0, f"Headline '{headline}' should have non-positive sentiment, got {res.sentiment}"
        elif expected_sentiment_sign > 0:
            assert res.sentiment >= 0, f"Headline '{headline}' should have non-negative sentiment, got {res.sentiment}"

    accuracy = correct / total
    print(f"\nClassification accuracy: {accuracy * 100:.1f}% ({correct}/{total})")
    assert accuracy >= 0.70, f"Accuracy must be >= 70%, achieved {accuracy * 100:.1f}%"

def test_entity_extraction():
    res = analyze_text("JPMorgan and Goldman Sachs warn of European Union banking turbulence")
    assert "JPMorgan" in res.entities or "Goldman Sachs" in res.entities

if __name__ == "__main__":
    print("Executing NLP tests...")
    test_health()
    print("  * test_health passed")
    test_sentiment_polarity_positive()
    print("  * test_sentiment_polarity_positive passed")
    test_sentiment_polarity_negative()
    print("  * test_sentiment_polarity_negative passed")
    test_classification_accuracy_benchmark()
    print("  * test_classification_accuracy_benchmark passed")
    test_entity_extraction()
    print("  * test_entity_extraction passed")
    print("All NLP tests passed successfully!")

