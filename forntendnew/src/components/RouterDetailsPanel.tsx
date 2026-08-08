import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RouterEvidenceResponse, RouterItem } from '../types';
import { fetchRouterEvidence } from '../services/api';
import { BaselineTable } from './BaselineTable';
import { EvidenceBars } from './EvidenceBars';
import { TelemetryCharts } from './TelemetryCharts';
import {
  X,
  Wrench,
  AlertOctagon,
  CheckCircle,
  Clock,
  Users,
  Wifi,
  Cpu,
  HardDrive,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface RouterDetailsPanelProps {
  router: RouterItem | null;
  onClose: () => void;
}

export const RouterDetailsPanel: React.FC<RouterDetailsPanelProps> = ({ router, onClose }) => {
  const [evidenceData, setEvidenceData] = useState<RouterEvidenceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!router) return;
    setLoading(true);
    fetchRouterEvidence(router.id)
      .then((data) => {
        setEvidenceData(data);
      })
      .catch((err) => console.error('Failed fetching router evidence:', err))
      .finally(() => setLoading(false));
  }, [router?.id]);

  if (!router) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Sliding Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl h-full bg-white dark:bg-[#101828] border-l border-gray-200/80 dark:border-gray-800 shadow-2xl overflow-y-auto z-10 flex flex-col justify-between"
        >
          <div>
            {/* Header */}
            <div className="sticky top-0 z-20 bg-white/90 dark:bg-[#080b13]/90 backdrop-blur-md border-b border-gray-200 dark:border-[#1d2939] p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    router.status === 'Critical'
                      ? 'bg-rose-500 animate-rapid-pulse'
                      : router.status === 'Watch'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500 animate-soft-pulse'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold font-mono text-gray-900 dark:text-white">
                      {router.id}
                    </h2>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                        router.status === 'Critical'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : router.status === 'Watch'
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}
                    >
                      {router.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {router.name} • {router.building} ({router.room})
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-6">
              {loading || !evidenceData ? (
                <div className="space-y-4 py-8">
                  <div className="h-20 bg-gray-100 dark:bg-gray-900 rounded-2xl shimmer-bg" />
                  <div className="h-40 bg-gray-100 dark:bg-gray-900 rounded-2xl shimmer-bg" />
                  <div className="h-40 bg-gray-100 dark:bg-gray-900 rounded-2xl shimmer-bg" />
                </div>
              ) : (
                <>
                  {/* Recommended Action High-Contrast Callout Box */}
                  <div
                    className={`rounded-2xl p-5 border shadow-sm ${
                      router.status === 'Critical'
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-rose-500/30'
                        : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Recommended IT Action Plan
                        </span>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/20 dark:bg-gray-900/20">
                        Urgency: {evidenceData.recommendation.urgency}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold mb-2">
                      {evidenceData.recommendation.action}
                    </h3>
                    <p className="text-xs opacity-80 leading-relaxed mb-3">
                      {evidenceData.recommendation.reason}
                    </p>

                    <div className="pt-3 border-t border-white/10 dark:border-gray-900/10 flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                        {evidenceData.recommendation.estimated_impact}
                      </span>
                      <span className="font-mono text-[11px] opacity-75">
                        Priority {router.priority_score}/100
                      </span>
                    </div>
                  </div>

                  {/* Hardware & Network Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F2F2F2] dark:bg-[#121829] border border-[#C9CFF2] dark:border-[#1e284a] rounded-2xl p-4">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Model</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate block">
                        {router.model}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Firmware</span>
                      <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white truncate block">
                        {router.firmware}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">Management IP</span>
                      <span className="text-xs font-mono font-semibold text-gray-900 dark:text-white truncate block">
                        {router.ip}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold block">MAC Address</span>
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate block">
                        {router.mac}
                      </span>
                    </div>
                  </div>

                  {/* Baselines Side-by-Side Table */}
                  <BaselineTable
                    current={evidenceData.current_metrics}
                    baselines={evidenceData.baselines}
                  />

                  {/* Evidence Strength Bars */}
                  <EvidenceBars evidenceList={evidenceData.evidence} />

                  {/* 24h Telemetry Recharts */}
                  <TelemetryCharts trends={evidenceData.trends} />
                </>
              )}
            </div>
          </div>

          {/* Panel Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-[#1e284a] bg-[#F2F2F2] dark:bg-[#121829] flex items-center justify-between text-xs text-gray-500">
            <span>Last Telemetry Sync: {router.last_seen}</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold bg-[#445EF2] text-white hover:bg-[#334bd9] transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              Done Reviewing
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
