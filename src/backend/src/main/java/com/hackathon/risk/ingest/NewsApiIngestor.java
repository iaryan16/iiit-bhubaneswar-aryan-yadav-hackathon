package com.hackathon.risk.ingest;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.File;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class NewsApiIngestor implements Ingestor {

    @Value("${NEWSAPI_KEY:}")
    private String apiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final WebClient webClient = WebClient.builder().build();

    @Override
    public String getSourceType() {
        return "NEWSAPI";
    }

    @Override
    public List<RawDoc> fetch() {
        if (apiKey != null && !apiKey.isBlank()) {
            try {
                String url = "https://newsapi.org/v2/top-headlines?category=business&language=en&apiKey=" + apiKey;
                String response = webClient.get()
                        .uri(url)
                        .retrieve()
                        .bodyToMono(String.class)
                        .timeout(Duration.ofSeconds(3))
                        .block();

                if (response != null) {
                    JsonNode root = objectMapper.readTree(response);
                    JsonNode articles = root.path("articles");
                    if (articles.isArray() && articles.size() > 0) {
                        List<RawDoc> docs = new ArrayList<>();
                        for (JsonNode art : articles) {
                            String title = art.path("title").asText("");
                            String description = art.path("description").asText("");
                            String articleUrl = art.path("url").asText("");
                            if (!title.isBlank()) {
                                docs.add(RawDoc.builder()
                                        .id("newsapi-" + Math.abs(title.hashCode()))
                                        .source(getSourceType())
                                        .title(title)
                                        .snippet(description)
                                        .url(articleUrl)
                                        .publishedAt(Instant.now())
                                        .build());
                            }
                        }
                        return docs;
                    }
                }
            } catch (Exception e) {
                log.warn("NewsAPI live call failed or timed out: {}. Using offline samples.", e.getMessage());
            }
        }

        return loadOfflineSamples();
    }

    private List<RawDoc> loadOfflineSamples() {
        List<RawDoc> docs = new ArrayList<>();
        File file = new File("data/raw_samples/sample_news.json");
        if (!file.exists()) {
            file = new File("../data/raw_samples/sample_news.json");
        }

        if (file.exists()) {
            try {
                List<Map<String, Object>> list = objectMapper.readValue(file, new TypeReference<>() {});
                for (Map<String, Object> item : list) {
                    String title = (String) item.get("title");
                    String snippet = (String) item.get("snippet");
                    String publishedAtStr = (String) item.get("publishedAt");
                    Instant pub = publishedAtStr != null ? Instant.parse(publishedAtStr) : Instant.now();

                    docs.add(RawDoc.builder()
                            .id("news-" + Math.abs(title.hashCode()))
                            .source(getSourceType())
                            .title(title)
                            .snippet(snippet)
                            .url("https://news.sample/article/" + Math.abs(title.hashCode()))
                            .publishedAt(pub)
                            .build());
                }
                return docs;
            } catch (Exception e) {
                log.error("Could not parse offline sample_news.json: {}", e.getMessage());
            }
        }

        // Hard-coded guaranteed fallback
        docs.add(RawDoc.builder()
                .id("news-fallback-1")
                .source(getSourceType())
                .title("Federal Reserve signals aggressive rate hike as inflation surges to 40-year high")
                .snippet("Central bank policymakers prepare benchmark policy shift.")
                .url("https://news.sample/fed-rate-hike")
                .publishedAt(Instant.now())
                .build());

        return docs;
    }
}
