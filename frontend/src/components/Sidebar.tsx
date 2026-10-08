import React from 'react';
import {
  Shield,
  LayoutDashboard,
  Zap,
  Radio,
  Briefcase,
  History,
  Server,
} from 'lucide-react';

export type ActiveNav =
  | 'executive'
  | 'stress-engine'
  | 'signals'
  | 'holdings'
  | 'history';

interface SidebarProps {
  activeNav: ActiveNav;
  onNavigate: (nav: ActiveNav) => void;
  nlpStatus?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onNavigate,
  nlpStatus = 'CONNECTED',
}) => {
  const navItems = [
    {
      id: 'executive' as ActiveNav,
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'stress-engine' as ActiveNav,
      label: 'Portfolio Stress Engine',
      icon: Zap,
      badge: 'Target',
    },
    {
      id: 'signals' as ActiveNav,
      label: 'Risk Signal Stream',
      icon: Radio,
    },
    {
      id: 'holdings' as ActiveNav,
      label: 'Portfolio Holdings',
      icon: Briefcase,
    },
    {
      id: 'history' as ActiveNav,
      label: 'Audit History',
      icon: History,
    },
  ];

  return (
    <aside className="w-64 bg-[#0a0e16] border-r border-[#1a2333] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#16202e] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-slate-950 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white tracking-tight text-base font-['Outfit']">
                RiskEngine
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold tracking-wide">
                TERMINAL
              </span>
            </div>
            <div className="text-[10px] font-semibold tracking-wider text-slate-400 font-mono mt-0.5">
              S&P / CRISIL MODULE B
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="px-3 pt-6">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121926]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Infrastructure Footer Card */}
      <div className="p-4 m-3 rounded-xl bg-[#0e1420] border border-[#1a2333] shadow-inner">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2.5">
          <Server className="w-3.5 h-3.5 text-cyan-400" />
          <span className="tracking-wide uppercase text-[10px] text-slate-400">System Infrastructure</span>
        </div>
        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Spring Boot Core:</span>
            <span className="text-emerald-400 font-semibold">:8080 Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">FinBERT NLP:</span>
            <span className="text-emerald-400 font-semibold">:8000 {nlpStatus === 'CONNECTED' ? 'Online' : nlpStatus}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">PostgreSQL / H2:</span>
            <span className="text-emerald-400 font-semibold">:5432 Ready</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
