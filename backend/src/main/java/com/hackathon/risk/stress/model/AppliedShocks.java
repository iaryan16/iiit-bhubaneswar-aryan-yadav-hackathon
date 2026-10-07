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
        // Severity scaling: appliedShock = baseShock × min(impact / 8, 1.5)
        double scaling = Math.min(impactScore / 8.0, 1.5);
        boolean migration = impactScore >= 8;

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
