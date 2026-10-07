#!/usr/bin/env python3
"""
Synthetic Portfolio Generator
S&P Global & CRISIL Hackathon 2026 - Module B (Stress Testing)
Generates ~200 multi-asset positions with target portfolio market value of ~$1.2B - $1.8B.
Seed: 42
"""

import csv
import random
import os

random.seed(42)

SECTORS = ["Technology", "Financials", "Energy", "Healthcare", "Industrials", "Consumer Discretionary", "Utilities"]
REGIONS = ["North America", "Europe", "Asia", "Emerging Markets"]
CURRENCIES = ["USD", "EUR", "GBP", "JPY", "INR"]
RATINGS = ["AAA", "AA", "A", "BBB", "BB", "B"]

RATING_TO_PD = {
    "AAA": 0.0005,
    "AA": 0.0015,
    "A": 0.0040,
    "BBB": 0.0120,
    "BB": 0.0350,
    "B": 0.0850
}

EQUITIES_DATA = [
    ("AAPL", "Apple Inc.", "Technology", "North America", 185.50, 1.15),
    ("MSFT", "Microsoft Corp.", "Technology", "North America", 420.25, 1.05),
    ("GOOGL", "Alphabet Inc.", "Technology", "North America", 165.80, 1.10),
    ("AMZN", "Amazon.com Inc.", "Consumer Discretionary", "North America", 180.40, 1.25),
    ("TSLA", "Tesla Inc.", "Consumer Discretionary", "North America", 240.50, 2.10),
    ("NVDA", "Nvidia Corp.", "Technology", "North America", 125.60, 1.85),
    ("META", "Meta Platforms", "Technology", "North America", 505.20, 1.35),
    ("JPM", "JPMorgan Chase", "Financials", "North America", 198.40, 1.08),
    ("GS", "Goldman Sachs", "Financials", "North America", 465.10, 1.20),
    ("MS", "Morgan Stanley", "Financials", "North America", 98.70, 1.18),
    ("C", "Citigroup Inc.", "Financials", "North America", 62.30, 1.32),
    ("BAC", "Bank of America", "Financials", "North America", 39.80, 1.22),
    ("XOM", "Exxon Mobil", "Energy", "North America", 118.50, 0.85),
    ("CVX", "Chevron Corp.", "Energy", "North America", 155.20, 0.88),
    ("SHEL", "Shell plc", "Energy", "Europe", 68.40, 0.78),
    ("BP", "BP plc", "Energy", "Europe", 35.60, 0.82),
    ("BA", "Boeing Co.", "Industrials", "North America", 182.30, 1.40),
    ("LMT", "Lockheed Martin", "Industrials", "North America", 460.80, 0.55),
    ("PFE", "Pfizer Inc.", "Healthcare", "North America", 28.50, 0.62),
    ("JNJ", "Johnson & Johnson", "Healthcare", "North America", 156.40, 0.54),
]

COUNTERPARTIES = [
    "Barclays Bank", "Deutsche Bank", "Societe Generale", "HSBC Holdings",
    "BNP Paribas", "UBS AG", "Credit Agricole", "Standard Chartered",
    "Sumitomo Mitsui", "Mizuho Financial", "Tata Steel", "Reliance Industries",
    "Siemens AG", "Airbus SE", "TotalEnergies SE", "Rio Tinto",
    "Glencore International", "Enel SpA", "Sony Group", "BHP Group"
]

