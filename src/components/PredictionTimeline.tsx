import React from 'react';
import type { RouterDetail } from '../types';
import { Clock, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface PredictionTimelineProps {
  router: RouterDetail;
}

export const PredictionTimeline: React.FC<PredictionTimelineProps> = ({ router }) => {
  const currentHealth = router.current_health;
  const futureRisk = router.future_risk_pct;

  const history = router.history || [];
  const hPast24 = history[0]?.health_score ?? Math.min(100, currentHealth + 18);
  const hPast12 = history[Math.floor(history.length / 2)]?.health_score ?? Math.min(100, currentHealth + 10);

  const getStatusStage = (score: number) => {
    if (score >= 80) return { label: 'Healthy', color: 'text-emerald-400', bg: 'bg-emerald-500', icon: CheckCircle2 };
    if (score >= 60) return { label: 'Watch / Mod', color: 'text-amber-400', bg: 'bg-amber-500', icon: AlertTriangle };
    if (score >= 40) return { label: 'At Risk', color: 'text-orange-400', bg: 'bg-orange-500', icon: AlertTriangle };
    return { label: 'Critical', color: 'text-rose-400', bg: 'bg-rose-500', icon: AlertOctagon };
  };

  const stagePast24 = getStatusStage(hPast24);
  const stagePast12 = getStatusStage(hPast12);
  const stageNow = getStatusStage(currentHealth);

  const isPredictedDegraded = futureRisk >= 60.0;
  const stageFuture12 = isPredictedDegraded
    ? { label: 'Deteriorating', color: 'text-orange-400', bg: 'bg-orange-500', icon: AlertTriangle }
    : { label: 'Stable', color: 'text-emerald-400', bg: 'bg-emerald-500', icon: CheckCircle2 };

  const stageFuture24 = isPredictedDegraded
    ? { label: 'Degraded / Critical', color: 'text-rose-400', bg: 'bg-rose-500', icon: AlertOctagon }
    : { label: 'Nominal', color: 'text-emerald-400', bg: 'bg-emerald-500', icon: CheckCircle2 };

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400" />
          Degradation Horizon Timeline (-24h Past &rarr; NOW &rarr; +24h Forecast)
        </h4>
        <span className="text-[11px] font-mono text-purple-300 bg-purple-950/40 border border-purple-500/30 px-2 py-0.5 rounded">
          XGBoost Supervised Prediction Horizon
        </span>
      </div>

      {/* Nodes and Connector Line */}
      <div className="relative flex items-center justify-between px-4 py-3">
        {/* Continuous track */}
        <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 via-50% to-rose-500 rounded-full z-0 opacity-60" />

        {/* 1. -24h Node */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-7 w-7 rounded-full bg-gray-900 border-2 border-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[11px] font-mono text-gray-400 mt-2">-24 Hours</span>
          <span className={`text-xs font-bold ${stagePast24.color}`}>{stagePast24.label}</span>
          <span className="text-[10px] text-gray-500">Score: {Math.round(hPast24)}</span>
        </div>

        {/* 2. -12h Node */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-7 w-7 rounded-full bg-gray-900 border-2 border-emerald-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[11px] font-mono text-gray-400 mt-2">-12 Hours</span>
          <span className={`text-xs font-bold ${stagePast12.color}`}>{stagePast12.label}</span>
          <span className="text-[10px] text-gray-500">Score: {Math.round(hPast12)}</span>
        </div>

        {/* 3. NOW Node (Prediction Anchor Point) */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-9 w-9 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/40 animate-pulse">
            <div className="h-3.5 w-3.5 rounded-full bg-cyan-400" />
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300 mt-1.5 flex items-center gap-1">
            NOW (Prediction Point)
          </span>
          <span className={`text-xs font-bold ${stageNow.color}`}>{stageNow.label} ({router.current_health}/100)</span>
          <span className="text-[10px] font-mono text-cyan-400">P(Risk): {futureRisk}%</span>
        </div>

        {/* 4. +12h Node */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`h-7 w-7 rounded-full bg-gray-900 border-2 ${isPredictedDegraded ? 'border-orange-400' : 'border-emerald-400'} flex items-center justify-center`}>
            <div className={`h-2.5 w-2.5 rounded-full ${isPredictedDegraded ? 'bg-orange-400' : 'bg-emerald-400'}`} />
          </div>
          <span className="text-[11px] font-mono text-gray-400 mt-2">+12h Forecast</span>
          <span className={`text-xs font-bold ${stageFuture12.color}`}>{stageFuture12.label}</span>
          <span className="text-[10px] text-gray-500">Rising Latency</span>
        </div>

        {/* 5. +24h Node */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`h-7 w-7 rounded-full bg-gray-900 border-2 ${isPredictedDegraded ? 'border-rose-500' : 'border-emerald-400'} flex items-center justify-center`}>
            <div className={`h-2.5 w-2.5 rounded-full ${isPredictedDegraded ? 'bg-rose-500' : 'bg-emerald-400'}`} />
          </div>
          <span className="text-[11px] font-mono text-gray-400 mt-2">+24h Forecast</span>
          <span className={`text-xs font-bold ${stageFuture24.color}`}>{stageFuture24.label}</span>
          <span className="text-[10px] text-gray-500">Sustained Failure</span>
        </div>
      </div>
    </div>
  );
};
