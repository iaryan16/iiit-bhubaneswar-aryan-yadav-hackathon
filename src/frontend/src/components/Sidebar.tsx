import React from 'react';
import { Activity, BriefcaseBusiness, Clock3, LayoutDashboard, Radio, ShieldCheck, Zap } from 'lucide-react';

export type ActiveNav = 'executive' | 'stress-engine' | 'signals' | 'holdings' | 'history';

interface SidebarProps {
  activeNav: ActiveNav;
  onNavigate: (nav: ActiveNav) => void;
  nlpStatus?: string;
}

const navItems = [
  { id: 'executive' as const, label: 'Overview', icon: LayoutDashboard },
  { id: 'stress-engine' as const, label: 'Stress Engine', icon: Zap },
  { id: 'signals' as const, label: 'Risk Signals', icon: Radio },
  { id: 'holdings' as const, label: 'Holdings', icon: BriefcaseBusiness },
  { id: 'history' as const, label: 'Run History', icon: Clock3 },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onNavigate,
  nlpStatus = 'CONNECTED',
}) => (
  <aside className="app-sidebar" aria-label="Sidebar navigation">
    <a
      className="brand"
      href="#overview"
      onClick={(event) => {
        event.preventDefault();
        onNavigate('executive');
      }}
    >
      <span className="brand-mark">
        <ShieldCheck size={20} className="text-white" />
      </span>
      <span>
        <strong>RiskEngine</strong>
        <small>STRESS TESTING • DARK</small>
      </span>
    </a>

    <nav className="primary-nav" aria-label="Main navigation">
      <p className="nav-caption">Terminal Console</p>
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`nav-link ${activeNav === id ? 'nav-link-active' : ''}`}
          aria-current={activeNav === id ? 'page' : undefined}
        >
          <Icon size={17} className={activeNav === id ? 'text-emerald-400' : 'text-slate-400'} />
          <span>{label}</span>
        </button>
      ))}
    </nav>

    <div className="sidebar-status">
      <span
        className={`status-dot ${nlpStatus === 'CONNECTED' ? '' : 'status-dot-offline'}`}
      />
      <span>NLP Sidecar</span>
      <small>{nlpStatus === 'CONNECTED' ? 'CONNECTED' : nlpStatus}</small>
    </div>

    <div className="sidebar-foot">
      <Activity size={14} className="text-emerald-400" />
      <span>Real-Time Engine</span>
    </div>
  </aside>
);
