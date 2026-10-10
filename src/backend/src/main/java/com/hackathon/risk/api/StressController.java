package com.hackathon.risk.api;

import com.hackathon.risk.signal.EventType;
import com.hackathon.risk.signal.RiskSignal;
import com.hackathon.risk.signal.SignalService;
import com.hackathon.risk.stress.StressPublisher;
import com.hackathon.risk.stress.StressService;
import com.hackathon.risk.stress.model.StressResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/stress")
@Tag(name = "Stress Testing", description = "Execute stress test revaluations, view run history, and stream results")
@RequiredArgsConstructor
public class StressController {

    private final StressService stressService;
    private final StressPublisher stressPublisher;
    private final SignalService signalService;

    @GetMapping("/results")
    @Operation(summary = "Get historical stress testing runs")
    public ResponseEntity<List<StressResult>> getResults() {
        return ResponseEntity.ok(stressService.getHistory());
    }

    @PostMapping("/run")
    @Operation(summary = "Inject scenario with headline/text; AI automatically predicts event type, severity, and revalues portfolio metrics")
    public ResponseEntity<StressResult> runManualStress(@RequestBody ManualStressRequest request) {
        String inputHeadline = request.getHeadline();
        if (inputHeadline == null || inputHeadline.isBlank()) {
            inputHeadline = request.getText();
        }

        EventType eventType = request.getEventType();
        int impact = request.getImpactScore();
        String signalId = null;

        // If headline or text is provided, use AI to classify taxonomy and predict severity
        if (inputHeadline != null && !inputHeadline.isBlank()) {
            RiskSignal signal = signalService.processManualScenario(inputHeadline);
            if (signal != null) {
                if (eventType == null) {
                    eventType = signal.getEventType();
                }
                if (impact <= 0) {
                    impact = signal.getImpactScore() != null ? signal.getImpactScore() : 8;
                }
                signalId = signal.getSignalId();
                inputHeadline = signal.getHeadline();
                log.info("AI predicted manual scenario: eventType=[{}], severity=[{}/10], headline='{}'",
                        eventType, impact, inputHeadline);
            }
        }

        if (eventType == null) {
            eventType = EventType.GEOPOLITICAL;
        }
        if (impact <= 0) {
            impact = 8;
        }
        if (inputHeadline == null || inputHeadline.isBlank()) {
            inputHeadline = "Manual Scenario Injection (" + eventType + ")";
        }

        StressResult result = stressService.runStressTest(eventType, impact, signalId, inputHeadline);
        return ResponseEntity.ok(result);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Server-Sent Events (SSE) stream for stress test completions")
    public SseEmitter streamStressResults() {
        return stressPublisher.subscribe();
    }

    @Data
    public static class ManualStressRequest {
        private EventType eventType;
        private int impactScore;
        private String headline;
        private String text;
    }
}
