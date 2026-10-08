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
import { Shield, Sparkles, Terminal, BarChart2, Radio, History } from 'lucide-react';

export default function App() {
  const queryClient = useQueryClient();

  // State
  const [selectedStress, setSelectedStress] = useState<StressResult | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<RevaluationPosition | null>(null);
  const [isWhyDrawerOpen, setIsWhyDrawerOpen] = useState(false);
  const [isInjectorOpen, setIsInjectorOpen] = useState(false);
  const [activeView, setActiveView] = useState<'analytics' | 'signals' | 'history'>('analytics');

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
    const matchingRun = stressHistory.find((r) => r.triggerSignalId === signal.signalId);
    if (matchingRun) {
      setSelectedStress(matchingRun);
      setActiveView('analytics');
    } else {
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
                <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  CRISIL & S&P GLOBAL RISK STRESS ENGINE
                </h1>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  MODULE B
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Real-Time NLP Signal Ingestion & Multi-Asset Revaluation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Sidecar status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400 text-[11px]">NLP Engine:</span>
              <span className="font-mono text-[11px] text-emerald-400 font-medium">
                {health?.nlpSidecar || 'READY'}
              </span>
            </div>

            <a
              href="http://localhost:8080/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-2.5"
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

        {/* Clean View Tabs Controller (Declutters the entire dashboard!) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeView === 'analytics'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Stress Analytics & Holdings</span>
            </button>

            <button
              onClick={() => setActiveView('signals')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeView === 'signals'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Risk Signals ({signalsList.length})</span>
            </button>

            <button
              onClick={() => setActiveView('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeView === 'history'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Simulation History ({stressHistory.length})</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono hidden md:block">
            {activeView === 'analytics' && 'Executive revaluation & exposure breakdown'}
            {activeView === 'signals' && 'Real-time NLP signal feed with automated scoring'}
            {activeView === 'history' && 'Chronological stress testing audit trail'}
          </div>
        </div>

        {/* View 1: Analytics (Executive Workspace: 65% Stress Panel + 35% Quick Signals) */}
        {activeView === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <StressPanel
                latestStress={currentStressRun}
                onOpenWhyDrawer={(stress, pos) => handleOpenWhyDrawer(stress, pos)}
              />
            </div>

            <div className="lg:col-span-4">
              <SignalFeed
                signals={signalsList}
                threshold={thresholdConfig.impactThreshold}
                onSelectSignal={handleSelectSignal}
              />
            </div>
          </div>
        )}

        {/* View 2: Full-Width Real-Time Signals Feed */}
        {activeView === 'signals' && (
          <div className="max-w-4xl mx-auto">
            <SignalFeed
              signals={signalsList}
              threshold={thresholdConfig.impactThreshold}
              onSelectSignal={handleSelectSignal}
            />
          </div>
        )}

        {/* View 3: Full-Width Simulation History */}
        {activeView === 'history' && (
          <StressHistoryTimeline
            history={stressHistory}
            onSelectRun={(run) => {
              setSelectedStress(run);
              setActiveView('analytics');
            }}
            selectedResultId={currentStressRun?.resultId}
          />
        )}
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
          setActiveView('analytics');
        }}
      />
    </div>
  );
}
