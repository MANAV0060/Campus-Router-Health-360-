import React from 'react';
import { BaselineProfiles, CurrentMetrics } from '../types';

interface BaselineTableProps {
  current: CurrentMetrics;
  baselines: BaselineProfiles;
}

export const BaselineTable: React.FC<BaselineTableProps> = ({ current, baselines }) => {
  const rows = [
    {
      metric: 'Round-Trip Latency',
      current: `${current.latency_ms} ms`,
      peer: `${baselines.peer_avg.latency_ms} ms`,
      healthy: `${baselines.healthy_avg.latency_ms} ms`,
      global: `${baselines.global_avg.latency_ms} ms`,
      isBad: current.latency_ms > baselines.healthy_avg.latency_ms * 2
    },
    {
      metric: 'Packet Loss Rate',
      current: `${current.packet_loss_pct}%`,
      peer: `${baselines.peer_avg.packet_loss_pct}%`,
      healthy: `${baselines.healthy_avg.packet_loss_pct}%`,
      global: `${baselines.global_avg.packet_loss_pct}%`,
      isBad: current.packet_loss_pct > 1.0
    },
    {
      metric: '24h Disconnect Flaps',
      current: `${current.disconnects_24h} drops`,
      peer: `${baselines.peer_avg.disconnects_24h} drops`,
      healthy: `${baselines.healthy_avg.disconnects_24h} drops`,
      global: `${baselines.global_avg.disconnects_24h} drops`,
      isBad: current.disconnects_24h > 5
    },
    {
      metric: 'Active Throughput',
      current: `${current.throughput_mbps} Mbps`,
      peer: `${baselines.peer_avg.throughput_mbps} Mbps`,
      healthy: `${baselines.healthy_avg.throughput_mbps} Mbps`,
      global: `${baselines.global_avg.throughput_mbps} Mbps`,
      isBad: current.throughput_mbps < baselines.healthy_avg.throughput_mbps * 0.5
    }
  ];

  return (
    <div className="bg-gray-50 dark:bg-[#101828] border border-gray-200 dark:border-[#1d2939] rounded-2xl p-4 sm:p-5 mb-5">
      <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">
        Metric Baselines Comparison
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400 font-semibold">
              <th className="py-2 px-2">Metric</th>
              <th className="py-2 px-2 font-bold text-gray-900 dark:text-white">Current Node</th>
              <th className="py-2 px-2">Peer Building Avg</th>
              <th className="py-2 px-2">Healthy Baseline</th>
              <th className="py-2 px-2">Global Campus Avg</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/60 dark:divide-gray-800/60 font-mono">
            {rows.map((row) => (
              <tr key={row.metric} className="hover:bg-gray-100/50 dark:hover:bg-gray-800/40">
                <td className="py-2.5 px-2 font-sans font-medium text-gray-700 dark:text-gray-300">
                  {row.metric}
                </td>
                <td
                  className={`py-2.5 px-2 font-bold ${
                    row.isBad ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {row.current}
                </td>
                <td className="py-2.5 px-2 text-gray-600 dark:text-gray-400">{row.peer}</td>
                <td className="py-2.5 px-2 text-gray-600 dark:text-gray-400">{row.healthy}</td>
                <td className="py-2.5 px-2 text-gray-500 dark:text-gray-500">{row.global}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
