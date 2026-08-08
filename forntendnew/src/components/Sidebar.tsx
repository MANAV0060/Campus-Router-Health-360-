import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Server,
  AlertTriangle,
  BarChart3,
  Bot,
  ShieldCheck,
  Zap,
  Download,
  FileText,
  X,
  Activity,
  Cpu,
  Layers
} from 'lucide-react';

export type TabType = 'dashboard' | 'explorer' | 'at_risk' | 'analytics' | 'copilot';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  criticalCount: number;
  watchCount: number;
  isOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  criticalCount,
  watchCount,
  isOpen = true,
  onCloseMobile
}) => {
  const mainNavItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Operations Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'explorer' as TabType,
      label: 'Router Explorer',
      icon: Server,
      badge: null
    },
    {
      id: 'at_risk' as TabType,
      label: 'At Risk Routers',
      icon: AlertTriangle,
      badge: criticalCount > 0 ? `${criticalCount} Crit` : null,
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    },
    {
      id: 'analytics' as TabType,
      label: 'Fleet Analytics',
      icon: BarChart3,
      badge: watchCount > 0 ? `${watchCount} Watch` : null,
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    },
    {
      id: 'copilot' as TabType,
      label: 'AI Copilot Console',
      icon: Bot,
      badge: 'Gemini 2.5',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    }
  ];

  const secondaryNavItems = [
    {
      label: 'Export Telemetry Reports',
      icon: Download,
      action: () => alert('Exporting full gNMI network telemetry report as CSV/PDF...')
    },
    {
      label: 'Admin Audit Logs',
      icon: FileText,
      action: () => alert('Opening Admin Audit Logs...')
    }
  ];

  const content = (
    <div className="flex flex-col h-full justify-between p-4 sm:p-5 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="space-y-6">
        {/* Navigation Group Header */}
        <div>
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-[10px] font-extrabold tracking-widest text-gray-400 dark:text-gray-500 uppercase">
              NAVIGATION MENU
            </span>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <nav className="space-y-1.5">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAtRisk = item.id === 'at_risk';

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? isAtRisk
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-[#445EF2]/10 text-[#445EF2] dark:bg-[#445EF2]/20 dark:text-[#94A2F2] font-bold border border-[#445EF2]/30 dark:border-[#5E75F2]/40 shadow-2xs'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-[#C9CFF2]/30 dark:hover:bg-gray-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? isAtRisk
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-[#445EF2] dark:text-[#94A2F2]'
                          : 'text-gray-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                        isActive && !isAtRisk
                          ? 'bg-[#445EF2] text-white border-transparent'
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Secondary Navigation */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800/80">
          <span className="text-[10px] font-extrabold tracking-widest text-gray-400 dark:text-gray-500 uppercase px-2 block mb-2">
            TOOLS & LOGS
          </span>
          <div className="space-y-1">
            {secondaryNavItems.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={idx}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#101828] transition-colors cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Engine Summary Card */}
        <div className="bg-gradient-to-b from-[#121829] to-[#0b0e17] border border-[#445EF2]/30 rounded-2xl p-4 text-xs text-gray-300 shadow-sm">
          <div className="flex items-center gap-2 text-[#94A2F2] font-bold mb-1.5">
            <Cpu className="w-4 h-4 text-[#445EF2]" />
            <span>Telemetry Engine</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed font-mono">
            gNMI Streaming → Anomaly Detection → Priority Score Mining → Copilot Knowledge
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#445EF2]" />
          <span>NetSentinel Admin</span>
        </div>
        <span className="font-mono text-[10px] text-gray-500">v4.2.1</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="lg:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container with Spring Layout Animations */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.aside
            initial={{ opacity: 0, x: -30, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 256 }}
            exit={{ opacity: 0, x: -30, width: 0 }}
            transition={{
              type: 'spring',
              stiffness: 350,
              damping: 32,
              mass: 0.8
            }}
            className="fixed lg:sticky top-0 lg:top-[76px] left-0 z-50 lg:z-20 h-full lg:h-[calc(100vh-100px)] shrink-0 bg-white dark:bg-[#121829] border-r lg:border border-[#C9CFF2]/80 dark:border-[#1e284a] lg:rounded-2xl shadow-xl lg:shadow-2xs overflow-hidden"
          >
            <div className="w-64 h-full">
              {content}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};
