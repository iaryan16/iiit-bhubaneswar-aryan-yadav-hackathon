package com.hackathon.risk.ingest;

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
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class CsvReplayIngestor implements Ingestor {

    private static final String CSV_PATH = "data/raw_samples/sample_tweets.csv";
    private static final String FALLBACK_CSV = """
            id,timestamp,user,text,retweets
            1,2026-10-06T08:00:00Z,RiskDeskAlerts,"FLASH: Escalating military conflict in Eastern Europe triggers immediate sanctions from US and NATO allies. Energy markets spiking #oil #geopolitics",1420
            2,2026-10-06T08:45:00Z,MacroMonitor,"BREAKING: US Core CPI prints 5.4% YoY above expectations. Treasury yields spike 18bps as bond markets price in aggressive Fed rate hike",890
            3,2026-10-06T09:30:00Z,CreditDeskLive,"CRITICAL: Evergrande debt restructuring officially collapses. S&P downgrades debt to selective default, contagion fears hit property sector",2300
            4,2026-10-06T10:15:00Z,DealMakerWeekly,"M&A ALERT: Pfizer and biotech partner agree on $14B buyout to acquire breakthrough oncology platform",310
            5,2026-10-06T11:00:00Z,TechPulse,"Apple unveils next-generation M5 Neural Studio chips at developer summit with unprecedented AI compute density",5120
            6,2026-10-06T11:45:00Z,DisasterWatch,"Severe Category 5 hurricane disrupts Gulf of Mexico oil platforms; offshore drilling operations shut down indefinitely",1820
            7,2026-10-06T12:30:00Z,CyberAlerts,"Ransomware attack cripples regional power grid operations in northern district; authorities declare emergency blackout",940
            """;

    @Override
    public String getSourceType() {
        return "TWEET_CSV";
    }

    @Override
    public List<RawDoc> fetch() {
        List<RawDoc> docs = new ArrayList<>();
        File file = new File(CSV_PATH);
        if (!file.exists()) {
            file = new File("../data/raw_samples/sample_tweets.csv");
        }

        try (Reader reader = file.exists() ? new FileReader(file, StandardCharsets.UTF_8) : new StringReader(FALLBACK_CSV);
             CSVParser parser = new CSVParser(reader, CSVFormat.DEFAULT.builder().setHeader().setSkipHeaderRecord(true).build())) {

            for (CSVRecord record : parser) {
                String id = record.get("id");
                String timestampStr = record.get("timestamp");
                String user = record.get("user");
                String text = record.get("text");

                Instant timestamp;
                try {
                    timestamp = Instant.parse(timestampStr);
                } catch (Exception e) {
                    timestamp = Instant.now();
                }

                docs.add(RawDoc.builder()
                        .id("tweet-" + id)
                        .source(getSourceType())
                        .title(text)
                        .snippet("Tweet from @" + user)
                        .url("https://twitter.com/" + user + "/status/" + id)
                        .publishedAt(timestamp)
                        .build());
            }
        } catch (Exception e) {
            log.error("Failed to parse tweets CSV, returning empty list: {}", e.getMessage());
        }

        return docs;
    }
}
