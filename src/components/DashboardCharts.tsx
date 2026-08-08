import React from 'react';
import { DashboardDistributions, RouterItem } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { Building2, Layers, AlertOctagon, ChevronRight } from 'lucide-react';

interface DashboardChartsProps {
  distributions: DashboardDistributions;
  worstPerforming: RouterItem[];
  onSelectRouter: (router: RouterItem) => void;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  distributions,
  worstPerforming,
  onSelectRouter
}) => {
  return (
    <div className="space-y-6">
      {/* 2-Column Grid for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Building Health Breakdown Stacked Bar Chart */}
        <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/80 dark:border-[#1e284a] rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                Router Status Distribution by Campus Building
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Healthy (emerald), Watch (amber), Critical (rose)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributions.by_building} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                <XAxis
                  dataKey="building"
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(16, 24, 40, 0.95)',
                    borderColor: '#1d2939',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                    color: '#ffffff'
                  }}
                />
                <Bar dataKey="healthy" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="watch" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="critical" stackId="a" fill="#f43f5e" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency Histogram Bar Chart */}
        <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/80 dark:border-[#1e284a] rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                Round-Trip Latency Distribution (ms)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Number of campus routers grouped by response times
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributions.latency_histogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(16, 24, 40, 0.95)',
                    borderColor: '#1d2939',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                    color: '#ffffff'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distributions.latency_histogram.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.range === '>150ms' || entry.range === '101-150ms'
                          ? '#f43f5e'
                          : entry.range === '51-100ms'
                          ? '#f59e0b'
                          : '#10b981'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Worst Performing Routers Table Callout */}
      <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/80 dark:border-[#1e284a] rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-500" />
              Highest Anomaly Priority Nodes
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Immediate intervention required for high packet loss and buffer exhaustion.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold uppercase">
                <th className="py-2.5 px-3">Router ID</th>
                <th className="py-2.5 px-3">Building & Room</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Packet Loss</th>
                <th className="py-2.5 px-3">Priority Score</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
              {worstPerforming.map((router) => (
                <tr
                  key={router.id}
                  onClick={() => onSelectRouter(router)}
                  className="hover:bg-gray-50 dark:hover:bg-[#101828] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 font-mono font-bold text-gray-900 dark:text-white">
                    {router.id}
                  </td>
                  <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                    {router.building} ({router.room})
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        router.status === 'Critical'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}
                    >
                      {router.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-rose-500 font-bold">
                    {router.latency_ms} ms
                  </td>
                  <td className="py-3 px-3 font-mono text-rose-500 font-bold">
                    {router.packet_loss_pct}%
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-rose-500 text-white">
                      {router.priority_score}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button className="text-xs text-gray-700 dark:text-gray-300 font-semibold hover:underline flex items-center gap-1 justify-end ml-auto">
                      Inspect <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
