package com.hackathon.risk.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.util.Map;

@RestController
@Tag(name = "Health", description = "System and service connectivity health checks")
public class HealthController {

    @Autowired(required = false)
    private WebClient nlpWebClient;

    @GetMapping("/health")
    @Operation(summary = "Check backend and sidecar service health")
    public ResponseEntity<Map<String, Object>> health() {
        String nlpStatus = "STANDALONE_FALLBACK_READY";
        if (nlpWebClient != null) {
            try {
                Map<?, ?> response = nlpWebClient.get()
                        .uri("/health")
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block(java.time.Duration.ofMillis(800));
                if (response != null && "UP".equalsIgnoreCase(String.valueOf(response.get("status")))) {
                    nlpStatus = "CONNECTED";
                }
            } catch (Exception ignored) {
                nlpStatus = "OFFLINE_FALLBACK_ACTIVE";
            }
        }

        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "risk-stress-engine",
                "version", "1.0.0",
                "nlpSidecar", nlpStatus,
                "timestamp", Instant.now().toString()
        ));
    }
}
