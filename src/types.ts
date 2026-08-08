export type RouterStatus = 'Healthy' | 'Watch' | 'Critical';

export interface RouterSummary {
  total: number;
  healthy: number;
  watch: number;
  critical: number;
  avg_latency_ms: number;
  avg_packet_loss_pct: number;
  fleet_health_score: number;
}

export interface BuildingDistribution {
  building: string;
  healthy: number;
  watch: number;
  critical: number;
}

export interface ModelDistribution {
  model: string;
  count: number;
  health_pct: number;
}

export interface FirmwareDistribution {
  firmware: string;
  count: number;
  outdated_count: number;
}

export interface LatencyHistogram {
  range: string;
  count: number;
}

export interface DashboardDistributions {
  by_building: BuildingDistribution[];
  by_model: ModelDistribution[];
  by_firmware: FirmwareDistribution[];
  latency_histogram: LatencyHistogram[];
}

export interface RouterItem {
  id: string;
  name: string;
  building: string;
  room: string;
  model: string;
  firmware: string;
  ip: string;
  mac: string;
  uptime_days: number;
  status: RouterStatus;
  affected_users: number;
  priority_score: number;
  last_seen: string;
  latency_ms: number;
  packet_loss_pct: number;
  disconnects_24h: number;
  throughput_mbps: number;
}

export interface DashboardResponse {
  summary: RouterSummary;
  distributions: DashboardDistributions;
  worst_performing: RouterItem[];
}

export interface MetricSet {
  latency_ms: number;
  packet_loss_pct: number;
  disconnects_24h: number;
  throughput_mbps: number;
}

export interface CurrentMetrics extends MetricSet {
  cpu_usage_pct: number;
  memory_usage_pct: number;
  connected_clients: number;
}

export interface BaselineProfiles {
  peer_avg: MetricSet;
  healthy_avg: MetricSet;
  global_avg: MetricSet;
}

export interface TrendPoint {
  timestamp: string;
  latency_ms: number;
  speed_mbps: number;
  disconnects: number;
  packet_loss: number;
}

export interface EvidenceItem {
  metric: string;
  current: string | number;
  benchmark: string | number;
  deviation_pct: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface Recommendation {
  action: string;
  reason: string;
  estimated_impact: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Immediate';
}

export interface RouterEvidenceResponse {
  router: RouterItem;
  health: {
    score: number;
    status: RouterStatus;
    trend_direction: 'improving' | 'stable' | 'degrading';
  };
  current_metrics: CurrentMetrics;
  baselines: BaselineProfiles;
  trends: TrendPoint[];
  evidence: EvidenceItem[];
  recommendation: Recommendation;
}

export interface PrioritizedIntervention {
  id: string;
  router_id: string;
  building: string;
  room: string;
  issue_title: string;
  severity: RouterStatus;
  priority_score: number;
  affected_users: number;
  root_cause: string;
  recommended_action: string;
  status: 'Open' | 'In Progress' | 'Scheduled' | 'Resolved';
  assigned_tech: string;
  estimated_downtime_min: number;
}

export interface AnalyticsResponse {
  prioritized_interventions: PrioritizedIntervention[];
  aggregates: {
    total_affected_users: number;
    high_priority_count: number;
    outdated_firmware_count: number;
    top_risk_building: string;
  };
}

export interface CopilotPayload {
  question: string;
}

export interface CopilotResponse {
  response: string;
  source: string;
}

export interface FilterState {
  building: string;
  firmware: string;
  model: string;
  status: string;
  search: string;
}
