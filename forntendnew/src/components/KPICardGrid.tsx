import React from 'react';
import { RouterSummary } from '../types';
import { Server, CheckCircle2, AlertTriangle, AlertOctagon, Activity, SignalHigh, WifiOff } from 'lucide-react';

interface KPICardGridProps {
  summary: RouterSummary;
  onSelectStatusFilter?: (status: string) => void;
  currentStatusFilter?: string;
}

export const KPICardGrid: React.FC<KPICardGridProps> = ({
  summary,
  onSelectStatusFilter,
  currentStatusFilter = 'All'
}) => {
  const cards = [
    {
      id: 'All',
      title: 'Total Active Routers',
      value: summary.total,
      badge: '100% Monitored',
      subtext: `${summary.fleet_health_score}% Fleet Health Index`,
      icon: Server,
      colorClass: 'text-gray-900 dark:text-white',
      dotClass: 'bg-gray-400 dark:bg-gray-500',
      borderHover: 'hover:border-gray-400 dark:hover:border-gray-600'
    },
    {
      id: 'Healthy',
      title: 'Healthy Routers',
      value: summary.healthy,
      badge: 'Nominal',
      subtext: `${summary.avg_latency_ms}ms avg round-trip`,
      icon: CheckCircle2,
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      dotClass: 'bg-emerald-500 animate-soft-pulse',
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-600'
    },
    {
      id: 'Watch',
      title: 'Watch Status',
      value: summary.watch,
      badge: 'Drift Detected',
      subtext: `${summary.avg_packet_loss_pct}% packet loss avg`,
      icon: AlertTriangle,
      colorClass: 'text-amber-600 dark:text-amber-400',
      dotClass: 'bg-amber-500',
      borderHover: 'hover:border-amber-400 dark:hover:border-amber-600'
    },
    {
      id: 'Critical',
      title: 'Critical Outages',
      value: summary.critical,
      badge: 'Immediate Action',
      subtext: `${summary.critical > 0 ? 'High priority alerts' : 'Zero outages'}`,
      icon: AlertOctagon,
      colorClass: 'text-rose-600 dark:text-rose-400',
      dotClass: 'bg-rose-500 animate-rapid-pulse',
      borderHover: 'hover:border-rose-400 dark:hover:border-rose-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = currentStatusFilter === card.id;

        return (
          <div
            key={card.title}
            onClick={() => onSelectStatusFilter && onSelectStatusFilter(card.id)}
            className={`bg-white dark:bg-[#121829] border ${
              isSelected
                ? 'border-[#445EF2] dark:border-[#94A2F2] ring-2 ring-[#445EF2]/20'
                : 'border-[#C9CFF2]/80 dark:border-[#1e284a]'
            } rounded-2xl px-5 pt-5 pb-5 sm:px-6 sm:pt-6 transition-all duration-200 cursor-pointer ${card.borderHover} hover:shadow-md active:scale-[0.99] shadow-2xs flex flex-col justify-between`}
          >
            <div>
              {/* Card Header: Title & Dot */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${card.dotClass}`} />
                </div>
              </div>

              {/* Value & Badge */}
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className={`text-3xl font-extrabold tracking-tight ${card.colorClass}`}>
                  {card.value}
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#f2f4f7] dark:bg-[#101828] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#1d2939]">
                  {card.badge}
                </span>
              </div>
            </div>

            {/* Subtext */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="truncate">{card.subtext}</span>
              <Icon className={`w-4 h-4 shrink-0 ${card.colorClass} opacity-80`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
