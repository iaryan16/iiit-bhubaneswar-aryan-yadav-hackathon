import React from 'react';
import { X, Info, Calculator, AlertCircle } from 'lucide-react';
import type { StressResult, RevaluationPosition, AppliedShocks } from '../types/risk';

interface WhyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stressResult: StressResult | null;
  selectedPosition?: RevaluationPosition | null;
}

export const WhyDrawer: React.FC<WhyDrawerProps> = ({
  isOpen,
  onClose,
  stressResult,
  selectedPosition,
}) => {
  if (!isOpen || !stressResult) return null;

  const appliedShocks: AppliedShocks | null = stressResult.appliedShocksJson
    ? JSON.parse(stressResult.appliedShocksJson)
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto custom-scrollbar">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-bold text-white leading-snug tracking-snug">Why This Shock?</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Headline and Event Context */}
            <div className="mt-4 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1 leading-none">
                Trigger Event: {stressResult.eventType} (Impact {stressResult.impactScore}/10)
              </div>
              <div className="text-sm font-medium text-slate-200 leading-normal tracking-normal">
                "{stressResult.headline}"
              </div>
            </div>

            {/* Severity Scaling Formula */}
            <div className="mt-5">
              <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2 flex items-center gap-1.5 leading-normal">
                <Calculator className="w-3.5 h-3.5 text-cyan-400" />
                <span>Severity Scaling Heuristic</span>
              </h3>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1.5 font-mono leading-relaxed tracking-normal">
                <div className="text-slate-400">appliedShock = baseShock × min(impact / 8, 1.5)</div>
                <div className="text-emerald-400">
                  Scaling Factor = min({stressResult.impactScore} / 8, 1.5) ={' '}
                  <span className="font-bold">{appliedShocks?.severityScaling.toFixed(3) || '1.000'}x</span>
                </div>
              </div>
            </div>

            {/* Shock Vectors */}
            {appliedShocks && (
              <div className="mt-5">
                <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2 leading-normal">
                  Calibrated Macro & Market Shocks
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono leading-normal tracking-normal">
                  <div className="p-2.5 rounded bg-slate-800/40 border border-slate-700/40">
                    <span className="text-slate-400 block text-2xs uppercase tracking-wider leading-none mb-1">Equity Shock</span>
                    <span className="font-bold text-rose-400 text-sm leading-tight tracking-tight">{appliedShocks.equityShockPct.toFixed(1)}%</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-800/40 border border-slate-700/40">
                    <span className="text-slate-400 block text-2xs uppercase tracking-wider leading-none mb-1">Rate Shift</span>
                    <span className="font-bold text-blue-400 text-sm leading-tight tracking-tight">{appliedShocks.rateShockBp.toFixed(0)} bps</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-800/40 border border-slate-700/40">
                    <span className="text-slate-400 block text-2xs uppercase tracking-wider leading-none mb-1">Credit Spread</span>
                    <span className="font-bold text-amber-400 text-sm leading-tight tracking-tight">+{appliedShocks.creditSpreadBp.toFixed(0)} bps</span>
                  </div>
                  <div className="p-2.5 rounded bg-slate-800/40 border border-slate-700/40">
                    <span className="text-slate-400 block text-2xs uppercase tracking-wider leading-none mb-1">PD Multiplier</span>
                    <span className="font-bold text-purple-400 text-sm leading-tight tracking-tight">{appliedShocks.pdMultiplier.toFixed(2)}x</span>
                  </div>
                </div>

                {appliedShocks.highImpactMigration && (
                  <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-1.5 leading-normal tracking-normal">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Impact ≥ 8 triggered 1-notch rating migration (+25% PD surcharge).</span>
                  </div>
                )}
              </div>
            )}

            {/* Position Specific Detail if selected */}
            {selectedPosition && (
              <div className="mt-5">
                <h3 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-2 leading-normal">
                  Position Revaluation: {selectedPosition.positionId}
                </h3>
                <div className="p-3 rounded-lg bg-slate-800/70 border border-slate-700 text-xs space-y-2 leading-normal tracking-normal">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Counterparty:</span>
                    <span className="font-medium text-white">{selectedPosition.counterparty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Asset Class:</span>
                    <span className="font-mono text-slate-200">{selectedPosition.assetClass}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Net Delta:</span>
                    <span className="font-mono font-bold text-rose-400">
                      -${(Math.abs(selectedPosition.deltaValue) / 1e6).toFixed(3)}M ({selectedPosition.deltaPercentage.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-700 text-xs text-slate-300 leading-relaxed tracking-normal">
                    <span className="font-mono text-blue-300 block mb-0.5 leading-normal">Pricing Model Rationale:</span>
                    {selectedPosition.rationale}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs leading-none tracking-normal transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
