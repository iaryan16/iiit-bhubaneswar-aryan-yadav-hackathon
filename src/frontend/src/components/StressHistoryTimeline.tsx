import React, { useState } from 'react';
import { Clock, TrendingDown, ArrowRight, DollarSign, Percent, Activity } from 'lucide-react';
import type { StressResult } from '../types/risk';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface StressHistoryTimelineProps {
  history: StressResult[];
  onSelectRun: (result: StressResult) => void;
  selectedResultId?: string;
}

type MetricMode = 'valuation' | 'drawdown';

export const StressHistoryTimeline: React.FC<StressHistoryTimelineProps> = ({
  history,
  onSelectRun,
  selectedResultId,
}) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('valuation');

  // Chart data: chronological path of portfolio value (oldest to newest)
  const chartData = [...history]
    .reverse()
    .map((item, idx) => {
      const date = new Date(item.timestamp);
      const timeStr = isNaN(date.getTime())
        ? `T+${idx}`
        : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const baselineB = item.portfolioValueBefore > 0 ? item.portfolioValueBefore / 1e9 : 1.759;
      const stressedB = item.portfolioValueAfter / 1e9;
      const deltaPct = item.deltaPercentage ?? ((item.portfolioValueAfter - item.portfolioValueBefore) / item.portfolioValueBefore) * 100;

      return {
        id: item.resultId,
        index: idx + 1,
        // Unique XAxis identifier to prevent Recharts from grouping runs occurring in the same minute
        xLabel: `#${idx + 1} (${timeStr.split(' ')[0]})`,
        time: timeStr,
        value: parseFloat(stressedB.toFixed(4)),
        baseline: parseFloat(baselineB.toFixed(4)),
        deltaPct: parseFloat(deltaPct.toFixed(2)),
        deltaUsd: item.deltaValue,
        event: item.eventType,
        impactScore: item.impactScore,
        headline: item.headline,
        rawRun: item,
      };
    });

  // Calculate dynamic padded domain to prevent Recharts flatline bug
  const baselineVal = chartData.length > 0 ? chartData[0].baseline : 1.759;
  const values = chartData.map((d) => d.value);
  const minVal = values.length > 0 ? Math.min(...values, baselineVal) : 1.4;
  const maxVal = values.length > 0 ? Math.max(...values, baselineVal) : 1.8;
  const valSpread = Math.max(0.06, (maxVal - minVal) * 0.18);
  const valDomain = [
    parseFloat(Math.max(0, minVal - valSpread).toFixed(3)),
    parseFloat((maxVal + valSpread).toFixed(3)),
  ];

  // Drawdown domain
  const drawdowns = chartData.map((d) => d.deltaPct);
  const minDd = drawdowns.length > 0 ? Math.min(...drawdowns, 0) : -20;
  const maxDd = drawdowns.length > 0 ? Math.max(...drawdowns, 0) : 0;
  const ddSpread = Math.max(2.0, (maxDd - minDd) * 0.15);
  const ddDomain = [
    parseFloat((minDd - ddSpread).toFixed(1)),
    parseFloat(Math.max(1, maxDd + ddSpread).toFixed(1)),
  ];

  return (
    <div className="glass-panel p-5 mt-6 scroll-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <h3 className="text-base font-semibold text-white leading-snug tracking-snug">
            Historical Stress Runs & Portfolio Valuation Path
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Metric View Switcher */}
          {chartData.length > 1 && (
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-2xs">
              <button
                type="button"
                onClick={() => setMetricMode('valuation')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-medium ${
                  metricMode === 'valuation'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View portfolio market value trajectory ($B)"
              >
                <DollarSign className="w-3 h-3" />
                <span>Value ($B)</span>
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('drawdown')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all font-medium ${
                  metricMode === 'drawdown'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View drawdown percentage trajectory (%)"
              >
                <Percent className="w-3 h-3" />
                <span>Drawdown (%)</span>
              </button>
            </div>
          )}

          <span className="text-xs text-slate-400 font-mono leading-none tracking-wide bg-slate-800/60 px-2 py-1 rounded border border-slate-700/50">
            {history.length} Runs Logged
          </span>
        </div>
      </div>

      {/* Path Chart */}
      {chartData.length > 1 ? (
        <div className="h-52 w-full mb-5 pb-3 border-b border-slate-800/60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 30, left: 15, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="xLabel"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                interval={Math.max(0, Math.floor(chartData.length / 8))}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                domain={metricMode === 'valuation' ? valDomain : ddDomain}
                tickFormatter={(val: number) =>
                  metricMode === 'valuation' ? `$${val.toFixed(2)}B` : `${val.toFixed(1)}%`
                }
                label={{
                  value: metricMode === 'valuation' ? 'Stressed MV ($B)' : 'Drawdown (%)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#64748b',
                  fontSize: 10,
                  offset: 0,
                }}
              />

              {/* Reference Baseline */}
              {metricMode === 'valuation' ? (
                <ReferenceLine
                  y={baselineVal}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  label={{
                    value: `Baseline $${baselineVal.toFixed(3)}B`,
                    position: 'insideTopRight',
                    fill: '#94a3b8',
                    fontSize: 10,
                  }}
                />
              ) : (
                <ReferenceLine
                  y={0}
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  label={{
                    value: '0% Baseline',
                    position: 'insideTopRight',
                    fill: '#94a3b8',
                    fontSize: 10,
                  }}
                />
              )}

              {/* Custom Rich Tooltip */}
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const isSelected = selectedResultId === data.id;
                    return (
                      <div className="bg-slate-900/95 border border-slate-700/80 rounded-lg p-3 shadow-2xl backdrop-blur-md text-xs z-50 min-w-[240px]">
                        <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-slate-800">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-emerald-400" />
                            Run #{data.index}
                          </span>
                          <span className="font-mono text-slate-400 text-2xs">{data.time}</span>
                        </div>
                        <div className="text-emerald-400 font-semibold mb-1 flex items-center justify-between">
                          <span>{data.event}</span>
                          {data.impactScore && (
                            <span className="text-2xs bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                              Impact {data.impactScore}/10
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 text-2xs line-clamp-2 mb-2 italic">
                          "{data.headline}"
                        </div>
                        <div className="space-y-1 font-mono text-2xs pt-1 border-t border-slate-800/80">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Stressed Value:</span>
                            <span className="text-white font-bold">${data.value.toFixed(4)}B</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Baseline Value:</span>
                            <span className="text-slate-300">${data.baseline.toFixed(4)}B</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400">Net Drawdown:</span>
                            <span className="text-rose-400 font-bold">
                              {data.deltaPct.toFixed(2)}% (${(data.deltaUsd / 1e6).toFixed(1)}M)
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-2xs text-emerald-400/80 text-right">
                          {isSelected ? '✓ Currently Selected' : 'Click dot to inspect run'}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Line
                type="monotone"
                dataKey={metricMode === 'valuation' ? 'value' : 'deltaPct'}
                stroke={metricMode === 'valuation' ? '#10b981' : '#f43f5e'}
                strokeWidth={2.5}
                dot={{
                  r: 3.5,
                  fill: metricMode === 'valuation' ? '#059669' : '#e11d48',
                  strokeWidth: 1,
                  stroke: '#0f172a',
                }}
                activeDot={{
                  r: 6,
                  fill: metricMode === 'valuation' ? '#34d399' : '#fb7185',
                  stroke: '#ffffff',
                  strokeWidth: 2,
                  onClick: (_event: any, payload: any) => {
                    if (payload && payload.payload && payload.payload.rawRun) {
                      onSelectRun(payload.payload.rawRun);
                    }
                  },
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : chartData.length === 1 ? (
        <div className="mb-4 p-3 bg-slate-900/40 border border-slate-800/60 rounded-lg flex items-center justify-between text-xs text-slate-400">
          <span>Initial stress baseline point recorded (${chartData[0].value.toFixed(3)}B).</span>
          <span className="text-emerald-400">Run more scenarios or replay signals to visualize valuation path.</span>
        </div>
      ) : null}

      {/* Timeline List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs leading-normal tracking-normal">
            No historical runs recorded.
          </div>
        ) : (
          history.map((run, idx) => {
            const isSelected = selectedResultId === run.resultId;
            const runNum = history.length - idx;
            return (
              <div
                key={run.resultId}
                onClick={() => onSelectRun(run)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs leading-normal tracking-normal ${
                  isSelected
                    ? 'bg-emerald-950/20 border-emerald-500/50'
                    : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xs font-mono font-bold text-slate-400 w-6">
                    #{runNum}
                  </span>
                  <div className="text-2xs font-mono text-slate-500 w-16 leading-none tracking-wide">
                    {new Date(run.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>

                  <span className="font-mono text-2xs uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 leading-none">
                    {run.eventType}
                  </span>

                  <span className="text-slate-200 truncate max-w-[280px] text-xs leading-normal tracking-normal">
                    {run.headline}
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="font-mono text-slate-300 text-xs leading-none tracking-tight">
                    ${(run.portfolioValueAfter / 1e9).toFixed(3)}B
                  </span>

                  <div className="flex items-center gap-1 font-mono font-bold text-rose-400 text-xs leading-none tracking-tight">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{run.deltaPercentage.toFixed(2)}%</span>
                  </div>

                  <div className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium text-xs leading-none tracking-normal">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

