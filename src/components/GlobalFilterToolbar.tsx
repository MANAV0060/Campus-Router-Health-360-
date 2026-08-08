import React from 'react';
import { Filter, RotateCcw, Building2, Cpu, ShieldAlert, Layers } from 'lucide-react';
import { FilterState } from '../types';

interface GlobalFilterToolbarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
  totalFilteredCount: number;
}

const BUILDINGS = [
  'All',
  'Engineering Center',
  'Science Hall',
  'Library Annex',
  'Student Union',
  'Tech Tower',
  'Medical Research Center',
  'Humanities Building',
  'Athletics Complex',
  'Admin East'
];

const FIRMWARES = [
  'All',
  'v4.14.2-LTS',
  'v4.12.1-LTS',
  'v5.1.0-STABLE',
  'v4.10.0-DEPR',
  'v3.9.4-VULN'
];

const MODELS = [
  'All',
  'Cisco Catalyst 9300X',
  'Juniper EX4400',
  'Aruba CX 6300',
  'Ubiquiti UniFi Enterprise XG',
  'Netgear ProSAFE M4300'
];

const STATUSES = ['All', 'Healthy', 'Watch', 'Critical'];

export const GlobalFilterToolbar: React.FC<GlobalFilterToolbarProps> = ({
  filters,
  setFilters,
  onReset,
  totalFilteredCount
}) => {
  const isFiltered =
    filters.building !== 'All' ||
    filters.firmware !== 'All' ||
    filters.model !== 'All' ||
    filters.status !== 'All' ||
    filters.search !== '';

  return (
    <div className="bg-white dark:bg-[#121829] border border-[#C9CFF2]/80 dark:border-[#1e284a] rounded-2xl p-4 sm:p-5 mb-6 shadow-2xs transition-colors duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title / Label */}
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#445EF2]/10 text-[#445EF2] dark:text-[#94A2F2]">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Global Fleet Filters
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Showing <span className="font-bold text-gray-900 dark:text-gray-200">{totalFilteredCount}</span> matched nodes
            </p>
          </div>
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-1 max-w-4xl">
          {/* Building Select */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filters.building}
              onChange={(e) => setFilters(prev => ({ ...prev, building: e.target.value }))}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-[#f2f4f7] dark:bg-[#101828] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1d2939] rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 appearance-none cursor-pointer"
            >
              <option value="All">All Buildings</option>
              {BUILDINGS.filter(b => b !== 'All').map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Firmware Select */}
          <div className="relative">
            <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filters.firmware}
              onChange={(e) => setFilters(prev => ({ ...prev, firmware: e.target.value }))}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-[#f2f4f7] dark:bg-[#101828] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1d2939] rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 appearance-none cursor-pointer"
            >
              <option value="All">All Firmware</option>
              {FIRMWARES.filter(f => f !== 'All').map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Model Select */}
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filters.model}
              onChange={(e) => setFilters(prev => ({ ...prev, model: e.target.value }))}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-[#f2f4f7] dark:bg-[#101828] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1d2939] rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 appearance-none cursor-pointer"
            >
              <option value="All">All Hardware Models</option>
              {MODELS.filter(m => m !== 'All').map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Status Select */}
          <div className="relative">
            <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-[#f2f4f7] dark:bg-[#101828] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#1d2939] rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 appearance-none cursor-pointer"
            >
              <option value="All">All Health Statuses</option>
              {STATUSES.filter(s => s !== 'All').map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Filters Button */}
        {isFiltered && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#101828] hover:bg-gray-200 dark:hover:bg-gray-800 border border-gray-200 dark:border-[#1d2939] rounded-lg transition-all active:scale-95 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
