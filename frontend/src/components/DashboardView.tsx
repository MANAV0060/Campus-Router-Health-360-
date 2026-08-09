import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert, Heart, ClipboardList, Upload } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

interface RouterSummary {
  rank: number;
  router_id: string;
  health_score: number;
  status: string;
  building: string;
  model: string;
  firmware: string;
  latency: number;
  packet_loss: number;
  disconnects: number;
  signal: number;
  connected_devices: number;
}

interface DashboardData {
  summary: {
    total_routers: number;
    healthy_count: number;
    watch_count: number;
    at_risk_count: number;
    critical_count: number;
  };
  worst_routers: RouterSummary[];
  building_distribution: Array<{ building: string; total: number; critical: number; healthy: number }>;
  firmware_distribution: Array<{ firmware: string; total: number; critical: number; healthy: number }>;
  status_distribution: Array<{ name: string; value: number }>;
}

interface DashboardViewProps {
  filters: {
    building: string;
    firmware: string;
    model: string;
    status: string;
  };
  onRouterSelect: (routerId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ filters, onRouterSelect }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (filters.building) query.append('building', filters.building);
    if (filters.firmware) query.append('firmware', filters.firmware);
    if (filters.model) query.append('model', filters.model);
    if (filters.status) query.append('status', filters.status);

    fetch(`${API_BASE_URL}/dashboard?${query.toString()}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard:', err);
        setLoading(false);
      });
  }, [filters]);

  const handleFileUpload = async (type: 'metrics' | 'routers', file: File) => {
    setUploadStatus(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/upload/${type}`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        setUploadStatus({ success: true, message: `Successfully updated ${type} telemetry.` });
      } else {
        setUploadStatus({ success: false, message: result.detail || 'Upload failed.' });
      }
    } catch (err: any) {
      setUploadStatus({ success: false, message: err.message || 'Error connecting to upload API.' });
    }
  };

  if (loading || !data) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin text-cyan-400 text-3xl mb-3">⟳</div>
        <p className="text-sm text-gray-400">Loading Network Health Dashboard...</p>
      </div>
    );
  }

  const { summary, worst_routers } = data;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-white/10">
          <div className="flex items-center justify-between text-gray-400 text-xs mb-1">
            <span>Total Units</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">{summary.total_routers}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-300 text-xs mb-1">
            <span>Healthy (80-100)</span>
            <Heart className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{summary.healthy_count}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-amber-500/30 bg-amber-950/20">
          <div className="flex items-center justify-between text-amber-300 text-xs mb-1">
            <span>Watch / Mod</span>
            <ClipboardList className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300">{summary.watch_count}</div>
        </div>

        <div className="glass-card p-4 rounded-xl border border-rose-500/30 bg-rose-950/20">
          <div className="flex items-center justify-between text-rose-300 text-xs mb-1">
            <span>Critical (&lt; 40)</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{summary.critical_count}</div>
        </div>
      </div>

      {/* CSV Intake Panel */}
      <div className="glass-card p-4 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Live CSV Telemetry Intake</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-gray-300 border border-white/10 cursor-pointer">
            Upload metrics.csv
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload('metrics', e.target.files[0])} />
          </label>
          <label className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-gray-300 border border-white/10 cursor-pointer">
            Upload routers.csv
            <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload('routers', e.target.files[0])} />
          </label>
        </div>
        {uploadStatus && (
          <div className={`text-xs w-full ${uploadStatus.success ? 'text-emerald-400' : 'text-rose-400'}`}>
            {uploadStatus.message}
          </div>
        )}
      </div>

      {/* Worst 10 Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 font-bold text-xs uppercase tracking-wider text-white">
          Degraded Routers Requiring Inspection
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th>Router ID</th>
                <th>Building</th>
                <th>Health Score</th>
                <th>Status</th>
                <th>Latency (ms)</th>
                <th>Packet Loss (%)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {worst_routers.map((r) => (
                <tr key={r.router_id} onClick={() => onRouterSelect(r.router_id)} className="cursor-pointer hover:bg-white/5">
                  <td className="font-mono font-bold text-white">{r.router_id}</td>
                  <td>{r.building}</td>
                  <td className="font-mono font-bold text-rose-400">{r.health_score}</td>
                  <td><span className="badge badge-critical">{r.status}</span></td>
                  <td>{r.latency}ms</td>
                  <td>{r.packet_loss}%</td>
                  <td>
                    <button className="text-cyan-400 hover:underline">Inspect &rarr;</button>
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
