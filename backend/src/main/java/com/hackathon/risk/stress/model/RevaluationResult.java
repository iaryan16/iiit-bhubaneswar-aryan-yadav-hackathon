package com.hackathon.risk.stress.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevaluationResult {
    private String positionId;
    private String assetClass;
    private String counterparty;
    private String sector;
    private String region;
    private double baseMarketValue;
    private double stressedMarketValue;
    private double deltaValue;
    private double deltaPercentage;
    private double baseExpectedLoss;
    private double stressedExpectedLoss;
    private String rationale;
}
