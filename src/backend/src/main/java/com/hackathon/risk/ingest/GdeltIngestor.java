package com.hackathon.risk.ingest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class GdeltIngestor implements Ingestor {

    @Value("${app.ingestion.gdelt-enabled:true}")
    private boolean enabled;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    private static final String GDELT_API_URL = "https://api.gdeltproject.org/api/v2/doc/doc?query=finance%20OR%20market%20OR%20sanctions%20OR%20rates&mode=artlist&maxrecords=10&format=json";

    public GdeltIngestor() {
        this.webClient = WebClient.builder()
                .codecs(config -> config.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public String getSourceType() {
        return "GDELT";
    }

    @Scheduled(cron = "${app.ingestion.schedule-cron:0 */15 * * * *}")
    public void scheduledRun() {
        if (!enabled) return;
        log.info("Scheduled GDELT poll executing...");
        List<RawDoc> docs = fetch();
        log.info("GDELT ingested {} articles", docs.size());
    }

    @Override
    public List<RawDoc> fetch() {
        if (!enabled) return List.of();

        List<RawDoc> docs = new ArrayList<>();
        try {
            String response = webClient.get()
                    .uri(GDELT_API_URL)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(3))
                    .block();

            if (response != null) {
                JsonNode root = objectMapper.readTree(response);
                JsonNode articles = root.path("articles");
                if (articles.isArray()) {
                    for (JsonNode art : articles) {
                        String title = art.path("title").asText("");
                        String url = art.path("url").asText("");
                        if (!title.isBlank()) {
                            docs.add(RawDoc.builder()
                                    .id("gdelt-" + Math.abs(title.hashCode()))
                                    .source(getSourceType())
                                    .title(title)
                                    .snippet("GDELT article: " + url)
                                    .url(url)
                                    .publishedAt(Instant.now())
                                    .build());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("GDELT network request timed out or unavailable, using offline bundled sample: {}", e.getMessage());
            docs = getBundledFallback();
        }

        return docs.isEmpty() ? getBundledFallback() : docs;
    }

    public List<RawDoc> getBundledFallback() {
        return List.of(
                RawDoc.builder()
                        .id("gdelt-sample-1")
                        .source(getSourceType())
                        .title("Strait of Hormuz blockade threatened as regional powers trade drone and missile strikes")
                        .snippet("Maritime security agencies issue highest alert for Gulf shipping lanes.")
                        .url("https://gdeltproject.org/sample/1")
                        .publishedAt(Instant.now().minusSeconds(1800))
                        .build(),
                RawDoc.builder()
                        .id("gdelt-sample-2")
                        .source(getSourceType())
                        .title("ECB announces emergency liquidity facility as European sovereign bond yields diverge")
                        .snippet("Central bank governors convene unscheduled monetary policy symposium.")
                        .url("https://gdeltproject.org/sample/2")
                        .publishedAt(Instant.now().minusSeconds(3600))
                        .build()
        );
    }
}
