import type { PortfolioSummary, Position, RiskSignal, StressResult, ThresholdConfig } from '../types/risk';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export async function fetchHealth(): Promise<{ status: string; nlpSidecar: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchPortfolioSummary(): Promise<PortfolioSummary> {
  const res = await fetch(`${API_BASE}/api/portfolio/summary`);
  if (!res.ok) throw new Error('Failed to fetch portfolio summary');
  return res.json();
}

export async function fetchPositions(): Promise<Position[]> {
  const res = await fetch(`${API_BASE}/api/portfolio/positions`);
  if (!res.ok) throw new Error('Failed to fetch positions');
  return res.json();
}

export async function fetchSignals(minImpact?: number): Promise<RiskSignal[]> {
  const url = new URL(`${API_BASE}/api/signals`);
  if (minImpact !== undefined) {
    url.searchParams.set('minImpact', minImpact.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch risk signals');
  return res.json();
}

export async function fetchStressResults(): Promise<StressResult[]> {
  const res = await fetch(`${API_BASE}/api/stress/results`);
  if (!res.ok) throw new Error('Failed to fetch stress results');
  return res.json();
}

export async function triggerManualStress(payload: {
  eventType?: string;
  impactScore?: number;
  headline?: string;
  text?: string;
}): Promise<StressResult> {
  const res = await fetch(`${API_BASE}/api/stress/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to execute manual stress run');
  return res.json();
}

export async function analyzeHeadline(text: string): Promise<RiskSignal> {
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to analyze headline');
  return res.json();
}

export async function triggerReplayStream(): Promise<{ processedCount: number }> {
  const res = await fetch(`${API_BASE}/api/ingest/run`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger ingestion replay');
  return res.json();
}

export async function resetSignals(): Promise<{ processedCount: number; message: string }> {
  const res = await fetch(`${API_BASE}/api/signals/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset signals database');
  return res.json();
}

export async function resetPortfolioDefault(): Promise<PortfolioSummary> {
  const res = await fetch(`${API_BASE}/api/portfolio/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset default portfolio');
  return res.json();
}


export async function fetchThresholdConfig(): Promise<ThresholdConfig> {
  const res = await fetch(`${API_BASE}/api/config/threshold`);
  if (!res.ok) throw new Error('Failed to fetch threshold config');
  return res.json();
}

export async function updateThresholdConfig(config: ThresholdConfig): Promise<ThresholdConfig> {
  const res = await fetch(`${API_BASE}/api/config/threshold`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update threshold config');
  return res.json();
}
