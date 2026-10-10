package com.hackathon.risk.api.dto;

import com.hackathon.risk.signal.EventType;
import com.hackathon.risk.signal.RiskSignal;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskSignalDto {
    private String signalId;
    private Instant timestamp;
    private String source;
    private String headline;
    private String snippet;
    private List<String> entities;
    private List<String> tickers;
    private String region;
    private String sector;
    private Double sentimentScore;
    private EventType eventType;
    private Double eventConfidence;
    private Integer impactScore;
    private List<String> impactRationale;

    public static RiskSignalDto fromEntity(RiskSignal entity) {
        if (entity == null) return null;
        return RiskSignalDto.builder()
                .signalId(entity.getSignalId())
                .timestamp(entity.getTimestamp())
                .source(entity.getSource())
                .headline(entity.getHeadline())
                .snippet(entity.getSnippet())
                .entities(entity.getEntities())
                .tickers(entity.getTickers())
                .region(entity.getRegion())
                .sector(entity.getSector())
                .sentimentScore(entity.getSentimentScore())
                .eventType(entity.getEventType())
                .eventConfidence(entity.getEventConfidence())
                .impactScore(entity.getImpactScore())
                .impactRationale(entity.getImpactRationale())
                .build();
    }
}
