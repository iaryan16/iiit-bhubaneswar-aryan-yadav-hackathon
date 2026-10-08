# S&P Global & CRISIL Hackathon 2026
## Module B: Financial Stress Testing Platform
**Real-Time Event-Driven Stress Testing Powered by NLP Risk Signal Intelligence**

---

### Slide 1: Title & Executive Summary
- **Title:** Event-Driven Financial Stress Testing Engine
- **Participant:** Solo Developer
- **Core Value Proposition:**
  - Modern risk management often operates on backward-looking data with multi-day reporting latencies.
  - This platform links **real-time unstructured geopolitical and macroeconomic intelligence** directly to a **$1.76B multi-asset trading book**.
  - Ingests global headlines, runs hybrid NLP sentiment & event classification, calculates transparent impact heuristics (1–10), debounces event noise within a 30-minute window, and revalues Bonds, Loans, Swaps, FX Forwards, and Equities in sub-second response times.
- **Key Metric:**
  - Full portfolio revaluation (200 positions, $1.76B market value) completed in **< 15 milliseconds** upon incoming signal trigger.

---

### Slide 2: Architecture & System Topology
- **Loose-Coupled Microservice Architecture:**
  1. **Ingestion Layer:** GDELT DOC 2.0 API, NewsAPI, and CSV Replay Ingestors with SHA-256 deduplication and text sanitization.
  2. **NLP Risk Sidecar (FastAPI :8000):** FinBERT sentiment scoring, BART zero-shot classification, and spaCy NER.
  3. **Zero-Dependency Fallback Engine (Spring Boot :8080):** Embedded financial lexicon and rule taxonomy ensuring 100% offline uptime even if the Python sidecar is down.
  4. **Impact Scoring Engine:** Transparent, deterministic formula mapping events, sentiment, velocity, and systemic entities to a clamped 1–10 scale.
  5. **Dynamic Trigger & Debouncing:** 30-minute rolling window suppresses lower-severity noise while upgrading to higher-impact spikes.
  6. **Interactive Dashboard (React 18 + Vite + TypeScript :5173):** Server-Sent Events (SSE) streaming, Recharts Before vs After visuals, and "Why?" shock drawer.

---

### Slide 3: NLP Risk Intelligence & Hybrid Classification
- **FinBERT Sentiment Calibration:**
  - Evaluates financial tone: `sentiment = P(pos) - P(neg)` bounded strictly between `[-1.0, 1.0]`.
  - Distinguishes macro risks (e.g., "rate hikes", "yield spikes", "inflation surges") as systemic negatives.
- **Hybrid Event Taxonomy:**
  - Rules-first layer captures high-precision keywords; BART zero-shot evaluates edge cases.
  - Covers 8 standard event types: `GEOPOLITICAL`, `MACROECONOMIC`, `CREDIT_EVENT`, `MERGER_ACQUISITION`, `PRODUCT_LAUNCH`, `REGULATORY`, `NATURAL_DISASTER_OPERATIONAL`, `OTHER`.
- **Benchmark Performance:**
  - Achieved **95.0% accuracy** on Python NLP sidecar and **100.0% accuracy** on Java fallback across 20 labeled benchmark headlines.
- **Impact Scoring Heuristic:**
  $$\text{Impact} = \text{clamp}\Big(\text{round}\big(\text{Base} + 2\cdot|\text{Sentiment}| + \text{Bonus}_{\text{kw}} + \text{Bonus}_{\text{velocity}} + \text{Bonus}_{\text{entity}}\big),\, 1,\, 10\Big)$$
  - Full auditability: Stores transparent rationale array (e.g., `["base=6", "sentiment=+1.4", "kw:sanctions=+1"]`).

---

### Slide 4: Synthetic Multi-Asset Portfolio ($1.76B Book)
- **Deterministic Generation (Seed 42):**
  - Generated 200 realistic positions totaling **$1,759,091,843.29** across four asset classes:
    1. **Corporate & Sovereign Bonds (~50 positions):** Fixed coupon, modified duration ($3.5\text{y} - 9.5\text{y}$), convexity ($25 - 85$), and credit ratings (`AAA` to `B`).
    2. **Commercial & Syndicated Loans (~50 positions):** Floating/fixed rates, baseline PD ($0.05\% - 8.5\%$), and LGD ($35\% - 50\%$).
    3. **Derivatives (~50 positions):**
       - Interest Rate Swaps: DV01 sensitivity, Pay-Fixed vs Receive-Fixed legs.
       - FX Forwards: Currency pairs (`USDEUR`, `USDINR`, `USDGBP`, `USDJPY`) with delta sensitivities.
    4. **Equities (~50 positions):** Real cached market prices and betas ($0.54 - 2.10$) across Technology, Financials, Energy, Healthcare, and Industrials.

