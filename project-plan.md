Tech stack
Layer	Choice
Backend	Java 17, Spring Boot 3.x, Maven
Spring modules	Web, WebFlux WebClient, Data JPA, Validation, Scheduling, WebSocket or SSE
Database	H2 for demo (or PostgreSQL via Docker), Flyway migrations
NLP service	Python 3.11, FastAPI, Transformers (ProsusAI/finbert, bart-large-mnli), spaCy
Frontend	React 18 + Vite + TypeScript
UI libraries	Recharts (or ECharts), TanStack Query, Tailwind, shadcn/ui
Data and parsing	Jackson, OpenCSV or Apache Commons CSV, Jsoup if needed
Testing	JUnit 5, Mockito, Testcontainers (optional), Vitest
Packaging	Docker Compose (backend, nlp, frontend)
Docs	springdoc-openapi (Swagger UI), which is useful for the jury
Architecture
GDELT / NewsAPI / Tweet CSV
        |
Spring Boot: Ingestion (scheduled, dedup, clean)
        |  HTTP
Python NLP service (sentiment, event class, entities)   <- fallback: Java rules scorer
        |
Spring Boot: Impact scoring (Java heuristic) -> RiskSignal -> DB
        |
Trigger service (threshold, debounce) -> Stress engine -> StressResult -> DB
        |  REST + SSE
React dashboard

Impact scoring stays in Java. It is a transparent heuristic, so it is easy to explain and unit test.

Repo structure
<college>-<name>-hackathon/
├── README.md, LICENSE, docker-compose.yml, .env.example
├── backend/                         # Spring Boot
│   ├── pom.xml
│   └── src/main/java/com/hackathon/risk/
│       ├── config/                  # WebClient, CORS, scheduling, OpenAPI
│       ├── ingest/                  # Ingestor interface, GdeltIngestor, NewsApiIngestor, CsvReplayIngestor
│       ├── nlp/                     # NlpClient (calls sidecar), FallbackAnalyzer, ImpactScorer, EntityMapper
│       ├── signal/                  # RiskSignal entity, repository, controller, SSE publisher
│       ├── portfolio/               # Position entity, PortfolioService, loader/generator
│       ├── stress/                  # ScenarioConfig, shock models, Revaluators, TriggerService, StressService
│       └── api/                     # DTOs, controllers, exception handling
│   └── src/main/resources/          # application.yml, scenarios.yml, db/migration
├── nlp-service/                     # Python sidecar
│   ├── app.py, requirements.txt, Dockerfile
├── frontend/                        # React + Vite
│   └── src/ components/, pages/, api/, hooks/
├── data/                            # raw_samples/, portfolio.csv, entity_map.csv
├── scripts/                         # generate_portfolio.py (or Java CommandLineRunner)
└── docs/                            # presentation.pdf, architecture.png, PROGRESS.md
Phase 0: Agent rules (paste into Antigravity)
PROJECT: S&P Global & Crisil Hackathon 2026, Module B (Stress Testing). Solo.
STACK: Spring Boot 3 (Java 17, Maven) backend; React+Vite+TS frontend;
       Python FastAPI NLP sidecar (FinBERT, BART zero-shot, spaCy).
RULES
- Public/synthetic data only. Seed randomness (42).
- Must run offline from /data samples if APIs or keys are missing.
- If NLP sidecar is down, backend falls back to Java rules-based analyzer.
- Incremental commits after each phase; tests pass before moving on.
- Append a short note to docs/PROGRESS.md at the end of each phase.
- No secrets committed. Keep README quickstart commands exact and tested.
Phase 1: Contracts and scaffolding
Generate the Spring Boot project (Web, WebFlux, JPA, H2, Validation, Flyway, Lombok, springdoc) and the Vite React TS app.
Define the RiskSignal contract, shared as an OpenAPI spec:
json
{
  "signalId": "uuid", "timestamp": "ISO8601", "source": "GDELT|NEWSAPI|TWEET_CSV",
  "headline": "", "snippet": "", "entities": [], "tickers": [], "region": "", "sector": "",
  "sentimentScore": -0.72, "eventType": "GEOPOLITICAL", "eventConfidence": 0.81,
  "impactScore": 8, "impactRationale": ["base=6", "sentiment=+1.4", "kw:sanctions=+1"]
}
Define the event enum: GEOPOLITICAL, MACROECONOMIC, CREDIT_EVENT, MERGER_ACQUISITION, PRODUCT_LAUNCH, REGULATORY, NATURAL_DISASTER_OPERATIONAL, OTHER.
Set up docker-compose.yml with the three services and CORS for the frontend.

Acceptance: mvn test passes, the Swagger UI loads, and the React app calls /health.

Phase 2: NLP Risk Engine

NLP sidecar (Python)

POST /analyze with {text} returns {sentiment, eventType, eventConfidence, entities}.
Sentiment is FinBERT P(pos) − P(neg).
Event type uses a rule layer first, then BART zero-shot when no strong rule hit, and combines the two.
Entities come from spaCy NER.
POST /analyze/batch for throughput, and GET /health.
The model loads once at startup.

Spring Boot ingestion

