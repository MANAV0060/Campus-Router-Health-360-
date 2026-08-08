import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowLeft, Cpu, Wrench, RefreshCw, Layers, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

interface RouterDetailsViewProps {
  routerId: string;
  onBack: () => void;
}

interface EvidenceItem {
  factor: string;
  strength: string;
  score: number;
  current: number;
  baseline: number;
  change_percent: number;
}

interface EvidencePackage {
  router: {
    id: string;
    building: string;
    model: string;
    firmware: string;
    room: string;
    user_type: string;
    complaints: Array<{ ticket_id: string; date: string; complaint_text: string }>;
  };
  health: {
    score: number;
    status: string;
  };
  current_metrics: {
    speed: number;
    latency: number;
    packet_loss: number;
    disconnects: number;
    device_load: number;
    signal: number;
  };
  baselines: {
    global: Record<string, number>;
    peer: Record<string, number>;
    healthy: Record<string, number>;
  };
  trends: Record<string, { now: number; '6h': number; '12h': number; '24h': number; history: number[] }>;
  evidence: EvidenceItem[];
  recommendation: {
    action: string;
    reason: string;
  };
}

interface DiagnosisRes {
  diagnosis_text: string;
  source: string;
}

interface MiniRouterDetail {
  router_id: string;
  health_score: number;
  status: string;
  latency: number;
  packet_loss: number;
  disconnects: number;
  signal: number;
  speed: number;
  connected_devices: number;
  building: string;
  firmware: string;
  model: string;
}

const STATUS_COLORS = {
  Healthy: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
  Watch: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
  'At Risk': 'text-orange-400 border-orange-500/20 bg-orange-500/10',
  Critical: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
};

const STRENGTH_COLORS = {
  Strong: 'bg-rose-500 text-rose-100',
  Moderate: 'bg-orange-500 text-orange-100',
  Weak: 'bg-amber-500 text-amber-900',
  Negligible: 'bg-slate-700 text-slate-300',
};

