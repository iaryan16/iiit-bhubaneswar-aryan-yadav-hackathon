import React, { useState } from 'react';
import { Radio, Search, Filter, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { RiskSignal } from '../types/risk';

interface SignalFeedProps {
  signals: RiskSignal[];
  threshold: number;
  onSelectSignal: (signal: RiskSignal) => void;
}

export const SignalFeed: React.FC<SignalFeedProps> = ({
  signals,
  threshold,
  onSelectSignal,
}) => {
  const [filterMinImpact, setFilterMinImpact] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = signals.filter((s) => {
    if (s.impactScore < filterMinImpact) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchHeadline = s.headline.toLowerCase().includes(q);
      const matchSource = s.source.toLowerCase().includes(q);
      const matchEvent = s.eventType.toLowerCase().includes(q);
      const matchEntities = s.entities?.some((e) => e.toLowerCase().includes(q));
      return matchHeadline || matchSource || matchEvent || matchEntities;
    }
    return true;
  });

  const getImpactBadgeClass = (score: number) => {
    if (score >= 9) return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse';
    if (score >= 7) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    if (score >= 4) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  };

  const getEventTypeClass = (type: string) => {
    switch (type) {
      case 'GEOPOLITICAL':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/40';
      case 'MACROECONOMIC':
        return 'text-blue-400 bg-blue-950/40 border-blue-800/40';
      case 'CREDIT_EVENT':
        return 'text-purple-400 bg-purple-950/40 border-purple-800/40';
      case 'MERGER_ACQUISITION':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
      case 'REGULATORY':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/40';
      case 'PRODUCT_LAUNCH':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40';
      case 'NATURAL_DISASTER_OPERATIONAL':
        return 'text-orange-400 bg-orange-950/40 border-orange-800/40';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="glass-panel p-5 flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h2 className="text-base font-semibold text-white tracking-wide">Live Risk Signal Feed</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {filtered.length} active
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search headline, entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-48"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterMinImpact(0)}
              className={`px-2 py-1 text-[11px] rounded transition-colors ${filterMinImpact === 0 ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMinImpact(threshold)}
              className={`px-2 py-1 text-[11px] rounded transition-colors flex items-center gap-1 ${filterMinImpact === threshold ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Filter className="w-2.5 h-2.5" />
              <span>≥ {threshold}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feed List / Table */}
      <div className="overflow-y-auto max-h-[520px] space-y-2 pr-1 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No signals match the current filters.
          </div>
        ) : (
          filtered.map((signal) => {
            const isAboveThreshold = signal.impactScore >= threshold;

            return (
              <div
                key={signal.signalId}
                onClick={() => onSelectSignal(signal)}
                className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-slate-800/40 relative ${
                  isAboveThreshold
                    ? 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50'
                    : 'bg-slate-900/40 border-slate-800/70 hover:border-slate-700'
                }`}
              >
                {/* Highlight Indicator Bar */}
                {isAboveThreshold && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 rounded-l-lg" />
                )}

                <div className="flex items-start justify-between gap-3 mb-1.5 pl-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Event Type */}
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${getEventTypeClass(signal.eventType)}`}>
                      {signal.eventType.replace('_', ' ')}
                    </span>

                    {/* Source Tag */}
                    <span className="text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded font-mono">
                      {signal.source}
                    </span>

                    {/* Region */}
                    {signal.region && (
                      <span className="text-[10px] text-slate-400">
                        • {signal.region}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Sentiment Tag */}
                    <div className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded ${signal.sentimentScore < 0 ? 'text-rose-400 bg-rose-950/30' : 'text-emerald-400 bg-emerald-950/30'}`}>
                      {signal.sentimentScore < 0 ? (
                        <ArrowDownRight className="w-3 h-3" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      <span>{signal.sentimentScore > 0 ? `+${signal.sentimentScore.toFixed(2)}` : signal.sentimentScore.toFixed(2)}</span>
                    </div>

                    {/* Impact Badge */}
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border flex items-center gap-1 ${getImpactBadgeClass(signal.impactScore)}`}>
                      {isAboveThreshold && <ShieldAlert className="w-3 h-3" />}
                      <span>{signal.impactScore}</span>
                    </div>
                  </div>
                </div>

                {/* Headline */}
                <h3 className="text-xs font-medium text-slate-100 pl-1.5 leading-snug hover:text-blue-300 transition-colors">
                  {signal.headline}
                </h3>

                {/* Entities & Tickers */}
                {(signal.entities?.length > 0 || signal.tickers?.length > 0) && (
                  <div className="flex items-center gap-1.5 mt-2 pl-1.5 flex-wrap">
                    {signal.tickers?.map((t) => (
                      <span key={t} className="text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.2 rounded">
                        ${t}
                      </span>
                    ))}
                    {signal.entities?.map((e) => (
                      <span key={e} className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded">
                        {e}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
