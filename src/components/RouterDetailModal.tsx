import React, { useEffect, useState } from 'react';
import type { RouterDetail } from '../types';
import { fetchRouterDetail } from '../services/api';
import { PredictionTimeline } from './PredictionTimeline';
import { MetricTrendCharts } from './MetricTrendCharts';
import { ShapExplanationChart } from './ShapExplanationChart';
import { AICopilotDrawer } from './AICopilotDrawer';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  Building,
  User,
  Clock
} from 'lucide-react';

interface RouterDetailModalProps {
  routerId: string;
  onClose: () => void;
}

export const RouterDetailModal: React.FC<RouterDetailModalProps> = ({ routerId, onClose }) => {
  const [detail, setDetail] = useState<RouterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchRouterDetail(routerId)
      .then((data) => {
        if (mounted) setDetail(data);
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Failed to load router diagnostics');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [routerId]);

  if (!routerId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl border border-white/20 p-6 sm:p-7 shadow-2xl relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer border border-white/10"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="py-24 text-center">
            <div className="animate-spin text-cyan-400 text-3xl mb-3">⟳</div>
            <p className="text-sm text-gray-400">Loading AI 360° Telemetry for {routerId}...</p>
          </div>
        ) : error || !detail ? (
          <div className="py-16 text-center text-rose-400">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-semibold">{error || 'Router data unavailable'}</p>
          </div>
        ) : (
          <div>
            {/* 1. Header Bar: Identity & Location */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black font-mono text-white tracking-tight">
                    {detail.router_id}
                  </h2>
                  <span className="badge badge-cyan text-xs">
                    Model: {detail.model}
                  </span>
                  <span className="badge badge-watch text-xs">
                    FW: {detail.firmware_version}
                  </span>
                  {detail.is_anomaly && (
                    <span className="badge badge-risk text-xs flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Anomaly Score: {detail.anomaly_score}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    <Building className="h-3.5 w-3.5 text-gray-500" /> {detail.building} (Room {detail.room})
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-gray-500" /> {detail.user_type}
                  </span>
                  <span>&bull;</span>
                  <span>Active Clients: <strong className="text-white font-mono">{detail.metrics_now.devices_now}</strong></span>
                </div>
              </div>

              {/* Priority Tag */}
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                  Operational Priority
                </div>
                <div className={`badge ${
                  detail.priority_level === 'CRITICAL' ? 'priority-critical' :
                  detail.priority_level === 'HIGH' ? 'priority-high' :
                  detail.priority_level === 'MEDIUM' ? 'priority-medium' : 'priority-low'
                } text-xs px-3 py-1`}>
                  {detail.priority_level} ({detail.priority_score})
                </div>
              </div>
            </div>

            {/* 2. Side-by-Side: Current Health vs Future Risk */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* CURRENT HEALTH */}
              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider">A. Current Operational Health</span>
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black font-mono text-white">
                    {detail.current_health}
                  </span>
                  <span className="text-xs text-gray-400">/ 100</span>
                  <span className={`badge ${
                    detail.health_status === 'HEALTHY' ? 'badge-healthy' :
                    detail.health_status === 'WATCH' ? 'badge-watch' :
                    detail.health_status === 'AT_RISK' ? 'badge-risk' : 'badge-critical'
                  } text-xs`}>
                    {detail.health_status}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  Instantaneous 6-factor normalized telemetry score at the present timestamp.
                </p>
              </div>

              {/* FUTURE RISK (ML PREDICTION) */}
              <div className="p-4 sm:p-5 rounded-2xl border border-rose-500/40 bg-rose-950/20 shadow-lg shadow-rose-950/20">
                <div className="flex items-center justify-between text-rose-300 text-xs mb-2">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="pulse-dot pulse-red"></span> B. AI Future Degradation Risk
                  </span>
                  <Clock className="h-4 w-4 text-rose-400" />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black font-mono text-rose-400">
                    {detail.future_risk_pct}%
                  </span>
                  <span className={`badge ${
                    detail.risk_level === 'HIGH' ? 'badge-critical' :
                    detail.risk_level === 'MEDIUM' ? 'badge-watch' : 'badge-healthy'
                  } text-xs`}>
                    {detail.risk_level} RISK
                  </span>
                </div>
                <p className="text-[11px] text-rose-200/80 mt-2">
                  Supervised XGBoost forecast for the <strong>Next 24 Hours</strong> (Trained Model Output).
                </p>
              </div>
            </div>

            {/* 3. Prediction Horizon Timeline (-24h -> NOW -> +24h) */}
            <PredictionTimeline router={detail} />

            {/* 4. Live Multi-Metric Trend Charts */}
            <MetricTrendCharts history={detail.history} slopes={detail.metric_slopes} />

            {/* 5. SHAP Factor Attribution Chart */}
            <ShapExplanationChart
              contributors={detail.top_contributors}
              routerId={detail.router_id}
              riskPct={detail.future_risk_pct}
            />

            {/* 6. Root Cause & Actionable Recommendation Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Root Cause Diagnosis */}
              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-cyan-400" /> Identified Root Cause
                </h4>
                <div className="text-sm font-bold text-white mb-2">
                  {detail.root_cause}
                </div>
                <ul className="space-y-1 text-xs text-gray-300">
                  {detail.evidence.map((ev, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-cyan-400 font-bold">&bull;</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Single Actionable Recommendation */}
              <div className="p-4 sm:p-5 rounded-2xl border border-cyan-500/40 bg-cyan-950/20 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 mb-2 flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-cyan-400" /> Single Actionable Recommendation
                  </h4>
                  <div className="text-base font-extrabold text-cyan-200 mb-1.5">
                    {detail.recommended_action}
                  </div>
                  <p className="text-xs text-gray-300">
                    Targeted preventive IT action to avoid service interruption for {Math.round(detail.metrics_now.devices_now)} active connected clients.
                  </p>
                </div>
              </div>
            </div>

            {/* 7. Grounded AI Copilot Assistant */}
            <AICopilotDrawer routerId={detail.router_id} />
          </div>
        )}
      </div>
    </div>
  );
};
