package com.hackathon.risk.stress;

import com.hackathon.risk.portfolio.Position;
import com.hackathon.risk.signal.EventType;
import com.hackathon.risk.signal.RiskSignal;
import com.hackathon.risk.signal.SignalService;
import com.hackathon.risk.stress.model.AppliedShocks;
import com.hackathon.risk.stress.model.RevaluationResult;
import com.hackathon.risk.stress.model.StressResult;
import com.hackathon.risk.stress.revaluator.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class StressEngineTests {

    @Autowired
    private BondRevaluator bondRevaluator;

    @Autowired
    private LoanRevaluator loanRevaluator;

    @Autowired
    private DerivativeRevaluator derivativeRevaluator;

    @Autowired
    private EquityRevaluator equityRevaluator;

    @Autowired
    private StressService stressService;

    @Autowired
    private SignalService signalService;

    @Test
    @DisplayName("Verify BondRevaluator matches analytical hand calculation")
    void testBondRevaluatorHandCalculation() {
        Position bond = Position.builder()
                .positionId("TEST-BND")
                .assetClass("BOND")
                .counterparty("US Treasury")
                .sector("Sovereign")
                .region("North America")
                .currency("USD")
                .marketValue(10_000_000.0)
                .notional(10_000_000.0)
                .modifiedDuration(5.0)
                .convexity(40.0)
                .build();

        AppliedShocks shocks = AppliedShocks.builder()
                .rateShockBp(-50.0)       // -0.0050
                .creditSpreadBp(150.0)    // +0.0150
                .build();

        // Analytical hand calculation:
        // deltaP/P = -5.0 * (-0.0050) + 0.5 * 40.0 * (-0.0050)^2 - 5.0 * 0.0150
        //          = +0.0250 + 0.0005 - 0.0750 = -0.0495 (-4.95%)
        // deltaValue = 10,000,000 * (-0.0495) = -495,000.0
        RevaluationResult result = bondRevaluator.revalue(bond, shocks);

        assertEquals(-495_000.0, result.getDeltaValue(), 1e-4);
        assertEquals(9_505_000.0, result.getStressedMarketValue(), 1e-4);
        assertEquals(-4.95, result.getDeltaPercentage(), 1e-4);
    }

    @Test
    @DisplayName("Verify EquityRevaluator matches analytical hand calculation with beta and sector overrides")
    void testEquityRevaluatorHandCalculation() {
        Position techStock = Position.builder()
                .positionId("TEST-EQ")
                .assetClass("EQUITY")
                .counterparty("Apple")
                .sector("Technology")
                .marketValue(1_000_000.0)
                .beta(1.20)
                .build();

        AppliedShocks shocks = AppliedShocks.builder()
                .equityShockPct(-10.0)
                .build();

        // Effective shock = -10.0 * 1.20 = -12.0%
        // deltaValue = 1,000,000 * (-0.12) = -120,000.0
        RevaluationResult result = equityRevaluator.revalue(techStock, shocks);

        assertEquals(-120_000.0, result.getDeltaValue(), 1e-4);
        assertEquals(880_000.0, result.getStressedMarketValue(), 1e-4);
        assertEquals(-12.0, result.getDeltaPercentage(), 1e-4);
    }

    @Test
    @DisplayName("Verify DerivativeRevaluator matches analytical hand calculation for Swaps and FX Forwards")
    void testDerivativeRevaluatorHandCalculation() {
        // Swap Pay Fixed: benefits from rate rise
        Position swap = Position.builder()
                .positionId("TEST-SWP")
                .assetClass("DERIVATIVE")
                .rateType("SWAP")
                .payReceive("PAY_FIXED")
                .marketValue(0.0)
                .notional(25_000_000.0)
                .dv01(10_000.0)
                .build();

        AppliedShocks swapShocks = AppliedShocks.builder()
                .rateShockBp(200.0)
                .build();

        RevaluationResult swapResult = derivativeRevaluator.revalue(swap, swapShocks);
        // ΔMTM = DV01 * Δrate = 10,000 * 200 = 2,000,000
        assertEquals(2_000_000.0, swapResult.getDeltaValue(), 1e-4);

        // FX Forward
        Position fxForward = Position.builder()
                .positionId("TEST-FX")
                .assetClass("DERIVATIVE")
                .currencyPair("USDEUR")
                .notional(10_000_000.0)
                .marketValue(0.0)
                .delta(0.90)
                .build();

        AppliedShocks fxShocks = AppliedShocks.builder()
                .fxShocks(Map.of("USDEUR", 3.0))
                .build();

        RevaluationResult fxResult = derivativeRevaluator.revalue(fxForward, fxShocks);
        // ΔMTM = 10,000,000 * (3.0 / 100) * 0.90 = 270,000.0
        assertEquals(270_000.0, fxResult.getDeltaValue(), 1e-4);
    }

    @Test
    @DisplayName("Verify LoanRevaluator matches analytical hand calculation for spread widening and PD migration")
    void testLoanRevaluatorHandCalculation() {
        Position loan = Position.builder()
                .positionId("TEST-LN")
                .assetClass("LOAN")
                .marketValue(10_000_000.0)
                .notional(10_000_000.0)
                .modifiedDuration(3.0)
                .pd(0.02)
                .lgd(0.50)
                .build();

        AppliedShocks shocks = AppliedShocks.builder()
                .creditSpreadBp(100.0) // 0.0100
                .pdMultiplier(1.5)
                .highImpactMigration(false)
                .build();

        // ΔMTM = -3.0 * 0.0100 * 10,000,000 = -300,000
        // Base EL = 0.02 * 0.50 * 10M = 100,000
        // Stressed EL = (0.02 * 1.5) * 0.50 * 10M = 150,000
        RevaluationResult result = loanRevaluator.revalue(loan, shocks);

        assertEquals(-300_000.0, result.getDeltaValue(), 1e-4);
        assertEquals(9_700_000.0, result.getStressedMarketValue(), 1e-4);
        assertEquals(100_000.0, result.getBaseExpectedLoss(), 1e-4);
        assertEquals(150_000.0, result.getStressedExpectedLoss(), 1e-4);
    }

    @Test
    @DisplayName("Verify Monotonicity: Higher impact score strictly increases portfolio loss")
    void testMonotonicity() {
        StressResult runImpact6 = stressService.runStressTest(EventType.GEOPOLITICAL, 6, "sig-6", "Monotonicity test 6");
        StressResult runImpact8 = stressService.runStressTest(EventType.GEOPOLITICAL, 8, "sig-8", "Monotonicity test 8");
        StressResult runImpact10 = stressService.runStressTest(EventType.GEOPOLITICAL, 10, "sig-10", "Monotonicity test 10");

        double loss6 = Math.abs(runImpact6.getDeltaValue());
        double loss8 = Math.abs(runImpact8.getDeltaValue());
        double loss10 = Math.abs(runImpact10.getDeltaValue());

        System.out.printf("Monotonicity Losses: Impact 6: $%,.2f | Impact 8: $%,.2f | Impact 10: $%,.2f%n",
                loss6, loss8, loss10);

        assertTrue(loss8 > loss6, "Impact 8 loss must be greater than Impact 6 loss");
        assertTrue(loss10 > loss8, "Impact 10 loss must be greater than Impact 8 loss");
    }

    @Test
    @DisplayName("Verify End-to-End Stress Test: 'GEOPOLITICAL, 9' signal triggers revaluation and reduces portfolio value")
    void testEndToEndGeopoliticalSignalReducesPortfolioValue() {
        // Feed severe geopolitical headline into signal processing
        String severeHeadline = "All-out war declared in Middle East as naval strikes devastate oil pipelines and maritime traffic";
        RiskSignal signal = signalService.processRawText(severeHeadline, "LIVE_FEED");

        assertNotNull(signal);
        assertEquals(EventType.GEOPOLITICAL, signal.getEventType());
        assertTrue(signal.getImpactScore() >= 8, "Severe war headline should score impact >= 8, scored: " + signal.getImpactScore());

        // Run stress test directly for GEOPOLITICAL at impact 9
        StressResult result = stressService.runStressTest(
                EventType.GEOPOLITICAL,
                9,
                signal.getSignalId(),
                signal.getHeadline()
        );

        assertNotNull(result);
        assertTrue(result.getPortfolioValueBefore() > 1.0e9, "Baseline portfolio value must exceed $1B");
        assertTrue(result.getPortfolioValueAfter() < result.getPortfolioValueBefore(), "Portfolio value after stress must decrease");
        assertTrue(result.getDeltaValue() < 0, "Delta value must be negative (loss)");
        assertTrue(result.getDeltaPercentage() < 0, "Delta percentage must be negative");

        // Verify Expected Loss increased
        assertTrue(result.getExpectedLossAfter() > result.getExpectedLossBefore(), "Stressed expected loss must increase");

        // Verify top 10 positions populated
        assertNotNull(result.getTopLossPositionsJson());
        assertFalse(result.getTopLossPositionsJson().isBlank());

        System.out.printf("E2E GEOPOLITICAL 9 Result: Before $%,.2f -> After $%,.2f (Δ $%,.2f / %.2f%%)%n",
                result.getPortfolioValueBefore(), result.getPortfolioValueAfter(),
                result.getDeltaValue(), result.getDeltaPercentage());
    }
}
