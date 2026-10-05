import React, { useEffect, useState } from 'react';
import type { FleetPatternsResponse } from '../types';
import { fetchFleetPatterns } from '../services/api';
import { Layers, AlertTriangle, Cpu, Building2, HardDrive, Info } from 'lucide-react';

interface FleetPatternsSectionProps {
  patterns?: FleetPatternsResponse | null;
}

export const FleetPatternsSection: React.FC<FleetPatternsSectionProps> = ({
  patterns: initialPatterns,
}) => {
  const [patterns, setPatterns] = useState<FleetPatternsResponse | null>(initialPatterns || null);
  const [loading, setLoading] = useState<boolean>(!initialPatterns);

  useEffect(() => {
    if (!initialPatterns) {
      setLoading(true);
      fetchFleetPatterns()
        .then((data) => setPatterns(data))
        .catch((err) => console.error('Failed to load patterns:', err))
        .finally(() => setLoading(false));
    }
  }, [initialPatterns]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="animate-spin text-cyan-400 text-3xl mb-3">⟳</div>
        <p className="text-sm text-gray-400">Analyzing fleet-level systemic patterns...</p>
      </div>
    );
  }

  if (!patterns) return null;

  const alerts = patterns.systemic_alerts || [];
  const fwPatterns = patterns.patterns_by_dimension?.firmware_version || [];
  const bldPatterns = patterns.patterns_by_dimension?.building || [];
  const modelPatterns = patterns.patterns_by_dimension?.model || [];

  return (
    <div className="space-y-6 mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C9CFF2]/60 dark:border-[#1e284a] pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-600 dark:text-cyan-400" /> Fleet-Level Systemic Pattern Analysis
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Statistical risk concentration across firmware revisions, physical topology, and router models.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white dark:bg-[#121829] px-3.5 py-1.5 rounded-xl border border-[#C9CFF2]/60 dark:border-[#1e284a] shadow-2xs">
          <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span className="text-gray-600 dark:text-gray-300">
            Fleet Baseline Risk: <strong className="text-gray-900 dark:text-white font-mono">{patterns.fleet_summary.baseline_risk_rate_pct}%</strong>
          </span>
        </div>
      </div>

      {/* Systemic Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl border border-amber-300/80 dark:border-amber-500/40 bg-amber-50/90 dark:bg-amber-950/30 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                      Systemic Pattern Flagged
                    </span>
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-400">Dimension: {alert.dimension}</span>
                  </div>
                  <p className="text-sm font-bold text-amber-950 dark:text-amber-100 mt-1.5 leading-snug">
                    {alert.statement}
                  </p>
                </div>
              </div>

              {/* Causation Warning Note */}
              <div className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-white/95 dark:bg-black/60 border border-amber-200/80 dark:border-white/10 p-3 rounded-xl max-w-md shrink-0 shadow-2xs leading-relaxed">
                <strong className="text-amber-800 dark:text-amber-400 font-bold">Guardrail:</strong> {alert.causation_note}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Breakdown Grid: Firmware, Building, Models */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Firmware Revisions */}
        <div className="bg-white dark:bg-[#121829] p-5 rounded-2xl border border-[#C9CFF2]/60 dark:border-[#1e284a] shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-3.5 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-600 dark:text-cyan-400" /> By Firmware Version
          </h3>
          <div className="space-y-3">
            {fwPatterns.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{item.value}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 text-[11px]">{item.high_risk_routers}/{item.total_routers} units</span>
                    <span className={`font-mono font-bold ${
                      item.risk_rate_pct > patterns.fleet_summary.baseline_risk_rate_pct + 5
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {item.risk_rate_pct}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.risk_rate_pct}%` }}
                    className={`h-full rounded-full transition-all ${
                      item.risk_rate_pct > patterns.fleet_summary.baseline_risk_rate_pct + 5
                        ? 'bg-rose-500'
                        : 'bg-cyan-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Buildings / Topology */}
        <div className="bg-white dark:bg-[#121829] p-5 rounded-2xl border border-[#C9CFF2]/60 dark:border-[#1e284a] shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-3.5 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" /> By Building / Location
          </h3>
          <div className="space-y-3">
            {bldPatterns.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 text-[11px]">{item.high_risk_routers}/{item.total_routers} units</span>
                    <span className={`font-mono font-bold ${
                      item.risk_rate_pct > patterns.fleet_summary.baseline_risk_rate_pct + 5
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {item.risk_rate_pct}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.risk_rate_pct}%` }}
                    className={`h-full rounded-full transition-all ${
                      item.risk_rate_pct > patterns.fleet_summary.baseline_risk_rate_pct + 5
                        ? 'bg-rose-500'
                        : 'bg-purple-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Hardware Models */}
        <div className="bg-white dark:bg-[#121829] p-5 rounded-2xl border border-[#C9CFF2]/60 dark:border-[#1e284a] shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200 mb-3.5 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-amber-600 dark:text-amber-400" /> By Router Hardware Model
          </h3>
          <div className="space-y-3">
            {modelPatterns.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-gray-400 text-[11px]">{item.high_risk_routers}/{item.total_routers} units</span>
                    <span className={`font-mono font-bold ${
                      item.risk_rate_pct > patterns.fleet_summary.baseline_risk_rate_pct + 5
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {item.risk_rate_pct}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${item.risk_rate_pct}%` }}
                    className={`h-full rounded-full transition-all ${
                      item.risk_rate_pct > patterns.fleet_summary.baseline_risk_rate_pct + 5
                        ? 'bg-rose-500'
                        : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
