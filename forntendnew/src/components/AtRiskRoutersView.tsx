import React, { useState } from 'react';
import { RouterItem } from '../types';
import {
  AlertTriangle,
  Target,
  Wrench,
  CheckCircle2,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Search,
  ShieldAlert,
  Sparkles,
  Zap
} from 'lucide-react';

interface AtRiskRoutersViewProps {
  routers: RouterItem[];
  onSelectRouter: (router: RouterItem) => void;
}

export const AtRiskRoutersView: React.FC<AtRiskRoutersViewProps> = ({
  routers,
  onSelectRouter
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'All' | 'Critical' | 'Watch'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter routers for "At Risk" (Critical and Watch status, or high priority score)
  const atRiskList = routers
    .filter((r) => r.status === 'Critical' || r.status === 'Watch' || r.priority_score >= 50)
    .filter((r) => {
      if (filterSeverity === 'Critical') return r.status === 'Critical';
      if (filterSeverity === 'Watch') return r.status === 'Watch';
      return true;
    })
    .filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.id.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.building.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.priority_score - a.priority_score);

  // Helper to generate risk factors array based on metrics
  const getRiskFactors = (router: RouterItem) => {
    const factors: string[] = [];
    if (router.latency_ms > 100) {
      factors.push(`Severe Latency (${router.latency_ms}ms > 100ms)`);
    } else if (router.latency_ms > 50) {
      factors.push(`Elevated Latency (${router.latency_ms}ms)`);
    }

    if (router.packet_loss_pct > 5) {
      factors.push(`High Packet Loss (${router.packet_loss_pct}%)`);
    } else if (router.packet_loss_pct > 2) {
      factors.push(`Moderate Packet Loss (${router.packet_loss_pct}%)`);
    }

    if (router.disconnects_24h > 20) {
      factors.push(`Frequent Interface Disconnects (${router.disconnects_24h} flaps/24h)`);
    } else if (router.disconnects_24h > 10) {
      factors.push(`Unstable Connection (${router.disconnects_24h} flaps)`);
    }

    if (router.firmware.includes('VULN') || router.firmware.includes('3.9')) {
      factors.push(`Deprecated Firmware (${router.firmware})`);
    }

    if (router.priority_score > 80) {
      factors.push(`Critical Priority Level (${router.priority_score}/100)`);
    }

    if (factors.length === 0) {
      factors.push('Buffer Bloat Anomalies Detected');
    }

    return factors;
  };

  // Helper to generate action plan list
  const getActionPlan = (router: RouterItem) => {
    const plans: string[] = [];
    if (router.latency_ms > 100 || router.packet_loss_pct > 5) {
      plans.push(`Flush ARP buffers & clear memory cache on interface ge-0/0/1 immediately.`);
    }
    if (router.firmware.includes('VULN') || router.firmware.includes('3.9')) {
      plans.push(`Deploy critical firmware patch update to v4.14.2-LTS.`);
    }
    if (router.disconnects_24h > 15) {
      plans.push(`Dispatch Tier-3 Field Technician for physical SFP transceiver inspection.`);
    } else {
      plans.push(`Schedule off-hours automated diagnostic reboot during 02:00 window.`);
    }
    plans.push(`Verify peer BGP stability & run continuous gNMI telemetry stream.`);
    return plans;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Control */}
      <div className="bg-white dark:bg-[#101828] border border-gray-200/80 dark:border-gray-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              At-Risk Campus Routers
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-rose-500 text-white">
                {atRiskList.length} High Risk Nodes
              </span>
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Real-time anomaly detection identifying routers with elevated latency, packet drops, or critical firmware vulnerabilities.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter at-risk node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#f2f4f7] dark:bg-[#101828] text-gray-900 dark:text-white border border-gray-200 dark:border-[#1d2939] rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
            />
          </div>

          <div className="flex items-center bg-[#f2f4f7] dark:bg-[#101828] p-1 rounded-xl border border-gray-200 dark:border-[#1d2939] text-xs">
            <button
              onClick={() => setFilterSeverity('All')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === 'All'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({routers.filter((r) => r.status === 'Critical' || r.status === 'Watch').length})
            </button>
            <button
              onClick={() => setFilterSeverity('Critical')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === 'Critical'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-rose-500'
              }`}
            >
              Critical Only ({routers.filter((r) => r.status === 'Critical').length})
            </button>
            <button
              onClick={() => setFilterSeverity('Watch')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterSeverity === 'Watch'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-amber-500'
              }`}
            >
              Watch Only ({routers.filter((r) => r.status === 'Watch').length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid of At Risk Router Cards (Matching Provided Screenshot Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {atRiskList.map((router) => {
          const riskFactors = getRiskFactors(router);
          const actionPlan = getActionPlan(router);
          const isCritical = router.status === 'Critical';

          return (
            <div
              key={router.id}
              className={`bg-white dark:bg-[#101828] border rounded-2xl p-6 shadow-2xs transition-all hover:border-indigo-400/60 relative flex flex-col justify-between ${
                isCritical
                  ? 'border-rose-500/30 dark:border-rose-500/40'
                  : 'border-amber-500/30 dark:border-amber-500/40'
              }`}
            >
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    {/* Small Red Router ID */}
                    <span className="text-xs font-mono font-bold tracking-wider text-rose-500 uppercase">
                      {router.id}
                    </span>
                    {/* Main Title: Router Name & Building */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                      {router.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                      <span>{router.building} ({router.room})</span>
                      <span>•</span>
                      <span className="font-mono">{router.ip}</span>
                    </p>
                  </div>

                  {/* Top Right: Final Score / Priority Score */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block">
                      RISK SCORE
                    </span>
                    <span
                      className={`text-2xl font-black font-mono tracking-tight ${
                        isCritical ? 'text-rose-500' : 'text-amber-400'
                      }`}
                    >
                      {router.priority_score}%
                    </span>
                  </div>
                </div>

                {/* Metrics Pill Row (3 Sub-Boxes) */}
                <div className="grid grid-cols-3 gap-2.5 my-4">
                  <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium block mb-1">
                      Latency
                    </span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        router.latency_ms > 80 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {router.latency_ms} ms
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium block mb-1">
                      Packet Loss
                    </span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        router.packet_loss_pct > 3 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {router.packet_loss_pct}%
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/60 rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-medium block mb-1">
                      Disconnects
                    </span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        router.disconnects_24h > 15 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {router.disconnects_24h} flaps
                    </span>
                  </div>
                </div>

                {/* Risk Factors Section */}
                <div className="mb-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400 block mb-2">
                    RISK FACTORS:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {riskFactors.map((factor, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recommended Action Plan Section */}
                <div className="pt-3 border-t border-[#1d2939]">
                  <div className="flex items-center gap-1.5 mb-2 text-emerald-400">
                    <Target className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      RECOMMENDED ACTION PLAN:
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-gray-300 leading-relaxed pl-1">
                    {actionPlan.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 shrink-0 mt-0.5">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="mt-5 pt-4 border-t border-[#1d2939] flex items-center justify-between gap-3">
                <div className="text-[11px] text-gray-400">
                  Impact: <span className="font-semibold text-white">{router.affected_users} Active Users</span>
                </div>
                <button
                  onClick={() => onSelectRouter(router)}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-white text-gray-900 hover:bg-gray-200 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  Inspect Evidence <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {atRiskList.length === 0 && (
        <div className="bg-white dark:bg-[#080b13] border border-gray-200 dark:border-[#1d2939] rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No At-Risk Routers Found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            All filtered campus routers are operating within healthy telemetry baselines.
          </p>
        </div>
      )}
    </div>
  );
};
