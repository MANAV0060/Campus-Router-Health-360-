import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

interface RouterListResponse {
  total: number;
  page: number;
  limit: number;
  routers: Array<{
    router_id: string;
    health_score: number;
    status: string;
    building: string;
    room: string;
    model: string;
    firmware: string;
    latency: number;
    packet_loss: number;
    disconnects: number;
    signal: number;
    connected_devices: number;
    priority?: {
      priority_score: number;
      tier: string;
    };
  }>;
}

interface RouterTableProps {
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

const PRIORITY_TIERS = {
  Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Low: 'bg-slate-800 text-slate-400 border-slate-700',
};

export const RouterTable: React.FC<RouterTableProps> = ({ filters, onRouterSelect }) => {
  const [data, setData] = useState<RouterListResponse | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setPage(1); // Reset page on filter/search change
  }, [filters, search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters.building) params.append('building', filters.building);
    if (filters.firmware) params.append('firmware', filters.firmware);
    if (filters.model) params.append('model', filters.model);
    if (filters.status) params.append('status', filters.status);
    if (search) params.append('search', search);

    fetch(`${API_BASE_URL}/routers?${params.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading routers:', err);
        setLoading(false);
      });
  }, [filters, search, page]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const routers = data?.routers || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input Bar */}
      <div className="flex items-center gap-2 bg-[#0b0f19] border border-slate-800 rounded-lg px-3 py-2 w-full md:w-96 focus-within:border-emerald-500 transition-colors">
        <Search size={18} className="text-slate-500" />
        <input
          type="text"
          placeholder="Search by Router ID, location, or model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-sm text-slate-200 w-full"
        />
      </div>

      {/* Routers Grid Table */}
      <div className="glass-panel p-5 flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase bg-slate-900/40">
                <th className="py-3 px-4">Router ID</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4">Intervention Priority</th>
                <th className="py-3 px-4">Building & Room</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Packet Loss</th>
                <th className="py-3 px-4">Disconnects</th>
                <th className="py-3 px-4">Signal</th>
                <th className="py-3 px-4">Devices</th>
                <th className="py-3 px-4">Model & Firmware</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                  </td>
                </tr>
              ) : routers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-slate-500">
                    No routers match the specified search or filter criteria.
                  </td>
                </tr>
              ) : (
                routers.map((r) => (
                  <tr
                    key={r.router_id}
                    onClick={() => onRouterSelect(r.router_id)}
                    className="border-b border-slate-800/60 hover:bg-slate-900/35 transition-colors cursor-pointer text-sm"
                  >
                    <td className="py-3.5 px-4 font-semibold text-emerald-400 hover:underline">{r.router_id}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: STATUS_COLORS[r.status as keyof typeof STATUS_COLORS] }}
                        ></span>
                        <span className="font-medium text-slate-200">{r.health_score}</span>
                        <span className="text-xs text-slate-400">({r.status})</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {r.priority && r.priority.priority_score > 0 ? (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${PRIORITY_TIERS[r.priority.tier as keyof typeof PRIORITY_TIERS]}`}>
                          <AlertTriangle size={12} />
                          <span>{r.priority.tier} (Score: {r.priority.priority_score.toFixed(0)})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {r.building.replace('-', ' ')} <span className="text-slate-500">({r.room})</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{r.latency.toFixed(1)} ms</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.packet_loss.toFixed(2)}%</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.disconnects}</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.signal.toFixed(1)} dBm</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.connected_devices}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                      {r.model} / {r.firmware}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-2">
            <span className="text-xs text-slate-400">
              Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} routers
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-slate-300 font-medium px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
