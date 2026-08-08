import React from 'react';
import type { ShapContributor } from '../types';
import { BarChart3 } from 'lucide-react';

interface ShapExplanationChartProps {
  contributors: ShapContributor[];
  routerId: string;
  riskPct: number;
}

export const ShapExplanationChart: React.FC<ShapExplanationChartProps> = ({
  contributors,
  routerId,
  riskPct,
}) => {
  if (!contributors || contributors.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-white/10 text-xs text-gray-500">
        No SHAP attribution values available for this unit.
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            Why is this router at risk? (SHAP Factor Attribution)
          </h4>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Exact mathematical contribution of temporal features driving {routerId}'s {riskPct}% degradation risk.
          </p>
        </div>
        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
          TreeSHAP Additive Values
        </span>
      </div>

      {/* Contributors Bar List */}
      <div className="space-y-3 mt-4">
        {contributors.map((contrib, idx) => {
          const pct = Math.min(100, Math.max(2, contrib.contribution_pct));

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-400 font-bold">{idx + 1}.</span>
                  <span className="font-semibold text-gray-200">{contrib.display_name}</span>
                  <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.2 rounded">
                    Val: {contrib.raw_value}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-gray-400">
                    SHAP: +{contrib.shap_value.toFixed(4)}
                  </span>
                  <span className="font-mono font-bold text-rose-400 text-xs w-12 text-right">
                    +{contrib.contribution_pct}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${pct}%` }}
                  className={`h-full rounded-full ${
                    idx === 0
                      ? 'bg-rose-500'
                      : idx === 1
                      ? 'bg-orange-500'
                      : idx === 2
                      ? 'bg-amber-500'
                      : 'bg-cyan-500'
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
