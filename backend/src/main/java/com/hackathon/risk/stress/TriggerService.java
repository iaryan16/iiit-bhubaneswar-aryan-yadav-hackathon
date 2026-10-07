package com.hackathon.risk.stress;

import com.hackathon.risk.signal.EventType;
import com.hackathon.risk.signal.RiskSignal;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class TriggerService {

    private final StressService stressService;

    @Getter
    @Setter
    @Value("${app.stress.impact-threshold:7}")
    private int impactThreshold;

    @Getter
    @Setter
    @Value("${app.stress.confidence-threshold:0.5}")
    private double confidenceThreshold;

    @Getter
    @Setter
    @Value("${app.stress.debounce-minutes:30}")
    private int debounceMinutes;

    // Track last triggered signal per EventType for debouncing
    private final Map<EventType, DebounceState> debounceMap = new ConcurrentHashMap<>();

    private record DebounceState(Instant timestamp, int impactScore) {}

    @EventListener
    public void onRiskSignal(RiskSignal signal) {
        if (signal == null) return;

        int impact = signal.getImpactScore() != null ? signal.getImpactScore() : 0;
        double confidence = signal.getEventConfidence() != null ? signal.getEventConfidence() : 0.0;
        EventType eventType = signal.getEventType();

        // 1. Threshold check
        if (impact <= impactThreshold) {
            log.debug("Signal below impact threshold ({} <= {}), skipping trigger", impact, impactThreshold);
            return;
        }

        if (confidence < confidenceThreshold) {
            log.debug("Signal below confidence threshold ({} < {}), skipping trigger", confidence, confidenceThreshold);
            return;
        }

        // 2. Debounce check: within window, only trigger if new signal has strictly higher impact
        Instant now = Instant.now();
        Instant cutoff = now.minusSeconds(debounceMinutes * 60L);
        DebounceState lastState = debounceMap.get(eventType);

        if (lastState != null && lastState.timestamp().isAfter(cutoff)) {
            if (impact <= lastState.impactScore()) {
                log.info("Debouncing [{}] event: incoming impact {} <= recent active impact {}, suppressing stress trigger",
                        eventType, impact, lastState.impactScore());
                return;
            } else {
                log.info("Elevated impact detected for [{}] ({} > {}), upgrading stress run",
                        eventType, impact, lastState.impactScore());
            }
        }

        // 3. Update debounce tracker
        debounceMap.put(eventType, new DebounceState(now, impact));

        // 4. Trigger stress test execution
        log.info("TRIGGERING STRESS RUN: [{}] Impact: {} (Confidence: {}) - '{}'",
                eventType, impact, confidence, signal.getHeadline());

        stressService.runStressTest(
                eventType,
                impact,
                signal.getSignalId(),
                signal.getHeadline()
        );
    }
}