---

### Slide 5: Mathematical Stress Revaluation Engine
- **Severity Scaling:**
  $$\text{Applied Shock} = \text{Base Shock} \times \min\left(\frac{\text{Impact}}{8.0},\, 1.5\right)$$
- **Multi-Asset Revaluation Strategies:**
  - **Bonds:** Modified duration & convexity Taylor expansion + credit spread widening:
    $$\frac{\Delta P}{P} = -D \cdot \Delta y + \frac{1}{2} C \cdot (\Delta y)^2 - D \cdot \Delta \text{spread}$$
  - **Loans:** MTM spread loss plus credit migration expected loss:
    $$\Delta \text{MTM} = -D \cdot \Delta \text{spread} \cdot V, \quad \text{EL}_{\text{stressed}} = \text{PD}_{\text{stressed}} \cdot \text{LGD} \cdot \text{EAD}$$
    *(High impact $\ge 8$ applies a 1-notch rating migration penalty of $+25\%$ PD)*.
  - **Derivatives:**
    - Swaps: $\Delta \text{MTM} = \pm \text{DV01} \cdot \Delta \text{rate}_{\text{bps}}$
    - FX Forwards: $\Delta \text{MTM} = \text{Notional} \cdot \Delta \text{fx} \cdot \delta$
  - **Equities:** Beta-adjusted asset revaluation with sector overrides (e.g., Energy $+5\%$, Airlines $-20\%$):
    $$\Delta V = V_{\text{base}} \cdot (\text{Shock}_{\text{sector}} \cdot \beta)$$
- **Validated Tests:**
  - Hand calculations matched to $0.0001 precision.
  - Strict monotonicity confirmed: Impact 10 loss ($149.4M) > Impact 8 loss ($119.6M) > Impact 6 loss ($89.8M).

---

### Slide 6: Real-Time Interactive Dashboard & Demo Walkthrough
- **User Interface Features:**
  - **Header KPIs:** Live active valuation, percentage drawdowns, stressed EL migration, and SSE connection pulse.
  - **SSE Live Signal Feed:** Real-time table streaming with color-coded impact badges (1–10), sentiment signs, and threshold alerts.
  - **Before vs After Visual Chart:** Recharts grouped-bar comparison showing immediate balance sheet contraction and expected loss increases.
  - **Loss Slices:** Interactive breakdowns by Asset Class, Sector, and Geographic Region.
  - **Top-10 Loss Positions Table:** Direct drill-down into highest-risk exposures.
  - **"Why?" Shock Drawer:** Transparent explanation of scaling factor, macro vectors, and position-specific pricing formulas.
  - **Controls:** Dynamic threshold slider (synced via REST PUT), Replay stream button, and manual scenario injector modal.

---

### Slide 7: Jury Q&A Preparation & Defensibility
- **1. Why the Sidecar Architecture?**
  - Isolates heavy deep learning dependencies (Python/PyTorch/spaCy) from core high-throughput financial execution (Java/Spring Boot). If the Python sidecar crashes, the Java fallback handles 100% of traffic with zero downtime.
- **2. How was Shock Calibration Derived?**
  - Calibrated against historical market stress benchmarks (2008 GFC credit spread widening, 2020 COVID equity drawdowns, 2022 rate hike cycles).
- **3. Why Use a Deterministic Heuristic for Impact Scoring?**
  - Financial regulators and risk committees require full transparency. Machine learning black-boxes are hard to audit; our formula stores exact rationale tokens (`base`, `sentiment`, `keyword`, `velocity`, `entity`) for regulatory compliance.
- **4. Recognized Limitations & Future Enhancements:**
  - Current models use instantaneous static shocks; future iterations can add cross-asset correlation matrices (copula models), multi-step contagion cascades, and options volatility surfaces.
