package com.hackathon.risk.stress.revaluator;

import com.hackathon.risk.portfolio.Position;
import com.hackathon.risk.stress.model.AppliedShocks;
import com.hackathon.risk.stress.model.RevaluationResult;
import org.springframework.stereotype.Component;

@Component
public class DerivativeRevaluator implements Revaluator {

    @Override
    public boolean supports(String assetClass) {
        return "DERIVATIVE".equalsIgnoreCase(assetClass);
    }

    @Override
    public RevaluationResult revalue(Position position, AppliedShocks shocks) {
        double baseMv = position.getMarketValue() != null ? position.getMarketValue() : 0.0;
        double notional = position.getNotional() != null ? position.getNotional() : Math.abs(baseMv);
        double deltaMtm = 0.0;
        String rationale = "";

        if ("SWAP".equalsIgnoreCase(position.getRateType()) || position.getDv01() != null) {
            // Swaps: ΔMTM = DV01 × Δrate
            double dv01 = position.getDv01() != null ? position.getDv01() : (notional * 0.0004);
            double rateShockBp = shocks.getRateShockBp();
            boolean isPayFixed = "PAY_FIXED".equalsIgnoreCase(position.getPayReceive());

            // Pay Fixed gains when rates rise; Receive Fixed loses when rates rise
            deltaMtm = isPayFixed ? (dv01 * rateShockBp) : (-dv01 * rateShockBp);
            rationale = String.format("IR Swap (%s): DV01 $%,.0f × Rate shock %.1fbps -> ΔMTM: $%,.0f",
                    position.getPayReceive(), dv01, rateShockBp, deltaMtm);
        } else {
            // FX forwards: notional × Δfx × delta
            String pair = position.getCurrencyPair() != null ? position.getCurrencyPair() : "USDEUR";
            double fxShockPct = shocks.getFxShocks().getOrDefault(pair, 2.0);
            double delta = position.getDelta() != null ? position.getDelta() : 0.85;

            deltaMtm = notional * (fxShockPct / 100.0) * delta;
            rationale = String.format("FX Forward (%s): Notional $%,.0f × Δfx %.2f%% × Delta %.2f -> ΔMTM: $%,.0f",
                    pair, notional, fxShockPct, delta, deltaMtm);
        }

        double stressedMv = baseMv + deltaMtm;
        double deltaPct = baseMv != 0 ? (deltaMtm / Math.abs(baseMv)) * 100.0 : (deltaMtm / notional) * 100.0;

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
                .baseExpectedLoss(0.0)
                .stressedExpectedLoss(0.0)
                .rationale(rationale)
                .build();
    }
}
