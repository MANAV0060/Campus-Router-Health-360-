import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, Search, Bell, ShieldCheck, Activity, Menu, X, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  criticalCount: number;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  setDarkMode,
  searchQuery,
  setSearchQuery,
  criticalCount,
  onToggleSidebar,
  isSidebarOpen
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#121829]/95 backdrop-blur-md border-b border-[#C9CFF2]/60 dark:border-[#1e284a] px-4 sm:px-6 py-3.5 transition-colors duration-200 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Animated Hamburger Toggle + Brand / Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Animated Hamburger Menu Bar Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Collapse Navigation Menu' : 'Expand Navigation Menu'}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors shadow-2xs cursor-pointer ${
              isSidebarOpen
                ? 'bg-[#445EF2]/10 text-[#445EF2] dark:text-[#94A2F2] border-[#445EF2]/30'
                : 'text-gray-700 dark:text-gray-200 hover:bg-[#F2F2F2] dark:hover:bg-gray-800 border-[#C9CFF2]/80 dark:border-gray-700'
            }`}
          >
            <motion.div
              animate={{ rotate: isSidebarOpen ? 90 : 0, scale: isSidebarOpen ? 1.05 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-[#445EF2] dark:text-[#94A2F2]" /> : <Menu className="w-5 h-5" />}
            </motion.div>
          </motion.button>

          <div className="w-9 h-9 rounded-xl bg-[#445EF2] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900 dark:text-white leading-none">
                NetSentinel
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#445EF2]/10 text-[#445EF2] dark:text-[#94A2F2] border border-[#445EF2]/20">
                v4.2.1
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 hidden md:block">
              Campus Router Telemetry & Anomaly Guard
            </p>
          </div>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search or type command..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-[#F2F2F2] dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 border border-[#C9CFF2] dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#445EF2]/40 focus:border-[#445EF2] transition-all shadow-2xs"
            />
            <kbd className="hidden md:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white dark:bg-gray-800 border border-[#C9CFF2] dark:border-gray-700 rounded shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications / Alerts Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Critical Network Alerts"
            className="relative p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-[#F2F2F2] dark:hover:bg-gray-800 transition-all border border-[#C9CFF2] dark:border-gray-700 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                {criticalCount}
              </span>
            )}
          </motion.button>

          {/* Theme Switcher */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-[#F2F2F2] dark:hover:bg-gray-800 transition-all border border-[#C9CFF2] dark:border-gray-700 cursor-pointer"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </motion.button>

          {/* User Profile */}
          <div className="pl-2 border-l border-gray-200 dark:border-gray-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#445EF2] flex items-center justify-center text-xs font-bold text-white shadow-xs">
              NS
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                NetOps Lead
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight font-mono">
                Admin Console
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
