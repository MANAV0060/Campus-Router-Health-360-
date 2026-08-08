import { useState, useEffect } from 'react';
import { LayoutDashboard, Router, Cpu, BarChart4, Network, Bell, HelpCircle, Activity, ScatterChart, Sliders } from 'lucide-react';
import { FilterBar } from './components/FilterBar';
import { DashboardView } from './components/DashboardView';
import { RouterTable } from './components/RouterTable';
import { RouterDetailsView } from './components/RouterDetailsView';
import { CopilotView } from './components/CopilotView';

import { MetricCards } from './components/MetricCards';
import { HealthDistributionChart } from './components/HealthDistributionChart';
import { DemoModeBanner } from './components/DemoModeBanner';
import { PredictedDegradationTable } from './components/PredictedDegradationTable';
import { FleetPatternsSection } from './components/FleetPatternsSection';
import { ModelTrainingPage } from './components/ModelTrainingPage';
import { RouterDetailModal } from './components/RouterDetailModal';
import { fetchFleetKpis, fetchRoutersRanking } from './api/client';
import type { FleetKpis as PredictiveKpis, RouterSummary as PredictiveRouterSummary } from './types';

type Page = 'dashboard' | 'routers' | 'router-detail' | 'copilot' | 'analytics' | 'predictive-ops' | 'predictive-patterns' | 'predictive-model';

