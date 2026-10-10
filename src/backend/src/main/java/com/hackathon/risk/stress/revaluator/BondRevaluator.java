package com.hackathon.risk.stress.revaluator;

import com.hackathon.risk.portfolio.Position;
import com.hackathon.risk.stress.model.AppliedShocks;
import com.hackathon.risk.stress.model.RevaluationResult;
import org.springframework.stereotype.Component;

@Component
public class BondRevaluator implements Revaluator {

    @Override
    public boolean supports(String assetClass) {
        return "BOND".equalsIgnoreCase(assetClass);
    }

    @Override
    public RevaluationResult revalue(Position position, AppliedShocks shocks) {
        double baseMv = position.getMarketValue() != null ? position.getMarketValue() : 0.0;
        double duration = position.getModifiedDuration() != null ? position.getModifiedDuration() : 5.0;
        double convexity = position.getConvexity() != null ? position.getConvexity() : 40.0;

        // Convert basis points to decimals
        double deltaY = shocks.getRateShockBp() / 10000.0;
        double deltaSpread = shocks.getCreditSpreadBp() / 10000.0;

        // ΔP/P = −D·Δy + ½·C·Δy² − D·Δspread
        double deltaPOverP = (-duration * deltaY) + (0.5 * convexity * deltaY * deltaY) - (duration * deltaSpread);
        double deltaValue = baseMv * deltaPOverP;
        double stressedMv = baseMv + deltaValue;
        double deltaPct = baseMv != 0 ? (deltaValue / baseMv) * 100.0 : 0.0;

        String rationale = String.format(
                "Duration: %.1fy, Convexity: %.1f, Δy: %.1fbps, Δspread: %.1fbps -> ΔP/P: %.2f%%",
                duration, convexity, shocks.getRateShockBp(), shocks.getCreditSpreadBp(), deltaPct
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
                .deltaPercentage(deltaPct)
                .baseExpectedLoss(0.0)
                .stressedExpectedLoss(0.0)
                .rationale(rationale)
                .build();
    }
}
