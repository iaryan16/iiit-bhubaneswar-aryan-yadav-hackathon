import React from 'react';
import { RefreshCw, Terminal } from 'lucide-react';
import type { ActiveNav } from './Sidebar';

interface TopNavbarProps {
  activeNav: ActiveNav;
  onSync: () => void;
  isSyncing?: boolean;
}

const headings: Record<ActiveNav, [string, string]> = {
  executive: ['Executive Overview', 'Real-time multi-asset portfolio exposure & sentiment-driven risk telemetry.'],
  holdings: ['Portfolio Holdings', 'Granular multi-asset positions across sovereign bonds, loans, equities & derivatives.'],
  'stress-engine': ['Stress Testing Engine', 'Revaluate asset classes & expected losses against simulated market shocks.'],
  signals: ['Risk Signal Radar', 'Live GDELT & financial news feeds scored with FinBERT & zero-shot NLP.'],
  history: ['Stress Scenario Audit History', 'Chronological valuation trajectory & post-shock loss attribution logs.'],
};

export const TopNavbar: React.FC<TopNavbarProps> = ({ activeNav, onSync, isSyncing = false }) => {
  const [title, subtitle] = headings[activeNav];

  return (
    <header className="page-header">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1.5 leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Terminal Online
          </span>
          <span className="text-xs font-mono text-slate-500 hidden sm:inline leading-none tracking-wide">
            Dark Edition
          </span>
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0f1d] border border-[#162034] text-xs font-mono text-slate-400 leading-normal tracking-wide">
          <Terminal size={13} className="text-cyan-400" />
          <span>Real-time Risk Monitor</span>
        </div>

        <button
          className="refresh-button"
          onClick={onSync}
          disabled={isSyncing}
          title="Refresh portfolio data"
        >
          <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
        </button>
      </div>
    </header>
  );
};
