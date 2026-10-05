import React from 'react';
import { motion } from 'motion/react';
import { EvidenceItem } from '../types';
import { AlertCircle, Activity, ShieldAlert } from 'lucide-react';

interface EvidenceBarsProps {
  evidenceList: EvidenceItem[];
}

export const EvidenceBars: React.FC<EvidenceBarsProps> = ({ evidenceList }) => {
  return (
    <div className="bg-gray-50 dark:bg-[#101828] border border-gray-200 dark:border-[#1d2939] rounded-2xl p-4 sm:p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Evidence Strength & Benchmark Deviations
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Automated anomaly score based on departure from healthy campus telemetry profiles.
          </p>
        </div>
        <Activity className="w-4 h-4 text-gray-400" />
      </div>

      <div className="space-y-4">
        {evidenceList.map((item, index) => {
          // Normalize percentage for bar width display (0 - 100%)
          const fillPercentage = Math.min(Math.max(item.deviation_pct / 5, 8), 100);

          const getSeverityBadge = (sev: string) => {
            switch (sev) {
              case 'critical':
                return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
              case 'high':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
              case 'medium':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
              default:
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            }
          };

          const getBarColor = (sev: string) => {
            switch (sev) {
              case 'critical':
                return 'bg-rose-500';
              case 'high':
                return 'bg-amber-500';
              case 'medium':
                return 'bg-amber-400';
              default:
                return 'bg-emerald-500';
            }
          };

          return (
            <div key={item.metric} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.metric}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 font-semibold uppercase rounded border ${getSeverityBadge(item.severity)}`}>
                    {item.severity}
                  </span>
                </div>
                <div className="font-mono text-xs">
                  <span className="font-bold text-gray-900 dark:text-white">{item.current}</span>
                  <span className="text-gray-400 mx-1">/</span>
                  <span className="text-gray-500 dark:text-gray-400">target {item.benchmark}</span>
                  <span className="ml-2 text-rose-500 font-bold">+{item.deviation_pct}%</span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPercentage}%` }}
                  transition={{
                    type: 'spring',
                    stiffness: 80,
                    damping: 15,
                    delay: index * 0.1
                  }}
                  className={`h-full rounded-full ${getBarColor(item.severity)}`}
                />
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
