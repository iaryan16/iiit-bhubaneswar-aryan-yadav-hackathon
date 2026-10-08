import React, { useState } from 'react';
import { X, Play, Sparkles, BrainCircuit } from 'lucide-react';

interface ScenarioInjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (headline: string) => Promise<void>;
}

const PRESET_HEADLINES = [
  {
    title: 'Geopolitical Conflict',
    text: 'Middle East naval escalation: Missile strikes hit critical oil shipping tankers in Strait of Hormuz',
    badge: 'War / Embargo',
  },
  {
    title: 'Emergency Rate Hike',
    text: 'Federal Reserve announces surprise 75 bps emergency interest rate hike as inflation prints 40-year peak',
    badge: 'Macroeconomic',
  },
  {
    title: 'Global Bank Default',
    text: 'Major multinational investment bank faces credit downgrade and insolvency default proceedings',
    badge: 'Credit Event',
  },
  {
    title: 'Infrastructure Blackout',
    text: 'Catastrophic cyberattack and hurricane knock out critical power grid infrastructure causing complete shutdown',
    badge: 'Disaster / Grid',
  },
  {
    title: 'Antitrust Sanction',
    text: 'Global antitrust authorities levy record $5B penalty and mandate immediate asset divestiture on tech giant',
    badge: 'Regulatory',
  },
  {
    title: 'AI Breakthrough',
    text: 'Leading enterprise technology conglomerate unveils groundbreaking quantum AI computing architecture',
    badge: 'Tech Launch',
  },
];

export const ScenarioInjectorModal: React.FC<ScenarioInjectorModalProps> = ({
  isOpen,
  onClose,
  onInject,
}) => {
  if (!isOpen) return null;

  const [headline, setHeadline] = useState<string>(PRESET_HEADLINES[0].text);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim()) return;

    setIsSubmitting(true);
    try {
      await onInject(headline.trim());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Modal Card */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <BrainCircuit className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>AI Scenario Stress Injector</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Autonomous Scoring
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Enter any headline; NLP will predict severity (1-10) and revalue portfolio metrics automatically.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Headline Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase text-slate-300 font-medium">
                Market Event / News Headline
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                Severity & taxonomy predicted by NLP
              </span>
            </div>
            <textarea
              rows={3}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 font-sans leading-relaxed"
              placeholder="Type or paste any hypothetical headline (e.g. Geopolitical conflict escalates, Fed emergency rate hike, bank default...)"
              required
            />
          </div>

          {/* Quick Preset Chips */}
          <div>
            <span className="block text-[11px] font-mono uppercase text-slate-400 mb-2">
              Quick Test Presets (Click to autofill)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_HEADLINES.map((preset) => (
                <button
                  type="button"
                  key={preset.title}
                  onClick={() => setHeadline(preset.text)}
                  className={`p-2.5 rounded-lg text-left border transition-all text-xs flex flex-col justify-between ${
                    headline === preset.text
                      ? 'bg-blue-950/40 border-blue-500/50 text-blue-200 shadow-sm shadow-blue-500/20'
                      : 'bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-white text-[11px]">{preset.title}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">
                    {preset.text}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* AI Autonomous Pipeline Info Card */}
          <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 flex items-start gap-2.5 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="text-blue-300 font-medium">Automatic Pipeline: </span>
              Your input headline will be analyzed by FinBERT sentiment and BART zero-shot categorization. The engine will determine the event category, calculate severity (1–10), and shock all 200 portfolio positions with duration and credit migration revaluations.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !headline.trim()}
              className="btn-primary flex items-center gap-2 text-xs shadow-lg shadow-blue-500/20"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Predicting Severity & Revaluing...' : 'Predict Severity & Revalue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
