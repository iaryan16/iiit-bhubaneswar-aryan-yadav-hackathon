import React from 'react';
import { Clock, TrendingDown, ArrowRight } from 'lucide-react';
import type { StressResult } from '../types/risk';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StressHistoryTimelineProps {
  history: StressResult[];
  onSelectRun: (result: StressResult) => void;
  selectedResultId?: string;
}

export const StressHistoryTimeline: React.FC<StressHistoryTimelineProps> = ({
  history,
  onSelectRun,
  selectedResultId,
}) => {
  // Chart data: chronological path of portfolio value
  const chartData = [...history]
    .reverse()
    .map((item, idx) => ({
      index: idx + 1,
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: parseFloat((item.portfolioValueAfter / 1e9).toFixed(3)),
      deltaPct: item.deltaPercentage,
      event: item.eventType,
    }));

  return (
    <div className="glass-panel p-5 mt-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Historical Stress Runs & Portfolio Valuation Path</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">{history.length} Runs Logged</span>
      </div>

      {/* Path Chart */}
      {chartData.length > 1 && (
        <div className="h-44 w-full mb-5 pb-3 border-b border-slate-800/60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={['auto', 'auto']} label={{ value: '$B Value', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
                formatter={(val: any) => [`$${val}B`, 'Stressed Value']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ r: 4, fill: '#0284c7' }}
                activeDot={{ r: 6, fill: '#38bdf8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Timeline List */}
      <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            No historical runs recorded.
          </div>
        ) : (
          history.map((run) => {
            const isSelected = selectedResultId === run.resultId;
            return (
              <div
                key={run.resultId}
                onClick={() => onSelectRun(run)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                  isSelected
                    ? 'bg-blue-950/20 border-blue-500/50'
                    : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-mono text-slate-500 w-16">
                    {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {run.eventType}
                  </span>

                  <span className="text-slate-200 truncate max-w-[280px]">
                    {run.headline}
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="font-mono text-slate-300">
                    ${(run.portfolioValueAfter / 1e9).toFixed(3)}B
                  </span>

                  <div className="flex items-center gap-1 font-mono font-bold text-rose-400">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{run.deltaPercentage.toFixed(2)}%</span>
                  </div>

                  <div className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium">
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
