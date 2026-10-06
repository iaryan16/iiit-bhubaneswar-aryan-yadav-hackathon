package com.hackathon.risk.nlp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackathon.risk.signal.EventType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class NlpClient {

    private final WebClient nlpWebClient;
    private final FallbackAnalyzer fallbackAnalyzer;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NlpAnalysisResult analyze(String text) {
        if (text == null || text.isBlank()) {
            return fallbackAnalyzer.analyze(text);
        }

        try {
            String jsonResponse = nlpWebClient.post()
                    .uri("/analyze")
                    .bodyValue(Map.of("text", text))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(3000))
                    .retry(1)
                    .block();

            if (jsonResponse != null) {
                JsonNode root = objectMapper.readTree(jsonResponse);
                double sentiment = root.path("sentiment").asDouble(0.0);
                String eventTypeStr = root.path("eventType").asText("OTHER");
                double confidence = root.path("eventConfidence").asDouble(0.5);

                List<String> entities = new ArrayList<>();
                JsonNode entitiesNode = root.path("entities");
                if (entitiesNode.isArray()) {
                    for (JsonNode n : entitiesNode) {
                        entities.add(n.asText());
                    }
                }

                EventType eventType;
                try {
                    eventType = EventType.valueOf(eventTypeStr.toUpperCase());
                } catch (Exception e) {
                    eventType = EventType.OTHER;
                }

                return NlpAnalysisResult.builder()
                        .text(text)
                        .sentiment(sentiment)
                        .eventType(eventType)
                        .eventConfidence(confidence)
                        .entities(entities)
                        .engineUsed("PYTHON_FASTAPI_SIDECAR")
                        .build();
            }
        } catch (Exception ex) {
            log.debug("NLP sidecar call failed ({}), activating Java FallbackAnalyzer", ex.getMessage());
        }

        return fallbackAnalyzer.analyze(text);
    }
}
