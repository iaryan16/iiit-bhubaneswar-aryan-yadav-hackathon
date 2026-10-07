package com.hackathon.risk.portfolio;

import com.hackathon.risk.api.dto.PortfolioSummaryDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class PortfolioTests {

    @Autowired
    private PositionRepository positionRepository;

    @Autowired
    private PortfolioService portfolioService;

    @Test
    @DisplayName("Verify portfolio loads ~200 positions with total market value between $1B and $2B")
    void testPortfolioCompositionAndValuation() {
        List<Position> positions = positionRepository.findAll();
        assertFalse(positions.isEmpty(), "Positions should be loaded in database");
        assertTrue(positions.size() >= 180 && positions.size() <= 220, "Should contain ~200 positions, found: " + positions.size());

        PortfolioSummaryDto summary = portfolioService.getSummary();
        assertNotNull(summary);
        double totalMv = summary.getTotalMarketValue();
        System.out.printf("Total Portfolio Market Value: $%,.2f across %d positions%n", totalMv, summary.getTotalPositions());

        assertTrue(totalMv >= 1.0e9 && totalMv <= 2.0e9, "Total Market Value must be within $1B - $2B range, was: " + totalMv);
    }

    @Test
    @DisplayName("Verify all required asset classes are represented with breakdowns")
    void testAssetClassRepresentation() {
        PortfolioSummaryDto summary = portfolioService.getSummary();

        assertTrue(summary.getByAssetClass().containsKey("BOND"), "Must contain BONDS");
        assertTrue(summary.getByAssetClass().containsKey("LOAN"), "Must contain LOANS");
        assertTrue(summary.getByAssetClass().containsKey("EQUITY"), "Must contain EQUITIES");
        assertTrue(summary.getByAssetClass().containsKey("DERIVATIVE"), "Must contain DERIVATIVES");

        assertFalse(summary.getBySector().isEmpty(), "Sector breakdown must not be empty");
        assertFalse(summary.getByRegion().isEmpty(), "Region breakdown must not be empty");
        assertTrue(summary.getTotalExpectedLoss() > 0, "Baseline Expected Loss should be calculated");
    }
}
