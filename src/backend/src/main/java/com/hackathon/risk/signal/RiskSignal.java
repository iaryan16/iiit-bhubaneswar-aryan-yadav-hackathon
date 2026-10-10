package com.hackathon.risk.signal;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "risk_signals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskSignal {

    @Id
    @Column(name = "signal_id", length = 64)
    private String signalId;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false, length = 32)
    private String source;

    @Column(nullable = false, length = 1000)
    private String headline;

    @Column(columnDefinition = "TEXT")
    private String snippet;

    @Column(name = "entities_raw", length = 1000)
    private String entitiesRaw;

    @Column(name = "tickers_raw", length = 500)
    private String tickersRaw;

    @Column(length = 64)
    private String region;

    @Column(length = 64)
    private String sector;

    @Column(name = "sentiment_score", nullable = false)
    private Double sentimentScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 64)
    private EventType eventType;

    @Column(name = "event_confidence", nullable = false)
    private Double eventConfidence;

    @Column(name = "impact_score", nullable = false)
    private Integer impactScore;

    @Column(name = "impact_rationale_raw", columnDefinition = "TEXT")
    private String impactRationaleRaw;

    @Column(name = "processed_at")
    private Instant processedAt;

    @PrePersist
    public void prePersist() {
        if (this.signalId == null) {
            this.signalId = UUID.randomUUID().toString();
        }
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
        if (this.processedAt == null) {
            this.processedAt = Instant.now();
        }
    }

    public List<String> getEntities() {
        if (entitiesRaw == null || entitiesRaw.isBlank()) return new ArrayList<>();
        return Arrays.stream(entitiesRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public void setEntities(List<String> entities) {
        if (entities == null || entities.isEmpty()) {
            this.entitiesRaw = "";
        } else {
            this.entitiesRaw = String.join(",", entities);
        }
    }

    public List<String> getTickers() {
        if (tickersRaw == null || tickersRaw.isBlank()) return new ArrayList<>();
        return Arrays.stream(tickersRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public void setTickers(List<String> tickers) {
        if (tickers == null || tickers.isEmpty()) {
            this.tickersRaw = "";
        } else {
            this.tickersRaw = String.join(",", tickers);
        }
    }

    public List<String> getImpactRationale() {
        if (impactRationaleRaw == null || impactRationaleRaw.isBlank()) return new ArrayList<>();
        return Arrays.stream(impactRationaleRaw.split(";"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public void setImpactRationale(List<String> rationale) {
        if (rationale == null || rationale.isEmpty()) {
            this.impactRationaleRaw = "";
        } else {
            this.impactRationaleRaw = String.join(";", rationale);
        }
    }
}
