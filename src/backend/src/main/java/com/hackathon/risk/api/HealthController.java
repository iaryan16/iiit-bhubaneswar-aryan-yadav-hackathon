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

    @org.springframework.beans.factory.annotation.Value("${app.nlp.service-url:http://localhost:8000}")
    private String nlpServiceUrl;

    @GetMapping("/health")
    @Operation(summary = "Check backend and sidecar service health")
    public ResponseEntity<Map<String, Object>> health() {
        String nlpStatus = "STANDALONE_FALLBACK_READY";
        try {
            var client = java.net.http.HttpClient.newBuilder()
                    .version(java.net.http.HttpClient.Version.HTTP_1_1)
                    .connectTimeout(java.time.Duration.ofMillis(1500))
                    .build();
            var req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(nlpServiceUrl + "/health"))
                    .timeout(java.time.Duration.ofMillis(2000))
                    .GET()
                    .build();
            var res = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 200 && res.body().contains("\"status\":\"UP\"")) {
                nlpStatus = "CONNECTED";
            }
        } catch (Exception ignored) {
            nlpStatus = "OFFLINE_FALLBACK_ACTIVE";
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
