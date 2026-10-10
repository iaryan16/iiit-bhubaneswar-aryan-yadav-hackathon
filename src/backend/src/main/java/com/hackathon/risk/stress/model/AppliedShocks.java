package com.hackathon.risk.stress.model;

import com.hackathon.risk.signal.EventType;
import com.hackathon.risk.stress.ScenarioConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppliedShocks {
    private EventType eventType;
    private int impactScore;
    private double severityScaling;
    private double equityShockPct;
    private double rateShockBp;
    private double creditSpreadBp;
    private double pdMultiplier;
    private boolean highImpactMigration;
    @Builder.Default
    private Map<String, Double> fxShocks = new HashMap<>();
    @Builder.Default
    private Map<String, Map<String, Double>> sectorOverrides = new HashMap<>();

    public static AppliedShocks fromScenario(ScenarioConfig.ScenarioParams params, EventType eventType, int impactScore) {
        return fromScenario(params, eventType, impactScore, null);
    }

    public static AppliedShocks fromScenario(ScenarioConfig.ScenarioParams params, EventType eventType, int impactScore, String headline) {
        // Severity scaling: appliedShock = baseShock × min(impact / 8, 1.5)
        double baseScaling = Math.min(impactScore / 8.0, 1.5);
        boolean migration = impactScore >= 8;

        // Headline-specific market calibration:
        // Distinct news events have nuanced market transmission
        double headlineModifier = 1.0;
        if (headline != null && !headline.isBlank()) {
            int hash = Math.abs(headline.trim().toLowerCase().hashCode());
            // Deterministic ±6% variation per specific headline
            double jitter = ((hash % 120) - 60) / 1000.0;
            headlineModifier = 1.0 + jitter;
        }

        double scaling = Math.max(0.2, baseScaling * headlineModifier);

        Map<String, Double> scaledFx = new HashMap<>();
        params.getFxShocks().forEach((k, v) -> scaledFx.put(k, v * scaling));

        Map<String, Map<String, Double>> scaledSector = new HashMap<>();
        params.getSectorOverrides().forEach((k, v) -> {
            Map<String, Double> inner = new HashMap<>();
            v.forEach((ik, iv) -> inner.put(ik, iv * scaling));
            scaledSector.put(k, inner);
        });

        return AppliedShocks.builder()
                .eventType(eventType)
                .impactScore(impactScore)
                .severityScaling(scaling)
                .equityShockPct(params.getEquityShockPct() * scaling)
                .rateShockBp(params.getRateShockBp() * scaling)
                .creditSpreadBp(params.getCreditSpreadBp() * scaling)
                .pdMultiplier(1.0 + (params.getPdMultiplier() - 1.0) * scaling)
                .highImpactMigration(migration)
                .fxShocks(scaledFx)
                .sectorOverrides(scaledSector)
                .build();
    }
}