interface AnalyticsViewProps {
  onRouterSelect: (routerId: string) => void;
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onRouterSelect }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/analytics')
      .then((res) => res.json())
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Network Fleet Analytics</h2>
        <p className="text-xs text-slate-400">Deep aggregated analysis of firmware cohorts, model loads, and maintenance prioritization</p>
      </div>

      {/* IT Priority Intervention Queue */}
      <div className="glass-panel p-5 flex flex-col gap-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Urgent IT Intervention Queue (Priority-Score Rank)</h3>
          <span className="text-xs bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 font-medium">
            Sorted by User-Impact & Telemetry Severity
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase bg-slate-900/40">
                <th className="py-2.5 px-3">Priority Rank</th>
                <th className="py-2.5 px-3">Router ID</th>
                <th className="py-2.5 px-3">Building Location</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Affected Users (Devices)</th>
                <th className="py-2.5 px-3">Priority Score</th>
                <th className="py-2.5 px-3">Evidence strength</th>
              </tr>
            </thead>
            <tbody>
              {analytics.prioritized_interventions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    All systems operating within normal boundaries. No active interventions.
                  </td>
                </tr>
              ) : (
                analytics.prioritized_interventions.map((p: any, idx: number) => (
                  <tr
                    key={p.router_id}
                    onClick={() => onRouterSelect(p.router_id)}
                    className="border-b border-slate-800/40 hover:bg-slate-900/35 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3 text-slate-400 font-medium">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-emerald-400">{p.router_id}</td>
                    <td className="py-3 px-3 text-slate-300">
                      {p.building.replace('-', ' ')} <span className="text-slate-500">({p.room})</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-semibold uppercase">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">{p.affected_users} devices</td>
                    <td className="py-3 px-3 font-bold text-slate-200">{p.priority_score.toFixed(1)}</td>
                    <td className="py-3 px-3 text-slate-400 font-medium">{p.evidence_strength}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Building & Model Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Building Incident rates */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-300">Building Performance Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-2">Building</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Critical</th>
                  <th className="py-2">Critical Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.building_performance.map((b: any) => (
                  <tr key={b.building} className="border-b border-slate-800/40">
                    <td className="py-2.5 font-medium text-slate-200">{b.building.replace('-', ' ')}</td>
                    <td className="py-2.5 text-slate-400">{b.total}</td>
                    <td className="py-2.5 text-slate-400">{b.critical}</td>
                    <td className="py-2.5 text-slate-200 font-semibold">{b.critical_rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model failure ratios */}
        <div className="glass-panel p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-300">Model Deployment Load Profiles</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-2">Model</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Critical</th>
                  <th className="py-2">Critical Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.model_performance.map((m: any) => (
                  <tr key={m.model} className="border-b border-slate-800/40">
                    <td className="py-2.5 font-medium text-slate-200">{m.model}</td>
                    <td className="py-2.5 text-slate-400">{m.total}</td>
                    <td className="py-2.5 text-slate-400">{m.critical}</td>
                    <td className="py-2.5 text-slate-200 font-semibold">{m.critical_rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PredictiveOpsViewProps {
  onRouterSelect: (routerId: string) => void;
}

const PredictiveOpsView: React.FC<PredictiveOpsViewProps> = ({ onRouterSelect }) => {
  const [kpis, setKpis] = useState<PredictiveKpis | null>(null);
  const [routers, setRouters] = useState<PredictiveRouterSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & Sorting
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterBuilding, setFilterBuilding] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiData, rankingData] = await Promise.all([
        fetchFleetKpis(),
        fetchRoutersRanking({
          filterStatus: filterStatus !== 'ALL' ? filterStatus : undefined,
          filterBuilding: filterBuilding !== 'ALL' ? filterBuilding : undefined,
          filterRisk: filterRisk !== 'ALL' ? filterRisk : undefined,
          sortBy: sortBy,
        }),
      ]);
      setKpis(kpiData);
      setRouters(rankingData);
    } catch (err) {
      console.error('Failed to load fleet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, filterBuilding, filterRisk, sortBy]);

  const filteredRouters = routers.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.router_id.toLowerCase().includes(term) ||
      r.model.toLowerCase().includes(term) ||
      r.building.toLowerCase().includes(term) ||
      r.firmware_version.toLowerCase().includes(term) ||
      r.recommended_action.toLowerCase().includes(term)
    );
  });

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col gap-2">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Predictive Operations Center</h2>
        <p className="text-xs text-slate-400 font-medium">Real-time XGBoost forecasts, user-impact analysis, and early warnings</p>
      </div>

      <DemoModeBanner onSelectRouter={onRouterSelect} />
      <MetricCards kpis={kpis} />
      <HealthDistributionChart kpis={kpis} />
      
      <PredictedDegradationTable
        routers={filteredRouters}
        onSelectRouter={onRouterSelect}
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterBuilding={filterBuilding}
        setFilterBuilding={setFilterBuilding}
        filterRisk={filterRisk}
        setFilterRisk={setFilterRisk}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
    </div>
  );
};

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedRouterId, setSelectedRouterId] = useState<string>('');
  const [selectedPredictiveRouter, setSelectedPredictiveRouter] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    building: '',
    firmware: '',
    model: '',
    status: '',
  });

  const [alerts, setAlerts] = useState<string[]>([]);

  // Periodically fetch general alerts (e.g. number of critical routers)
  useEffect(() => {
    fetch('http://localhost:8000/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        const critCount = data.summary.critical_count;
        if (critCount > 0) {
          setAlerts([
            `NetSentinel alert: ${critCount} critical routers detected in the fleet. Urgent intervention recommended.`,
          ]);
        } else {
          setAlerts([]);
        }
      })
      .catch((err) => console.error('Alert checker failed:', err));
  }, [filters]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleRouterSelect = (routerId: string) => {
    setSelectedRouterId(routerId);
    setCurrentPage('router-detail');
  };

  const navigateToPage = (page: Page) => {
    setCurrentPage(page);
    if (page !== 'router-detail') {
      setSelectedRouterId('');
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-slate-100 flex font-sans">
      {/* 1. Sidebar Panel */}
      <aside className="w-64 border-r border-border-dark bg-[#0a0d17]/95 flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div className="flex flex-col">
          {/* App Logo */}
          <div className="p-6 border-b border-border-dark flex items-center gap-3">
            <div className="relative">
              <Network className="text-emerald-400" size={24} />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 pulse-healthy-glow"></span>
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm tracking-wide">NetSentinel</span>
              <div className="text-[10px] text-slate-500 font-medium">Campus Router 360</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1.5">
            {/* Dashboard Link */}
            <button
              onClick={() => navigateToPage('dashboard')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${currentPage === 'dashboard' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
            >
              <LayoutDashboard size={18} />
              <span>Operations Dashboard</span>
            </button>

            {/* Router Explorer Link */}
            <button
              onClick={() => navigateToPage('routers')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${currentPage === 'routers' || currentPage === 'router-detail' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
            >
              <Router size={18} />
              <span>Router Explorer</span>
            </button>

            {/* AI Copilot Link */}
            <button
              onClick={() => navigateToPage('copilot')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${currentPage === 'copilot' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
            >
              <Cpu size={18} />
              <span>AI Copilot Console</span>
            </button>

            {/* Analytics Link */}
            <button
              onClick={() => navigateToPage('analytics')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${currentPage === 'analytics' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
            >
              <BarChart4 size={18} />
              <span>Fleet Analytics</span>
            </button>

            {/* Divider */}
            <div className="mx-4 my-2 border-t border-slate-800/40"></div>
            <div className="px-4 py-1 text-[9px] uppercase font-bold text-slate-500 tracking-wider">Predictive ML Suite</div>

            {/* Predictive Operations Link */}
            <button
              onClick={() => navigateToPage('predictive-ops')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${currentPage === 'predictive-ops' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
            >
              <Activity size={18} />
              <span>Predictive Operations</span>
            </button>

            {/* Systemic Patterns Link */}
            <button
              onClick={() => navigateToPage('predictive-patterns')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${currentPage === 'predictive-patterns' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
            >
              <ScatterChart size={18} />
              <span>Systemic Patterns</span>
            </button>

            {/* XGBoost Performance Link */}
            <button
              onClick={() => navigateToPage('predictive-model')}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${currentPage === 'predictive-model' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
            >
              <Sliders size={18} />
              <span>XGBoost Diagnostics</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-border-dark flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono">v1.2.0 (Active)</span>
          <div className="flex gap-2">
            <HelpCircle size={14} className="cursor-pointer hover:text-slate-300" />
          </div>
        </div>
      </aside>

      {/* 2. Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Alert Notification */}
        <header className="border-b border-border-dark bg-[#080b13]/80 backdrop-blur px-6 py-4 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-200 uppercase tracking-wider">
              {currentPage === 'dashboard' && 'Operations Command Center'}
              {currentPage === 'routers' && 'Campus Router Fleet'}
              {currentPage === 'router-detail' && 'Device Diagnostics Control'}
              {currentPage === 'copilot' && 'NetSentinel Intelligent Assistant'}
              {currentPage === 'analytics' && 'Fleet Intelligence Analysis'}
              {currentPage === 'predictive-ops' && 'Predictive ML Operations'}
              {currentPage === 'predictive-patterns' && 'Systemic Anomaly Patterns'}
              {currentPage === 'predictive-model' && 'XGBoost Performance Diagnostics'}
            </h1>
            <div className="flex items-center gap-3">
              <div className="relative cursor-pointer bg-slate-900 border border-slate-800 hover:border-slate-700 p-2 rounded-lg text-slate-400 hover:text-slate-200">
                <Bell size={16} />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-[#080b13]"></span>
                )}
              </div>
            </div>
          </div>

          {/* Active Alerts Banner */}
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2 mt-1"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></div>
              <span>{alert}</span>
            </div>
          ))}
        </header>

        {/* Main View Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Render Active View */}
          {currentPage === 'dashboard' && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Sidebar filter on the left column */}
              <div className="xl:col-span-1">
                <FilterBar onFilterChange={handleFilterChange} activeFilters={filters} />
              </div>
              {/* Dashboard graphs on the remaining columns */}
              <div className="xl:col-span-3">
                <DashboardView filters={filters} onRouterSelect={handleRouterSelect} />
              </div>
            </div>
          )}

          {currentPage === 'routers' && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Sidebar filter on the left */}
              <div className="xl:col-span-1">
                <FilterBar onFilterChange={handleFilterChange} activeFilters={filters} />
              </div>
              {/* Router table on the remaining */}
              <div className="xl:col-span-3">
                <RouterTable filters={filters} onRouterSelect={handleRouterSelect} />
              </div>
            </div>
          )}

          {currentPage === 'router-detail' && (
            <RouterDetailsView routerId={selectedRouterId} onBack={() => navigateToPage('routers')} />
          )}

          {currentPage === 'copilot' && <CopilotView />}

          {currentPage === 'analytics' && <AnalyticsView onRouterSelect={handleRouterSelect} />}

          {currentPage === 'predictive-ops' && (
            <PredictiveOpsView onRouterSelect={(id) => setSelectedPredictiveRouter(id)} />
          )}

          {currentPage === 'predictive-patterns' && <FleetPatternsSection />}

          {currentPage === 'predictive-model' && <ModelTrainingPage />}
        </main>
      </div>

      {/* 360 Diagnostic Modal */}
      {selectedPredictiveRouter && (
        <RouterDetailModal
          routerId={selectedPredictiveRouter}
          onClose={() => setSelectedPredictiveRouter(null)}
        />
      )}
    </div>
  );
}

export default App;
