import React from 'react';
import { Sliders, RefreshCw, PlayCircle } from 'lucide-react';
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
    <div className="glass-panel p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Dynamic Threshold Slider */}
      <div className="flex items-center gap-4 flex-1 min-w-[280px]">
        <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span>Trigger Threshold:</span>
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold text-sm border border-blue-500/30">
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
          className="flex-1 max-w-[220px] h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-slate-700"
        />

        <div className="text-xs text-slate-400 hidden sm:block">
          Confidence: ≥ {(config.confidenceThreshold * 100).toFixed(0)}%
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onReplay}
          disabled={isReplaying}
          className="btn-secondary flex items-center gap-2 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isReplaying ? 'animate-spin text-blue-400' : ''}`} />
          <span>{isReplaying ? 'Replaying...' : 'Replay Stream'}</span>
        </button>

        <button
          onClick={onOpenInjector}
          className="btn-primary flex items-center gap-2 text-xs shadow-lg shadow-blue-500/20"
        >
          <PlayCircle className="w-4 h-4 text-blue-200" />
          <span>Inject Scenario</span>
        </button>
      </div>
    </div>
  );
};
