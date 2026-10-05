import React from 'react';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';

interface DemoModeBannerProps {
  onSelectRouter: (routerId: string) => void;
}

export const DemoModeBanner: React.FC<DemoModeBannerProps> = ({ onSelectRouter }) => {
  return (
    <div className="p-4 rounded-2xl border border-cyan-200 dark:border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/30 mb-6 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-300">
                Core Innovation
              </span>
              <span className="badge badge-watch text-[9px] py-0.5 font-bold">
                Watch (76/100) &rarr; High Risk (89.8%)
              </span>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
              NetSentinel predicts that <strong>R-1042</strong> is entering failure in the next 24h due to rising latency (+8.3ms/6h) and packet loss slopes.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectRouter('R-1042')}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer shrink-0"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Launch R-1042 360&deg; Diagnostic</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
