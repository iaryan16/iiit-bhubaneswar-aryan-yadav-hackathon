# S&P Global & CRISIL Hackathon 2026 — Module B: Financial Stress Testing Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Java: 21](https://img.shields.io/badge/Java-21-blue.svg)](https://adoptium.net/)
[![Spring Boot: 3.3.4](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React: 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![FastAPI: 0.100+](https://img.shields.io/badge/FastAPI-0.100+-teal.svg)](https://fastapi.tiangolo.com/)

An event-driven financial risk engine that continuously ingests global news and social feeds, evaluates NLP sentiment and risk taxonomy, computes transparent multi-factor impact scores, and executes real-time multi-asset stress testing across a **$1.76 Billion** trading portfolio in sub-second latency.

---

## 🏛️ System Architecture

![Platform Architecture](docs/architecture.png)

### Data & Processing Pipeline
1. **Ingestion Layer:** Multi-source ingestors (GDELT DOC 2.0 API, NewsAPI, and CSV Replay) normalize text, compute SHA-256 headline deduplication hashes, and filter noise.
2. **NLP Risk Sidecar (Python FastAPI :8000):** Evaluates FinBERT sentiment $P(\text{pos}) - P(\text{neg}) \in [-1.0, 1.0]$, classifies risk events across 8 taxonomy categories via rule + BART zero-shot, and extracts named entities.
3. **Java Fallback Analyzer (Zero-Downtime):** Embedded financial lexicon and keyword classifier in Spring Boot ensuring **100% offline availability** even when the NLP sidecar is offline.
4. **Transparent Impact Scorer:** Heuristic calculation clamped between 1 and 10 with auditable rationale strings.
5. **Trigger Service & Debouncing:** Evaluates threshold ($\text{Impact} \ge 7, \text{Confidence} > 0.5$) with a **30-minute rolling debouncing window** that suppresses duplicate noise while upgrading to higher-impact spikes.
6. **Stress Revaluation Engine:** Executes multi-asset pricing models (Duration/Convexity for Bonds, MTM + PD migration for Loans, DV01 for IR Swaps, Delta for FX Forwards, and Beta with sector overrides for Equities).
7. **Interactive React Dashboard (React 18 + Vite + TS :5173):** Server-Sent Events (SSE) live feed, Before vs After Recharts visual comparison, dimensional slice tabs, and "Why?" shock drawer.

---

## ⚙️ Tech Stack & Runtime Environment

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Backend** | Java / Spring Boot 3 | Java 17 / 21, Spring Boot 3.3.4 | Core stress engine, JPA persistence, REST & SSE |
| **NLP Sidecar** | Python / FastAPI / Uvicorn | Python 3.11 / 3.14 | FinBERT sentiment, BART classification, spaCy NER |
| **Frontend** | React 18 / Vite / TypeScript | Node 20 / 24, Vite 8.3 | Real-time financial dashboard & Recharts visuals |
| **Database** | H2 (in-memory) / Flyway | H2 2.2+, Flyway 10+ | Embedded high-speed trading book & signal storage |
| **Documentation**| SpringDoc OpenAPI 3.0 | 2.5.0 (Swagger UI) | Interactive API exploration at `/swagger-ui.html` |
| **Packaging** | Docker Compose | Compose v2 | Multi-container orchestration |

---

## 🚀 Quickstart & Execution Guide

### Option 1: Docker Compose (All Services)
```bash
docker compose up --build
```
- **React Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Spring Boot Backend:** [http://localhost:8080](http://localhost:8080)
- **Swagger UI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **NLP Sidecar:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Manual Local Startup

#### 1. Start the NLP Sidecar (Optional in Offline Mode)
```bash
cd nlp-service
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

#### 2. Start the Spring Boot Backend
```bash
cd backend
mvn spring-boot:run
```
*(The backend automatically loads `data/portfolio.csv` and `data/entity_map.csv` on startup. If the Python sidecar is down, it seamlessly falls back to the embedded Java FallbackAnalyzer).*

#### 3. Start the React Frontend Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📊 Dataset Used & Portfolio Calibration

1. **Synthetic Multi-Asset Trading Portfolio (`data/portfolio.csv`):**
   - **Deterministic Seed:** `42` (seeded in `scripts/generate_portfolio.py`).
   - **Total Positions:** 200 multi-asset instruments.
   - **Total Market Value:** **$1,759,091,843.29** (~$1.76 Billion, matching the $1B–$2B specification).
   - **Asset Composition:**
     - **Bonds (50):** Corporate and sovereign bonds with fixed coupons, modified duration ($3.5\text{y} - 9.5\text{y}$), convexity ($25 - 85$), and ratings `AAA` to `B`.
     - **Loans (50):** Commercial and syndicated loans with baseline PDs ($0.05\% - 8.5\%$) and LGDs ($35\% - 50\%$).
     - **Derivatives (50):** 25 Interest Rate Swaps (DV01 sensitivity, Pay-Fixed vs Receive-Fixed) and 25 FX Forwards (`USDEUR`, `USDINR`, `USDGBP`, `USDJPY` with delta sensitivities).
     - **Equities (50):** Real cached market equities (`data/cached_equities.csv`) across Technology, Financials, Energy, Healthcare, and Industrials with betas ($0.54 - 2.10$).
2. **Kaggle Inspiration:** Real-world counterparties (e.g., Barclays, Deutsche Bank, BNP Paribas, UBS) and sector mixes inspired by financial stress benchmark datasets.

---

## 🧮 Mathematical Valuation & Pricing Models

### Severity Scaling
$$\text{Applied Shock} = \text{Base Shock} \times \min\left(\frac{\text{Impact}}{8.0},\, 1.5\right)$$

### 1. Bonds
Taylor series expansion incorporating modified duration and convexity, with credit spread widening:
$$\frac{\Delta P}{P} = -D \cdot \Delta y + \frac{1}{2} C \cdot (\Delta y)^2 - D \cdot \Delta \text{spread}$$

### 2. Loans
Mark-to-market spread widening combined with credit migration expected loss:
$$\Delta \text{MTM} = -D \cdot \Delta \text{spread} \cdot V_{\text{base}}$$
$$\text{EL}_{\text{stressed}} = \text{PD}_{\text{stressed}} \times \text{LGD} \times \text{EAD}$$
*(High severity impact $\ge 8$ applies a 1-notch rating migration surcharge of $+25\%$ PD)*.

### 3. Derivatives
- **Interest Rate Swaps:**
  $$\Delta \text{MTM} = \begin{cases} +\text{DV01} \times \Delta \text{rate}_{\text{bps}} & \text{if Pay Fixed} \\ -\text{DV01} \times \Delta \text{rate}_{\text{bps}} & \text{if Receive Fixed} \end{cases}$$
- **FX Forwards:**
  $$\Delta \text{MTM} = \text{Notional} \times \Delta \text{fx} \times \delta$$

### 4. Equities
Capital Asset Pricing Model (CAPM) beta-adjusted shock with scenario sector overrides (e.g., Energy $+5\%$, Airlines $-20\%$):
$$\Delta V = V_{\text{base}} \times (\text{Shock}_{\text{sector}} \times \beta)$$

---

## 🧪 Automated Testing & Verification

Run the test suite:
```bash
# Backend unit & integration tests (15 test suites)
cd backend && mvn test

# Frontend TypeScript check and production bundle
cd frontend && npm run build

# Python NLP test suite (classification accuracy >= 70%)
python nlp-service/test_nlp.py
```

### Verified Test Results
- **NLP Classification Accuracy:** **95.0% (Python)** and **100.0% (Java Fallback)** across 20 labeled benchmark headlines.
- **Analytical Hand Calculation Validation:** Bond, Loan, Swap, FX Forward, and Equity revaluation matches hand calculations to $0.0001 precision.
- **Monotonicity Verification:** Confirmed that higher impact scores strictly produce greater portfolio drawdowns ($\text{Loss}_{10} > \text{Loss}_8 > \text{Loss}_6$).
- **End-to-End Stress Test:** Confirmed `GEOPOLITICAL, 9` signal triggers revaluation, reducing portfolio value from **$1.76B** to **$1.62B** ($-134.5\text{M}$ / $-7.65\%$) with credit expected loss increasing from **$14.06M** to **$25.49M**.

---

## ⚖️ Jury Q&A & Architecture Defensibility

1. **Why the Sidecar Architecture?**
   - Eliminates heavy native ML runtime dependencies from the core transaction and revaluation path. If the Python sidecar is unavailable, Spring Boot automatically falls back to the embedded Java FallbackAnalyzer with zero interruption.
2. **How was Shock Calibration Derived?**
   - Calibrated against historical financial crises (2008 Lehman credit spread widening, 2020 COVID equity shocks, 2022 Fed rate hiking cycle).
3. **Why Use a Deterministic Impact Heuristic?**
   - Financial regulators (Basel III/IV, PRA, Fed) require transparent auditability. Black-box impact scores cannot be explained; our heuristic logs every token (`base`, `sentiment`, `keyword`, `velocity`, `entity`) in the audit trail.
4. **Recognized Limitations:**
   - Shocks are instantaneous static revaluations; future iterations can add dynamic copula cross-asset correlation models and multi-period contagion cascades.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
