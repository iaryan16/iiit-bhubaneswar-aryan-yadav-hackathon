package com.hackathon.risk.stress.model;

import com.hackathon.risk.signal.EventType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stress_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StressResult {

    @Id
    @Column(name = "result_id", length = 64)
    private String resultId;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "trigger_signal_id", length = 64)
    private String triggerSignalId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 64)
    private EventType eventType;

    @Column(name = "impact_score", nullable = false)
    private Integer impactScore;

    @Column(name = "headline", length = 1000)
    private String headline;

    @Column(name = "portfolio_value_before", nullable = false)
    private Double portfolioValueBefore;

    @Column(name = "portfolio_value_after", nullable = false)
    private Double portfolioValueAfter;

    @Column(name = "delta_value", nullable = false)
    private Double deltaValue;

    @Column(name = "delta_percentage", nullable = false)
    private Double deltaPercentage;

    @Column(name = "expected_loss_before", nullable = false)
    private Double expectedLossBefore;

    @Column(name = "expected_loss_after", nullable = false)
    private Double expectedLossAfter;

    @Column(name = "breakdown_by_asset_class", columnDefinition = "TEXT")
    private String breakdownByAssetClassJson;

    @Column(name = "breakdown_by_sector", columnDefinition = "TEXT")
    private String breakdownBySectorJson;

    @Column(name = "breakdown_by_region", columnDefinition = "TEXT")
    private String breakdownByRegionJson;

    @Column(name = "top_loss_positions", columnDefinition = "TEXT")
    private String topLossPositionsJson;

    @Column(name = "applied_shocks", columnDefinition = "TEXT")
    private String appliedShocksJson;

    @PrePersist
    public void prePersist() {
        if (this.resultId == null) {
            this.resultId = UUID.randomUUID().toString();
        }
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }
}
