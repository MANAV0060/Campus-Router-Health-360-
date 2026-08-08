import React from 'react';
import type { FleetKpis } from '../types';
import { Router, AlertOctagon, Users, HeartPulse, CheckCircle2, TrendingUp } from 'lucide-react';

interface MetricCardsProps {
  kpis: FleetKpis | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ kpis }) => {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* 1. Total Fleet */}
      <div className="glass-card p-3.5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between text-gray-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Fleet Total</span>
          <Router className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-white">{kpis.total_routers}</span>
          <span className="text-[11px] text-gray-400">units</span>
        </div>
        <div className="mt-1 text-[10px] text-gray-400">
          <strong className="text-emerald-400">{kpis.healthy_count}</strong> Healthy &bull; <strong className="text-amber-400">{kpis.watch_count}</strong> Watch
        </div>
      </div>

      {/* 2. Future Risk (OUR EXTENSION) */}
      <div className="glass-card p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 shadow-lg shadow-rose-950/20">
        <div className="flex items-center justify-between text-rose-300 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span className="pulse-dot pulse-red"></span> AI Future Risk
          </span>
          <TrendingUp className="h-3.5 w-3.5 text-rose-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-rose-400">{kpis.high_future_risk_count}</span>
          <span className="text-[11px] text-rose-300 font-semibold">Elevated (24h)</span>
        </div>
        <div className="mt-1 text-[10px] text-rose-200/70 font-medium">
          ML Early Warning &ge; 60%
        </div>
      </div>

      {/* 3. Current Critical */}
      <div className="glass-card p-3.5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between text-gray-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Currently Critical</span>
          <AlertOctagon className="h-3.5 w-3.5 text-red-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-red-400">{kpis.critical_count}</span>
          <span className="text-[11px] text-gray-400">immediate</span>
        </div>
        <div className="mt-1 text-[10px] text-gray-400">
          Health Score &lt; 40/100
        </div>
      </div>

      {/* 4. Impacted Clients */}
      <div className="glass-card p-3.5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between text-gray-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Impacted Clients</span>
          <Users className="h-3.5 w-3.5 text-purple-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-purple-300">{kpis.users_affected}</span>
          <span className="text-[11px] text-gray-400">users</span>
        </div>
        <div className="mt-1 text-[10px] text-gray-400">
          Connected to at-risk units
        </div>
      </div>

      {/* 5. Fleet Health Average */}
      <div className="glass-card p-3.5 rounded-xl border border-white/10">
        <div className="flex items-center justify-between text-gray-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">Avg Fleet Health</span>
          <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-emerald-400">{kpis.avg_fleet_health}</span>
          <span className="text-[11px] text-gray-400">/ 100</span>
        </div>
        <div className="mt-1 text-[10px] text-gray-400">
          Normalized Index
        </div>
      </div>

      {/* 6. Model Recall */}
      <div className="glass-card p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20">
        <div className="flex items-center justify-between text-cyan-300 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider">Model Recall</span>
          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-cyan-300">{kpis.model_recall}%</span>
          <span className="text-[11px] text-cyan-400 font-semibold">Test Set</span>
        </div>
        <div className="mt-1 text-[10px] text-cyan-200/70">
          0 missed degradation events
        </div>
      </div>
    </div>
  );
};
