package com.hackathon.risk.api;

import com.hackathon.risk.stress.TriggerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/config")
@Tag(name = "Configuration", description = "Dynamic runtime thresholds and trigger parameters")
@RequiredArgsConstructor
public class ConfigController {

    private final TriggerService triggerService;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThresholdConfigDto {
        private int impactThreshold;
        private double confidenceThreshold;
        private int debounceMinutes;
    }

    @GetMapping("/threshold")
    @Operation(summary = "Get current trigger threshold parameters")
    public ResponseEntity<ThresholdConfigDto> getThreshold() {
        return ResponseEntity.ok(ThresholdConfigDto.builder()
                .impactThreshold(triggerService.getImpactThreshold())
                .confidenceThreshold(triggerService.getConfidenceThreshold())
                .debounceMinutes(triggerService.getDebounceMinutes())
                .build());
    }

    @PutMapping("/threshold")
    @Operation(summary = "Update trigger threshold parameters dynamically at runtime")
    public ResponseEntity<ThresholdConfigDto> updateThreshold(@RequestBody ThresholdConfigDto config) {
        if (config.getImpactThreshold() > 0) {
            triggerService.setImpactThreshold(config.getImpactThreshold());
        }
        if (config.getConfidenceThreshold() >= 0.0 && config.getConfidenceThreshold() <= 1.0) {
            triggerService.setConfidenceThreshold(config.getConfidenceThreshold());
        }
        if (config.getDebounceMinutes() >= 0) {
            triggerService.setDebounceMinutes(config.getDebounceMinutes());
        }

        return ResponseEntity.ok(ThresholdConfigDto.builder()
                .impactThreshold(triggerService.getImpactThreshold())
                .confidenceThreshold(triggerService.getConfidenceThreshold())
                .debounceMinutes(triggerService.getDebounceMinutes())
                .build());
    }
}