def generate_portfolio(target_file="data/portfolio.csv"):
    positions = []
    pos_id = 1000

    # 1. Equities (~50 positions)
    for _ in range(50):
        pos_id += 1
        t_info = random.choice(EQUITIES_DATA)
        ticker, name, sector, region, price, beta = t_info
        shares = random.randint(15000, 60000)
        notional = round(shares * price, 2)
        market_value = notional

        positions.append({
            "positionId": f"EQ-{pos_id}",
            "assetClass": "EQUITY",
            "counterparty": name,
            "sector": sector,
            "region": region,
            "currency": "USD",
            "notional": notional,
            "marketValue": market_value,
            "coupon": "",
            "modifiedDuration": "",
            "convexity": "",
            "rating": "",
            "rateType": "",
            "pd": "",
            "lgd": "",
            "dv01": "",
            "payReceive": "",
            "currencyPair": "",
            "delta": "",
            "ticker": ticker,
            "shares": shares,
            "price": price,
            "beta": beta
        })

    # 2. Corporate & Sovereign Bonds (~50 positions)
    for _ in range(50):
        pos_id += 1
        counterparty = random.choice(COUNTERPARTIES)
        sector = random.choice(SECTORS)
        region = random.choice(REGIONS)
        currency = random.choice(["USD", "EUR", "GBP"])
        rating = random.choice(RATINGS)
        face = round(random.randint(6, 18) * 1_000_000, 2)
        price_pct = round(random.uniform(96.0, 103.5), 2)
        market_value = round(face * (price_pct / 100.0), 2)
        coupon = round(random.uniform(3.0, 7.5), 2)
        duration = round(random.uniform(3.5, 9.5), 2)
        convexity = round(random.uniform(25.0, 85.0), 2)

        positions.append({
            "positionId": f"BND-{pos_id}",
            "assetClass": "BOND",
            "counterparty": counterparty,
            "sector": sector,
            "region": region,
            "currency": currency,
            "notional": face,
            "marketValue": market_value,
            "coupon": coupon,
            "modifiedDuration": duration,
            "convexity": convexity,
            "rating": rating,
            "rateType": "FIXED",
            "pd": "",
            "lgd": "",
            "dv01": "",
            "payReceive": "",
            "currencyPair": "",
            "delta": "",
            "ticker": "",
            "shares": "",
            "price": price_pct,
            "beta": ""
        })

    # 3. Commercial & Syndicated Loans (~50 positions)
    for _ in range(50):
        pos_id += 1
        counterparty = random.choice(COUNTERPARTIES)
        sector = random.choice(SECTORS)
        region = random.choice(REGIONS)
        currency = random.choice(["USD", "EUR"])
        rating = random.choice(["A", "BBB", "BB", "B"])
        notional = round(random.randint(8, 22) * 1_000_000, 2)
        market_value = notional
        rate_type = random.choice(["SOFR_FLOATING", "EURIBOR_FLOATING", "FIXED"])
        pd = RATING_TO_PD[rating]
        lgd = round(random.uniform(0.35, 0.50), 3)

        positions.append({
            "positionId": f"LN-{pos_id}",
            "assetClass": "LOAN",
            "counterparty": counterparty,
            "sector": sector,
            "region": region,
            "currency": currency,
            "notional": notional,
            "marketValue": market_value,
            "coupon": round(random.uniform(4.5, 8.0), 2),
            "modifiedDuration": round(random.uniform(2.0, 5.0), 2),
            "convexity": "",
            "rating": rating,
            "rateType": rate_type,
            "pd": pd,
            "lgd": lgd,
            "dv01": "",
            "payReceive": "",
            "currencyPair": "",
            "delta": "",
            "ticker": "",
            "shares": "",
            "price": "",
            "beta": ""
        })

    # 4. Derivatives: IR Swaps (~25 positions) and FX Forwards (~25 positions)
    # IR Swaps
    for _ in range(25):
        pos_id += 1
        counterparty = random.choice(COUNTERPARTIES)
        notional = round(random.randint(15, 45) * 1_000_000, 2)
        market_value = round(random.uniform(-450_000, 550_000), 2)
        dv01 = round(notional * 0.00045, 2)
        pay_receive = random.choice(["PAY_FIXED", "RECEIVE_FIXED"])

        positions.append({
            "positionId": f"SWP-{pos_id}",
            "assetClass": "DERIVATIVE",
            "counterparty": counterparty,
            "sector": "Financials",
            "region": "North America",
            "currency": "USD",
            "notional": notional,
            "marketValue": market_value,
            "coupon": "",
            "modifiedDuration": "",
            "convexity": "",
            "rating": "",
            "rateType": "SWAP",
            "pd": "",
            "lgd": "",
            "dv01": dv01,
            "payReceive": pay_receive,
            "currencyPair": "",
            "delta": "",
            "ticker": "",
            "shares": "",
            "price": "",
            "beta": ""
        })

    # FX Forwards
    for _ in range(25):
        pos_id += 1
        counterparty = random.choice(COUNTERPARTIES)
        notional = round(random.randint(10, 30) * 1_000_000, 2)
        pair = random.choice(["USDEUR", "USDGBP", "USDJPY", "USDINR"])
        delta = round(random.uniform(0.70, 0.98), 2)
        market_value = round(random.uniform(-250_000, 350_000), 2)

        positions.append({
            "positionId": f"FXF-{pos_id}",
            "assetClass": "DERIVATIVE",
            "counterparty": counterparty,
            "sector": "Financials",
            "region": "Global",
            "currency": "USD",
            "notional": notional,
            "marketValue": market_value,
            "coupon": "",
            "modifiedDuration": "",
            "convexity": "",
            "rating": "",
            "rateType": "FX_FORWARD",
            "pd": "",
            "lgd": "",
            "dv01": "",
            "payReceive": "",
            "currencyPair": pair,
            "delta": delta,
            "ticker": "",
            "shares": "",
            "price": "",
            "beta": ""
        })

    # Ensure output directory exists
    os.makedirs(os.path.dirname(target_file), exist_ok=True)

    fieldnames = [
        "positionId", "assetClass", "counterparty", "sector", "region", "currency",
        "notional", "marketValue", "coupon", "modifiedDuration", "convexity",
        "rating", "rateType", "pd", "lgd", "dv01", "payReceive", "currencyPair",
        "delta", "ticker", "shares", "price", "beta"
    ]

    total_mv = sum(p["marketValue"] for p in positions)
    with open(target_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(positions)

    print(f"Generated {len(positions)} positions.")
    print(f"Total Market Value: ${total_mv:,.2f}")
    return total_mv, len(positions)

if __name__ == "__main__":
    generate_portfolio("data/portfolio.csv")
