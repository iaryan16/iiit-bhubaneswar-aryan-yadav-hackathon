package com.hackathon.risk.stress.revaluator;

import com.hackathon.risk.portfolio.Position;
import com.hackathon.risk.stress.model.AppliedShocks;
import com.hackathon.risk.stress.model.RevaluationResult;
import org.springframework.stereotype.Component;

@Component
public class LoanRevaluator implements Revaluator {

    @Override
    public boolean supports(String assetClass) {
        return "LOAN".equalsIgnoreCase(assetClass);
    }

    @Override
    public RevaluationResult revalue(Position position, AppliedShocks shocks) {
        double baseMv = position.getMarketValue() != null ? position.getMarketValue() : 0.0;
        double notional = position.getNotional() != null ? position.getNotional() : baseMv;
        double duration = position.getModifiedDuration() != null ? position.getModifiedDuration() : 3.0;

        // Spread shock
        double deltaSpread = shocks.getCreditSpreadBp() / 10000.0;
        double deltaMtm = -duration * deltaSpread * baseMv;
        double stressedMv = baseMv + deltaMtm;
        double deltaPct = baseMv != 0 ? (deltaMtm / baseMv) * 100.0 : 0.0;

        // Baseline EL
        double basePd = position.getPd() != null ? position.getPd() : 0.015;
        double lgd = position.getLgd() != null ? position.getLgd() : 0.45;
        double baseEl = basePd * lgd * notional;

        // Stressed PD with rating migration at high impact (impact >= 8)
        double migrationFactor = shocks.isHighImpactMigration() ? 1.25 : 1.0;
        double stressedPd = Math.min(1.0, basePd * shocks.getPdMultiplier() * migrationFactor);
        double stressedEl = stressedPd * lgd * notional;

        String rationale = String.format(
                "Spread widening: +%.0fbps, PD migration: %.3f%% -> %.3f%% (EL: +$%,.0f)",
                shocks.getCreditSpreadBp(), basePd * 100, stressedPd * 100, (stressedEl - baseEl)
        );

        return RevaluationResult.builder()
                .positionId(position.getPositionId())
                .assetClass(position.getAssetClass())
                .counterparty(position.getCounterparty())
                .sector(position.getSector())
                .region(position.getRegion())
                .baseMarketValue(baseMv)
                .stressedMarketValue(stressedMv)
                .deltaValue(deltaMtm)
                .deltaPercentage(deltaPct)
                .baseExpectedLoss(baseEl)
                .stressedExpectedLoss(stressedEl)
                .rationale(rationale)
                .build();
    }
}
