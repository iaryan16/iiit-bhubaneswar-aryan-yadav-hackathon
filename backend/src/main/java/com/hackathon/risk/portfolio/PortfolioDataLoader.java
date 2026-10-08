package com.hackathon.risk.portfolio;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class PortfolioDataLoader implements CommandLineRunner {

    private final PositionRepository positionRepository;

    private static final String CSV_PATH = "data/portfolio.csv";

    @Override
    public void run(String... args) {
        if (positionRepository.count() >= 100) {
            log.info("Portfolio already populated with {} positions", positionRepository.count());
            return;
        }

        if (positionRepository.count() > 0) {
            log.info("Resetting partial portfolio of {} positions to load full dataset", positionRepository.count());
            positionRepository.deleteAll();
        }

        File file = new File(CSV_PATH);
        if (!file.exists()) {
            file = new File("../data/portfolio.csv");
        }

        try {
            Reader reader = null;
            if (file.exists()) {
                reader = new FileReader(file, StandardCharsets.UTF_8);
            } else {
                var is = getClass().getResourceAsStream("/data/portfolio.csv");
                if (is != null) {
                    reader = new java.io.InputStreamReader(is, StandardCharsets.UTF_8);
                }
            }

            if (reader == null) {
                log.warn("Portfolio CSV not found, generating fallback in-memory positions");
                generateInMemoryPositions();
                return;
            }

            List<Position> positions = new ArrayList<>();
            try (CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {
                for (CSVRecord record : parser) {
                    Position pos = Position.builder()
                            .positionId(record.get("positionId"))
                            .assetClass(record.get("assetClass"))
                            .counterparty(record.get("counterparty"))
                            .sector(record.get("sector"))
                            .region(record.get("region"))
                            .currency(record.get("currency"))
                            .notional(parseDouble(record.get("notional")))
                            .marketValue(parseDouble(record.get("marketValue")))
                            .coupon(parseDouble(record.get("coupon")))
                            .modifiedDuration(parseDouble(record.get("modifiedDuration")))
                            .convexity(parseDouble(record.get("convexity")))
                            .rating(record.get("rating"))
                            .rateType(record.get("rateType"))
                            .pd(parseDouble(record.get("pd")))
                            .lgd(parseDouble(record.get("lgd")))
                            .dv01(parseDouble(record.get("dv01")))
                            .payReceive(record.get("payReceive"))
                            .currencyPair(record.get("currencyPair"))
                            .delta(parseDouble(record.get("delta")))
                            .ticker(record.get("ticker"))
                            .shares(parseDouble(record.get("shares")))
                            .price(parseDouble(record.get("price")))
                            .beta(parseDouble(record.get("beta")))
                            .build();
                    positions.add(pos);
                }
            }

            positionRepository.saveAll(positions);
            log.info("Successfully loaded {} portfolio positions into database. Total count: {}", positions.size(), positionRepository.count());
        } catch (Exception e) {
            log.error("Failed to load portfolio CSV: {}", e.getMessage());
            generateInMemoryPositions();
        }
    }

    private Double parseDouble(String str) {
        if (str == null || str.isBlank()) return null;
        try {
            return Double.parseDouble(str.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void generateInMemoryPositions() {
        List<Position> list = new ArrayList<>();
        list.add(Position.builder()
                .positionId("EQ-SAMPLE-1")
                .assetClass("EQUITY")
                .counterparty("Apple Inc.")
                .sector("Technology")
                .region("North America")
                .currency("USD")
                .notional(50_000_000.0)
                .marketValue(50_000_000.0)
                .ticker("AAPL")
                .shares(270_000.0)
                .price(185.0)
                .beta(1.15)
                .build());
        positionRepository.saveAll(list);
    }
}
