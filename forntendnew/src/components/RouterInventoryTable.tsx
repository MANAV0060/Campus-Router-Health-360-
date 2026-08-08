import React from 'react';
import { RouterItem } from '../types';
import { Server, Users, ArrowRight, ShieldAlert, Cpu, ChevronRight } from 'lucide-react';

interface RouterInventoryTableProps {
  routers: RouterItem[];
  onSelectRouter: (router: RouterItem) => void;
  selectedRouterId?: string;
}

export const RouterInventoryTable: React.FC<RouterInventoryTableProps> = ({
  routers,
  onSelectRouter,
  selectedRouterId
}) => {
  return (
    <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/80 dark:border-[#1e284a] rounded-2xl p-5 sm:p-6 shadow-2xs transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            Router Inventory & Live Telemetry
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click any router row to open baseline diagnostics, evidence metrics, and IT recommendation panel.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#f2f4f7] dark:bg-[#101828] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#1d2939] self-start sm:self-auto">
          {routers.length} Active Nodes
        </span>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-3">Router ID & Name</th>
              <th className="py-3 px-3">Location</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Latency</th>
              <th className="py-3 px-3">Packet Loss</th>
              <th className="py-3 px-3">Impacted Users</th>
              <th className="py-3 px-3 text-right">Priority Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs font-medium">
            {routers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  No routers match current filter constraints.
                </td>
              </tr>
            ) : (
              routers.map((router) => {
                const isSelected = router.id === selectedRouterId;
                const isCritical = router.status === 'Critical';
                const isWatch = router.status === 'Watch';

                return (
                  <tr
                    key={router.id}
                    onClick={() => onSelectRouter(router)}
                    className={`group cursor-pointer transition-all duration-150 hover:translate-x-0.5 hover:bg-[#F2F2F2]/60 dark:hover:bg-[#1a233b] ${
                      isSelected
                        ? 'bg-[#445EF2]/10 dark:bg-[#445EF2]/20 font-semibold border-l-4 border-l-[#445EF2]'
                        : ''
                    }`}
                  >
                    {/* ID & Name */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-900 dark:text-white">
                          {router.id}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                        {router.name}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-3">
                      <div className="text-gray-900 dark:text-gray-200 font-semibold">
                        {router.building}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {router.room}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isCritical
                              ? 'bg-rose-500 animate-rapid-pulse'
                              : isWatch
                              ? 'bg-amber-500'
                              : 'bg-emerald-500 animate-soft-pulse'
                          }`}
                        />
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                            isCritical
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : isWatch
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {router.status}
                        </span>
                      </div>
                    </td>

                    {/* Latency */}
                    <td className="py-3.5 px-3 font-mono">
                      <span className={router.latency_ms > 100 ? 'text-rose-500 font-bold' : 'text-gray-700 dark:text-gray-300'}>
                        {router.latency_ms} ms
                      </span>
                    </td>

                    {/* Loss */}
                    <td className="py-3.5 px-3 font-mono">
                      <span className={router.packet_loss_pct > 5 ? 'text-rose-500 font-bold' : 'text-gray-700 dark:text-gray-300'}>
                        {router.packet_loss_pct}%
                      </span>
                    </td>

                    {/* Impacted Users */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>{router.affected_users}</span>
                      </div>
                    </td>

                    {/* Priority Score */}
                    <td className="py-3.5 px-3 text-right font-mono">
                      <div className="inline-flex items-center justify-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            router.priority_score >= 80
                              ? 'bg-rose-500 text-white'
                              : router.priority_score >= 50
                              ? 'bg-amber-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {router.priority_score}
                        </span>
                      </div>
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
