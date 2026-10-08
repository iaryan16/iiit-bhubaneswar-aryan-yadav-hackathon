package com.hackathon.risk.signal;

import com.hackathon.risk.ingest.Ingestor;
import com.hackathon.risk.ingest.RawDoc;
import com.hackathon.risk.nlp.EntityMapper;
import com.hackathon.risk.nlp.ImpactScorer;
import com.hackathon.risk.nlp.NlpAnalysisResult;
import com.hackathon.risk.nlp.NlpClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class SignalService {

    private final List<Ingestor> ingestors;
    private final NlpClient nlpClient;
    private final ImpactScorer impactScorer;
    private final EntityMapper entityMapper;
    private final RiskSignalRepository signalRepository;
    private final SignalPublisher signalPublisher;
    private final ApplicationEventPublisher eventPublisher;

    private final Set<String> seenHeadlineHashes = ConcurrentHashMap.newKeySet();

    @Transactional
    public List<RiskSignal> runIngestion() {
        List<RiskSignal> processed = new ArrayList<>();
        for (Ingestor ingestor : ingestors) {
            try {
                List<RawDoc> docs = ingestor.fetch();
                for (RawDoc doc : docs) {
                    RiskSignal signal = processDoc(doc);
                    if (signal != null) {
                        processed.add(signal);
                    }
                }
            } catch (Exception e) {
                log.error("Ingestion failed for source {}: {}", ingestor.getSourceType(), e.getMessage());
            }
        }
        return processed;
    }

    @Transactional
    public RiskSignal processDoc(RawDoc doc) {
        if (doc == null || doc.getTitle() == null || doc.getTitle().isBlank()) {
            return null;
        }

        // 1. Text cleaning and normalized dedup hash
        String cleanTitle = cleanText(doc.getTitle());
        if (!isEnglish(cleanTitle)) {
            log.debug("Skipping non-English headline: {}", cleanTitle);
            return null;
        }

        String hash = computeHash(cleanTitle);
        if (!seenHeadlineHashes.add(hash)) {
            log.debug("Duplicate headline detected and skipped: {}", cleanTitle);
            return null;
        }

        // 2. NLP Analysis (sidecar with Java fallback)
        NlpAnalysisResult nlpResult = nlpClient.analyze(cleanTitle);

        // 3. Entity Resolution
        EntityMapper.EntityResolution resolution = entityMapper.resolve(nlpResult.getEntities());

        // 4. Velocity check (count in last 30 minutes)
        Instant windowStart = Instant.now().minusSeconds(1800);
        long recentCount = signalRepository.countByEventTypeAndTimestampAfter(nlpResult.getEventType(), windowStart);

        // 5. Impact Scoring
        ImpactScorer.ImpactAssessment impact = impactScorer.score(
                cleanTitle,
                nlpResult.getEventType(),
                nlpResult.getSentiment(),
                nlpResult.getEntities(),
                (int) recentCount
        );

        // 6. Build and persist RiskSignal
        RiskSignal signal = RiskSignal.builder()
                .signalId(UUID.randomUUID().toString())
                .timestamp(doc.getPublishedAt() != null ? doc.getPublishedAt() : Instant.now())
                .source(doc.getSource() != null ? doc.getSource() : "UNKNOWN")
                .headline(cleanTitle)
                .snippet(doc.getSnippet() != null ? doc.getSnippet() : cleanTitle)
                .sentimentScore(nlpResult.getSentiment())
                .eventType(nlpResult.getEventType())
                .eventConfidence(nlpResult.getEventConfidence())
                .impactScore(impact.getImpactScore())
                .region(resolution.getRegion())
                .sector(resolution.getSector())
                .build();

        signal.setEntities(nlpResult.getEntities());
        signal.setTickers(resolution.getTickers());
        signal.setImpactRationale(impact.getRationale());

        RiskSignal saved = signalRepository.save(signal);
        log.info("Saved RiskSignal: [{}] {} (Impact: {})", saved.getEventType(), saved.getHeadline(), saved.getImpactScore());

        // 7. Publish to live SSE stream
        signalPublisher.publish(saved);

        // 8. Publish internal Spring event for Stress TriggerService
        eventPublisher.publishEvent(saved);

        return saved;
    }

    public RiskSignal processRawText(String text, String source) {
        return processManualScenario(text);
    }

    @Transactional
    public RiskSignal processManualScenario(String headline) {
        if (headline == null || headline.isBlank()) {
            return null;
        }

        String cleanTitle = cleanText(headline);
        // Do not block duplicate for manual injection
        seenHeadlineHashes.add(computeHash(cleanTitle));

        // 1. NLP Analysis (sidecar with Java fallback)
        NlpAnalysisResult nlpResult = nlpClient.analyze(cleanTitle);

        // 2. Entity Resolution
        EntityMapper.EntityResolution resolution = entityMapper.resolve(nlpResult.getEntities());

        // 3. Velocity check
        Instant windowStart = Instant.now().minusSeconds(1800);
        long recentCount = signalRepository.countByEventTypeAndTimestampAfter(nlpResult.getEventType(), windowStart);

        // 4. Impact Scoring (AI predicted severity 1-10)
        ImpactScorer.ImpactAssessment impact = impactScorer.score(
                cleanTitle,
                nlpResult.getEventType(),
                nlpResult.getSentiment(),
                nlpResult.getEntities(),
                (int) recentCount
        );

        // 5. Build RiskSignal
        RiskSignal signal = RiskSignal.builder()
                .signalId(UUID.randomUUID().toString())
                .timestamp(Instant.now())
                .source("MANUAL_INJECTION")
                .headline(cleanTitle)
                .snippet(cleanTitle)
                .sentimentScore(nlpResult.getSentiment())
                .eventType(nlpResult.getEventType())
                .eventConfidence(nlpResult.getEventConfidence())
                .impactScore(impact.getImpactScore())
                .region(resolution.getRegion())
                .sector(resolution.getSector())
                .build();

        signal.setEntities(nlpResult.getEntities());
        signal.setTickers(resolution.getTickers());
        signal.setImpactRationale(impact.getRationale());

        RiskSignal saved = signalRepository.save(signal);
        log.info("Saved Manually Injected RiskSignal: [{}] {} (AI Predicted Impact: {})",
                saved.getEventType(), saved.getHeadline(), saved.getImpactScore());

        // 6. Broadcast to SSE stream for live feed
        signalPublisher.publish(saved);

        return saved;
    }

    public List<RiskSignal> findSignals(Integer minImpact, Instant since) {
        int impactFilter = (minImpact != null) ? minImpact : 1;
        Instant sinceFilter = (since != null) ? since : Instant.EPOCH;
        return signalRepository.findFiltered(impactFilter, sinceFilter);
    }

    private String cleanText(String text) {
        return text.replaceAll("[\\r\\n]+", " ")
                .replaceAll("\\s{2,}", " ")
                .trim();
    }

    private boolean isEnglish(String text) {
        // Simple printable ASCII and common Latin punctuation check
        int asciiCount = 0;
        for (char c : text.toCharArray()) {
            if (c < 128) {
                asciiCount++;
            }
        }
        return ((double) asciiCount / Math.max(1, text.length())) > 0.80;
    }

    private String computeHash(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(text.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return String.valueOf(text.toLowerCase(Locale.ROOT).hashCode());
        }
    }
}
