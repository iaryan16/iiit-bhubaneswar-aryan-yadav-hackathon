package com.hackathon.risk.api;

import com.hackathon.risk.signal.EventType;
import com.hackathon.risk.stress.StressPublisher;
import com.hackathon.risk.stress.StressService;
import com.hackathon.risk.stress.model.StressResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/stress")
@Tag(name = "Stress Testing", description = "Execute stress test revaluations, view run history, and stream results")
@RequiredArgsConstructor
public class StressController {

    private final StressService stressService;
    private final StressPublisher stressPublisher;

    @GetMapping("/results")
    @Operation(summary = "Get historical stress testing runs")
    public ResponseEntity<List<StressResult>> getResults() {
        return ResponseEntity.ok(stressService.getHistory());
    }

    @PostMapping("/run")
    @Operation(summary = "Manually trigger or replay a scenario with custom event type and impact score")
    public ResponseEntity<StressResult> runManualStress(@RequestBody ManualStressRequest request) {
        EventType eventType = request.getEventType() != null ? request.getEventType() : EventType.GEOPOLITICAL;
        int impact = request.getImpactScore() > 0 ? request.getImpactScore() : 8;
        String headline = request.getHeadline() != null ? request.getHeadline() : "Manual Scenario Injection (" + eventType + ")";

        StressResult result = stressService.runStressTest(eventType, impact, null, headline);
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
    }
}
