import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Activity, ShieldAlert, Heart, ClipboardList, AlertTriangle } from 'lucide-react';

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

const STATUS_COLORS = {
  Healthy: '#10b981',
  Watch: '#f59e0b',
  'At Risk': '#f97316',
  Critical: '#ef4444',
};

export const DashboardView: React.FC<DashboardViewProps> = ({ filters, onRouterSelect }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Construct query parameters
    const params = new URLSearchParams();
    if (filters.building) params.append('building', filters.building);
    if (filters.firmware) params.append('firmware', filters.firmware);
    if (filters.model) params.append('model', filters.model);
    if (filters.status) params.append('status', filters.status);

    fetch(`http://localhost:8000/api/dashboard?${params.toString()}`)
      .then((res) => res.json())
      .then((dashboardData) => {
        setData(dashboardData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading dashboard:', err);
        setLoading(false);
      });
  }, [filters]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const { summary, worst_routers, building_distribution, firmware_distribution, status_distribution } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Routers */}
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="bg-slate-800/80 p-3 rounded-lg text-slate-300">
            <ClipboardList size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Routers</div>
            <div className="text-2xl font-bold text-slate-100">{summary.total_routers}</div>
          </div>
        </div>

        {/* Healthy */}
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400">
            <Heart size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Healthy</div>
            <div className="text-2xl font-bold text-emerald-400">{summary.healthy_count}</div>
          </div>
        </div>

        {/* Watch */}
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="bg-amber-500/10 p-3 rounded-lg text-amber-400">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Watch</div>
            <div className="text-2xl font-bold text-amber-400">{summary.watch_count}</div>
          </div>
        </div>

        {/* At Risk */}
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="bg-orange-500/10 p-3 rounded-lg text-orange-400">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">At Risk</div>
            <div className="text-2xl font-bold text-orange-400">{summary.at_risk_count}</div>
          </div>
        </div>

        {/* Critical */}
        <div className="glass-panel p-4 flex items-center gap-4 col-span-2 md:col-span-1">
          <div className="bg-rose-500/10 p-3 rounded-lg text-rose-400">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Critical</div>
            <div className="text-2xl font-bold text-rose-400">{summary.critical_count}</div>
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-300">Health Score Distribution</h3>
          <div className="h-64 flex items-center justify-center">
            {summary.total_routers === 0 ? (
              <span className="text-sm text-slate-500">No data available for cohort</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={status_distribution.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f1322', borderColor: '#1e2538', color: '#f1f5f9' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Building Critical Rate Bar Chart */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-300">Critical Routers by Building</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={building_distribution.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="building" stroke="#64748b" fontSize={10} tickFormatter={(v) => v.replace('-', ' ')} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1322', borderColor: '#1e2538', color: '#f1f5f9' }}
                />
                <Legend />
                <Bar name="Critical" dataKey="critical" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar name="Healthy / Watch" dataKey="healthy" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Firmware Critical Rate Bar Chart */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-300">Critical Routers by Firmware</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={firmware_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="firmware" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1322', borderColor: '#1e2538', color: '#f1f5f9' }}
                />
                <Legend />
                <Bar name="Critical" dataKey="critical" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar name="Healthy / Watch" dataKey="healthy" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Worst Performing Routers Table */}
      <div className="glass-panel p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Worst Performing Routers (Action Required)</h3>
          <span className="text-xs text-slate-400">Showing top 10 routers sorted by lowest health score</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase bg-slate-900/40">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Router ID</th>
                <th className="py-3 px-4">Health Score</th>
                <th className="py-3 px-4">Building</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Packet Loss</th>
                <th className="py-3 px-4">Disconnects</th>
                <th className="py-3 px-4">Signal</th>
                <th className="py-3 px-4">Connected</th>
                <th className="py-3 px-4">Firmware</th>
              </tr>
            </thead>
            <tbody>
              {worst_routers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-slate-500">
                    No matching unhealthy routers found for these filters.
                  </td>
                </tr>
              ) : (
                worst_routers.map((r) => (
                  <tr
                    key={r.router_id}
                    onClick={() => onRouterSelect(r.router_id)}
                    className="border-b border-slate-800/60 hover:bg-slate-900/35 transition-colors cursor-pointer text-sm"
                  >
                    <td className="py-3.5 px-4 text-slate-400 font-medium">{r.rank}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400 hover:underline">{r.router_id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[r.status as keyof typeof STATUS_COLORS] }}
                        ></span>
                        <span className="font-medium text-slate-200">{r.health_score}</span>
                        <span className="text-xs text-slate-400">({r.status})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{r.building.replace('-', ' ')}</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.latency.toFixed(1)} ms</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.packet_loss.toFixed(2)}%</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.disconnects}</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.signal.toFixed(1)} dBm</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.connected_devices}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">{r.firmware}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
