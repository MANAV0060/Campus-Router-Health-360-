import React, { useState } from 'react';
import { TrendPoint } from '../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Activity, Gauge, Zap } from 'lucide-react';

interface TelemetryChartsProps {
  trends: TrendPoint[];
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ trends }) => {
  const [metricTab, setMetricTab] = useState<'latency' | 'speed' | 'disconnects'>('latency');

  return (
    <div className="bg-gray-50 dark:bg-[#101828] border border-gray-200 dark:border-[#1d2939] rounded-2xl p-4 sm:p-5 mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            24-Hour Telemetry Drift Log
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Real-time interface time-series collected via gNMI telemetry stream.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#080b13] border border-gray-200 dark:border-[#1d2939] rounded-lg">
          <button
            onClick={() => setMetricTab('latency')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              metricTab === 'latency'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Latency (ms)
          </button>
          <button
            onClick={() => setMetricTab('speed')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              metricTab === 'speed'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Speed (Mbps)
          </button>
          <button
            onClick={() => setMetricTab('disconnects')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              metricTab === 'disconnects'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Disconnect Flaps
          </button>
        </div>
      </div>

      {/* Recharts Container */}
      <div className="h-60 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="disconnectsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
            <XAxis
              dataKey="timestamp"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(16, 24, 40, 0.95)',
                borderColor: '#1d2939',
                borderRadius: '0.5rem',
                fontSize: '12px',
                color: '#ffffff',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(val: any) => [
                metricTab === 'latency'
                  ? `${val} ms`
                  : metricTab === 'speed'
                  ? `${val} Mbps`
                  : `${val} drops`,
                metricTab.toUpperCase()
              ]}
            />
            {metricTab === 'latency' && (
              <Area
                type="monotone"
                dataKey="latency_ms"
                stroke="#f43f5e"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#latencyGradient)"
                isAnimationActive={true}
                animationDuration={1200}
              />
            )}
            {metricTab === 'speed' && (
              <Area
                type="monotone"
                dataKey="speed_mbps"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#speedGradient)"
                isAnimationActive={true}
                animationDuration={1200}
              />
            )}
            {metricTab === 'disconnects' && (
              <Area
                type="monotone"
                dataKey="disconnects"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#disconnectsGradient)"
                isAnimationActive={true}
                animationDuration={1200}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