export const RouterDetailsView: React.FC<RouterDetailsViewProps> = ({ routerId, onBack }) => {
  const [evidence, setEvidence] = useState<EvidencePackage | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [diagnosis, setDiagnosis] = useState<DiagnosisRes | null>(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  const [allRouters, setAllRouters] = useState<any[]>([]);
  const [compareRouterId, setCompareRouterId] = useState('');
  const [compareDetails, setCompareDetails] = useState<MiniRouterDetail | null>(null);
  const [selectedChartMetric, setSelectedChartMetric] = useState<'latency' | 'packet_loss' | 'disconnects' | 'signal' | 'speed'>('latency');

  useEffect(() => {
    // 1. Fetch router evidence
    fetch(`${API_BASE_URL}/routers/${routerId}/evidence`)
      .then((res) => res.json())
      .then((data) => setEvidence(data))
      .catch((err) => console.error('Error fetching evidence:', err));

    // 2. Fetch history for charts
    fetch(`${API_BASE_URL}/routers/${routerId}/history`)
      .then((res) => res.json())
      .then((data) => setHistory(data.history))
      .catch((err) => console.error('Error fetching history:', err));

    // 3. Reset diagnosis
    setDiagnosis(null);

    // 4. Fetch all routers for comparison dropdown
    fetch(`${API_BASE_URL}/routers?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        setAllRouters(data.routers.filter((r: any) => r.router_id !== routerId));
      })
      .catch((err) => console.error('Error fetching routers list:', err));
  }, [routerId]);

  useEffect(() => {
    if (!compareRouterId) {
      setCompareDetails(null);
      return;
    }
    // Fetch details of router to compare
    fetch(`${API_BASE_URL}/routers/${compareRouterId}`)
      .then((res) => res.json())
      .then((data) => {
        setCompareDetails({
          router_id: data.router_id,
          health_score: data.health_score,
          status: data.status,
          latency: data.averages.latency,
          packet_loss: data.averages.packet_loss,
          disconnects: data.averages.disconnects,
          signal: data.averages.signal,
          speed: data.averages.speed,
          connected_devices: data.averages.connected_devices,
          building: data.building,
          firmware: data.firmware,
          model: data.model,
        });
      })
      .catch((err) => console.error('Error fetching comparison details:', err));
  }, [compareRouterId]);

  const requestDiagnosis = () => {
    setLoadingDiagnosis(true);
    fetch(`${API_BASE_URL}/routers/${routerId}/diagnosis`)
      .then((res) => res.json())
      .then((data) => {
        setDiagnosis(data);
        setLoadingDiagnosis(false);
      })
      .catch((err) => {
        console.error('Error running diagnosis:', err);
        setLoadingDiagnosis(false);
      });
  };

  if (!evidence) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Format Recharts data
  const chartData = history.map((h) => ({
    hour: new Date(h.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    latency: h.latency,
    packet_loss: h.packet_loss,
    disconnects: h.disconnects,
    signal: h.signal,
    speed: h.speed,
    devices: h.connected_devices,
  }));

  const renderChart = () => {
    let strokeColor = '#10b981';
    let dataKey = 'latency';
    let label = 'Latency (ms)';

    if (selectedChartMetric === 'packet_loss') {
      strokeColor = '#ef4444';
      dataKey = 'packet_loss';
      label = 'Packet Loss (%)';
    } else if (selectedChartMetric === 'disconnects') {
      strokeColor = '#f59e0b';
      dataKey = 'disconnects';
      label = 'Disconnects';
    } else if (selectedChartMetric === 'signal') {
      strokeColor = '#f97316';
      dataKey = 'signal';
      label = 'Signal Strength (dBm)';
    } else if (selectedChartMetric === 'speed') {
      strokeColor = '#60a5fa';
      dataKey = 'speed';
      label = 'Average Speed (Mbps)';
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2538" />
          <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
          <YAxis stroke="#64748b" fontSize={10} />
          <Tooltip contentStyle={{ backgroundColor: '#0f1322', borderColor: '#1e2538', color: '#f1f5f9' }} />
          <Line type="monotone" name={label} dataKey={dataKey} stroke={strokeColor} strokeWidth={2} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back button and title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <span className="text-xs text-slate-400 font-medium">Campus Router Explorer</span>
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-3">
            <span>Router: {evidence.router.id}</span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${STATUS_COLORS[evidence.health.status as keyof typeof STATUS_COLORS]}`}>
              {evidence.health.score}/100 — {evidence.health.status}
            </span>
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Router Profile & Baselines */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Metadata Card */}
          <div className="glass-panel p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-slate-400">Building / Location</span>
              <div className="text-sm font-semibold text-slate-200">{evidence.router.building.replace('-', ' ')} (Rm {evidence.router.room})</div>
            </div>
            <div>
              <span className="text-xs text-slate-400">Hardware Model</span>
              <div className="text-sm font-semibold text-slate-200">{evidence.router.model}</div>
            </div>
            <div>
              <span className="text-xs text-slate-400">Firmware Version</span>
              <div className="text-sm font-semibold text-slate-200 font-mono">{evidence.router.firmware}</div>
            </div>
            <div>
              <span className="text-xs text-slate-400">Primary Users</span>
              <div className="text-sm font-semibold text-slate-200 capitalize">{evidence.router.user_type}</div>
            </div>
          </div>

          {/* Three-tier Baselines Table */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Layers size={16} className="text-emerald-400" />
              <span>Three-Tier Baseline Context Analysis</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase bg-slate-900/40">
                    <th className="py-2.5 px-3">Metric Indicator</th>
                    <th className="py-2.5 px-3 text-emerald-400">R-{evidence.router.id} Current</th>
                    <th className="py-2.5 px-3">Peer Baseline (Same Location)</th>
                    <th className="py-2.5 px-3">Healthy Baseline (Campus)</th>
                    <th className="py-2.5 px-3">Global Baseline (Campus)</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Latency */}
                  <tr className="border-b border-slate-800/40 hover:bg-slate-900/10">
                    <td className="py-3 px-3 text-slate-300">Latency</td>
                    <td className="py-3 px-3 font-semibold text-slate-100">{evidence.current_metrics.latency.toFixed(1)} ms</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.peer.latency.toFixed(1)} ms</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.healthy.latency.toFixed(1)} ms</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.global.latency.toFixed(1)} ms</td>
                  </tr>
                  {/* Packet Loss */}
                  <tr className="border-b border-slate-800/40 hover:bg-slate-900/10">
                    <td className="py-3 px-3 text-slate-300">Packet Loss</td>
                    <td className="py-3 px-3 font-semibold text-slate-100">{evidence.current_metrics.packet_loss.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.peer.packet_loss.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.healthy.packet_loss.toFixed(2)}%</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.global.packet_loss.toFixed(2)}%</td>
                  </tr>
                  {/* Disconnects */}
                  <tr className="border-b border-slate-800/40 hover:bg-slate-900/10">
                    <td className="py-3 px-3 text-slate-300">Disconnects (24h)</td>
                    <td className="py-3 px-3 font-semibold text-slate-100">{int_round(evidence.current_metrics.disconnects * 24)}</td>
                    <td className="py-3 px-3 text-slate-400">{int_round(evidence.baselines.peer.disconnects * 24)}</td>
                    <td className="py-3 px-3 text-slate-400">{int_round(evidence.baselines.healthy.disconnects * 24)}</td>
                    <td className="py-3 px-3 text-slate-400">{int_round(evidence.baselines.global.disconnects * 24)}</td>
                  </tr>
                  {/* Signal Strength */}
                  <tr className="border-b border-slate-800/40 hover:bg-slate-900/10">
                    <td className="py-3 px-3 text-slate-300">Signal Strength</td>
                    <td className="py-3 px-3 font-semibold text-slate-100">{evidence.current_metrics.signal.toFixed(1)} dBm</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.peer.signal.toFixed(1)} dBm</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.healthy.signal.toFixed(1)} dBm</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.global.signal.toFixed(1)} dBm</td>
                  </tr>
                  {/* Average Speed */}
                  <tr className="border-b border-slate-800/40 hover:bg-slate-900/10">
                    <td className="py-3 px-3 text-slate-300">Average Speed</td>
                    <td className="py-3 px-3 font-semibold text-slate-100">{evidence.current_metrics.speed.toFixed(1)} Mbps</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.peer.speed.toFixed(1)} Mbps</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.healthy.speed.toFixed(1)} Mbps</td>
                    <td className="py-3 px-3 text-slate-400">{evidence.baselines.global.speed.toFixed(1)} Mbps</td>
                  </tr>
                  {/* Connected Devices */}
                  <tr className="hover:bg-slate-900/10">
                    <td className="py-3 px-3 text-slate-300">Connected Devices</td>
                    <td className="py-3 px-3 font-semibold text-slate-100">{int_round(evidence.current_metrics.device_load)}</td>
                    <td className="py-3 px-3 text-slate-400">{int_round(evidence.baselines.peer.device_load)}</td>
                    <td className="py-3 px-3 text-slate-400">{int_round(evidence.baselines.healthy.device_load)}</td>
                    <td className="py-3 px-3 text-slate-400">{int_round(evidence.baselines.global.device_load)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Temporal Trends */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-400" />
              <span>Temporal Trends (Performance Drift)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase bg-slate-900/40">
                    <th className="py-2.5 px-3">Metric</th>
                    <th className="py-2.5 px-3">24 Hours Ago</th>
                    <th className="py-2.5 px-3">12 Hours Ago</th>
                    <th className="py-2.5 px-3">6 Hours Ago</th>
                    <th className="py-2.5 px-3 text-emerald-400">Current Reading</th>
                    <th className="py-2.5 px-3">Trajectory</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(evidence.trends).map((key) => {
                    const t = evidence.trends[key];
                    const nowVal = t.now;
                    const h24Val = t['24h'];
                    let trendStr = 'Stable';
                    let trendColor = 'text-slate-400';
                    
                    if (nowVal > h24Val * 1.25) {
                      trendStr = key === 'speed' || key === 'signal' ? 'Improving' : 'Degrading';
                      trendColor = key === 'speed' || key === 'signal' ? 'text-emerald-400' : 'text-rose-400';
                    } else if (nowVal < h24Val * 0.75) {
                      trendStr = key === 'speed' || key === 'signal' ? 'Degrading' : 'Improving';
                      trendColor = key === 'speed' || key === 'signal' ? 'text-rose-400' : 'text-emerald-400';
                    }
                    
                    return (
                      <tr key={key} className="border-b border-slate-800/40 hover:bg-slate-900/10">
                        <td className="py-3 px-3 text-slate-300 capitalize">{key.replace('_', ' ')}</td>
                        <td className="py-3 px-3 text-slate-400">{t['24h'].toFixed(1)}</td>
                        <td className="py-3 px-3 text-slate-400">{t['12h'].toFixed(1)}</td>
                        <td className="py-3 px-3 text-slate-400">{t['6h'].toFixed(1)}</td>
                        <td className="py-3 px-3 font-semibold text-slate-100">{t.now.toFixed(1)}</td>
                        <td className={`py-3 px-3 font-semibold text-xs uppercase ${trendColor}`}>{trendStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Metric Charts */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <BarChart3 size={16} className="text-emerald-400" />
                <span>Historical Time-Series logs (24h)</span>
              </h3>
              <div className="flex items-center gap-1">
                {(['latency', 'packet_loss', 'disconnects', 'signal', 'speed'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedChartMetric(m)}
                    className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${selectedChartMetric === m ? 'bg-emerald-500 text-slate-950 font-semibold' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'}`}
                  >
                    {m.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72 w-full mt-2">
              {chartData.length > 0 ? renderChart() : <div className="text-center py-10 text-slate-500 text-sm">No historical log found</div>}
            </div>
          </div>

          {/* Router Side-by-Side Comparison Tool */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-300">Router Side-by-Side Comparison Console</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Select Peer to Compare:</span>
              <select
                value={compareRouterId}
                onChange={(e) => setCompareRouterId(e.target.value)}
                className="bg-[#0b0f19] border border-slate-800 rounded-md p-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Choose Router --</option>
                {allRouters.map((r) => (
                  <option key={r.router_id} value={r.router_id}>
                    {r.router_id} ({r.building.replace('-', ' ')} - Health: {r.health_score})
                  </option>
                ))}
              </select>
            </div>

            {compareDetails && (
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left text-sm border-collapse border border-slate-800">
                  <thead>
                    <tr className="bg-slate-900/60 text-xs text-slate-400 uppercase font-semibold">
                      <th className="py-2 px-3 border border-slate-800">Operational Parameter</th>
                      <th className="py-2 px-3 border border-slate-800 text-emerald-400">This Router ({evidence.router.id})</th>
                      <th className="py-2 px-3 border border-slate-800 text-amber-400">Comparison Router ({compareDetails.router_id})</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 px-3 border border-slate-800 font-medium">Health Status</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-100 font-semibold">{evidence.health.score} ({evidence.health.status})</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-100 font-semibold">{compareDetails.health_score} ({compareDetails.status})</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border border-slate-800 font-medium">Building Location</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{evidence.router.building.replace('-', ' ')}</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{compareDetails.building.replace('-', ' ')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border border-slate-800 font-medium">Hardware / Firmware</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300 font-mono text-xs">{evidence.router.model} / {evidence.router.firmware}</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300 font-mono text-xs">{compareDetails.model} / {compareDetails.firmware}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border border-slate-800 font-medium">Avg Latency</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{evidence.current_metrics.latency.toFixed(1)} ms</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{compareDetails.latency.toFixed(1)} ms</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border border-slate-800 font-medium">Avg Packet Loss</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{evidence.current_metrics.packet_loss.toFixed(2)}%</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{compareDetails.packet_loss.toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border border-slate-800 font-medium">Hourly Disconnects Avg</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{evidence.current_metrics.disconnects.toFixed(3)}</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{compareDetails.disconnects.toFixed(3)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border border-slate-800 font-medium">Avg Signal Strength</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{evidence.current_metrics.signal.toFixed(1)} dBm</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{compareDetails.signal.toFixed(1)} dBm</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 border border-slate-800 font-medium">Average Device Load</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{int_round(evidence.current_metrics.device_load)}</td>
                      <td className="py-2 px-3 border border-slate-800 text-slate-300">{int_round(compareDetails.connected_devices)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Evidence Engine & Recommended Action & AI Copilot Diagnosis */}
        <div className="flex flex-col gap-6">
          {/* Deterministic Recommended Action Panel */}
          <div className="glass-panel p-5 border-l-4 border-l-emerald-500 bg-emerald-500/5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <Wrench size={16} />
              <span>Diagnostic Action Prescription</span>
            </h3>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Recommended Intervention:</div>
              <div className="text-sm font-bold text-slate-100 mt-1">{evidence.recommendation.action}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Evidence Basis:</div>
              <div className="text-xs text-slate-300 mt-1 italic">{evidence.recommendation.reason}</div>
            </div>
          </div>

          {/* Evidence Strength Bars */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-300">Evidence Strength Matrix</h3>
            <div className="flex flex-col gap-3">
              {evidence.evidence.length === 0 ? (
                <div className="text-xs text-slate-500 py-2">No indicators show anomalies relative to baseline.</div>
              ) : (
                evidence.evidence.map((ev) => (
                  <div key={ev.factor} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize font-medium text-slate-300">{ev.factor.replace('_', ' ')}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${STRENGTH_COLORS[ev.strength as keyof typeof STRENGTH_COLORS] || 'bg-slate-800 text-slate-400'}`}>
                        {ev.strength} Evidence
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${ev.strength === 'Strong' ? 'bg-rose-500' : ev.strength === 'Moderate' ? 'bg-orange-500' : 'bg-amber-500'}`}
                        style={{ width: `${ev.score * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Complaints Panel */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-400" />
              <span>Complaints & User Incident Reports</span>
            </h3>
            <div className="flex flex-col gap-3">
              {evidence.router.complaints.length === 0 ? (
                <span className="text-xs text-slate-500 italic">No registered complaints for this router.</span>
              ) : (
                evidence.router.complaints.map((c) => (
                  <div key={c.ticket_id} className="bg-[#0b0f19]/80 border border-slate-800/80 p-3 rounded-lg flex flex-col gap-1 text-xs">
                    <div className="flex justify-between font-semibold text-slate-300">
                      <span>Ticket: {c.ticket_id}</span>
                      <span className="text-slate-500">{c.date}</span>
                    </div>
                    <p className="text-slate-400 mt-1 italic">"{c.complaint_text}"</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Copilot Diagnosis Console */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Cpu size={16} className="text-emerald-400" />
              <span>AI Copilot Diagnostics</span>
            </h3>
            <p className="text-xs text-slate-400">
              Trigger NetSentinel AI to synthesize the telemetry baselines and user complaints into a structured report.
            </p>

            {diagnosis ? (
              <div className="flex flex-col gap-3 text-xs bg-[#0b0f19] border border-slate-800 p-4 rounded-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1">
                  <span className="font-semibold text-emerald-400">Diagnosis Output</span>
                  <span className="text-[10px] text-slate-500 uppercase">Engine: {diagnosis.source}</span>
                </div>
                <div className="whitespace-pre-wrap text-slate-300 leading-relaxed font-sans">{diagnosis.diagnosis_text}</div>
                <button
                  onClick={requestDiagnosis}
                  className="mt-2 text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-end gap-1"
                >
                  <RefreshCw size={10} />
                  <span>Regenerate Diagnosis</span>
                </button>
              </div>
            ) : (
              <button
                disabled={loadingDiagnosis}
                onClick={requestDiagnosis}
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 text-emerald-400 hover:text-emerald-300 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40"
              >
                {loadingDiagnosis ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-emerald-400"></div>
                    <span>Generating Diagnosis...</span>
                  </>
                ) : (
                  <>
                    <Cpu size={14} />
                    <span>Run AI Copilot Diagnosis</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// String Extension Helpers
declare global {
  interface String {
    titleCase(): string;
  }
}
// Simple inline helpers to replace lodash or external dependencies
String.prototype.titleCase = function () {
  return this.split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const int_round = (val: number): number => {
  return Math.round(val);
};
