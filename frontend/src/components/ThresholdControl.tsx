import React from 'react';
import { Sliders, RefreshCw, Zap } from 'lucide-react';
import type { ThresholdConfig } from '../types/risk';

interface ThresholdControlProps {
  config: ThresholdConfig;
  onChange: (newThreshold: number) => void;
  onReplay: () => void;
  onOpenInjector: () => void;
  isReplaying: boolean;
}

export const ThresholdControl: React.FC<ThresholdControlProps> = ({
  config,
  onChange,
  onReplay,
  onOpenInjector,
  isReplaying,
}) => {
  return (
    <div className="glass-panel p-3.5 mb-6 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Dynamic Threshold Slider */}
      <div className="flex items-center gap-4 flex-1 min-w-[280px]">
        <div className="flex items-center gap-2 text-slate-300 font-medium text-xs">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>Stress Trigger Level:</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
            ≥ {config.impactThreshold} / 10
          </span>
        </div>

        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={config.impactThreshold}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="flex-1 max-w-[180px] h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-slate-700"
        />

        {/* Quick presets */}
        <div className="hidden sm:flex items-center gap-1">
          {[5, 7, 9].map((lvl) => (
            <button
              key={lvl}
              onClick={() => onChange(lvl)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                config.impactThreshold === lvl
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden md:block">
          Debounce: {config.debounceMinutes}m
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onReplay}
          disabled={isReplaying}
          className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
          title="Replay synthetic GDELT and News stream"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReplaying ? 'animate-spin text-blue-400' : ''}`} />
          <span>{isReplaying ? 'Replaying...' : 'Replay Signals'}</span>
        </button>

        <button
          onClick={onOpenInjector}
          className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3.5 shadow-md shadow-blue-500/20"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>Inject Scenario</span>
        </button>
      </div>
    </div>
  );
};
