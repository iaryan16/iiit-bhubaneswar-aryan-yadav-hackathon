import React, { useState } from 'react';
import { X, Play, Zap } from 'lucide-react';
import type { EventType } from '../types/risk';

interface ScenarioInjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (eventType: EventType, impactScore: number, headline: string) => Promise<void>;
}

const EVENT_OPTIONS: { type: EventType; label: string; defaultHeadline: string }[] = [
  {
    type: 'GEOPOLITICAL',
    label: 'Geopolitical Conflict & Embargo',
    defaultHeadline: 'Strait of Hormuz blockade threatened as regional powers trade missile strikes',
  },
  {
    type: 'MACROECONOMIC',
    label: 'Macro Rate Hike & Inflation',
    defaultHeadline: 'Central banks execute emergency 75bps rate hike as inflation prints 40-year record',
  },
  {
    type: 'CREDIT_EVENT',
    label: 'Major Corporate Default',
    defaultHeadline: 'Top multinational financial firm files for debt restructuring following credit downgrade',
  },
  {
    type: 'NATURAL_DISASTER_OPERATIONAL',
    label: 'Disaster / Grid Blackout',
    defaultHeadline: 'Catastrophic hurricane devastates energy infrastructure and causes operational shutdown',
  },
  {
    type: 'REGULATORY',
    label: 'Antitrust & Heavy Fines',
    defaultHeadline: 'Global antitrust authorities levy record $5B sanction and mandate asset divestiture',
  },
  {
    type: 'MERGER_ACQUISITION',
    label: 'Mega Merger & Acquisition',
    defaultHeadline: 'Tech titans announce $65B mega-merger in artificial intelligence infrastructure',
  },
];

export const ScenarioInjectorModal: React.FC<ScenarioInjectorModalProps> = ({
  isOpen,
  onClose,
  onInject,
}) => {
  if (!isOpen) return null;

  const [selectedType, setSelectedType] = useState<EventType>('GEOPOLITICAL');
  const [impactScore, setImpactScore] = useState<number>(8);
  const [headline, setHeadline] = useState<string>(EVENT_OPTIONS[0].defaultHeadline);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleTypeChange = (type: EventType) => {
    setSelectedType(type);
    const opt = EVENT_OPTIONS.find((o) => o.type === type);
    if (opt) setHeadline(opt.defaultHeadline);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onInject(selectedType, impactScore, headline);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-white">Manual Scenario Injector</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Event Type */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Select Scenario Taxonomy
            </label>
            <select
              value={selectedType}
              onChange={(e) => handleTypeChange(e.target.value as EventType)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {EVENT_OPTIONS.map((opt) => (
                <option key={opt.type} value={opt.type}>
                  {opt.label} ({opt.type})
                </option>
              ))}
            </select>
          </div>

          {/* Impact Score Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-mono uppercase text-slate-400">
                Severity Impact Score (1 to 10)
              </label>
              <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${impactScore >= 8 ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'}`}>
                Impact: {impactScore} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={impactScore}
              onChange={(e) => setImpactScore(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-slate-700"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>1 (Mild)</span>
              <span>7 (Trigger Line)</span>
              <span>10 (Catastrophic)</span>
            </div>
          </div>

          {/* Custom Headline */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
              Headline / News Alert Description
            </label>
            <textarea
              rows={3}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter hypothetical headline..."
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2 text-xs shadow-lg shadow-blue-500/20"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Executing Revaluation...' : 'Execute Stress Shock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
