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
    <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Current Health Distribution vs AI Future Risk Transition
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-gray-400">Total Fleet:</span>
          <strong className="text-white">{total} units</strong>
        </div>
      </div>

      {/* Multi-Segment Stacked Progress Bar */}
      <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-white/10">
        <div
          style={{ width: `${healthyPct}%` }}
          className="h-full bg-emerald-500 rounded-l-full"
          title={`Healthy: ${kpis.healthy_count} (${healthyPct}%)`}
        />
        <div
          style={{ width: `${watchPct}%` }}
          className="h-full bg-amber-500"
          title={`Watch: ${kpis.watch_count} (${watchPct}%)`}
        />
        <div
          style={{ width: `${criticalPct}%` }}
          className="h-full bg-rose-500 rounded-r-full"
          title={`Critical: ${kpis.critical_count} (${criticalPct}%)`}
        />
      </div>

      {/* Badges Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 text-xs">
        <div className="flex items-center gap-2 bg-white/[0.02] p-2 rounded-xl border border-white/5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <div className="text-[11px] text-gray-400">Healthy (80-100)</div>
            <div className="font-bold text-white font-mono">{kpis.healthy_count} units ({healthyPct}%)</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/[0.02] p-2 rounded-xl border border-white/5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <div>
            <div className="text-[11px] text-gray-400">Watch (60-79)</div>
            <div className="font-bold text-amber-300 font-mono">{kpis.watch_count} units ({watchPct}%)</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/[0.02] p-2 rounded-xl border border-white/5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <div>
            <div className="text-[11px] text-gray-400">Critical (&lt; 40)</div>
            <div className="font-bold text-rose-400 font-mono">{kpis.critical_count} units ({criticalPct}%)</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-rose-950/20 p-2 rounded-xl border border-rose-500/30">
          <span className="pulse-dot pulse-red shrink-0" />
          <div>
            <div className="text-[11px] text-rose-300 font-semibold">AI Elevated (24h)</div>
            <div className="font-bold text-rose-400 font-mono">{kpis.high_future_risk_count} units ({futureRiskPct}%)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
