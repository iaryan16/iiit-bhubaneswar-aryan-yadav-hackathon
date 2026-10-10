import React from 'react';
import { DollarSign, TrendingDown, ShieldAlert, Radio } from 'lucide-react';
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
  const elDelta = elStressed - elBase;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1: Active Portfolio Value */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 leading-none tracking-wide">Portfolio Value</span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white font-sans leading-tight">
          ${(currentVal / 1e9).toFixed(3)}B
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 leading-normal tracking-normal">
          <span>Baseline: ${(baselineVal / 1e9).toFixed(3)}B</span>
          <span className="text-slate-600">•</span>
          <span>{summary?.totalPositions || 200} Assets</span>
        </div>
      </div>

      {/* KPI 2: Stress Impact Drawdown */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 leading-none tracking-wide">Latest Stress Impact</span>
          <div className={`p-1.5 rounded-lg ${deltaVal < 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl font-bold tracking-tight font-sans leading-tight ${deltaVal < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
          {deltaPct >= 0 ? `+${deltaPct.toFixed(2)}%` : `${deltaPct.toFixed(2)}%`}
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 truncate leading-normal tracking-normal">
          <span>{deltaVal < 0 ? `-$${(Math.abs(deltaVal) / 1e6).toFixed(1)}M` : `+$${(deltaVal / 1e6).toFixed(1)}M`}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-300 font-medium">{latestStress ? latestStress.eventType : 'Baseline Normal'}</span>
        </div>
      </div>

      {/* KPI 3: Expected Loss (PD x LGD) */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 leading-none tracking-wide">Expected Credit Loss</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-amber-300 font-sans leading-tight">
          ${(elStressed / 1e6).toFixed(2)}M
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 leading-normal tracking-normal">
          <span>Base: ${(elBase / 1e6).toFixed(2)}M</span>
          <span className="text-slate-600">•</span>
          <span className={elDelta > 0 ? 'text-rose-400 font-medium' : 'text-slate-400'}>
            {elDelta > 0 ? `+${(elDelta / 1e6).toFixed(2)}M migration` : 'Normal'}
          </span>
        </div>
      </div>

      {/* KPI 4: Ingestion & Risk Radar */}
      <div className="kpi-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 leading-none tracking-wide">Risk Radar Monitor</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-2xs font-mono border border-slate-700 leading-none tracking-wider uppercase">
            <span className={`w-1.5 h-1.5 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className={sseConnected ? 'text-emerald-400' : 'text-slate-400'}>
              {sseConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-white font-sans flex items-center gap-2 leading-tight">
          <span>{activeAlertsCount}</span>
          <span className="text-xs font-normal text-rose-300 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 leading-none tracking-normal">
            High Impact
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400 leading-normal tracking-normal">
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span>Real-time news & signals</span>
        </div>
      </div>
    </div>
  );
};
