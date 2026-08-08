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
  FilterState
} from './types';
import { fetchDashboard, fetchRouters } from './services/api';

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
    </div>
  );
}
