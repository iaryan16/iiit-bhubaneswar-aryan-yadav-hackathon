import React from 'react';
import {
  ArrowRight,
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  Play,
  Radio,
  TrendingDown,
  Zap,
  TrendingUp,
} from 'lucide-react';
import type { PortfolioSummary, RiskSignal, StressResult } from '../types/risk';

interface Props {
  summary?: PortfolioSummary;
  signals: RiskSignal[];
  latestStress: StressResult | null;
  threshold: number;
  onSimulateShock: (headline?: string) => void;
  onOpenStressEngine: () => void;
}

const money = (value: number, digits = 2) => `$${(value / 1e9).toFixed(digits)}B`;
const label = (value?: string) =>
  (value || 'Other').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export const ExecutiveDashboardView: React.FC<Props> = ({
  summary,
  signals,
  latestStress,
  threshold,
  onSimulateShock,
  onOpenStressEngine,
}) => {
  const urgent = signals.filter((signal) => signal.impactScore >= threshold);
  const latestSignals = signals.slice(0, 5);
  const value = summary?.totalMarketValue ?? latestStress?.portfolioValueBefore ?? 0;
  const isLoss = latestStress?.deltaValue && latestStress.deltaValue < 0;

  return (
    <div className="overview">
      {/* Welcome Row */}
      <section className="welcome-row scroll-reveal">
        <div>
          <p className="eyebrow">PORTFOLIO TELEMETRY</p>
          <h2>Real-Time Risk &amp; Scenario Intelligence</h2>
          <p className="welcome-copy">
            Continuous NLP ingestion translates geopolitical and macroeconomic news into instant portfolio revaluations and capital reserves impact.
          </p>
        </div>
        <button className="action-button" onClick={() => onSimulateShock()}>
          <Zap size={16} /> Run a Scenario
        </button>
      </section>

      {/* KPI 3-Column Summary Cards */}
      <section className="summary-grid" aria-label="Portfolio summary">
        {/* Card 1: Value */}
        <article className="summary-card scroll-reveal scroll-reveal-delay-1">
          <span className="summary-icon">
            <BriefcaseBusiness size={19} />
          </span>
          <p className="summary-label">Baseline Portfolio Value</p>
          <strong className="font-mono">{value ? money(value) : '—'}</strong>
          <small>{summary?.totalPositions ?? 200} multi-asset positions</small>
        </article>

        {/* Card 2: Alerts */}
        <article className={`summary-card ${urgent.length ? 'summary-alert' : ''} scroll-reveal scroll-reveal-delay-2`}>
          <span className="summary-icon">
            <AlertTriangle size={19} />
          </span>
          <p className="summary-label">Signals Above Threshold</p>
          <strong className="font-mono text-white">{urgent.length}</strong>
          <small>
            Severity ≥ {threshold}/10 ({urgent.length ? 'Actionable stress risk' : 'Nominal exposure'})
          </small>
        </article>

        {/* Card 3: Latest Stress */}
        <article className="summary-card scroll-reveal scroll-reveal-delay-3">
          <span className="summary-icon">
            {isLoss ? (
              <TrendingDown size={19} className="text-rose-400" />
            ) : (
              <TrendingUp size={19} className="text-emerald-400" />
            )}
          </span>
          <p className="summary-label">Latest Scenario Drawdown</p>
          <strong
            className={`font-mono ${isLoss ? 'loss-value' : 'text-emerald-400'}`}
          >
            {latestStress ? `${latestStress.deltaPercentage.toFixed(2)}%` : 'No run yet'}
          </strong>
          <small>
            {latestStress
              ? `${label(latestStress.eventType)} · ${new Date(
                  latestStress.timestamp
                ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Inject a headline to trigger stress calculation'}
          </small>
        </article>
      </section>

      {/* Content Grid (2 Columns) */}
      <section className="content-grid">
        {/* Left Column: Stress Engine Preview */}
        <article className="surface-card stress-summary scroll-reveal">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ACTIVE SCENARIO</p>
              <h3>{latestStress ? label(latestStress.eventType) : 'Stress Engine Ready'}</h3>
            </div>
            {latestStress && (
              <span className="impact-chip">
                Severity {latestStress.impactScore}/10
              </span>
            )}
          </div>

          {latestStress ? (
            <>
              <p className="scenario-headline font-sans">{latestStress.headline}</p>
              <div className="value-comparison">
                <div>
                  <small>Pre-Shock MV</small>
                  <strong>{money(latestStress.portfolioValueBefore, 3)}</strong>
                </div>
                <ArrowRight size={18} className="text-slate-500 shrink-0" />
                <div>
                  <small>Post-Shock MV</small>
                  <strong>{money(latestStress.portfolioValueAfter, 3)}</strong>
                </div>
                <div className="scenario-loss">
                  <small>Net Impact</small>
                  <strong>
                    {latestStress.deltaValue < 0 ? '−' : '+'}$
                    {(Math.abs(latestStress.deltaValue) / 1e6).toFixed(1)}M
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <p className="empty-copy">
              A scenario stress run dynamically applies interest rate, credit spread, equity beta, and FX shocks across all institutional holdings.
            </p>
          )}

          <button className="text-button" onClick={onOpenStressEngine}>
            Explore Complete Stress Analytics <ArrowRight size={15} />
          </button>
        </article>

        {/* Right Column: Live Ingestion Feed */}
        <article className="surface-card signals-summary scroll-reveal scroll-reveal-delay-1">
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEWSFEED RADAR</p>
              <h3>Latest Risk Signals</h3>
            </div>
            <span className="count-chip">
              <Radio size={13} className="text-emerald-400" /> {signals.length} Signals
            </span>
          </div>

          {latestSignals.length ? (
            <div className="signal-list">
              {latestSignals.map((signal) => {
                const isUrgent = signal.impactScore >= threshold;
                return (
                  <div className="signal-row" key={signal.signalId}>
                    <span className={`signal-dot ${isUrgent ? 'signal-dot-high' : ''}`} />
                    <div className="signal-main">
                      <strong>{signal.headline}</strong>
                      <small>
                        {label(signal.eventType)} ·{' '}
                        {new Date(signal.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        · {signal.source}
                      </small>
                    </div>
                    <span className={`score-chip ${isUrgent ? 'score-chip-high' : ''}`}>
                      {signal.impactScore}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Activity size={22} className="text-slate-600 mb-2" />
              <p>No signals received yet</p>
              <small>Incoming GDELT &amp; news events will appear here in real-time.</small>
            </div>
          )}

          <button className="text-button" onClick={onOpenStressEngine}>
            <Play size={14} /> Test Scenario Injection <ArrowRight size={15} />
          </button>
        </article>
      </section>
    </div>
  );
};
