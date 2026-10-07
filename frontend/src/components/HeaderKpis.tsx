import React from 'react';
import { DollarSign, TrendingDown, ShieldCheck, Activity } from 'lucide-react';
import type { PortfolioSummary, StressResult } from '../types/risk';

interface HeaderKpisProps {
  summary: PortfolioSummary | undefined;
  latestStress: StressResult | null;
  activeAlertsCount: number;
  sseConnected: boolean;
}

export const HeaderKpis: React.FC<HeaderKpisProps> = ({
  summary,
  latestStress,
  activeAlertsCount,
  sseConnected,
}) => {
  const currentVal = latestStress
    ? latestStress.portfolioValueAfter
    : summary?.totalMarketValue || 0;

  const baselineVal = summary?.totalMarketValue || 0;
  const deltaVal = latestStress ? latestStress.deltaValue : 0;
  const deltaPct = latestStress ? latestStress.deltaPercentage : 0;

  const elBase = latestStress ? latestStress.expectedLossBefore : summary?.totalExpectedLoss || 0;
  const elStressed = latestStress ? latestStress.expectedLossAfter : elBase;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1: Portfolio Value */}
      <div className="kpi-card group">
        <div className="flex items-center justify-between mb-2">
          <span className="kpi-label">Active Portfolio Value</span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white">
          ${(currentVal / 1e9).toFixed(3)}B
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <span>Baseline: ${(baselineVal / 1e9).toFixed(3)}B</span>
          <span className="text-slate-600">•</span>
          <span>{summary?.totalPositions || 0} Positions</span>
        </div>
      </div>

      {/* KPI 2: Last Stress Delta */}
      <div className="kpi-card group">
        <div className="flex items-center justify-between mb-2">
          <span className="kpi-label">Last Stress Impact</span>
          <div className={`p-2 rounded-lg ${deltaVal < 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>
        <div className={`text-2xl font-bold tracking-tight ${deltaVal < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
          {deltaPct > 0 ? `+${deltaPct.toFixed(2)}%` : `${deltaPct.toFixed(2)}%`}
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <span>Delta: {deltaVal < 0 ? `-$${(Math.abs(deltaVal) / 1e6).toFixed(1)}M` : `+$${(deltaVal / 1e6).toFixed(1)}M`}</span>
          <span className="text-slate-600">•</span>
          <span className="truncate max-w-[120px]">{latestStress?.eventType || 'None'}</span>
        </div>
      </div>

      {/* KPI 3: Expected Loss (EL) */}
      <div className="kpi-card group">
        <div className="flex items-center justify-between mb-2">
          <span className="kpi-label">Expected Loss (PD × LGD)</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-amber-300">
          ${(elStressed / 1e6).toFixed(2)}M
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <span>Base EL: ${(elBase / 1e6).toFixed(2)}M</span>
          <span className="text-slate-600">•</span>
          <span className={elStressed > elBase ? 'text-rose-400 font-medium' : 'text-emerald-400'}>
            {elStressed > elBase ? `+${((elStressed - elBase) / 1e6).toFixed(2)}M stress migration` : 'Normal'}
          </span>
        </div>
      </div>

      {/* KPI 4: Active Alerts & SSE Status */}
      <div className="kpi-card group">
        <div className="flex items-center justify-between mb-2">
          <span className="kpi-label">Risk Radar & Signals</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              {sseConnected ? 'SSE Live' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>{activeAlertsCount}</span>
          <span className="text-xs font-normal text-rose-400 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
            High Severity
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>Real-time ingestion active</span>
        </div>
      </div>
    </div>
  );
};
