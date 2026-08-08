import React from 'react';
import { Activity, Radio, Cpu, RefreshCw, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'operations' | 'patterns' | 'model';
  setActiveTab: (tab: 'operations' | 'patterns' | 'model') => void;
  onRefresh: () => void;
  loading: boolean;
  onSelectDemoRouter: (routerId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onRefresh,
  loading,
  onSelectDemoRouter,
}) => {
  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
      <div className="container py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white font-black">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight font-mono">
                  NETSENTINEL
                </h1>
                <span className="badge badge-cyan text-[9px] py-0.5 font-bold">
                  AI PREDICTIVE NOC
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Early-warning degradation forecasting &bull; Next 24h horizon
              </p>
            </div>
          </div>

          {/* Center Demo Presets */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-xl">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-cyan-400" /> Presets:
            </span>
            <button
              onClick={() => onSelectDemoRouter('R-1042')}
              className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-all cursor-pointer"
            >
              R-1042 (89.8% Risk)
            </button>
            <button
              onClick={() => onSelectDemoRouter('R-1002')}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all cursor-pointer"
            >
              R-1002
            </button>
            <button
              onClick={() => onSelectDemoRouter('R-1010')}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-all cursor-pointer"
            >
              R-1010
            </button>
          </div>

          {/* Tabs Navigation & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-900/90 border border-white/10 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('operations')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'operations'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Operations
              </button>
              <button
                onClick={() => setActiveTab('patterns')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'patterns'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Radio className="h-3.5 w-3.5" />
                Fleet Patterns
              </button>
              <button
                onClick={() => setActiveTab('model')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'model'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Cpu className="h-3.5 w-3.5" />
                ML Diagnostics
              </button>
            </div>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Fleet Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
