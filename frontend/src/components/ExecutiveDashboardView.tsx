import React, { useState } from 'react';
import {
  DollarSign,
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  Radio,
  Zap,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import type { PortfolioSummary, RiskSignal, StressResult } from '../types/risk';

interface ExecutiveDashboardViewProps {
  summary?: PortfolioSummary;
  signals: RiskSignal[];
  latestStress: StressResult | null;
  threshold: number;
  onSimulateShock: (headline?: string) => void;
  onOpenStressEngine: () => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  summary,
  signals,
  latestStress,
  threshold,
  onSimulateShock,
  onOpenStressEngine,
}) => {
  const [signalFilter, setSignalFilter] = useState<'all' | 'high' | 'gdelt' | 'twitter'>('all');

  // Calculations
  const portfolioNotional = summary?.totalMarketValue
    ? `$${(summary.totalMarketValue / 1e9).toFixed(2)}B`
    : '$1.76B';

  const criticalSignalsCount = signals.filter((s) => s.impactScore >= threshold).length;

  const avgSentiment = signals.length > 0
    ? (signals.reduce((acc, s) => acc + (s.sentimentScore || 0), 0) / signals.length).toFixed(2)
    : '-0.45';

  const isBearish = Number(avgSentiment) < 0;

  // 1-Day Parametric VaR (95% approx 1.65 sigma on ~$1.76B is ~$38.5M)
  const parametricVaR = summary?.totalMarketValue
    ? `$${((summary.totalMarketValue * 0.0219) / 1e6).toFixed(1)}M`
    : '$38.5M';

  // Filter signals
  const filteredSignals = signals.filter((s) => {
    if (signalFilter === 'high') return s.impactScore >= threshold;
    if (signalFilter === 'gdelt') return s.source?.toLowerCase().includes('gdelt') || s.source === 'MANUAL_INJECTION';
    if (signalFilter === 'twitter') return s.source?.toLowerCase().includes('twitter');
    return true;
  });

  // Sentiment Trajectory Data points (mocking realistic trajectory based on signals)
  const trajectoryPoints = [
    { time: '14:28', val: 0.1 },
    { time: '14:30', val: -0.85 },
    { time: '14:31', val: 0.0 },
    { time: '14:33', val: 0.0 },
    { time: '14:35', val: -0.92 },
    { time: '14:37', val: 0.15 },
    { time: '14:38', val: -0.45 },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: TOTAL PORTFOLIO NOTIONAL */}
        <div className="kpi-card relative">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="kpi-label">Total Portfolio Notional</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit'] mb-3">
            {portfolioNotional}
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 font-mono">
              {summary?.totalPositions || 200} Multi-Asset Positions
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded font-mono">
              100% Allocated
            </span>
          </div>
          {/* Bottom Accent Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>

        {/* Card 2: CRITICAL RISK SIGNALS */}
        <div className="kpi-card relative">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="kpi-label">Critical Risk Signals</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit'] mb-3">
            {criticalSignalsCount}
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 font-mono">
              Impact Score ≥ {threshold} (Auto Shock)
            </span>
            <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded font-mono">
              {criticalSignalsCount} Critical
            </span>
          </div>
          {/* Bottom Accent Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-red-600" />
        </div>

        {/* Card 3: FINBERT SENTIMENT INDEX */}
        <div className="kpi-card relative">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="kpi-label">FinBERT Sentiment Index</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              {isBearish ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit'] mb-3">
            {avgSentiment}
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 font-mono">
              Scale: -1.0 to +1.0 Polarity
            </span>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded font-mono ${
                isBearish
                  ? 'text-amber-400 bg-amber-500/15'
                  : 'text-emerald-400 bg-emerald-500/15'
              }`}
            >
              {isBearish ? 'Bearish Tilt' : 'Bullish Bias'}
            </span>
          </div>
          {/* Bottom Accent Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        </div>

        {/* Card 4: 1-DAY PARAMETRIC VAR (95%) */}
        <div className="kpi-card relative">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="kpi-label">1-Day Parametric VaR (95%)</span>
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Outfit'] mb-3">
            {parametricVaR}
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400 font-mono">
              Crisis Horizon Loss Boundary
            </span>
            <span className="text-[11px] font-semibold text-violet-400 bg-violet-500/15 px-2 py-0.5 rounded font-mono">
              {latestStress?.deltaPercentage ? `${latestStress.deltaPercentage.toFixed(2)}% Cap` : '-6.36% Cap'}
            </span>
          </div>
          {/* Bottom Accent Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
        </div>
      </div>

      {/* 2. Auto-Stress Trigger Engine Active Alert Banner */}
      <div className="rounded-xl bg-gradient-to-r from-rose-950/40 via-[#0e1422] to-[#0e1422] border border-rose-500/30 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-rose-950/20">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Module B Auto-Stress Trigger Engine Active
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Threshold ≥ {threshold}
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Incoming GDELT news or tweets with FinBERT Impact Score ≥ {threshold} automatically calibrate macro risk factor shocks and evaluate cross-asset portfolio drawdown.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSimulateShock()}
          className="btn-primary text-xs shrink-0 flex items-center gap-1.5 px-4 py-2 font-semibold shadow-md"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Simulate Shock</span>
        </button>
      </div>

      {/* 3. 2-Column Split: Signal Stream (60%) & FinBERT Trajectory (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Real-Time Risk Signal Stream */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5">
            {/* Header with Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1b263b]">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Real-Time Risk Signal Stream
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-lg border border-[#1a2333]">
                <button
                  onClick={() => setSignalFilter('all')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    signalFilter === 'all'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSignalFilter('high')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    signalFilter === 'high'
                      ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Impact ≥ {threshold}
                </button>
                <button
                  onClick={() => setSignalFilter('gdelt')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    signalFilter === 'gdelt'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  GDELT
                </button>
                <button
                  onClick={() => setSignalFilter('twitter')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                    signalFilter === 'twitter'
                      ? 'bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Twitter
                </button>
              </div>
            </div>

            {/* Signals List */}
            <div className="mt-4 space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredSignals.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No signals found matching the current filter.
                </div>
              ) : (
                filteredSignals.map((signal) => {
                  const isHighImpact = signal.impactScore >= threshold;
                  const sentimentVal = signal.sentimentScore || 0;
                  const sentimentLabel = sentimentVal > 0.15 ? 'BULLISH' : sentimentVal < -0.15 ? 'BEARISH' : 'NEUTRAL';
                  const formattedTime = new Date(signal.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={signal.signalId}
                      className={`p-4 rounded-xl bg-[#090d16] border border-[#1b263b] hover:border-[#2a3c5a] transition-all relative overflow-hidden ${
                        isHighImpact ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-cyan-500'
                      }`}
                    >
                      {/* Top Badges Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                            SYSTEM
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                            {signal.eventType || 'Macroeconomic'}
                          </span>
                          <span className="text-slate-500">• Portfolio Engine</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] font-mono">
                          {/* Sentiment Tag */}
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold ${
                              sentimentVal > 0.15
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : sentimentVal < -0.15
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {sentimentVal > 0 ? `+${sentimentVal.toFixed(2)}` : sentimentVal.toFixed(2)} {sentimentLabel}
                          </span>

                          {/* Impact Pill */}
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              isHighImpact
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {signal.impactScore}/10
                          </span>

                          {/* Auto Shock Pill */}
                          {isHighImpact && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-bold text-[9px] uppercase tracking-wider">
                              AUTO SHOCK
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Headline / Body */}
                      <p className="text-xs text-slate-200 leading-relaxed font-sans mb-3 font-medium">
                        "{signal.headline}"
                      </p>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formattedTime}</span>
                        </div>

                        <button
                          onClick={() => onSimulateShock(signal.headline)}
                          className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium text-[11px] flex items-center gap-1 transition-all"
                        >
                          <Zap className="w-3 h-3 fill-current text-rose-400" />
                          <span>Simulate Shock</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: FinBERT Sentiment Trajectory & Stress Summary */}
        <div className="lg:col-span-5 space-y-4">
          {/* Sentiment Trajectory Chart Card */}
          <div className="glass-panel p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b263b] mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  FinBERT Sentiment Trajectory
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Scale: -1.0 to +1.0
              </span>
            </div>

            {/* Custom SVG Spline Chart */}
            <div className="h-40 w-full relative mb-3">
              <svg className="w-full h-full" viewBox="0 0 360 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="20" x2="360" y2="20" stroke="#1a2333" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="360" y2="70" stroke="#334155" strokeWidth="1.5" />
                <line x1="0" y1="120" x2="360" y2="120" stroke="#1a2333" strokeDasharray="3 3" />

                {/* Y-Axis Labels */}
                <text x="5" y="16" fill="#64748b" fontSize="9" fontFamily="monospace">1</text>
                <text x="5" y="68" fill="#94a3b8" fontSize="9" fontFamily="monospace">0</text>
                <text x="5" y="125" fill="#64748b" fontSize="9" fontFamily="monospace">-1</text>

                {/* Sentiment Curve Area & Path */}
                <path
                  d="M 25,65 Q 60,115 100,70 T 170,70 T 230,125 T 290,60 T 345,95 L 345,70 L 25,70 Z"
                  fill="url(#sentimentGradient)"
                />
                <path
                  d="M 25,65 Q 60,115 100,70 T 170,70 T 230,125 T 290,60 T 345,95"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Plotted Data Dots */}
                <circle cx="25" cy="65" r="3" fill="#10b981" />
                <circle cx="100" cy="70" r="3" fill="#06b6d4" />
                <circle cx="170" cy="70" r="3" fill="#06b6d4" />
                <circle cx="230" cy="125" r="3.5" fill="#f43f5e" />
                <circle cx="290" cy="60" r="3" fill="#10b981" />
                <circle cx="345" cy="95" r="4" fill="#f43f5e" />
              </svg>

              {/* X-Axis Time Labels */}
              <div className="flex justify-between px-6 text-[9px] font-mono text-slate-500 mt-2">
                {trajectoryPoints.map((p, i) => (
                  <span key={i}>{p.time}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Active Stress Shock Quick Impact Card */}
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b263b]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Active Revaluation Impact
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                {latestStress ? `${latestStress.deltaPercentage.toFixed(2)}% SHOCK` : 'NO ACTIVE SHOCK'}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-[#090d16] border border-[#1a2333]">
                <span className="text-slate-400">Total Capital Drawdown:</span>
                <span className="font-mono font-bold text-rose-400">
                  {latestStress ? `-$${(Math.abs(latestStress.deltaValue) / 1e6).toFixed(1)}M` : '$0.0M'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-[#090d16] border border-[#1a2333]">
                <span className="text-slate-400">Credit Reserve Increment:</span>
                <span className="font-mono font-bold text-amber-400">
                  {latestStress ? `+$${((latestStress.expectedLossAfter - latestStress.expectedLossBefore) / 1e6).toFixed(2)}M` : '$0.0M'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg bg-[#090d16] border border-[#1a2333]">
                <span className="text-slate-400">Stressed Market Valuation:</span>
                <span className="font-mono font-bold text-white">
                  {latestStress ? `$${(latestStress.portfolioValueAfter / 1e9).toFixed(3)}B` : portfolioNotional}
                </span>
              </div>
            </div>

            <button
              onClick={onOpenStressEngine}
              className="w-full btn-secondary text-xs flex items-center justify-center gap-2 py-2 mt-2"
            >
              <span>Open Portfolio Stress Engine</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