An Ingestor interface with fetch() returning RawDoc, and three implementations:
GdeltIngestor, using the DOC 2.0 API or GKG CSV and @Scheduled every 15 minutes.
NewsApiIngestor, with a key from env.
CsvReplayIngestor, reading the Kaggle tweets or news sample. This is the offline replay source.
Add a dedup hash on the normalized headline, text cleaning and an English-only filter. Each ingestor has a bundled sample fallback.
NlpClient uses WebClient with a timeout and retry, and falls back to FallbackAnalyzer (keyword rules and a small sentiment lexicon in Java).
ImpactScorer computes, with the rationale list stored:
impact = clamp(round(baseSeverity[event] + 2·|sentiment| + keywordBonus + velocityBonus + entityBonus), 1, 10)
EntityMapper loads data/entity_map.csv (company → ticker, sector, region; country → region).
Persist signals, and expose GET /api/signals?minImpact=&since=, GET /api/signals/stream (SSE), POST /api/analyze and POST /api/ingest/run.

Acceptance: two sources ingest, signals are saved with all three required fields, and the tests cover the sentiment sign on clear headlines, classification accuracy of at least 70% on 20 labeled headlines, impact bounds, and the sidecar-down fallback.

Phase 3: Synthetic portfolio
A generator (Python script or a Java CommandLineRunner), seeded, producing roughly 200 positions worth about $1–2B, written to data/portfolio.csv and loaded into the DB on startup.
Asset classes:
Loans: notional, rate type, maturity, rating, PD, LGD, sector, country.
Bonds: face, coupon, maturity, price, modified duration, convexity, rating.
Derivatives: IR swaps (DV01, pay/receive) and FX forwards (notional, pair, delta).
Equities: ticker, shares, price, beta.
Common fields: positionId, assetClass, counterparty, sector, region, currency, notional, marketValue.
Equity prices and betas are cached from yfinance in a small CSV, with hard-coded fallbacks. Java has no good yfinance equivalent, so run this step once in a Python script and commit the cached CSV.
The Kaggle datasets are only inspiration for counterparty and sector mix. Document this under "Dataset Used" in the README.
Phase 4: Stress engine (Java)

Scenario library (scenarios.yml, loaded via @ConfigurationProperties):

yaml
scenarios:
  GEOPOLITICAL:
    equityShockPct: -12
    rateShockBp: -50
    creditSpreadBp: 150
    fxShocks: { USDEUR: 3, USDINR: 4 }
    sectorOverrides: { Energy: { equityShockPct: 5 }, Airlines: { equityShockPct: -20 } }
    pdMultiplier: 1.4
  MACROECONOMIC: { rateShockBp: 200, equityShockPct: -8, creditSpreadBp: 100, pdMultiplier: 1.25 }
  CREDIT_EVENT:  { creditSpreadBp: 250, equityShockPct: -10, pdMultiplier: 2.0, counterpartySpecific: true }
  MERGER_ACQUISITION: {}   # logged, no stress

Severity scaling: appliedShock = baseShock × min(impact / 8, 1.5).

Revaluators use a Revaluator strategy interface per asset class:

Bonds: ΔP/P = −D·Δy + ½·C·Δy² − D·Δspread
Loans: MTM from spread × duration, plus expected loss PD × LGD × EAD with a stressed PD (one notch of migration at high impact)
Swaps: ΔMTM = DV01 × Δrate
FX forwards: notional × Δfx × delta
Equities: V × shock × beta, with sector and region overrides

TriggerService:

Triggers when impact > threshold (default 7, runtime-configurable) and eventConfidence > 0.5.
Debounces the same event type within a 30-minute window and keeps the highest-impact signal.
Produces and stores a StressResult with value before and after, delta and delta%, breakdowns by asset class, sector and region, the top 10 loss positions, EL before and after, and the applied shocks.

Endpoints: GET /api/portfolio/summary, GET /api/stress/results, POST /api/stress/run (manual injection with event type and impact, the demo safety net), GET/PUT /api/config/threshold, and GET /api/stress/stream (SSE).

Acceptance: JUnit tests for each revaluator against hand-calculated values, a monotonicity test (higher impact means a bigger loss), and an end-to-end test where a "GEOPOLITICAL, 9" signal reduces portfolio value.

Phase 5: React dashboard
Header KPIs: portfolio value, last stress delta %, expected loss, active alerts.
Live signal feed: SSE-driven table with impact badges, event type and sentiment, highlighting signals above the threshold.
Stress panel:
before vs after chart (the required visual), either a waterfall or grouped bars
tabs for breakdown by asset class, sector and region
top-10 impacted positions table
a "Why?" drawer showing the shocks applied and the impact rationale
Controls: threshold slider, "Replay stream" button, and a manual scenario injector (event type, impact and run).
History: timeline of stress runs and the portfolio value path.
Use TanStack Query for REST and a small useEventSource hook for SSE. Add loading and empty states, and keep the layout clean so the before/after story reads in seconds.

Acceptance: npm run dev against the backend shows live signals, the replay triggers a stress run, and the charts update. Use the browser tool for screenshots.

Phase 6: Packaging and submission
docker compose up brings up everything. Also document the manual commands:
cd nlp-service && pip install -r requirements.txt && uvicorn app:app
cd backend && mvn spring-boot:run
cd frontend && npm i && npm run dev
State the runtime in the README (Java 17, Node 20, Python 3.11).
README follows the mandatory template with the embedded docs/architecture.png.
docs/presentation.pdf has 5–7 slides following the suggested outline.
Demo video: under 5 minutes, since the problem statement says 5 and the guidelines say 10. Upload to YouTube as unlisted and test in incognito.
The /data folder contains everything used. The repo is public with MIT LICENSE, no secrets, an incremental commit history, and no large binaries. Slides go on GitHub or YouTube, not Google Drive or OneDrive.
Prepare for the jury Q&A on shock calibration, the impact heuristic, the hybrid classifier, why the sidecar architecture, and the limitations (static shocks, no correlation modelling, simplified pricing).
