package com.hackathon.risk.api;

import com.hackathon.risk.api.dto.RiskSignalDto;
import com.hackathon.risk.signal.RiskSignal;
import com.hackathon.risk.signal.SignalPublisher;
import com.hackathon.risk.signal.SignalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@Tag(name = "Signals", description = "Risk signal ingestion, on-demand NLP analysis, and real-time streaming")
@RequiredArgsConstructor
public class SignalController {

    private final SignalService signalService;
    private final SignalPublisher signalPublisher;

    @GetMapping("/signals")
    @Operation(summary = "Query ingested risk signals with optional minImpact and timestamp filtering")
    public ResponseEntity<List<RiskSignalDto>> getSignals(
            @RequestParam(required = false) Integer minImpact,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant since
    ) {
        List<RiskSignal> signals = signalService.findSignals(minImpact, since);
        List<RiskSignalDto> dtos = signals.stream()
                .map(RiskSignalDto::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping(value = "/signals/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Server-Sent Events (SSE) stream for real-time incoming risk signals")
    public SseEmitter streamSignals() {
        return signalPublisher.subscribe();
    }

    @PostMapping("/analyze")
    @Operation(summary = "Analyze raw headline text on demand and score financial impact")
    public ResponseEntity<RiskSignalDto> analyzeText(@RequestBody AnalyzeRequest request) {
        RiskSignal signal = signalService.processRawText(request.getText(), request.getSource());
        return ResponseEntity.ok(RiskSignalDto.fromEntity(signal));
    }

    @PostMapping({"/ingest/run", "/signals/replay"})
    @Operation(summary = "Manually trigger multi-source ingestion poll / signal stream replay")
    public ResponseEntity<Map<String, Object>> triggerIngestion() {
        List<RiskSignal> processed = signalService.replayStream();
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "processedCount", processed.size(),
                "timestamp", Instant.now().toString()
        ));
    }

    @PostMapping("/signals/reset")
    @Operation(summary = "Reset signals database to default baseline stream")
    public ResponseEntity<Map<String, Object>> resetSignals() {
        int count = signalService.resetSignals();
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "processedCount", count,
                "message", "Signals reset to baseline stream",
                "timestamp", Instant.now().toString()
        ));
    }


    @Data
    public static class AnalyzeRequest {
        private String text;
        private String source = "MANUAL";
    }
}
