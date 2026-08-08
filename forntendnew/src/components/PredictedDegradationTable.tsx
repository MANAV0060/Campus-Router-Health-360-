import React from 'react';
import type { PredictiveRouterSummary } from '../types';
import {
  Search,
  TrendingUp,
  ChevronRight
} from 'lucide-react';

interface PredictedDegradationTableProps {
  routers: PredictiveRouterSummary[];
  onSelectRouter: (routerId: string) => void;
  selectedRouterId?: string;
  sortBy: string;
  setSortBy: (sort: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterBuilding: string;
  setFilterBuilding: (building: string) => void;
  filterRisk: string;
  setFilterRisk: (risk: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const PredictedDegradationTable: React.FC<PredictedDegradationTableProps> = ({
  routers,
  onSelectRouter,
  selectedRouterId,
  sortBy,
  setSortBy,
  filterStatus,
  setFilterStatus,
  filterBuilding,
  setFilterBuilding,
  filterRisk,
  setFilterRisk,
  searchTerm,
  setSearchTerm,
}) => {
  const getPriorityBadgeClass = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'priority-critical';
      case 'HIGH':
        return 'priority-high';
      case 'MEDIUM':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  };

  const getHealthBadgeClass = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'badge-healthy';
      case 'WATCH':
        return 'badge-watch';
      case 'AT_RISK':
        return 'badge-risk';
      default:
        return 'badge-critical';
    }
  };

  return (
    <div className="bg-white dark:bg-[#121829] rounded-2xl border border-[#C9CFF2]/60 dark:border-[#1e284a] overflow-hidden mb-8 shadow-2xs">
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-[#C9CFF2]/60 dark:border-[#1e284a] bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
                  Predictive Router Degradation Radar
                </h2>
                <span className="badge badge-cyan text-[10px]">AI Supervised</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Proactive 24-hour degradation probabilities & operational priority ranking
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search router, building, firmware..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-[#C9CFF2] dark:border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-cyan-400 w-52 transition-all"
              />
            </div>

            {/* Health Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-[#C9CFF2] dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Current Health</option>
              <option value="HEALTHY">Healthy (80-100)</option>
              <option value="WATCH">Watch / Mod (60-79)</option>
              <option value="AT_RISK">At Risk (40-59)</option>
              <option value="CRITICAL">Critical (&lt; 40)</option>
            </select>

            {/* Building Filter */}
            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-[#C9CFF2] dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Buildings</option>
              <option value="Hostel-A">Hostel-A</option>
              <option value="Hostel-B">Hostel-B</option>
              <option value="Lab-Complex">Lab-Complex</option>
              <option value="Staff-Qtrs">Staff-Qtrs</option>
              <option value="Library">Library</option>
              <option value="Main-Block">Main-Block</option>
            </select>

            {/* Risk Filter */}
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-[#C9CFF2] dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Future Risk (≥70%)</option>
              <option value="MEDIUM">Medium Risk (45-69%)</option>
              <option value="LOW">Low Risk (&lt;45%)</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-gray-900 border border-[#C9CFF2] dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-cyan-700 dark:text-cyan-300 font-semibold focus:outline-none focus:border-cyan-400"
            >
              <option value="priority">Sort: Operational Priority</option>
              <option value="future_risk">Sort: AI Future Risk (%)</option>
              <option value="current_health_asc">Sort: Current Health (Lowest)</option>
              <option value="devices">Sort: Connected Clients</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-3">Router Identity</th>
              <th className="py-3 px-3">Location</th>
              <th className="py-3 px-3">Current Health</th>
              <th className="py-3 px-3 text-rose-500 dark:text-rose-400">AI Future Risk (Next 24h)</th>
              <th className="py-3 px-3">Priority Score</th>
              <th className="py-3 px-3">Top Risk Contributor (SHAP)</th>
              <th className="py-3 px-3">Recommended Action</th>
              <th className="py-3 px-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs font-medium">
            {routers.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-500 text-sm">
                  No routers found matching search and filter criteria.
                </td>
              </tr>
            ) : (
              routers.map((router) => {
                const isSelected = router.router_id === selectedRouterId;
                const topContrib = router.top_contributors?.[0];
                return (
                  <tr
                    key={router.router_id}
                    onClick={() => onSelectRouter(router.router_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/10 dark:bg-cyan-950/40 border-l-4 border-l-cyan-500'
                        : 'hover:bg-gray-50 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Router Identity */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                          {router.router_id}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          {router.firmware_version}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 font-mono mt-0.5">
                        {router.model}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-3">
                      <div className="text-xs font-medium text-gray-800 dark:text-gray-200">{router.building}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">Room {router.room} &bull; {router.user_type}</div>
                    </td>

                    {/* Current Health Score */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                          {router.current_health}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">/100</span>
                      </div>
                      <span className={`badge ${getHealthBadgeClass(router.health_status)} mt-1 text-[9px] py-0.5`}>
                        {router.health_status}
                      </span>
                    </td>

                    {/* Future Risk Probability (Supervised XGBoost Output) */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-rose-500 dark:text-rose-400 text-base">
                          {router.future_risk_pct}%
                        </span>
                        {router.future_risk_pct >= 70 && (
                          <span className="pulse-dot pulse-red"></span>
                        )}
                      </div>
                      <div className="w-24 bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          style={{ width: `${router.future_risk_pct}%` }}
                          className={`h-full rounded-full ${
                            router.future_risk_pct >= 70
                              ? 'bg-rose-500'
                              : router.future_risk_pct >= 45
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>
                    </td>

                    {/* Priority Score */}
                    <td className="py-3.5 px-3">
                      <span className={`badge ${getPriorityBadgeClass(router.priority_level)} text-[10px]`}>
                        {router.priority_level} ({router.priority_score})
                      </span>
                    </td>

                    {/* Top SHAP Contributor */}
                    <td className="py-3.5 px-3">
                      {topContrib ? (
                        <div>
                          <div className="text-xs text-gray-800 dark:text-gray-200 font-medium truncate max-w-[170px]" title={topContrib.display_name}>
                            {topContrib.display_name}
                          </div>
                          <span className="text-[10px] font-mono text-rose-500 dark:text-rose-400">
                            +{topContrib.contribution_pct}% risk impact
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Nominal baseline</span>
                      )}
                    </td>

                    {/* Recommended Action */}
                    <td className="py-3.5 px-3">
                      <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-500/30 px-2.5 py-1 rounded-lg block text-center truncate max-w-[180px]" title={router.recommended_action}>
                        {router.recommended_action}
                      </span>
                    </td>

                    {/* Arrow Action */}
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRouter(router.router_id);
                        }}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-all cursor-pointer"
                        title="Open 360 Diagnostic View"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
