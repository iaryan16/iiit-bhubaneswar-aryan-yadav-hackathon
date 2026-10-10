package com.hackathon.risk.stress.revaluator;

import com.hackathon.risk.portfolio.Position;
import com.hackathon.risk.stress.model.AppliedShocks;
import com.hackathon.risk.stress.model.RevaluationResult;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class EquityRevaluator implements Revaluator {

    @Override
    public boolean supports(String assetClass) {
        return "EQUITY".equalsIgnoreCase(assetClass);
    }

    @Override
    public RevaluationResult revalue(Position position, AppliedShocks shocks) {
        double baseMv = position.getMarketValue() != null ? position.getMarketValue() : 0.0;
        double beta = position.getBeta() != null ? position.getBeta() : 1.0;

        // Check for sector overrides
        double shockPct = shocks.getEquityShockPct();
        Map<String, Double> override = shocks.getSectorOverrides().get(position.getSector());
        if (override != null && override.containsKey("equityShockPct")) {
            shockPct = override.get("equityShockPct");
        }

        // Equities: V × shock × beta
        double effectiveShockPct = shockPct * beta;
        double deltaValue = baseMv * (effectiveShockPct / 100.0);
        double stressedMv = baseMv + deltaValue;

        String rationale = String.format(
                "Base Shock: %.1f%%, Sector Override: %s, Beta: %.2f -> Effective Shock: %.2f%%",
                shocks.getEquityShockPct(),
                (override != null ? (shockPct + "%") : "NONE"),
                beta,
                effectiveShockPct
        );

        return RevaluationResult.builder()
                .positionId(position.getPositionId())
                .assetClass(position.getAssetClass())
                .counterparty(position.getCounterparty())
                .sector(position.getSector())
                .region(position.getRegion())
                .baseMarketValue(baseMv)
                .stressedMarketValue(stressedMv)
                .deltaValue(deltaValue)
                .deltaPercentage(effectiveShockPct)
                .baseExpectedLoss(0.0)
                .stressedExpectedLoss(0.0)
                .rationale(rationale)
                .build();
    }
}
