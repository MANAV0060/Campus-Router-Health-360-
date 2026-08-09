import React, { useEffect, useState } from 'react';
import { Activity, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

interface RouterDetailsViewProps {
  routerId: string;
  onBack: () => void;
}

export const RouterDetailsView: React.FC<RouterDetailsViewProps> = ({ routerId, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/routers/${encodeURIComponent(routerId)}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load router detail:', err);
        setLoading(false);
      });
  }, [routerId]);

  if (loading || !data) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin text-cyan-400 text-3xl mb-3">⟳</div>
        <p className="text-sm text-gray-400">Loading Router {routerId} Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 border border-white/10 transition-all cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </button>

      <div className="glass-card p-6 rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black font-mono text-white">{data.router_id}</h2>
              <span className="badge badge-cyan text-xs">Model: {data.model}</span>
              <span className="badge badge-watch text-xs">FW: {data.firmware_version || data.firmware}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Building: {data.building} &bull; Room {data.room} &bull; {data.user_type}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Health Score</div>
              <div className="text-2xl font-black font-mono text-white">{data.current_health || data.health_score}/100</div>
            </div>
          </div>
        </div>

        {/* Diagnosis & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <h4 className="text-xs font-bold uppercase text-gray-300 mb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-cyan-400" /> Root Cause Diagnosis
            </h4>
            <p className="text-sm font-semibold text-white mb-2">{data.root_cause || data.evidence?.root_cause_diagnosis || 'Network backhaul degradation'}</p>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
            <h4 className="text-xs font-bold uppercase text-cyan-300 mb-2">Recommended IT Action</h4>
            <p className="text-sm font-bold text-cyan-200">{data.recommended_action || data.evidence?.recommended_action || 'Investigate network/backhaul'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
