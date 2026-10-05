import React, { useEffect, useState } from 'react';
import { AnalyticsResponse, PrioritizedIntervention } from '../types';
import { fetchAnalytics } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';
import {
  ListOrdered,
  Users,
  AlertTriangle,
  Cpu,
  Building,
  CheckCircle,
  Clock,
  UserCheck,
  Wrench,
  ShieldAlert
} from 'lucide-react';

interface FleetAnalyticsViewProps {
  onSelectRouterById?: (id: string) => void;
}

export const FleetAnalyticsView: React.FC<FleetAnalyticsViewProps> = ({ onSelectRouterById }) => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [queue, setQueue] = useState<PrioritizedIntervention[]>([]);

  useEffect(() => {
    fetchAnalytics()
      .then((data) => {
        setAnalytics(data);
        setQueue(data.prioritized_interventions);
      })
      .catch((err) => console.error('Failed fetching analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = (id: string, newStatus: PrioritizedIntervention['status']) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white dark:bg-[#101828] border border-gray-200/80 dark:border-gray-800 rounded-2xl shimmer-bg" />
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-[#101828] border border-gray-200/80 dark:border-gray-800 rounded-2xl shimmer-bg" />
      </div>
    );
  }

  const COLORS = ['#f43f5e', '#f59e0b', '#445EF2', '#5E75F2'];

  return (
    <div className="space-y-6">
      {/* Aggregates Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Impacted Users */}
        <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/80 dark:border-[#1e284a] rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Total Impacted Users
            </span>
            <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">
              {analytics.aggregates.total_affected_users}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Across non-nominal nodes</p>
          </div>
          <div className="p-3 rounded-xl bg-[#445EF2]/10 text-[#445EF2] dark:text-[#94A2F2]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* High Priority Alerts */}
        <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/80 dark:border-[#1e284a] rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              High Priority Interventions
            </span>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
              {analytics.aggregates.high_priority_count}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Score &ge; 70 priority</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Outdated Firmware */}
        <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/80 dark:border-[#1e284a] rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Outdated Firmware Nodes
            </span>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {analytics.aggregates.outdated_firmware_count}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Requires flash update</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Top Risk Building */}
        <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/80 dark:border-[#1e284a] rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Highest Risk Building
            </span>
            <div className="text-base font-extrabold text-gray-900 dark:text-white mt-1 truncate max-w-[150px]">
              {analytics.aggregates.top_risk_building}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Concentrated user impact</p>
          </div>
          <div className="p-3 rounded-xl bg-[#445EF2]/10 text-[#445EF2] dark:text-[#94A2F2]">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Prioritized IT Queue Checklist */}
      <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/80 dark:border-[#1e284a] rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              Prioritized IT Intervention Queue
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sorted strictly by NetSentinel priority algorithm (Packet Loss % &times; Affected Users / Healthy Baseline).
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-[#101828] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#1d2939] self-start sm:self-auto">
            {queue.length} Active Tasks
          </span>
        </div>

        {/* Checklist List */}
        <div className="space-y-4">
          {queue.map((item, index) => {
            const isResolved = item.status === 'Resolved';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isResolved
                    ? 'bg-gray-50/50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 opacity-60'
                    : 'bg-[#f2f4f7]/60 dark:bg-[#101828]/80 border-gray-200 dark:border-[#1d2939] hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Task Detail */}
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-400">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => onSelectRouterById && onSelectRouterById(item.router_id)}
                        className="font-mono text-xs font-bold text-gray-900 dark:text-white hover:underline flex items-center gap-1"
                      >
                        {item.router_id}
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {item.building} ({item.room})
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          item.severity === 'Critical'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {item.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-500 ml-auto lg:ml-0">
                        Score: {item.priority_score}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.issue_title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      <strong className="text-gray-800 dark:text-gray-200">Root Cause:</strong> {item.root_cause}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <strong className="text-gray-800 dark:text-gray-200">Action:</strong> {item.recommended_action}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200/60 dark:border-gray-800/60">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {item.affected_users} Users
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                        Assignee: <strong className="text-gray-700 dark:text-gray-300">{item.assigned_tech}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Est. Downtime: {item.estimated_downtime_min} mins
                      </span>
                    </div>
                  </div>

                  {/* Right Status Toggle Selector */}
                  <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-[#080b13] text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
