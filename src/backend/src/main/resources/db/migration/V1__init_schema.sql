-- Initial database schema for Risk Stress Engine

CREATE TABLE IF NOT EXISTS risk_signals (
    signal_id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    source VARCHAR(32) NOT NULL,
    headline VARCHAR(1000) NOT NULL,
    snippet TEXT,
    entities VARCHAR(1000),
    tickers VARCHAR(500),
    region VARCHAR(64),
    sector VARCHAR(64),
    sentiment_score DOUBLE PRECISION NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    event_confidence DOUBLE PRECISION NOT NULL,
    impact_score INT NOT NULL,
    impact_rationale TEXT,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS positions (
    position_id VARCHAR(64) PRIMARY KEY,
    asset_class VARCHAR(32) NOT NULL,
    counterparty VARCHAR(255) NOT NULL,
    sector VARCHAR(64) NOT NULL,
    region VARCHAR(64) NOT NULL,
    currency VARCHAR(8) NOT NULL,
    notional DOUBLE PRECISION NOT NULL,
    market_value DOUBLE PRECISION NOT NULL,
    -- Bond specific
    coupon DOUBLE PRECISION,
    modified_duration DOUBLE PRECISION,
    convexity DOUBLE PRECISION,
    rating VARCHAR(16),
    -- Loan specific
    rate_type VARCHAR(16),
    pd DOUBLE PRECISION,
    lgd DOUBLE PRECISION,
    -- Derivative specific
    dv01 DOUBLE PRECISION,
    pay_receive VARCHAR(16),
    currency_pair VARCHAR(16),
    delta DOUBLE PRECISION,
    -- Equity specific
    ticker VARCHAR(16),
    shares DOUBLE PRECISION,
    price DOUBLE PRECISION,
    beta DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS stress_results (
    result_id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    trigger_signal_id VARCHAR(64),
    event_type VARCHAR(64) NOT NULL,
    impact_score INT NOT NULL,
    portfolio_value_before DOUBLE PRECISION NOT NULL,
    portfolio_value_after DOUBLE PRECISION NOT NULL,
    delta_value DOUBLE PRECISION NOT NULL,
    delta_percentage DOUBLE PRECISION NOT NULL,
    expected_loss_before DOUBLE PRECISION NOT NULL,
    expected_loss_after DOUBLE PRECISION NOT NULL,
    breakdown_by_asset_class TEXT,
    breakdown_by_sector TEXT,
    breakdown_by_region TEXT,
    top_loss_positions TEXT,
    applied_shocks TEXT
);
