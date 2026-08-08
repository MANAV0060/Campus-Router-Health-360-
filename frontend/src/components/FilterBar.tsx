import React, { useEffect, useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterBarProps {
  onFilterChange: (filters: {
    building: string;
    firmware: string;
    model: string;
    status: string;
  }) => void;
  activeFilters: {
    building: string;
    firmware: string;
    model: string;
    status: string;
  };
}

export const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, activeFilters }) => {
  const [buildings, setBuildings] = useState<string[]>([]);
  const [firmwares, setFirmwares] = useState<string[]>([]);
  const models = ['TL-841N', 'AC-1200', 'NX-500', 'DIR-615'];
  const statuses = ['Healthy', 'Watch', 'At Risk', 'Critical'];

  useEffect(() => {
    // Fetch unique buildings
    fetch('http://localhost:8000/api/buildings')
      .then((res) => res.json())
      .then((data) => {
        if (data.buildings) setBuildings(data.buildings);
      })
      .catch((err) => console.error('Error fetching buildings:', err));

    // Fetch unique firmwares
    fetch('http://localhost:8000/api/firmware')
      .then((res) => res.json())
      .then((data) => {
        if (data.firmware) setFirmwares(data.firmware);
      })
      .catch((err) => console.error('Error fetching firmwares:', err));
  }, []);

  const handleChange = (key: string, value: string) => {
    onFilterChange({
      ...activeFilters,
      [key]: value,
    });
  };

  const handleReset = () => {
    onFilterChange({
      building: '',
      firmware: '',
      model: '',
      status: '',
    });
  };

  const hasActiveFilters = Object.values(activeFilters).some((val) => val !== '');

  return (
    <div className="glass-panel p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-slate-200 font-semibold">
          <Filter size={18} className="text-emerald-400" />
          <span>Cohort Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Building Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">Building / Location</label>
          <select
            value={activeFilters.building}
            onChange={(e) => handleChange('building', e.target.value)}
            className="bg-[#0b0f19] border border-slate-800 rounded-md p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 w-full"
          >
            <option value="">All Buildings</option>
            {buildings.map((b) => (
              <option key={b} value={b}>
                {b.replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Firmware Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">Firmware Version</label>
          <select
            value={activeFilters.firmware}
            onChange={(e) => handleChange('firmware', e.target.value)}
            className="bg-[#0b0f19] border border-slate-800 rounded-md p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 w-full"
          >
            <option value="">All Firmwares</option>
            {firmwares.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Model Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">Router Model</label>
          <select
            value={activeFilters.model}
            onChange={(e) => handleChange('model', e.target.value)}
            className="bg-[#0b0f19] border border-slate-800 rounded-md p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 w-full"
          >
            <option value="">All Models</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">Health Status</label>
          <select
            value={activeFilters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="bg-[#0b0f19] border border-slate-800 rounded-md p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 w-full"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
