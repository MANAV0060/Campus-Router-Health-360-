import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { GlobalFilterToolbar } from './components/GlobalFilterToolbar';
import { KPICardGrid } from './components/KPICardGrid';
import { RouterInventoryTable } from './components/RouterInventoryTable';
import { RouterDetailsPanel } from './components/RouterDetailsPanel';
import { FleetAnalyticsView } from './components/FleetAnalyticsView';
import { AICopilotConsole } from './components/AICopilotConsole';
import { AtRiskRoutersView } from './components/AtRiskRoutersView';
import { DashboardCharts } from './components/DashboardCharts';
import { KPISkeleton, TableSkeleton } from './components/SkeletonLoader';
import {
  DashboardResponse,
  RouterItem,
  FilterState,
  FleetKpis,
  PredictiveRouterSummary
} from './types';
import { fetchDashboard, fetchRouters, fetchFleetKpis, fetchRoutersRanking } from './services/api';

// Predictive ML Views
import { DemoModeBanner } from './components/DemoModeBanner';
import { MetricCards } from './components/MetricCards';
import { HealthDistributionChart } from './components/HealthDistributionChart';
import { PredictedDegradationTable } from './components/PredictedDegradationTable';
import { FleetPatternsSection } from './components/FleetPatternsSection';
import { ModelTrainingPage } from './components/ModelTrainingPage';
import { RouterDetailModal } from './components/RouterDetailModal';
import { Layers, Cpu, Activity } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [filters, setFilters] = useState<FilterState>({
    building: 'All',
    firmware: 'All',
    model: 'All',
    status: 'All',
    search: ''
  });

  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [routers, setRouters] = useState<RouterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRouter, setSelectedRouter] = useState<RouterItem | null>(null);
  const [predictiveRouterId, setPredictiveRouterId] = useState<string | null>(null);

  // Sync dark class to root document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load data on filter change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([fetchDashboard(filters), fetchRouters(filters)])
      .then(([dashRes, routersRes]) => {
        if (!isMounted) return;
        setDashboardData(dashRes);
        setRouters(routersRes);
      })
      .catch((err) => console.error('Data load error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      building: 'All',
      firmware: 'All',
      model: 'All',
      status: 'All',
      search: ''
    });
  };

  const handleSelectStatusFilter = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status: prev.status === status ? 'All' : status
    }));
  };

  const handleSelectRouterById = (id: string) => {
    const found = routers.find((r) => r.id === id);
    if (found) {
      setSelectedRouter(found);
    } else {
      fetchRouters({ building: 'All', firmware: 'All', model: 'All', status: 'All', search: id }).then(
        (list) => {
          if (list.length > 0) setSelectedRouter(list[0]);
        }
      );
    }
  };

  const criticalCount = dashboardData?.summary?.critical ?? 0;
  const watchCount = dashboardData?.summary?.watch ?? 0;

  return (
    <div className={`min-h-screen bg-[#F2F2F2] dark:bg-[#0b0e17] text-gray-900 dark:text-gray-100 font-['Outfit',sans-serif] transition-colors duration-200 flex flex-col`}>
      {/* Top Header with Hamburger Toggle */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        searchQuery={filters.search}
        setSearchQuery={(q) => setFilters((prev) => ({ ...prev, search: q }))}
        criticalCount={criticalCount}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex items-start max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 gap-6 relative">
        {/* Left Sidebar Navigation with Animated Collapsible Support */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <Sidebar
              key="sidebar"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              criticalCount={criticalCount}
              watchCount={watchCount}
              isOpen={isSidebarOpen}
              onCloseMobile={() => setIsSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <motion.main
          layout
          transition={{ type: 'spring', stiffness: 350, damping: 32 }}
          className="flex-1 min-w-0"
        >
          {/* Global Filters Toolbar */}
          <GlobalFilterToolbar
            filters={filters}
            setFilters={setFilters}
            onReset={handleResetFilters}
            totalFilteredCount={routers.length}
          />

          {/* Animated Tab Content Switcher */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'dashboard' && (
                <div>
                  {loading || !dashboardData ? (
                    <>
                      <KPISkeleton />
                      <TableSkeleton />
                    </>
                  ) : (
                    <>
                      {/* KPI Cards */}
                      <KPICardGrid
                        summary={dashboardData.summary}
                        onSelectStatusFilter={handleSelectStatusFilter}
                        currentStatusFilter={filters.status}
                      />

                      {/* Charts and Anomaly Callouts */}
                      <DashboardCharts
                        distributions={dashboardData.distributions}
                        worstPerforming={dashboardData.worst_performing}
                        onSelectRouter={(r) => setSelectedRouter(r)}
                      />
                    </>
                  )}
                </div>
              )}

              {activeTab === 'at_risk' && (
                <AtRiskRoutersView
                  routers={routers}
                  onSelectRouter={(r) => setSelectedRouter(r)}
                />
              )}

              {activeTab === 'explorer' && (
                <div>
                  {loading ? (
                    <TableSkeleton />
                  ) : (
                    <RouterInventoryTable
                      routers={routers}
                      onSelectRouter={(r) => setSelectedRouter(r)}
                      selectedRouterId={selectedRouter?.id}
                    />
                  )}
                </div>
              )}

              {activeTab === 'analytics' && (
                <FleetAnalyticsView
                  onSelectRouterById={handleSelectRouterById}
                />
              )}

              {activeTab === 'copilot' && <AICopilotConsole />}

              {activeTab === 'predictive_ops' && (
                <PredictiveOpsView onSelectRouter={(id) => setPredictiveRouterId(id)} />
              )}

              {activeTab === 'predictive_patterns' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/60 dark:border-[#1e284a] rounded-2xl p-6 shadow-2xs">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-cyan-500" />
                      Systemic Cohort Risk Patterns
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                      Statistically significant risk anomalies grouped by hardware configurations.
                    </p>
                    <FleetPatternsSection />
                  </div>
                </div>
              )}

              {activeTab === 'predictive_model' && (
                <ModelTrainingPage />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>

      {/* Slide-Out Router Details Evidence Panel */}
      {selectedRouter && (
        <RouterDetailsPanel
          router={selectedRouter}
          onClose={() => setSelectedRouter(null)}
        />
      )}

      {/* 360° Diagnostic Predictive Modal */}
      {predictiveRouterId && (
        <RouterDetailModal
          routerId={predictiveRouterId}
          onClose={() => setPredictiveRouterId(null)}
        />
      )}
    </div>
  );
}

// Inline Predictive Dashboard view wrapper
interface PredictiveOpsViewProps {
  onSelectRouter: (id: string) => void;
}

function PredictiveOpsView({ onSelectRouter }: PredictiveOpsViewProps) {
  const [kpis, setKpis] = useState<FleetKpis | null>(null);
  const [routers, setRouters] = useState<PredictiveRouterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Table filters state
  const [sortBy, setSortBy] = useState('priority');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterBuilding, setFilterBuilding] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchFleetKpis(),
      fetchRoutersRanking({
        sortBy,
        filterStatus,
        filterBuilding,
        filterRisk,
        search
      })
    ]).then(([kpiData, rankingData]) => {
      setKpis(kpiData);
      setRouters(rankingData);
    })
    .catch((err) => console.error('Predictive load error:', err))
    .finally(() => setLoading(false));
  }, [sortBy, filterStatus, filterBuilding, filterRisk, search]);

  if (loading && !kpis) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      <DemoModeBanner />
      {kpis && <MetricCards kpis={kpis} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PredictedDegradationTable
            routers={routers}
            onSelectRouter={onSelectRouter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterBuilding={filterBuilding}
            setFilterBuilding={setFilterBuilding}
            filterRisk={filterRisk}
            setFilterRisk={setFilterRisk}
          />
        </div>
        <div>
          {kpis && <HealthDistributionChart kpis={kpis} />}
        </div>
      </div>
    </div>
  );
}
