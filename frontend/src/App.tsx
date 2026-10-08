import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPortfolioSummary,
  fetchPositions,
  fetchSignals,
  fetchStressResults,
  fetchThresholdConfig,
  updateThresholdConfig,
  triggerManualStress,
  triggerReplayStream,
  fetchHealth,
} from './api/riskApi';
import { useEventSource } from './hooks/useEventSource';
import { Sidebar, type ActiveNav } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { ExecutiveDashboardView } from './components/ExecutiveDashboardView';
import { PortfolioHoldingsView } from './components/PortfolioHoldingsView';
import { StressPanel } from './components/StressPanel';
import { ThresholdControl } from './components/ThresholdControl';
import { SignalFeed } from './components/SignalFeed';
import { StressHistoryTimeline } from './components/StressHistoryTimeline';
import { WhyDrawer } from './components/WhyDrawer';
import { ScenarioInjectorModal } from './components/ScenarioInjectorModal';
import type {
  RiskSignal,
  StressResult,
  RevaluationPosition,
} from './types/risk';

export default function App() {
  const queryClient = useQueryClient();

  // Navigation State
  const [activeNav, setActiveNav] = useState<ActiveNav>('executive');

  // Modal & Selection State
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

  const { data: positions = [] } = useQuery({
    queryKey: ['portfolio-positions'],
    queryFn: fetchPositions,
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
  const { data: liveSignal } = useEventSource<RiskSignal>(
    '/api/signals/stream',
    'SIGNAL'
  );

  const { data: liveStress } = useEventSource<StressResult>(
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

  // Mutations
  const thresholdMutation = useMutation({
    mutationFn: (newThreshold: number) =>
      updateThresholdConfig({ ...thresholdConfig, impactThreshold: newThreshold }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['threshold-config'], updated);
    },
  });

  const replayMutation = useMutation({
    mutationFn: triggerReplayStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signals'] });
      queryClient.invalidateQueries({ queryKey: ['stress-results'] });
    },
  });

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
      setActiveNav('stress-engine');
    } else {
      handleOpenWhyDrawer(currentStressRun);
    }
  };

  const handleSync = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['portfolio-summary'] }),
      queryClient.invalidateQueries({ queryKey: ['portfolio-positions'] }),
      queryClient.invalidateQueries({ queryKey: ['signals'] }),
      queryClient.invalidateQueries({ queryKey: ['stress-results'] }),
      queryClient.invalidateQueries({ queryKey: ['health'] }),
    ]);
  };

  return (
    <div className="min-h-screen flex bg-[#070a0e] text-slate-100 font-sans antialiased">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeNav={activeNav}
        onNavigate={(nav) => setActiveNav(nav)}
        nlpStatus={health?.nlpSidecar}
      />

      {/* 2. Main Terminal Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto custom-scrollbar">
        {/* Top Navbar */}
        <TopNavbar
          activeNav={activeNav}
          onSync={handleSync}
          onSimulateShock={() => setIsInjectorOpen(true)}
        />

        {/* View Content */}
        <main className="p-8 max-w-[1600px] w-full mx-auto">
          {/* VIEW 1: Executive Dashboard (Reference Image 1) */}
          {activeNav === 'executive' && (
            <ExecutiveDashboardView
              summary={summary}
              signals={signalsList}
              latestStress={currentStressRun}
              threshold={thresholdConfig.impactThreshold}
              onSimulateShock={(headline) => {
                if (headline) {
                  injectMutation.mutate({ headline });
                } else {
                  setIsInjectorOpen(true);
                }
              }}
              onOpenStressEngine={() => setActiveNav('stress-engine')}
            />
          )}

          {/* VIEW 2: Portfolio Holdings (Reference Image 2) */}
          {activeNav === 'holdings' && (
            <PortfolioHoldingsView
              summary={summary}
              positions={positions}
              onSimulateShock={() => setIsInjectorOpen(true)}
              onResetDefault={handleSync}
            />
          )}

          {/* VIEW 3: Portfolio Stress Engine */}
          {activeNav === 'stress-engine' && (
            <div className="space-y-6">
              <ThresholdControl
                config={thresholdConfig}
                onChange={(newVal) => thresholdMutation.mutate(newVal)}
                onReplay={() => replayMutation.mutate()}
                onOpenInjector={() => setIsInjectorOpen(true)}
                isReplaying={replayMutation.isPending}
              />
              <StressPanel
                latestStress={currentStressRun}
                onOpenWhyDrawer={(stress, pos) => handleOpenWhyDrawer(stress, pos)}
              />
            </div>
          )}

          {/* VIEW 4: Dedicated Signal Stream */}
          {activeNav === 'signals' && (
            <div className="max-w-5xl mx-auto">
              <SignalFeed
                signals={signalsList}
                threshold={thresholdConfig.impactThreshold}
                onSelectSignal={handleSelectSignal}
              />
            </div>
          )}

          {/* VIEW 5: Audit History */}
          {activeNav === 'history' && (
            <StressHistoryTimeline
              history={stressHistory}
              onSelectRun={(run) => {
                setSelectedStress(run);
                setActiveNav('stress-engine');
              }}
              selectedResultId={currentStressRun?.resultId}
            />
          )}
        </main>
      </div>

      {/* Global Modals & Drawers */}
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
          setActiveNav('stress-engine');
        }}
      />
    </div>
  );
}
