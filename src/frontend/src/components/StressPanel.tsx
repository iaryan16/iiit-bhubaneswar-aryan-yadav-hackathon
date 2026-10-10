import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Layers, HelpCircle, ArrowDownRight, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { StressResult, RevaluationPosition } from '../types/risk';

interface StressPanelProps {
  latestStress: StressResult | null;
  onOpenWhyDrawer: (stress: StressResult | null, position?: RevaluationPosition) => void;
}

export const StressPanel: React.FC<StressPanelProps> = ({
  latestStress,
  onOpenWhyDrawer,
}) => {
  const [activeTab, setActiveTab] = useState<'assetClass' | 'sector' | 'region'>('assetClass');
  const [showAllPositions, setShowAllPositions] = useState<boolean>(false);

  // Parse breakdown and top positions JSON
  const assetClassData = latestStress?.breakdownByAssetClassJson
    ? Object.entries(JSON.parse(latestStress.breakdownByAssetClassJson)).map(([k, v]) => ({
        name: k,
        delta: Math.round(((v as number) / 1e6) * 100) / 100, // in $M
      }))
    : [];

  const sectorData = latestStress?.breakdownBySectorJson
    ? Object.entries(JSON.parse(latestStress.breakdownBySectorJson)).map(([k, v]) => ({
        name: k,
        delta: Math.round(((v as number) / 1e6) * 100) / 100, // in $M
      }))
    : [];

  const regionData = latestStress?.breakdownByRegionJson
    ? Object.entries(JSON.parse(latestStress.breakdownByRegionJson)).map(([k, v]) => ({
        name: k,
        delta: Math.round(((v as number) / 1e6) * 100) / 100, // in $M
      }))
    : [];

  const topLossPositions: RevaluationPosition[] = latestStress?.topLossPositionsJson
    ? JSON.parse(latestStress.topLossPositionsJson)
    : [];

  const displayedPositions = showAllPositions ? topLossPositions : topLossPositions.slice(0, 5);

  const currentChartData =
    activeTab === 'assetClass' ? assetClassData : activeTab === 'sector' ? sectorData : regionData;

  const retainedPct = latestStress
    ? Math.max(0, Math.min(100, (latestStress.portfolioValueAfter / latestStress.portfolioValueBefore) * 100))
    : 100;

  return (
    <div className="space-y-6">
      {/* 1. Active Scenario Context & Direct Impact Card */}
      <div className="glass-panel p-6 scroll-reveal">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 leading-none">Current Shock Scenario</span>
              {latestStress && (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium leading-none tracking-wide">
                  {latestStress.eventType.replace('_', ' ')} • Severity {latestStress.impactScore}/10
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white leading-snug tracking-tight mt-2">
              {latestStress?.headline || 'No scenario injected yet. Inject a scenario to see stress revaluation.'}
            </h2>
          </div>

          {latestStress && (
            <button
              onClick={() => onOpenWhyDrawer(latestStress)}
              className="btn-secondary text-sm flex items-center gap-2 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10 px-4 py-2 leading-none tracking-normal"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Explain Math</span>
            </button>
          )}
        </div>

        {/* Dual Impact Cards with Intuitive Progress Bar */}
        {latestStress ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Box 1: Portfolio Capital Revaluation */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400 leading-none mb-3">
                <span>Portfolio Capital Shock</span>
                <span className="font-mono text-rose-400 flex items-center gap-1 font-bold text-xs leading-none tracking-tight">
                  <ArrowDownRight className="w-4 h-4" />
                  {latestStress.deltaPercentage.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-2xl font-bold text-white font-mono leading-tight tracking-tight">
                    ${(latestStress.portfolioValueAfter / 1e9).toFixed(3)}B
                  </span>
                  <span className="text-xs text-slate-400 font-mono ml-2 leading-none tracking-normal">
                    from ${(latestStress.portfolioValueBefore / 1e9).toFixed(3)}B
                  </span>
                </div>
                <span className="text-xs font-mono font-semibold text-rose-400 leading-none tracking-tight">
                  -${(Math.abs(latestStress.deltaValue) / 1e6).toFixed(1)}M loss
                </span>
              </div>
              {/* Visual Value Retention Bar */}
              <div className="space-y-1.5">
                <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${retainedPct}%` }}
                  />
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${100 - retainedPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 font-mono leading-normal tracking-wide">
                  <span>{retainedPct.toFixed(1)}% Retained Capital</span>
                  <span>{(100 - retainedPct).toFixed(1)}% Drawdown</span>
                </div>
              </div>
            </div>

            {/* Box 2: Credit Migration & Expected Loss */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400 leading-none mb-3">
                <span>Credit Loss Reserve (PD × LGD)</span>
                <span className="font-mono text-amber-400 font-bold text-xs leading-none tracking-tight">
                  +${((latestStress.expectedLossAfter - latestStress.expectedLossBefore) / 1e6).toFixed(2)}M
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-2xl font-bold text-amber-300 font-mono leading-tight tracking-tight">
                    ${(latestStress.expectedLossAfter / 1e6).toFixed(2)}M
                  </span>
                  <span className="text-xs text-slate-400 font-mono ml-2 leading-none tracking-normal">
                    from ${(latestStress.expectedLossBefore / 1e6).toFixed(2)}M
                  </span>
                </div>
                <span className="text-xs font-mono text-amber-400/80 font-medium leading-none tracking-normal">
                  Rating Migration
                </span>
              </div>
              {/* Context Pill */}
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-center gap-2 leading-normal tracking-normal">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  High-yield transition and spread widening increase mandatory capital reserves.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm leading-normal tracking-normal">
            Execute a scenario injection to inspect Before vs After revaluation.
          </div>
        )}
      </div>

      {/* 2. Loss Breakdown Slices ($ Millions) */}
      <div className="glass-panel p-6 scroll-reveal scroll-reveal-delay-1">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white leading-snug tracking-snug">Loss Breakdown by Exposure ($ Millions)</h3>
          </div>

          {/* Slices Tabs */}
          <div className="flex items-center gap-1 bg-[#090d16] p-1.5 rounded-lg border border-[#1a2333]">
            <button
              onClick={() => setActiveTab('assetClass')}
              className={`px-4 py-1.5 text-sm rounded transition-colors leading-none tracking-normal ${
                activeTab === 'assetClass' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Asset Class
            </button>
            <button
              onClick={() => setActiveTab('sector')}
              className={`px-4 py-1.5 text-sm rounded transition-colors leading-none tracking-normal ${
                activeTab === 'sector' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sector
            </button>
            <button
              onClick={() => setActiveTab('region')}
              className={`px-4 py-1.5 text-sm rounded transition-colors leading-none tracking-normal ${
                activeTab === 'region' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Region
            </button>
          </div>
        </div>

        {/* Tab Content Bar Chart */}
        <div className="h-56 w-full">
          {currentChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs leading-normal tracking-normal">
              Execute a scenario test to view loss distribution slices.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  label={{ value: 'Net Loss ($M)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`$${val}M`, 'Net Impact']}
                />
                <Bar dataKey="delta" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Top Impacted Holdings */}
      <div className="glass-panel p-6 scroll-reveal scroll-reveal-delay-2">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white leading-snug tracking-snug">Top Impacted Holdings</h3>
            <p className="text-sm text-slate-400 leading-normal tracking-normal mt-0.5">Largest individual position drawdowns in active stress test</p>
          </div>
          {topLossPositions.length > 5 && (
            <button
              onClick={() => setShowAllPositions(!showAllPositions)}
              className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1.5 transition-colors leading-none tracking-normal"
            >
              <span>{showAllPositions ? 'Show top 5' : `Show all ${topLossPositions.length}`}</span>
              {showAllPositions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-sm leading-normal tracking-normal">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono text-xs uppercase tracking-wider leading-none">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Position & Counterparty</th>
                <th className="py-3 px-4">Asset Class</th>
                <th className="py-3 px-4 text-right">Base MV</th>
                <th className="py-3 px-4 text-right">Stressed MV</th>
                <th className="py-3 px-4 text-right">Net Loss</th>
                <th className="py-3 px-4 text-right">Loss %</th>
                <th className="py-3 px-4 text-center">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedPositions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No stress test data available.
                  </td>
                </tr>
              ) : (
                displayedPositions.map((pos, idx) => (
                  <tr key={pos.positionId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-500 leading-normal tracking-wide">#{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-sm text-white leading-snug tracking-normal">{pos.counterparty}</div>
                      <div className="font-mono text-xs text-slate-400 leading-normal tracking-wide">{pos.positionId} • {pos.sector}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs leading-none tracking-normal">
                        {pos.assetClass}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-slate-300 leading-normal tracking-tight">
                      ${(pos.baseMarketValue / 1e6).toFixed(2)}M
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-slate-300 leading-normal tracking-tight">
                      ${(pos.stressedMarketValue / 1e6).toFixed(2)}M
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm font-bold text-rose-400 leading-normal tracking-tight">
                      -${(Math.abs(pos.deltaValue) / 1e6).toFixed(2)}M
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm text-rose-400 leading-normal tracking-tight">
                      {pos.deltaPercentage.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onOpenWhyDrawer(latestStress, pos)}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-medium leading-none tracking-normal transition-colors"
                      >
                        Why?
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
