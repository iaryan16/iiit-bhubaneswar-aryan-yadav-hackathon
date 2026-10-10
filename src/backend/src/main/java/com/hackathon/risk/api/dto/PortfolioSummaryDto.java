package com.hackathon.risk.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioSummaryDto {
    private int totalPositions;
    private double totalMarketValue;
    private double totalNotional;
    private double totalExpectedLoss;
    private Map<String, Double> byAssetClass;
    private Map<String, Double> bySector;
    private Map<String, Double> byRegion;
}
