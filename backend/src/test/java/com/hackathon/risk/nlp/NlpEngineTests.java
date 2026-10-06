package com.hackathon.risk.nlp;

import com.hackathon.risk.ingest.CsvReplayIngestor;
import com.hackathon.risk.ingest.GdeltIngestor;
import com.hackathon.risk.ingest.RawDoc;
import com.hackathon.risk.signal.EventType;
import com.hackathon.risk.signal.RiskSignal;
import com.hackathon.risk.signal.RiskSignalRepository;
import com.hackathon.risk.signal.SignalService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class NlpEngineTests {

    @Autowired
    private FallbackAnalyzer fallbackAnalyzer;

    @Autowired
    private ImpactScorer impactScorer;

    @Autowired
    private NlpClient nlpClient;

    @Autowired
    private CsvReplayIngestor csvReplayIngestor;

    @Autowired
    private GdeltIngestor gdeltIngestor;

    @Autowired
    private SignalService signalService;

    @Autowired
    private RiskSignalRepository signalRepository;

    private static final List<LabeledSample> LABELED_SAMPLES = List.of(
            // Geopolitical
            new LabeledSample("Russia intensifies military strikes as Western allies impose new sanctions", EventType.GEOPOLITICAL, -1),
            new LabeledSample("NATO troops mobilize along eastern border amid escalation fears", EventType.GEOPOLITICAL, -1),
            new LabeledSample("Taiwan reports heightened naval activity and missile drills in strait", EventType.GEOPOLITICAL, -1),
            new LabeledSample("Iran threatens naval blockade of Strait of Hormuz during war games", EventType.GEOPOLITICAL, -1),

            // Macroeconomic
            new LabeledSample("Federal Reserve signals aggressive rate hike as inflation surges", EventType.MACROECONOMIC, -1),
            new LabeledSample("ECB raises interest rates by 50 basis points to combat price pressures", EventType.MACROECONOMIC, -1),
            new LabeledSample("US GDP contracts for second consecutive quarter entering recession", EventType.MACROECONOMIC, -1),
            new LabeledSample("Treasury yields spike as central bank tightens monetary policy", EventType.MACROECONOMIC, -1),

            // Credit Event
            new LabeledSample("Evergrande officially defaults on offshore dollar bonds following restructuring collapse", EventType.CREDIT_EVENT, -1),
            new LabeledSample("Fitch downgrades sovereign credit rating to junk bond status amid default fears", EventType.CREDIT_EVENT, -1),
            new LabeledSample("Retail giant files for Chapter 11 bankruptcy after missed debt payments", EventType.CREDIT_EVENT, -1),
            new LabeledSample("Regional bank collapses into receivership amid liquidity insolvency", EventType.CREDIT_EVENT, -1),

            // M&A
            new LabeledSample("Tech conglomerate announces $40 billion acquisition of semiconductor rival", EventType.MERGER_ACQUISITION, 1),
            new LabeledSample("Global pharmaceutical firm merges with biotech pioneer in all-stock deal", EventType.MERGER_ACQUISITION, 1),
            new LabeledSample("Private equity consortium completes buyout of enterprise cloud provider", EventType.MERGER_ACQUISITION, 1),

            // Product Launch
            new LabeledSample("Apple unveils flagship next-gen AI smartphone in worldwide launch", EventType.PRODUCT_LAUNCH, 1),
            new LabeledSample("EV manufacturer announces commercial availability of solid-state battery debut", EventType.PRODUCT_LAUNCH, 1),

            // Regulatory
            new LabeledSample("DOJ and FTC file antitrust lawsuit seeking breakup of search monopoly", EventType.REGULATORY, -1),
            new LabeledSample("European Commission penalizes social media company with $1.2B GDPR fine", EventType.REGULATORY, -1),

            // Natural Disaster / Operational
            new LabeledSample("Catastrophic hurricane causes refinery shutdown and widespread pipeline leaks", EventType.NATURAL_DISASTER_OPERATIONAL, -1)
    );

    record LabeledSample(String text, EventType expectedType, int expectedSentimentSign) {}

    @Test
    @DisplayName("Verify sentiment sign on clear positive and negative financial headlines")
    void testSentimentSignOnClearHeadlines() {
        NlpAnalysisResult positive = fallbackAnalyzer.analyze("Company announces record profit growth and all-time high earnings rally");
        assertTrue(positive.getSentiment() > 0, "Positive headline should have positive sentiment score");

        NlpAnalysisResult negative = fallbackAnalyzer.analyze("Market crash worsens as major bank faces bankruptcy and default crisis");
        assertTrue(negative.getSentiment() < 0, "Negative headline should have negative sentiment score");
    }

    @Test
    @DisplayName("Verify classification accuracy is at least 70% across 20 labeled headlines")
    void testClassificationAccuracyBenchmark() {
        int correct = 0;
        int total = LABELED_SAMPLES.size();

        for (LabeledSample sample : LABELED_SAMPLES) {
            NlpAnalysisResult result = fallbackAnalyzer.analyze(sample.text());
            if (result.getEventType() == sample.expectedType()) {
                correct++;
            }
            if (sample.expectedSentimentSign() < 0) {
                assertTrue(result.getSentiment() <= 0, "Expected non-positive sentiment for: " + sample.text());
            } else if (sample.expectedSentimentSign() > 0) {
                assertTrue(result.getSentiment() >= 0, "Expected non-negative sentiment for: " + sample.text());
            }
        }

        double accuracy = (double) correct / total;
        System.out.printf("Java Fallback Classification Accuracy: %.1f%% (%d/%d)%n", accuracy * 100, correct, total);
        assertTrue(accuracy >= 0.70, "Accuracy must be at least 70%, was: " + (accuracy * 100) + "%");
    }

    @Test
    @DisplayName("Verify impact scorer bounds clamp strictly between 1 and 10 with non-empty rationale")
    void testImpactScorerBoundsAndRationale() {
        // Extreme negative scenario
        ImpactScorer.ImpactAssessment extremeHigh = impactScorer.score(
                "Catastrophic war, sanctions, and default crisis",
                EventType.CREDIT_EVENT,
                -1.0,
                List.of("JPMorgan", "United States"),
                10
        );
        assertTrue(extremeHigh.getImpactScore() <= 10, "Impact must not exceed 10");
        assertTrue(extremeHigh.getImpactScore() >= 8, "Extreme event should yield high impact");
        assertFalse(extremeHigh.getRationale().isEmpty(), "Rationale list must not be empty");

        // Mild scenario
        ImpactScorer.ImpactAssessment mild = impactScorer.score(
                "Company launches minor software update",
                EventType.PRODUCT_LAUNCH,
                0.1,
                List.of(),
                0
        );
        assertTrue(mild.getImpactScore() >= 1, "Impact must not be less than 1");
        assertTrue(mild.getImpactScore() <= 4, "Mild event should yield modest impact");
    }

    @Test
    @DisplayName("Verify sidecar down fallback gracefully returns valid analysis")
    void testSidecarDownFallback() {
        NlpAnalysisResult result = nlpClient.analyze("Russian military conflict triggers immediate global sanctions");
        assertNotNull(result);
        assertEquals(EventType.GEOPOLITICAL, result.getEventType());
        assertNotNull(result.getEngineUsed());
        assertTrue(result.getEventConfidence() >= 0.5);
    }

    @Test
    @DisplayName("Verify two sources ingest and save signals with sentimentScore, eventType, and impactScore")
    void testTwoSourcesIngestAndPersistSignals() {
        // Source 1: CSV Replay
        List<RawDoc> tweetDocs = csvReplayIngestor.fetch();
        assertFalse(tweetDocs.isEmpty(), "CSV Replay must return docs");

        // Source 2: GDELT
        List<RawDoc> gdeltDocs = gdeltIngestor.fetch();
        assertFalse(gdeltDocs.isEmpty(), "GDELT must return docs or bundled fallback");

        // Process a document through signalService
        RiskSignal signal = signalService.processDoc(tweetDocs.get(0));
        assertNotNull(signal, "Processed signal must not be null");
        assertNotNull(signal.getSentimentScore(), "Required field: sentimentScore must not be null");
        assertNotNull(signal.getEventType(), "Required field: eventType must not be null");
        assertNotNull(signal.getImpactScore(), "Required field: impactScore must not be null");
        assertTrue(signal.getImpactScore() >= 1 && signal.getImpactScore() <= 10, "Impact must be 1..10");

        // Verify retrieval from DB
        RiskSignal found = signalRepository.findById(signal.getSignalId()).orElse(null);
        assertNotNull(found, "Saved signal must exist in DB");
        assertEquals(signal.getHeadline(), found.getHeadline());
    }
}
