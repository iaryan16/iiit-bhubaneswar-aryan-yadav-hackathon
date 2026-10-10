package com.hackathon.risk.nlp;

import com.hackathon.risk.signal.EventType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Pattern;

@Component
public class ImpactScorer {

    private static final Map<EventType, Integer> BASE_SEVERITY = new EnumMap<>(EventType.class);
    private static final Map<String, Integer> HIGH_IMPACT_KEYWORDS = new LinkedHashMap<>();

    static {
        BASE_SEVERITY.put(EventType.CREDIT_EVENT, 7);
        BASE_SEVERITY.put(EventType.GEOPOLITICAL, 6);
        BASE_SEVERITY.put(EventType.MACROECONOMIC, 5);
        BASE_SEVERITY.put(EventType.NATURAL_DISASTER_OPERATIONAL, 5);
        BASE_SEVERITY.put(EventType.REGULATORY, 4);
        BASE_SEVERITY.put(EventType.MERGER_ACQUISITION, 3);
        BASE_SEVERITY.put(EventType.PRODUCT_LAUNCH, 2);
        BASE_SEVERITY.put(EventType.OTHER, 2);

        HIGH_IMPACT_KEYWORDS.put("sanction", 1);
        HIGH_IMPACT_KEYWORDS.put("sanctions", 1);
        HIGH_IMPACT_KEYWORDS.put("default", 2);
        HIGH_IMPACT_KEYWORDS.put("bankruptcy", 2);
        HIGH_IMPACT_KEYWORDS.put("blockade", 1);
        HIGH_IMPACT_KEYWORDS.put("war", 2);
        HIGH_IMPACT_KEYWORDS.put("missile", 1);
        HIGH_IMPACT_KEYWORDS.put("rate hike", 1);
        HIGH_IMPACT_KEYWORDS.put("emergency", 1);
        HIGH_IMPACT_KEYWORDS.put("blackout", 1);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImpactAssessment {
        private int impactScore;
        private List<String> rationale;
    }

    public ImpactAssessment score(
            String text,
            EventType eventType,
            double sentimentScore,
            List<String> entities,
            int recentVelocityCount
    ) {
        List<String> rationale = new ArrayList<>();

        // 1. Base Severity by Event Type
        int base = BASE_SEVERITY.getOrDefault(eventType, 2);
        rationale.add("base=" + base + " (" + eventType + ")");

        // 2. Sentiment Component: 2 * |sentiment|
        double absSentiment = Math.abs(sentimentScore);
        double sentimentComponent = 2.0 * absSentiment;
        long roundedSentiment = Math.round(sentimentComponent);
        if (roundedSentiment > 0) {
            rationale.add(String.format(Locale.US, "sentiment=+%.1f", sentimentComponent));
        }

        // 3. Keyword Bonus
        int keywordBonus = 0;
        String lowerText = (text != null) ? text.toLowerCase(Locale.ROOT) : "";
        for (Map.Entry<String, Integer> entry : HIGH_IMPACT_KEYWORDS.entrySet()) {
            if (Pattern.compile("\\b" + Pattern.quote(entry.getKey()) + "\\b").matcher(lowerText).find()) {
                keywordBonus += entry.getValue();
                rationale.add("kw:" + entry.getKey() + "=+" + entry.getValue());
                break; // Cap keyword bonus per primary keyword
            }
        }

        // 4. Velocity Bonus (burst of signals within window)
        int velocityBonus = 0;
        if (recentVelocityCount >= 5) {
            velocityBonus = 2;
            rationale.add("velocity:high=+2");
        } else if (recentVelocityCount >= 2) {
            velocityBonus = 1;
            rationale.add("velocity:elevated=+1");
        }

        // 5. Entity Bonus (high-impact systemic institutions)
        int entityBonus = 0;
        if (entities != null && !entities.isEmpty()) {
            boolean hasSystemicEntity = entities.stream().anyMatch(e ->
                    e.equalsIgnoreCase("JPMorgan") ||
                    e.equalsIgnoreCase("Goldman Sachs") ||
                    e.equalsIgnoreCase("United States") ||
                    e.equalsIgnoreCase("Federal Reserve") ||
                    e.equalsIgnoreCase("Russia") ||
                    e.equalsIgnoreCase("China")
            );
            if (hasSystemicEntity) {
                entityBonus = 1;
                rationale.add("entity:systemic=+1");
            }
        }

        // Total Impact calculation: clamped between 1 and 10
        double rawScore = base + sentimentComponent + keywordBonus + velocityBonus + entityBonus;
        int clampedImpact = (int) Math.min(10, Math.max(1, Math.round(rawScore)));

        return ImpactAssessment.builder()
                .impactScore(clampedImpact)
                .rationale(rationale)
                .build();
    }
}
