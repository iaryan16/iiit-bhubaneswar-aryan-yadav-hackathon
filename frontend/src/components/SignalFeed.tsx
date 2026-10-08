import React, { useState } from 'react';
import { Search, Radio, ShieldAlert, ArrowDownRight, ArrowUpRight } from 'lucide-react';
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

  const getImpactBadge = (score: number) => {
    if (score >= 9) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (score >= 7) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    if (score >= 5) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  };

  const formatEventType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="glass-panel p-5 flex flex-col h-full">
      {/* Header & Clean Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <h2 className="text-sm font-semibold text-white tracking-wide">Live Risk Signal Feed</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
            {filtered.length}
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-lg border border-[#1a2333]">
          <button
            onClick={() => setFilterMinImpact(0)}
            className={`px-2.5 py-0.5 text-[11px] rounded transition-colors ${
              filterMinImpact === 0 ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterMinImpact(threshold)}
            className={`px-2.5 py-0.5 text-[11px] rounded transition-colors ${
              filterMinImpact === threshold ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ≥ {threshold} Impact
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by keyword, entity, topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#090d16] border border-[#1b263b] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
        />
      </div>

      {/* Feed List */}
      <div className="overflow-y-auto max-h-[560px] space-y-2.5 pr-1 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No risk signals match the active filter criteria.
          </div>
        ) : (
          filtered.map((signal) => {
            const isHighSeverity = signal.impactScore >= threshold;

            return (
              <div
                key={signal.signalId}
                onClick={() => onSelectSignal(signal)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isHighSeverity
                    ? 'bg-slate-900/80 border-slate-700/80 hover:border-rose-500/50 hover:bg-slate-850'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Header row: Event category & Severity Badge */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      {formatEventType(signal.eventType)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      • {signal.source}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Sentiment Pill */}
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        signal.sentimentScore < 0
                          ? 'text-rose-400 bg-rose-950/40'
                          : 'text-emerald-400 bg-emerald-950/40'
                      }`}
                    >
                      {signal.sentimentScore < 0 ? (
                        <ArrowDownRight className="w-2.5 h-2.5" />
                      ) : (
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      )}
                      <span>
                        {signal.sentimentScore > 0
                          ? `+${signal.sentimentScore.toFixed(2)}`
                          : signal.sentimentScore.toFixed(2)}
                      </span>
                    </span>

                    {/* Impact Score Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border flex items-center gap-1 ${getImpactBadge(
                        signal.impactScore
                      )}`}
                    >
                      {isHighSeverity && <ShieldAlert className="w-3 h-3 text-rose-400" />}
                      <span>{signal.impactScore}/10</span>
                    </span>
                  </div>
                </div>

                {/* Headline */}
                <h3 className="text-xs text-slate-100 font-medium leading-relaxed hover:text-blue-300 transition-colors">
                  {signal.headline}
                </h3>

                {/* Footer entities if present */}
                {(signal.tickers?.length > 0 || signal.entities?.length > 0) && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {signal.tickers?.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.2 rounded"
                      >
                        ${t}
                      </span>
                    ))}
                    {signal.entities?.map((e) => (
                      <span
                        key={e}
                        className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.2 rounded"
                      >
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
