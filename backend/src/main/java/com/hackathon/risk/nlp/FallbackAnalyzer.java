package com.hackathon.risk.nlp;

import com.hackathon.risk.signal.EventType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class FallbackAnalyzer {

    private static final Map<EventType, List<String>> KEYWORD_RULES = new EnumMap<>(EventType.class);
    private static final Map<String, Double> SENTIMENT_LEXICON = new HashMap<>();
    private static final List<String> COMMON_ENTITIES = List.of(
            "Apple", "Microsoft", "Alphabet", "Google", "Amazon", "Tesla", "Nvidia", "Meta",
            "JPMorgan", "Goldman Sachs", "Morgan Stanley", "Citigroup", "Bank of America",
            "Barclays", "HSBC", "Deutsche Bank", "UBS", "BNP Paribas",
            "ExxonMobil", "Chevron", "Shell", "BP", "TotalEnergies",
            "Boeing", "Airbus", "Lockheed Martin", "Pfizer", "Moderna",
            "United States", "US", "China", "Russia", "Ukraine", "Taiwan", "Germany",
            "United Kingdom", "UK", "Japan", "India", "European Union", "EU"
    );

    static {
        KEYWORD_RULES.put(EventType.GEOPOLITICAL, List.of(
                "war", "military", "sanction", "sanctions", "conflict", "invasion", "troops",
                "missile", "treaty", "nato", "taiwan", "ukraine", "russia", "middle east",
                "iran", "israel", "strait of hormuz", "embargo", "blockade", "geopolitical"
        ));

        KEYWORD_RULES.put(EventType.MACROECONOMIC, List.of(
                "inflation", "cpi", "interest rate", "rate hike", "rate cut", "federal reserve",
                "fed", "ecb", "central bank", "gdp", "recession", "unemployment", "yield curve",
                "treasury yields", "stagflation", "monetary policy", "quantitative easing"
        ));

        KEYWORD_RULES.put(EventType.CREDIT_EVENT, List.of(
                "default", "bankruptcy", "credit downgrade", "debt restructuring", "insolvency",
                "liquidation", "junk bond", "credit rating", "fitch", "moody", "s&p downgrade",
                "missed payment", "chapter 11", "distressed debt", "evergrande"
        ));

        KEYWORD_RULES.put(EventType.MERGER_ACQUISITION, List.of(
                "merger", "acquisition", "acquire", "acquires", "buyout", "takeover",
                "merges with", "all-stock deal", "tender offer", "m&a"
        ));

        KEYWORD_RULES.put(EventType.PRODUCT_LAUNCH, List.of(
                "launch", "unveil", "unveils", "announces new product", "flagship",
                "rollout", "next-gen", "commercial availability", "debut"
        ));

        KEYWORD_RULES.put(EventType.REGULATORY, List.of(
                "antitrust", "fine", "investigation", "sec probe", "doj", "regulator",
                "compliance", "penalized", "gdpr", "ftc", "lawsuit"
        ));

        KEYWORD_RULES.put(EventType.NATURAL_DISASTER_OPERATIONAL, List.of(
                "earthquake", "hurricane", "flood", "wildfire", "blackout", "cyberattack",
                "ransomware", "system outage", "pipeline leak", "factory explosion", "tsunami"
        ));

        // Sentiment lexicon
        SENTIMENT_LEXICON.put("crash", -0.9);
        SENTIMENT_LEXICON.put("collapse", -0.9);
        SENTIMENT_LEXICON.put("default", -0.95);
        SENTIMENT_LEXICON.put("bankrupt", -0.95);
        SENTIMENT_LEXICON.put("bankruptcy", -0.95);
        SENTIMENT_LEXICON.put("crisis", -0.85);
        SENTIMENT_LEXICON.put("plunge", -0.8);
        SENTIMENT_LEXICON.put("plunges", -0.8);
        SENTIMENT_LEXICON.put("slump", -0.75);
        SENTIMENT_LEXICON.put("recession", -0.8);
        SENTIMENT_LEXICON.put("sanction", -0.75);
        SENTIMENT_LEXICON.put("sanctions", -0.75);
        SENTIMENT_LEXICON.put("war", -0.9);
        SENTIMENT_LEXICON.put("conflict", -0.7);
        SENTIMENT_LEXICON.put("downgrade", -0.8);
        SENTIMENT_LEXICON.put("rate hike", -0.6);
        SENTIMENT_LEXICON.put("inflation", -0.6);
        SENTIMENT_LEXICON.put("cyberattack", -0.85);
        SENTIMENT_LEXICON.put("blackout", -0.8);

        SENTIMENT_LEXICON.put("surge", 0.5);
        SENTIMENT_LEXICON.put("surges", 0.5);
        SENTIMENT_LEXICON.put("growth", 0.65);
        SENTIMENT_LEXICON.put("profit", 0.7);
        SENTIMENT_LEXICON.put("profits", 0.75);
        SENTIMENT_LEXICON.put("rally", 0.75);
        SENTIMENT_LEXICON.put("boom", 0.85);
        SENTIMENT_LEXICON.put("recovery", 0.7);
        SENTIMENT_LEXICON.put("upgrade", 0.8);
        SENTIMENT_LEXICON.put("record", 0.7);
    }

    public NlpAnalysisResult analyze(String text) {
        if (text == null || text.isBlank()) {
            return NlpAnalysisResult.builder()
                    .text("")
                    .sentiment(0.0)
                    .eventType(EventType.OTHER)
                    .eventConfidence(0.5)
                    .engineUsed("JAVA_FALLBACK")
                    .build();
        }

        String lower = text.toLowerCase(Locale.ROOT);

        // 1. Calculate Sentiment
        double sentimentSum = 0.0;
        int sentimentHits = 0;
        for (Map.Entry<String, Double> entry : SENTIMENT_LEXICON.entrySet()) {
            if (Pattern.compile("\\b" + Pattern.quote(entry.getKey()) + "\\b").matcher(lower).find()) {
                sentimentSum += entry.getValue();
                sentimentHits++;
            }
        }
        double sentiment = (sentimentHits > 0) ? (sentimentSum / sentimentHits) : 0.0;
        sentiment = Math.max(-1.0, Math.min(1.0, Math.round(sentiment * 100.0) / 100.0));

        // 2. Classify Event Type
        Map<EventType, Integer> counts = new EnumMap<>(EventType.class);
        for (Map.Entry<EventType, List<String>> entry : KEYWORD_RULES.entrySet()) {
            int score = 0;
            for (String kw : entry.getValue()) {
                if (Pattern.compile("\\b" + Pattern.quote(kw) + "\\b").matcher(lower).find()) {
                    score++;
                }
            }
            if (score > 0) {
                counts.put(entry.getKey(), score);
            }
        }

        EventType eventType = EventType.OTHER;
        double confidence = 0.50;
        if (!counts.isEmpty()) {
            Map.Entry<EventType, Integer> best = counts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .orElseThrow();
            eventType = best.getKey();
            confidence = Math.min(0.95, 0.65 + (best.getValue() * 0.10));
        }

        // 3. Extract Named Entities
        List<String> entities = new ArrayList<>();
        for (String ent : COMMON_ENTITIES) {
            if (Pattern.compile("\\b" + Pattern.quote(ent) + "\\b", Pattern.CASE_INSENSITIVE).matcher(text).find()) {
                entities.add(ent);
            }
        }

        return NlpAnalysisResult.builder()
                .text(text)
                .sentiment(sentiment)
                .eventType(eventType)
                .eventConfidence(Math.round(confidence * 100.0) / 100.0)
                .entities(entities)
                .engineUsed("JAVA_RULES_FALLBACK")
                .build();
    }
}
