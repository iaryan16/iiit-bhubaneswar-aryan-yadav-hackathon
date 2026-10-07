package com.hackathon.risk.api;

import com.hackathon.risk.api.dto.PortfolioSummaryDto;
import com.hackathon.risk.portfolio.Position;
import com.hackathon.risk.portfolio.PortfolioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/portfolio")
@Tag(name = "Portfolio", description = "Portfolio composition, position tracking, and aggregations")
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping("/summary")
    @Operation(summary = "Get portfolio summary KPIs and multi-dimensional breakdown")
    public ResponseEntity<PortfolioSummaryDto> getSummary() {
        return ResponseEntity.ok(portfolioService.getSummary());
    }

    @GetMapping("/positions")
    @Operation(summary = "List all positions in the trading book")
    public ResponseEntity<List<Position>> getPositions() {
        return ResponseEntity.ok(portfolioService.getAllPositions());
    }
}
