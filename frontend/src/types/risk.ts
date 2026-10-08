export type EventType =
  | 'GEOPOLITICAL'
  | 'MACROECONOMIC'
  | 'CREDIT_EVENT'
  | 'MERGER_ACQUISITION'
  | 'PRODUCT_LAUNCH'
  | 'REGULATORY'
  | 'NATURAL_DISASTER_OPERATIONAL'
  | 'OTHER';

export interface RiskSignal {
  signalId: string;
  timestamp: string;
  source: string;
  headline: string;
  snippet?: string;
  entities: string[];
  tickers: string[];
  region: string;
  sector: string;
  sentimentScore: number;
  eventType: EventType;
  eventConfidence: number;
  impactScore: number;
  impactRationale: string[];
}

export interface PortfolioSummary {
  totalPositions: number;
  totalMarketValue: number;
  totalNotional: number;
  totalExpectedLoss: number;
  byAssetClass: Record<string, number>;
  bySector: Record<string, number>;
  byRegion: Record<string, number>;
}

export interface RevaluationPosition {
  positionId: string;
  assetClass: string;
  counterparty: string;
  sector: string;
  region: string;
  baseMarketValue: number;
  stressedMarketValue: number;
  deltaValue: number;
  deltaPercentage: number;
  baseExpectedLoss: number;
  stressedExpectedLoss: number;
  rationale: string;
}

export interface AppliedShocks {
  eventType: EventType;
  impactScore: number;
  severityScaling: number;
  equityShockPct: number;
  rateShockBp: number;
  creditSpreadBp: number;
  pdMultiplier: number;
  highImpactMigration: boolean;
  fxShocks: Record<string, number>;
  sectorOverrides: Record<string, Record<string, number>>;
}

export interface StressResult {
  resultId: string;
  timestamp: string;
  triggerSignalId?: string;
  eventType: EventType;
  impactScore: number;
  headline: string;
  portfolioValueBefore: number;
  portfolioValueAfter: number;
  deltaValue: number;
  deltaPercentage: number;
  expectedLossBefore: number;
  expectedLossAfter: number;
  breakdownByAssetClassJson: string;
  breakdownBySectorJson: string;
  breakdownByRegionJson: string;
  topLossPositionsJson: string;
  appliedShocksJson: string;
}

export interface Position {
  positionId: string;
  assetClass: string;
  counterparty: string;
  sector: string;
  region: string;
  currency: string;
  notional: number;
  marketValue: number;
  coupon?: number | null;
  modifiedDuration?: number | null;
  convexity?: number | null;
  rating?: string | null;
  rateType?: string | null;
  pd?: number | null;
  lgd?: number | null;
  dv01?: number | null;
  payReceive?: string | null;
  currencyPair?: string | null;
  delta?: number | null;
  ticker?: string | null;
  shares?: number | null;
  price?: number | null;
  beta?: number | null;
}

export interface ThresholdConfig {
  impactThreshold: number;
  confidenceThreshold: number;
  debounceMinutes: number;
}
