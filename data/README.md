# RiskEngine Dataset Documentation (`/data`)

This directory contains the synthetic, public, and sample benchmark datasets utilized by the **RiskEngine** financial stress testing engine. In strict compliance with hackathon guidelines, **no proprietary or confidential client data** has been used. All portfolios and market scenarios are reproducibly generated or publicly sourced.

---

## 📁 Directory Structure

```
data/
├── portfolio.csv               # Synthetic 200-position multi-asset trading portfolio ($1.76B)
├── entity_map.csv              # Counterparty & systemic entity mapping dictionary
├── cached_equities.csv         # Public equity market benchmarks, betas, and pricing
├── README.md                   # Dataset schema, calibration methodology & assumptions
└── raw_samples/
    ├── sample_news.json        # Benchmark financial news headlines across 8 risk taxonomy classes
    └── sample_tweets.csv       # Social media sentiment & velocity event stream
```

---

## 1. Multi-Asset Portfolio (`data/portfolio.csv`)
- **Generation Method:** Algorithmic synthetic generation via `scripts/generate_portfolio.py`.
- **Reproducibility Seed:** `42` (deterministic random seed).
- **Total Book Size:** **$1,759,091,843.29** (~$1.76 Billion, matching the $1B–$2B trading book mandate).
- **Position Count:** 200 distinct financial instruments.

### Asset Class Distribution
| Asset Class | Count | Key Calibration Parameters | Market Value Share |
|---|---|---|---|
| **Bonds** | 50 | Modified Duration ($3.5\text{y} - 9.5\text{y}$), Convexity ($25 - 85$), Credit Rating (`AAA` to `B`), Fixed Coupon ($2.5\% - 6.5\%$) | ~$450M |
| **Loans** | 50 | Base Spread ($120 - 450\text{ bps}$), Baseline PD ($0.05\% - 8.5\%$), LGD ($35\% - 50\%$), Senior Secured / Syndicated | ~$480M |
| **Derivatives** | 50 | 25 Interest Rate Swaps (DV01 $\$5,000 - \$45,000/\text{bp}$, Pay-Fixed vs Receive-Fixed) + 25 FX Forwards (`USDEUR`, `USDINR`, `USDGBP`, `USDJPY`, Delta $0.85 - 1.0$) | ~$380M |
| **Equities** | 50 | Sector-classified equities across Tech, Financials, Energy, Healthcare, Industrials with market betas ($0.54 - 2.10$) | ~$449M |

### Field Schema
- `position_id`: Unique instrument identifier (e.g., `BOND-001`, `LOAN-024`, `SWAP-012`, `FX-005`, `EQ-033`).
- `asset_class`: Enum `[BOND, LOAN, DERIVATIVE, EQUITY]`.
- `instrument_name`: Descriptive security title or contract definition.
- `counterparty`: Reference institution or issuer.
- `base_value`: Mark-to-market base valuation in USD.
- `duration`: Modified duration in years (for Bonds and Loans).
- `convexity`: Bond convexity measure.
- `pd`: Baseline annual probability of default $[0.0, 1.0]$.
- `lgd`: Loss given default $[0.0, 1.0]$.
- `ead`: Exposure at default in USD.
- `dv01`: Dollar value of a basis point for interest rate swaps.
- `pay_fixed`: Boolean indicator (`true` = pay fixed / receive floating, `false` = receive fixed).
- `fx_currency_pair`: Currency pair identifier for FX forwards (e.g., `USDEUR`).
- `fx_delta`: Delta sensitivity to foreign exchange rate movements.
- `beta`: Systematic equity beta relative to global market benchmark.
- `sector`: GICS industry sector (`Technology`, `Financials`, `Energy`, `Healthcare`, `Industrials`).
- `region`: Geographic trading jurisdiction (`North America`, `Europe`, `Asia-Pacific`, `Emerging Markets`).
- `rating`: Credit rating notation (`AAA`, `AA`, `A`, `BBB`, `BB`, `B`).

---

## 2. Entity Mapping Dictionary (`data/entity_map.csv`)
- **Purpose:** Links incoming unstructured text entities (extracted via spaCy NER and keyword detection) to known financial counterparties, tickers, and systemic risk weights.
- **Fields:**
  - `entity_name`: Canonical institution name (e.g., `Barclays`, `Deutsche Bank`, `BNP Paribas`, `UBS`, `Federal Reserve`).
  - `ticker`: Public market ticker symbol if listed.
  - `systemic_weight`: Systemic importance factor $[1.0 - 2.0]$ applied in impact scoring bonus.
  - `sector`: Primary operating sector.
  - `credit_rating`: Baseline credit quality.

---

## 3. Benchmark Public Equities (`data/cached_equities.csv`)
- **Source:** Public equity market benchmarks across S&P 500, STOXX 600, and NIFTY 50 top constituents.
- **Parameters:** Closing price baseline, calculated 3-year weekly beta, GICS sector mapping.

---

## 4. Benchmark News & Social Feeds (`data/raw_samples/`)
- **`sample_news.json`:** Curated benchmark test cases spanning the 8 financial risk event taxonomies (`GEOPOLITICAL`, `MACROECONOMIC`, `CREDIT_EVENT`, `REGULATORY`, `MERGER_ACQUISITION`, `PRODUCT_LAUNCH`, `NATURAL_DISASTER_OPERATIONAL`, `OTHER`). Used for automated unit and integration tests.
- **`sample_tweets.csv`:** Sample social media event feed used by the streaming replay ingestor to test high-frequency velocity bursts.

---

## 5. Modeling Assumptions & Boundaries
1. **Instantaneous Static Shocks:** Shocks evaluate immediate balance sheet MTM impact prior to dynamic portfolio rebalancing or secondary hedging maneuvers.
2. **Deterministic Reproducibility:** Fixed random seeds guarantee that all baseline portfolios, unit test suites, and hand-calculation validations produce identical numbers on any evaluation machine.
3. **No Confidential Data:** All counterparty references represent publicly known financial institutions in synthetic loan/swap pairings.
