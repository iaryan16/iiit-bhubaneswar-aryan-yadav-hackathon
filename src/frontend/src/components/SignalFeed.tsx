import React, { useState } from 'react';
import { Search, Radio, ShieldAlert, ArrowDownRight, ArrowUpRight, RefreshCw, RotateCcw } from 'lucide-react';
import type { RiskSignal } from '../types/risk';

interface SignalFeedProps {
  signals: RiskSignal[];
  threshold: number;
  onSelectSignal: (signal: RiskSignal) => void;
  onReplaySignals?: () => void;
  onResetSignals?: () => void;
  isReplaying?: boolean;
  isResetting?: boolean;
}

export const SignalFeed: React.FC<SignalFeedProps> = ({
  signals,
  threshold,
  onSelectSignal,
  onReplaySignals,
  onResetSignals,
  isReplaying = false,
  isResetting = false,
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
    <div className="glass-panel p-6 flex flex-col h-full scroll-reveal">
      {/* Header & Clean Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h2 className="text-xl font-bold text-white leading-snug tracking-snug">Live Risk Signal Feed</h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono leading-none tracking-wide">
            {filtered.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Chips */}
          <div className="flex items-center gap-1 bg-[#090d16] p-1.5 rounded-lg border border-[#1a2333]">
            <button
              onClick={() => setFilterMinImpact(0)}
              className={`px-3 py-1 text-xs leading-none tracking-normal rounded transition-colors ${
                filterMinImpact === 0 ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMinImpact(threshold)}
              className={`px-3 py-1 text-xs leading-none tracking-normal rounded transition-colors ${
                filterMinImpact === threshold ? 'bg-rose-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ≥ {threshold} Impact
            </button>
          </div>

          {onReplaySignals && (
            <button
              onClick={onReplaySignals}
              disabled={isReplaying || isResetting}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 leading-none tracking-normal"
              title="Replay stream with fresh signals"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReplaying ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isReplaying ? 'Replaying...' : 'Replay Signals'}</span>
            </button>
          )}

          {onResetSignals && (
            <button
              onClick={onResetSignals}
              disabled={isReplaying || isResetting}
              className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 leading-none tracking-normal"
              title="Reset signals database to baseline seed stream"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isResetting ? 'Resetting...' : 'Reset Default'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Filter by keyword, entity, topic..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#090d16] border border-[#1b263b] rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 leading-normal tracking-normal"
        />
      </div>

      {/* Feed List */}
      <div className="overflow-y-auto max-h-[560px] space-y-3 pr-2 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm leading-normal tracking-normal">
            No risk signals match the active filter criteria.
          </div>
        ) : (
          filtered.map((signal) => {
            const isHighSeverity = signal.impactScore >= threshold;

            return (
              <div
                key={signal.signalId}
                onClick={() => onSelectSignal(signal)}
                className={`p-5 rounded-xl border transition-all cursor-pointer relative ${
                  isHighSeverity
                    ? 'bg-slate-900/80 border-slate-700/80 hover:border-rose-500/50 hover:bg-slate-850'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Header row: Event category & Severity Badge */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 leading-none">
                      {formatEventType(signal.eventType)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono leading-none tracking-wide">
                      • {signal.source}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sentiment Pill */}
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded flex items-center gap-1 leading-none tracking-normal ${
                        signal.sentimentScore < 0
                          ? 'text-rose-400 bg-rose-950/40'
                          : 'text-emerald-400 bg-emerald-950/40'
                      }`}
                    >
                      {signal.sentimentScore < 0 ? (
                        <ArrowDownRight className="w-3 h-3" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      <span>
                        {signal.sentimentScore > 0
                          ? `+${signal.sentimentScore.toFixed(2)}`
                          : signal.sentimentScore.toFixed(2)}
                      </span>
                    </span>

                    {/* Impact Score Pill */}
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-mono font-bold border flex items-center gap-1.5 leading-none tracking-normal ${getImpactBadge(
                        signal.impactScore
                      )}`}
                    >
                      {isHighSeverity && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                      <span>{signal.impactScore}/10</span>
                    </span>
                  </div>
                </div>

                {/* Headline */}
                <h3 className="text-sm text-slate-100 font-semibold leading-normal tracking-normal hover:text-blue-300 transition-colors">
                  {signal.headline}
                </h3>

                {/* Footer entities if present */}
                {(signal.tickers?.length > 0 || signal.entities?.length > 0) && (
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {signal.tickers?.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded leading-none tracking-wide"
                      >
                        ${t}
                      </span>
                    ))}
                    {signal.entities?.map((e) => (
                      <span
                        key={e}
                        className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded leading-none tracking-wide"
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
