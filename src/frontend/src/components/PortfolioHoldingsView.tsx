import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  RotateCcw,
  Zap,
  Search,
  PieChart as PieChartIcon,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { PortfolioSummary, Position } from '../types/risk';

interface PortfolioHoldingsViewProps {
  summary?: PortfolioSummary;
  positions: Position[];
  onSimulateShock: () => void;
  onResetDefault?: () => void | Promise<any>;
}

export const PortfolioHoldingsView: React.FC<PortfolioHoldingsViewProps> = ({
  summary,
  positions,
  onSimulateShock,
  onResetDefault,
}) => {
  const [distributionMode, setDistributionMode] = useState<'assetClass' | 'sector'>('assetClass');
  const [classFilter, setClassFilter] = useState<'ALL' | 'BOND' | 'LOAN' | 'DERIVATIVE' | 'EQUITY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isResetting, setIsResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(false);
  const pageSize = 12;

  const handleReset = async () => {
    setIsResetting(true);
    setClassFilter('ALL');
    setSearchQuery('');
    setDistributionMode('assetClass');
    setCurrentPage(1);
    try {
      if (onResetDefault) {
        await onResetDefault();
      }
      setResetFeedback(true);
      setTimeout(() => setResetFeedback(false), 2500);
    } finally {
      setTimeout(() => setIsResetting(false), 500);
    }
  };


  // Breakdown metrics
  const bondMV = summary?.byAssetClass?.['BOND'] || 581514400;
  const loanMV = summary?.byAssetClass?.['LOAN'] || 746000000;
  const equityMV = summary?.byAssetClass?.['EQUITY'] || 430406963;
  const derivMV = summary?.byAssetClass?.['DERIVATIVE'] || 1170480;
  const totalMV = summary?.totalMarketValue || bondMV + loanMV + equityMV + derivMV;

  // Colors for Donut
  const ASSET_COLORS: Record<string, string> = {
    BOND: '#10b981',       // Emerald
    LOAN: '#06b6d4',       // Glacier Cyan
    EQUITY: '#f59e0b',     // Vivid Amber
    DERIVATIVE: '#8b5cf6', // Electric Violet
  };

  const SECTOR_COLORS = [
    '#10b981',
    '#06b6d4',
    '#8b5cf6',
    '#f59e0b',
    '#f43f5e',
    '#3b82f6',
    '#14b8a6',
  ];

  // Donut Chart Data
  const donutData = useMemo(() => {
    if (distributionMode === 'assetClass') {
      return [
        { name: 'BOND', value: bondMV, color: ASSET_COLORS.BOND },
        { name: 'LOAN', value: loanMV, color: ASSET_COLORS.LOAN },
        { name: 'EQUITY', value: equityMV, color: ASSET_COLORS.EQUITY },
        { name: 'DERIVATIVE', value: Math.max(derivMV, 15000000), color: ASSET_COLORS.DERIVATIVE },
      ];
    } else {
      const sectors = summary?.bySector || {};
      return Object.entries(sectors).map(([sec, val], idx) => ({
        name: sec,
        value: Math.abs(val),
        color: SECTOR_COLORS[idx % SECTOR_COLORS.length],
      }));
    }
  }, [distributionMode, summary, bondMV, loanMV, equityMV, derivMV]);

  // Sector Bars Data
  const sectorBars = useMemo(() => {
    const rawSectors = summary?.bySector || {
      Technology: 399801964,
      Financials: 270848447,
      Energy: 256558276,
      Industrials: 226854964,
      'Consumer Discretionary': 203650670,
      Utilities: 200763400,
      Healthcare: 200614119,
    };

    return Object.entries(rawSectors)
      .map(([sector, amount]) => ({
        sector,
        amount: Math.abs(amount),
        pct: (Math.abs(amount) / totalMV) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [summary, totalMV]);

  // Filter positions
  const filteredPositions = useMemo(() => {
    return positions.filter((pos) => {
      const matchesClass = classFilter === 'ALL' || pos.assetClass === classFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pos.counterparty.toLowerCase().includes(q) ||
        pos.positionId.toLowerCase().includes(q) ||
        pos.sector.toLowerCase().includes(q) ||
        (pos.ticker && pos.ticker.toLowerCase().includes(q));
      return matchesClass && matchesSearch;
    });
  }, [positions, classFilter, searchQuery]);

  // Counts for tabs
  const bondCount = positions.filter((p) => p.assetClass === 'BOND').length;
  const loanCount = positions.filter((p) => p.assetClass === 'LOAN').length;
  const derivCount = positions.filter((p) => p.assetClass === 'DERIVATIVE').length;
  const equityCount = positions.filter((p) => p.assetClass === 'EQUITY').length;

  // Pagination
  const totalPages = Math.ceil(filteredPositions.length / pageSize) || 1;
  const paginatedPositions = filteredPositions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* 1. Benchmark Portfolio Top Banner */}
      <div className="rounded-xl bg-[#0e1422] border border-[#1a2333] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-lg scroll-reveal">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-snug tracking-tight">
              Multi-Asset Benchmark Portfolio
            </h2>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed tracking-normal">
              {positions.length || 200} institutional positions across sovereign bonds, corporate loans, equity indices, and derivatives
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="btn-secondary text-sm flex items-center gap-1.5 px-4 py-2 leading-none tracking-normal transition-all"
            title="Reset filters and restore benchmark portfolio"
          >
            <RotateCcw className={`w-4 h-4 text-slate-400 ${isResetting ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isResetting ? 'Resetting...' : resetFeedback ? 'Reset Done!' : 'Reset Default'}</span>
          </button>
          <button
            onClick={onSimulateShock}
            className="btn-primary text-sm flex items-center gap-2 px-5 py-2 font-semibold text-slate-950 leading-none tracking-normal"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Inject Scenario</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Allocation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* TOTAL PORTFOLIO NOTIONAL */}
        <div className="kpi-card relative p-5 overflow-hidden scroll-reveal scroll-reveal-delay-1">
          <span className="kpi-label">Total Portfolio Notional</span>
          <div className="text-3xl font-extrabold text-white mt-1 mb-2 font-mono leading-tight tracking-tighter">
            ${(totalMV / 1e9).toFixed(2)}B
          </div>
          <p className="text-xs text-slate-400 font-mono leading-normal tracking-wide">
            {positions.length || 200} institutional positions
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>

        {/* FIXED INCOME ALLOCATION */}
        <div className="kpi-card relative p-5 overflow-hidden scroll-reveal scroll-reveal-delay-2">
          <span className="kpi-label">Fixed Income Allocation</span>
          <div className="text-3xl font-extrabold text-white mt-1 mb-2 font-mono leading-tight tracking-tighter">
            ${(bondMV / 1e6).toFixed(1)}M
          </div>
          <p className="text-xs text-slate-400 font-mono leading-normal tracking-wide">
            Govt & corporate duration
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-cyan-500" />
        </div>

        {/* CORPORATE & EM LOANS */}
        <div className="kpi-card relative p-5 overflow-hidden scroll-reveal scroll-reveal-delay-3">
          <span className="kpi-label">Corporate & EM Loans</span>
          <div className="text-3xl font-extrabold text-white mt-1 mb-2 font-mono leading-tight tracking-tighter">
            ${(loanMV / 1e6).toFixed(1)}M
          </div>
          <p className="text-xs text-slate-400 font-mono leading-normal tracking-wide">
            Subject to spread widening
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
        </div>

        {/* DERIVATIVES & EQUITY */}
        <div className="kpi-card relative p-5 overflow-hidden scroll-reveal">
          <span className="kpi-label">Derivatives & Equity</span>
          <div className="text-3xl font-extrabold text-white mt-1 mb-2 font-mono leading-tight tracking-tighter">
            ${((equityMV + derivMV) / 1e6).toFixed(1)}M
          </div>
          <p className="text-xs text-slate-400 font-mono leading-normal tracking-wide">
            Convexity & beta sensitivity
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
        </div>
      </div>

      {/* 3. Middle Row: Allocation Distribution Donut (Left) + Sector Concentration (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Allocation Distribution Donut */}
        <div className="lg:col-span-5 glass-panel p-6 flex flex-col justify-between scroll-reveal">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#1b263b] mb-5">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white leading-snug tracking-snug">Allocation Distribution</h3>
              </div>

              {/* Toggle pills */}
              <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-lg border border-[#1a2333]">
                <button
                  onClick={() => setDistributionMode('assetClass')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all leading-none tracking-normal ${
                    distributionMode === 'assetClass'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Asset Class
                </button>
                <button
                  onClick={() => setDistributionMode('sector')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all leading-none tracking-normal ${
                    distributionMode === 'sector'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  By Sector
                </button>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="h-52 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0e1422" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`$${(Number(value) / 1e6).toFixed(1)}M`, 'Notional']}
                    contentStyle={{
                      backgroundColor: '#0a0e16',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none">
                <span className="text-xs uppercase font-mono text-slate-400 block leading-none tracking-wider">Total</span>
                <span className="text-base font-extrabold text-white font-mono leading-tight tracking-tight">
                  ${(totalMV / 1e9).toFixed(2)}B
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-800/60 text-sm leading-normal tracking-normal">
            {distributionMode === 'assetClass' ? (
              <>
                <div className="flex items-center gap-2 font-mono text-xs leading-none tracking-wide">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">BOND (33%)</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs leading-none tracking-wide">
                  <span className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="text-slate-300">LOAN (42%)</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs leading-none tracking-wide">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-slate-300">EQUITY (24%)</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs leading-none tracking-wide">
                  <span className="w-3 h-3 rounded-full bg-violet-500" />
                  <span className="text-slate-300">DERIVATIVE (1%)</span>
                </div>
              </>
            ) : (
              <span className="text-slate-400 font-mono text-xs leading-none tracking-wide">7 Diversified Macro Sectors</span>
            )}
          </div>
        </div>

        {/* Right: Sector Concentration & Duration Profiles */}
        <div className="lg:col-span-7 glass-panel p-6 scroll-reveal scroll-reveal-delay-1">
          <div className="flex items-center justify-between pb-4 border-b border-[#1b263b] mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white leading-snug tracking-snug">Sector Concentration & Duration Profiles</h3>
            </div>
            <span className="text-xs font-mono text-slate-400 leading-none tracking-wide">Total Book Allocation</span>
          </div>

          <div className="space-y-4 mt-2">
            {sectorBars.map((item, idx) => (
              <div key={item.sector} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm leading-normal tracking-normal">
                  <span className="text-slate-300 font-medium">{item.sector}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-white font-semibold text-sm leading-normal tracking-tight font-mono">${(item.amount / 1e6).toFixed(1)}M</span>
                    <span className="text-slate-400 text-xs font-mono leading-normal tracking-normal">({item.pct.toFixed(1)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-[#090d16] h-2.5 rounded-full overflow-hidden border border-[#1a2333]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: SECTOR_COLORS[idx % SECTOR_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Bottom Table: Full Holdings with Filters & Search */}
      <div className="glass-panel p-6 space-y-5 scroll-reveal">
        {/* Table Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1b263b]">
          {/* Class Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setClassFilter('ALL'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all leading-none tracking-normal ${
                classFilter === 'ALL'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-[#090d16]'
              }`}
            >
              All Holdings ({positions.length})
            </button>
            <button
              onClick={() => { setClassFilter('BOND'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all leading-none tracking-normal ${
                classFilter === 'BOND'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-[#090d16]'
              }`}
            >
              Bonds ({bondCount})
            </button>
            <button
              onClick={() => { setClassFilter('LOAN'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all leading-none tracking-normal ${
                classFilter === 'LOAN'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-[#090d16]'
              }`}
            >
              Loans ({loanCount})
            </button>
            <button
              onClick={() => { setClassFilter('DERIVATIVE'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all leading-none tracking-normal ${
                classFilter === 'DERIVATIVE'
                  ? 'bg-violet-500/20 text-violet-300 font-semibold border border-violet-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-[#090d16]'
              }`}
            >
              Derivatives ({derivCount})
            </button>
            <button
              onClick={() => { setClassFilter('EQUITY'); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all leading-none tracking-normal ${
                classFilter === 'EQUITY'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 bg-[#090d16]'
              }`}
            >
              Equities ({equityCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search asset, ticker, or sector..."
              className="w-full bg-[#090d16] border border-[#1b263b] rounded-lg pl-10 pr-8 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 leading-normal tracking-normal"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm leading-normal tracking-normal">
            <thead className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-[#1b263b] bg-[#090d16] leading-none">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Asset Name & Counterparty</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Sector</th>
                <th className="py-3 px-4 text-right">Notional ($M)</th>
                <th className="py-3 px-4 text-right">Coupon / Rate</th>
                <th className="py-3 px-4 text-right">Duration (Yrs)</th>
                <th className="py-3 px-4 text-center">Currency</th>
                <th className="py-3 px-4 text-right">Sensitivity Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#16202e] font-sans">
              {paginatedPositions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No holdings match your search criteria.
                  </td>
                </tr>
              ) : (
                paginatedPositions.map((pos, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const couponStr = pos.coupon ? `${(pos.coupon * 100).toFixed(2)}%` : pos.rateType || '—';
                  const durStr = pos.modifiedDuration ? pos.modifiedDuration.toFixed(2) : '—';

                  let sensitivityStr = '—';
                  if (pos.assetClass === 'EQUITY' && pos.beta) {
                    sensitivityStr = `Beta: ${pos.beta.toFixed(2)}`;
                  } else if (pos.assetClass === 'LOAN' && pos.pd) {
                    sensitivityStr = `PD: ${(pos.pd * 100).toFixed(1)}%`;
                  } else if (pos.assetClass === 'DERIVATIVE' && pos.dv01) {
                    sensitivityStr = `DV01: $${pos.dv01.toFixed(0)}`;
                  } else if (pos.rating) {
                    sensitivityStr = pos.rating;
                  }

                  return (
                    <tr key={pos.positionId} className="hover:bg-[#0e1624] transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500">#{globalIdx}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white leading-snug tracking-normal">{pos.counterparty}</div>
                        <div className="text-xs font-mono text-slate-400 leading-normal tracking-wide">
                          {pos.positionId} {pos.ticker ? `• ${pos.ticker}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase leading-none tracking-wide ${
                            pos.assetClass === 'BOND'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : pos.assetClass === 'LOAN'
                              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                              : pos.assetClass === 'EQUITY'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                          }`}
                        >
                          {pos.assetClass}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 leading-normal tracking-normal">{pos.sector}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm leading-normal tracking-tight">
                        ${(pos.marketValue / 1e6).toFixed(2)}M
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300 text-sm leading-normal tracking-normal">
                        {couponStr}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300 text-sm leading-normal tracking-normal">
                        {durStr}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400 text-xs leading-normal tracking-wide">{pos.currency}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-medium text-xs leading-normal tracking-tight">
                        {sensitivityStr}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1b263b] text-sm text-slate-400 leading-normal tracking-normal">
          <div>
            Showing <span className="font-mono text-white">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-mono text-white">
              {Math.min(currentPage * pageSize, filteredPositions.length)}
            </span>{' '}
            of <span className="font-mono text-white">{filteredPositions.length}</span> positions
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-[#090d16] border border-[#1b263b] hover:bg-[#121926] disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-mono text-sm text-slate-300 leading-none tracking-normal">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-[#090d16] border border-[#1b263b] hover:bg-[#121926] disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
