import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPortfolioSummary,
  fetchSignals,
  fetchStressResults,
  fetchThresholdConfig,
  updateThresholdConfig,
  triggerManualStress,
  triggerReplayStream,
  fetchHealth,
} from './api/riskApi';
import { useEventSource } from './hooks/useEventSource';
import { HeaderKpis } from './components/HeaderKpis';
import { ThresholdControl } from './components/ThresholdControl';
import { SignalFeed } from './components/SignalFeed';
import { StressPanel } from './components/StressPanel';
import { WhyDrawer } from './components/WhyDrawer';
import { ScenarioInjectorModal } from './components/ScenarioInjectorModal';
import { StressHistoryTimeline } from './components/StressHistoryTimeline';
import type {
  RiskSignal,
  StressResult,
  RevaluationPosition,
} from './types/risk';
import { Shield, Sparkles, Terminal } from 'lucide-react';

export default function App() {
  const queryClient = useQueryClient();

  // State
  const [selectedStress, setSelectedStress] = useState<StressResult | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<RevaluationPosition | null>(null);
  const [isWhyDrawerOpen, setIsWhyDrawerOpen] = useState(false);
  const [isInjectorOpen, setIsInjectorOpen] = useState(false);

  // Queries
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 15000,
  });

  const { data: summary } = useQuery({
    queryKey: ['portfolio-summary'],
    queryFn: fetchPortfolioSummary,
  });

  const { data: initialSignals = [] } = useQuery({
    queryKey: ['signals'],
    queryFn: () => fetchSignals(),
  });

  const { data: initialStressResults = [] } = useQuery({
    queryKey: ['stress-results'],
    queryFn: fetchStressResults,
  });

  const { data: thresholdConfig = { impactThreshold: 7, confidenceThreshold: 0.5, debounceMinutes: 30 } } =
    useQuery({
      queryKey: ['threshold-config'],
      queryFn: fetchThresholdConfig,
    });

  // SSE Streams
  const { data: liveSignal, isConnected: sseSignalsConnected } = useEventSource<RiskSignal>(
    '/api/signals/stream',
    'SIGNAL'
  );

  const { data: liveStress, isConnected: sseStressConnected } = useEventSource<StressResult>(
    '/api/stress/stream',
    'STRESS_RUN'
  );

  // Merged Signals List
  const signalsList = liveSignal
    ? [liveSignal, ...initialSignals.filter((s) => s.signalId !== liveSignal.signalId)]
    : initialSignals;

  // Merged Stress Results List
  const stressHistory = liveStress
    ? [liveStress, ...initialStressResults.filter((r) => r.resultId !== liveStress.resultId)]
    : initialStressResults;

  // Active displayed stress run (defaults to latest)
  const currentStressRun = selectedStress || stressHistory[0] || null;

  // Threshold update mutation
  const thresholdMutation = useMutation({
    mutationFn: (newThreshold: number) =>
      updateThresholdConfig({ ...thresholdConfig, impactThreshold: newThreshold }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['threshold-config'], updated);
    },
  });

  // Replay stream mutation
  const replayMutation = useMutation({
    mutationFn: triggerReplayStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      queryClient.invalidateQueries({ queryKey: ['stress-results'] });
    },
  });

  // Manual inject mutation
  const injectMutation = useMutation({
    mutationFn: (payload: { headline: string; eventType?: string; impactScore?: number }) =>
      triggerManualStress(payload),
    onSuccess: (newRun) => {
      setSelectedStress(newRun);
      queryClient.invalidateQueries({ queryKey: ['stress-results'] });
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] });
    },
  });

  const handleOpenWhyDrawer = (stress: StressResult | null, pos?: RevaluationPosition) => {
    if (stress) setSelectedStress(stress);
    setSelectedPosition(pos || null);
    setIsWhyDrawerOpen(true);
  };

  const handleSelectSignal = (signal: RiskSignal) => {
    // If signal has associated stress run, inspect it
    const matchingRun = stressHistory.find((r) => r.triggerSignalId === signal.signalId);
    if (matchingRun) {
      setSelectedStress(matchingRun);
    } else {
      // Allow user to trigger it manually
      handleOpenWhyDrawer(currentStressRun);
    }
  };

  const highSeverityAlertsCount = signalsList.filter(
    (s) => s.impactScore >= thresholdConfig.impactThreshold
  ).length;

  return (
    <div className="min-h-screen pb-16">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide">
                  CRISIL & S&P GLOBAL RISK STRESS ENGINE
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  MODULE B
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Real-Time NLP Signal Ingestion & Financial Stress Revaluation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sidecar status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400 text-[11px]">NLP Engine:</span>
              <span className="font-mono text-[11px] text-emerald-400 font-medium">
                {health?.nlpSidecar || 'STANDALONE_FALLBACK_READY'}
              </span>
            </div>

            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              <span>Swagger UI</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header KPIs */}
        <HeaderKpis
          summary={summary}
          latestStress={currentStressRun}
          activeAlertsCount={highSeverityAlertsCount}
          sseConnected={sseSignalsConnected || sseStressConnected}
        />

        {/* Dynamic Controls Bar */}
        <ThresholdControl
          config={thresholdConfig}
          onChange={(newVal) => thresholdMutation.mutate(newVal)}
          onReplay={() => replayMutation.mutate()}
          onOpenInjector={() => setIsInjectorOpen(true)}
          isReplaying={replayMutation.isPending}
        />

        {/* Two-Column Grid: Left Signal Feed (40%) | Right Stress Panel (60%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <SignalFeed
              signals={signalsList}
              threshold={thresholdConfig.impactThreshold}
              onSelectSignal={handleSelectSignal}
            />
          </div>

          <div className="lg:col-span-7">
            <StressPanel
              latestStress={currentStressRun}
              onOpenWhyDrawer={(stress, pos) => handleOpenWhyDrawer(stress, pos)}
            />
          </div>
        </div>

        {/* Historical Timeline & Portfolio Path */}
        <StressHistoryTimeline
          history={stressHistory}
          onSelectRun={(run) => setSelectedStress(run)}
          selectedResultId={currentStressRun?.resultId}
        />
      </main>

      {/* Modals & Drawers */}
      <WhyDrawer
        isOpen={isWhyDrawerOpen}
        onClose={() => setIsWhyDrawerOpen(false)}
        stressResult={currentStressRun}
        selectedPosition={selectedPosition}
      />

      <ScenarioInjectorModal
        isOpen={isInjectorOpen}
        onClose={() => setIsInjectorOpen(false)}
        onInject={async (headline: string) => {
          await injectMutation.mutateAsync({ headline });
        }}
      />
    </div>
  );
}
