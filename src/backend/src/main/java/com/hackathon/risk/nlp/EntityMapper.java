package com.hackathon.risk.nlp;

import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileReader;
import java.io.Reader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Slf4j
@Component
public class EntityMapper {

    private static final String CSV_PATH = "data/entity_map.csv";

    private final Map<String, EntityInfo> entityLookup = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EntityInfo {
        private String type;
        private String entity;
        private String ticker;
        private String sector;
        private String region;
    }

    @PostConstruct
    public void init() {
        loadMappings();
    }

    public synchronized void loadMappings() {
        entityLookup.clear();
        File file = new File(CSV_PATH);
        if (!file.exists()) {
            file = new File("../data/entity_map.csv");
        }

        Reader reader = null;
        try {
            if (file.exists()) {
                reader = new FileReader(file, StandardCharsets.UTF_8);
            } else {
                reader = new StringReader(getDefaultCsvData());
            }

            try (CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {
                for (CSVRecord record : parser) {
                    EntityInfo info = EntityInfo.builder()
                            .type(record.get("type"))
                            .entity(record.get("entity"))
                            .ticker(record.get("ticker"))
                            .sector(record.get("sector"))
                            .region(record.get("region"))
                            .build();
                    entityLookup.put(info.getEntity(), info);
                }
            }
            log.info("EntityMapper loaded {} entity mappings", entityLookup.size());
        } catch (Exception e) {
            log.error("Failed to load entity_map.csv: {}", e.getMessage());
        }
    }

    public EntityInfo lookup(String entityName) {
        if (entityName == null) return null;
        return entityLookup.get(entityName.trim());
    }

    public EntityResolution resolve(List<String> entities) {
        Set<String> tickers = new LinkedHashSet<>();
        String detectedSector = "General";
        String detectedRegion = "Global";

        if (entities != null) {
            for (String entity : entities) {
                EntityInfo info = lookup(entity);
                if (info != null) {
                    if (info.getTicker() != null && !info.getTicker().isBlank()) {
                        tickers.add(info.getTicker());
                    }
                    if (info.getSector() != null && !info.getSector().isBlank() && "General".equals(detectedSector)) {
                        detectedSector = info.getSector();
                    }
                    if (info.getRegion() != null && !info.getRegion().isBlank() && "Global".equals(detectedRegion)) {
                        detectedRegion = info.getRegion();
                    }
                }
            }
        }

        return new EntityResolution(new ArrayList<>(tickers), detectedSector, detectedRegion);
    }

    @Data
    @AllArgsConstructor
    public static class EntityResolution {
        private List<String> tickers;
        private String sector;
        private String region;
    }

    private String getDefaultCsvData() {
        return """
                type,entity,ticker,sector,region
                COMPANY,Apple,AAPL,Technology,North America
                COMPANY,Microsoft,MSFT,Technology,North America
                COMPANY,Tesla,TSLA,Consumer Discretionary,North America
                COMPANY,JPMorgan,JPM,Financials,North America
                COMPANY,Goldman Sachs,GS,Financials,North America
                COMPANY,ExxonMobil,XOM,Energy,North America
                COMPANY,Shell,SHEL,Energy,Europe
                COUNTRY,United States,SPY,Sovereign,North America
                COUNTRY,Russia,RSX,Sovereign,Emerging Markets
                COUNTRY,China,FXI,Sovereign,Asia
                """;
    }
}
