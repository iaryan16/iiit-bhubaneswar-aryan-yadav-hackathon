import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Layers, HelpCircle } from 'lucide-react';
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

  // Parse breakdown and top positions JSON from latestStress
  const assetClassData = latestStress?.breakdownByAssetClassJson
    ? Object.entries(JSON.parse(latestStress.breakdownByAssetClassJson)).map(([k, v]) => ({
        name: k,
        delta: Math.round((v as number) / 1e6 * 100) / 100, // in $M
      }))
    : [];

  const sectorData = latestStress?.breakdownBySectorJson
    ? Object.entries(JSON.parse(latestStress.breakdownBySectorJson)).map(([k, v]) => ({
        name: k,
        delta: Math.round((v as number) / 1e6 * 100) / 100, // in $M
      }))
    : [];

  const regionData = latestStress?.breakdownByRegionJson
    ? Object.entries(JSON.parse(latestStress.breakdownByRegionJson)).map(([k, v]) => ({
        name: k,
        delta: Math.round((v as number) / 1e6 * 100) / 100, // in $M
      }))
    : [];

  const topLossPositions: RevaluationPosition[] = latestStress?.topLossPositionsJson
    ? JSON.parse(latestStress.topLossPositionsJson)
    : [];

  // Grouped Bar Comparison Data: Before vs After
  const comparisonData = latestStress
    ? [
        {
          name: 'Portfolio MV ($B)',
          Baseline: parseFloat((latestStress.portfolioValueBefore / 1e9).toFixed(3)),
          Stressed: parseFloat((latestStress.portfolioValueAfter / 1e9).toFixed(3)),
        },
        {
          name: 'Expected Loss ($M)',
          Baseline: parseFloat((latestStress.expectedLossBefore / 1e6).toFixed(2)),
          Stressed: parseFloat((latestStress.expectedLossAfter / 1e6).toFixed(2)),
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Before vs After Chart Panel */}
      <div className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
              <span>Stress Valuation Impact (Before vs After)</span>
              {latestStress && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                  {latestStress.eventType} (Impact {latestStress.impactScore})
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative revaluation of balance sheet capital and credit migration reserves
            </p>
          </div>

          {latestStress && (
            <button
              onClick={() => onOpenWhyDrawer(latestStress)}
              className="btn-secondary flex items-center gap-1.5 text-xs text-blue-300 border-blue-500/30 hover:bg-blue-500/10"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>Why this shock?</span>
            </button>
          )}
        </div>

        {/* Visual Chart */}
        <div className="h-64 w-full">
          {comparisonData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              No stress test executed yet. Inject or trigger a scenario to view Before vs After impact.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Baseline" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Stressed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Breakdown Slices & Tabs */}
      <div className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Loss Breakdown Slices ($ Millions)</h3>
          </div>

          {/* Slices Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('assetClass')}
              className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'assetClass' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Asset Class
            </button>
            <button
              onClick={() => setActiveTab('sector')}
              className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'sector' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sector
            </button>
            <button
              onClick={() => setActiveTab('region')}
              className={`px-3 py-1 text-xs rounded transition-colors ${activeTab === 'region' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Region
            </button>
          </div>
        </div>

        {/* Tab Content Chart */}
        <div className="h-56 w-full">
          {(!latestStress || (activeTab === 'assetClass' ? assetClassData : activeTab === 'sector' ? sectorData : regionData).length === 0) ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Execute a scenario run to inspect multi-dimensional loss slices.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={activeTab === 'assetClass' ? assetClassData : activeTab === 'sector' ? sectorData : regionData}
                margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} angle={-15} textAnchor="end" tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} label={{ value: 'Delta ($M)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`$${val}M`, 'Net Delta']}
                />
                <Bar dataKey="delta" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Top-10 Impacted Positions Table */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-semibold text-white">Top-10 Loss Positions</h3>
            <p className="text-xs text-slate-400">Largest individual position drawdowns in current stress test</p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {topLossPositions.length} positions
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <th className="py-2 px-3">Rank</th>
                <th className="py-2 px-3">Position ID</th>
                <th className="py-2 px-3">Counterparty / Asset</th>
                <th className="py-2 px-3">Asset Class</th>
                <th className="py-2 px-3">Sector</th>
                <th className="py-2 px-3 text-right">Base MV</th>
                <th className="py-2 px-3 text-right">Stressed MV</th>
                <th className="py-2 px-3 text-right">Delta ($)</th>
                <th className="py-2 px-3 text-right">Delta (%)</th>
                <th className="py-2 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {topLossPositions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No stress test data available.
                  </td>
                </tr>
              ) : (
                topLossPositions.map((pos, idx) => (
                  <tr key={pos.positionId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500">#{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-300">{pos.positionId}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{pos.counterparty}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {pos.assetClass}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{pos.sector}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      ${(pos.baseMarketValue / 1e6).toFixed(2)}M
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      ${(pos.stressedMarketValue / 1e6).toFixed(2)}M
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                      -${(Math.abs(pos.deltaValue) / 1e6).toFixed(2)}M
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-400">
                      {pos.deltaPercentage.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onOpenWhyDrawer(latestStress, pos)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 text-[10px] font-medium transition-colors"
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
