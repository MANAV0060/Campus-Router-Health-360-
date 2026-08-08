import React from 'react';
import type { MetricPoint } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricTrendChartsProps {
  history: MetricPoint[];
  slopes?: {
    latency_slope_6h?: number;
    packet_loss_slope_6h?: number;
    disconnect_slope_6h?: number;
    speed_slope_6h?: number;
    signal_slope_6h?: number;
  };
}

export const MetricTrendCharts: React.FC<MetricTrendChartsProps> = ({ history, slopes }) => {
  if (!history || history.length === 0) {
    return <div className="text-xs text-gray-500 py-4">No historical metrics logged for this unit.</div>;
  }

  const latencies = history.map(h => h.latency_ms);
  const packetLosses = history.map(h => h.packet_loss_pct);
  const disconnects = history.map(h => h.disconnects);
  const speeds = history.map(h => h.avg_speed_mbps);

  const renderSparkline = (
    values: number[],
    color: string,
    minVal?: number,
    maxVal?: number,
    height: number = 55
  ) => {
    const min = minVal !== undefined ? minVal : Math.min(...values);
    const max = maxVal !== undefined ? maxVal : Math.max(...values, min + 1);
    const range = max - min || 1;
    const width = 280;

    const points = values.map((val, idx) => {
      const x = (idx / (values.length - 1 || 1)) * width;
      const y = height - ((val - min) / range) * (height - 10) - 5;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
        
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {values.length > 0 && (
          <circle
            cx={width}
            cy={height - ((values[values.length - 1] - min) / range) * (height - 10) - 5}
            r="4"
            fill={color}
            stroke="#0a0e17"
            strokeWidth="2"
          />
        )}
      </svg>
    );
  };

  const getTrendBadge = (slope?: number, invertGood: boolean = false) => {
    if (slope === undefined) return null;
    const isUp = slope > 0.05;
    const isDown = slope < -0.05;
    const isBad = invertGood ? isDown : isUp;

    if (isUp) {
      return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
          isBad ? 'bg-rose-950/50 text-rose-300 border border-rose-500/30' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
        }`}>
          <TrendingUp className="h-3 w-3" /> +{slope.toFixed(2)}/6h
        </span>
      );
    } else if (isDown) {
      return (
        <span className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
          isBad ? 'bg-rose-950/50 text-rose-300 border border-rose-500/30' : 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
        }`}>
          <TrendingDown className="h-3 w-3" /> {slope.toFixed(2)}/6h
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
        <Minus className="h-3 w-3" /> Flat
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* 1. Latency Trend */}
      <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-300">Latency (ms)</span>
          {getTrendBadge(slopes?.latency_slope_6h, false)}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold font-mono text-white">{latencies[latencies.length - 1]} ms</span>
          <span className="text-[10px] text-gray-500">24h History</span>
        </div>
        {renderSparkline(latencies, '#f43f5e')}
      </div>

      {/* 2. Packet Loss Trend */}
      <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-300">Packet Loss (%)</span>
          {getTrendBadge(slopes?.packet_loss_slope_6h, false)}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold font-mono text-white">{packetLosses[packetLosses.length - 1]}%</span>
          <span className="text-[10px] text-gray-500">24h History</span>
        </div>
        {renderSparkline(packetLosses, '#fb923c')}
      </div>

      {/* 3. Disconnects / Hour */}
      <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-300">Disconnects</span>
          {getTrendBadge(slopes?.disconnect_slope_6h, false)}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold font-mono text-white">{disconnects[disconnects.length - 1]} /hr</span>
          <span className="text-[10px] text-gray-500">24h History</span>
        </div>
        {renderSparkline(disconnects, '#a855f7')}
      </div>

      {/* 4. Bandwidth Speed (Mbps) */}
      <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-300">Speed (Mbps)</span>
          {getTrendBadge(slopes?.speed_slope_6h, true)}
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-xl font-bold font-mono text-white">{speeds[speeds.length - 1]} Mbps</span>
          <span className="text-[10px] text-gray-500">24h History</span>
        </div>
        {renderSparkline(speeds, '#10b981')}
      </div>
    </div>
  );
};
