import React from 'react';
import type { FleetKpis } from '../types';
import { Activity } from 'lucide-react';

interface HealthDistributionChartProps {
  kpis: FleetKpis | null;
}

export const HealthDistributionChart: React.FC<HealthDistributionChartProps> = ({ kpis }) => {
  if (!kpis) return null;

  const total = kpis.total_routers || 60;
  const healthyPct = Math.round((kpis.healthy_count / total) * 100);
  const watchPct = Math.round((kpis.watch_count / total) * 100);
  const criticalPct = Math.round((kpis.critical_count / total) * 100);
  const futureRiskPct = Math.round((kpis.high_future_risk_count / total) * 100);

  return (
    <div className="bg-white dark:bg-[#121829] p-4 sm:p-5 rounded-2xl border border-[#C9CFF2]/60 dark:border-[#1e284a] mb-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Current Health Distribution vs AI Future Risk Transition
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gray-500 dark:text-gray-400">Total Fleet:</span>
          <strong className="text-gray-900 dark:text-white font-bold">{total} units</strong>
        </div>
      </div>

      {/* Multi-Segment Stacked Progress Bar */}
      <div className="h-3.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-gray-200 dark:border-gray-700/60">
        <div
          style={{ width: `${healthyPct}%` }}
          className="h-full bg-emerald-500 rounded-l-full transition-all"
          title={`Healthy: ${kpis.healthy_count} (${healthyPct}%)`}
        />
        <div
          style={{ width: `${watchPct}%` }}
          className="h-full bg-amber-500 transition-all"
          title={`Watch: ${kpis.watch_count} (${watchPct}%)`}
        />
        <div
          style={{ width: `${criticalPct}%` }}
          className="h-full bg-rose-500 rounded-r-full transition-all"
          title={`Critical: ${kpis.critical_count} (${criticalPct}%)`}
        />
      </div>

      {/* Badges Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 text-xs">
        <div className="flex items-center gap-2.5 bg-emerald-50/80 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <div className="text-[11px] font-medium text-emerald-800/80 dark:text-emerald-400">Healthy (80-100)</div>
            <div className="font-bold text-emerald-950 dark:text-emerald-200 font-mono text-xs sm:text-sm">{kpis.healthy_count} units ({healthyPct}%)</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-amber-50/80 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/80 dark:border-amber-500/20">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <div>
            <div className="text-[11px] font-medium text-amber-800/80 dark:text-amber-400">Watch (60-79)</div>
            <div className="font-bold text-amber-950 dark:text-amber-200 font-mono text-xs sm:text-sm">{kpis.watch_count} units ({watchPct}%)</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-rose-50/80 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-500/20">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <div>
            <div className="text-[11px] font-medium text-rose-800/80 dark:text-rose-400">Critical (&lt; 40)</div>
            <div className="font-bold text-rose-950 dark:text-rose-200 font-mono text-xs sm:text-sm">{kpis.critical_count} units ({criticalPct}%)</div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-rose-100/90 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-300 dark:border-rose-500/40">
          <span className="pulse-dot pulse-red shrink-0" />
          <div>
            <div className="text-[11px] font-semibold text-rose-900 dark:text-rose-300">AI Elevated (24h)</div>
            <div className="font-bold text-rose-950 dark:text-rose-100 font-mono text-xs sm:text-sm">{kpis.high_future_risk_count} units ({futureRiskPct}%)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
