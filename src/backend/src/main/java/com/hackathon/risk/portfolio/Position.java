package com.hackathon.risk.portfolio;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "positions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Position {

    @Id
    @Column(name = "position_id", length = 64)
    private String positionId;

    @Column(name = "asset_class", nullable = false, length = 32)
    private String assetClass; // BOND, LOAN, DERIVATIVE, EQUITY

    @Column(nullable = false)
    private String counterparty;

    @Column(nullable = false, length = 64)
    private String sector;

    @Column(nullable = false, length = 64)
    private String region;

    @Column(nullable = false, length = 8)
    private String currency;

    @Column(nullable = false)
    private Double notional;

    @Column(name = "market_value", nullable = false)
    private Double marketValue;

    // Bond specific
    private Double coupon;
    @Column(name = "modified_duration")
    private Double modifiedDuration;
    private Double convexity;
    private String rating;

    // Loan specific
    @Column(name = "rate_type", length = 32)
    private String rateType;
    private Double pd;
    private Double lgd;

    // Derivative specific
    private Double dv01;
    @Column(name = "pay_receive", length = 32)
    private String payReceive;
    @Column(name = "currency_pair", length = 16)
    private String currencyPair;
    private Double delta;

    // Equity specific
    @Column(length = 16)
    private String ticker;
    private Double shares;
    private Double price;
    private Double beta;
}
