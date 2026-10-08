import React from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import type { ActiveNav } from './Sidebar';

interface TopNavbarProps {
  activeNav: ActiveNav;
  onSync: () => void;
  onSimulateShock: () => void;
  isSyncing?: boolean;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeNav,
  onSync,
  onSimulateShock,
  isSyncing = false,
}) => {
  const getHeaderInfo = () => {
    switch (activeNav) {
      case 'executive':
        return {
          title: 'Executive Risk Dashboard',
          subtitle: 'Live NLP sentiment triggers and cross-asset portfolio exposure',
        };
      case 'holdings':
        return {
          title: 'Multi-Asset Portfolio Allocation',
          subtitle: 'Synthetic $1.76B benchmark portfolio with duration and spread sensitivities',
        };
      case 'stress-engine':
        return {
          title: 'Portfolio Stress Engine',
          subtitle: 'Module B multi-factor scenario simulation, credit migration & position drawdowns',
        };
      case 'signals':
        return {
          title: 'Real-Time Risk Signal Stream',
          subtitle: 'Live GDELT & Twitter sentiment feed with autonomous impact calibration',
        };
      case 'history':
        return {
          title: 'Stress Simulation Audit History',
          subtitle: 'Historical crisis scenario revaluations, VaR bounds, and counterparty stress records',
        };
    }
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <header className="border-b border-[#1a2333] bg-[#070a0e]/95 backdrop-blur-md sticky top-0 z-20 px-8 py-3.5 flex items-center justify-between">
      {/* View Title & Subtitle */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight font-['Outfit']">
          {title}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* FinBERT Live Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0e1624] border border-[#1e2f47] text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-mono text-[11px] font-medium tracking-wide">
            FinBERT Live
          </span>
        </div>

        {/* Sync Button */}
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="btn-secondary text-xs flex items-center gap-1.5 px-3.5 py-1.5 border-[#1e2a3d] hover:border-[#2d3e57]"
          title="Refresh portfolio state and signals"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-slate-400 ${
              isSyncing ? 'animate-spin text-emerald-400' : ''
            }`}
          />
          <span className="font-medium text-slate-200">Sync</span>
        </button>

        {/* Simulate Shock Primary CTA */}
        <button
          onClick={onSimulateShock}
          className="btn-primary text-xs flex items-center gap-1.5 px-4 py-1.5 font-semibold text-slate-950 tracking-wide"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Simulate Shock</span>
        </button>
      </div>
    </header>
  );
};
