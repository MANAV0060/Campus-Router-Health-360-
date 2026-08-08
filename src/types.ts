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

export interface ShapContributor {
  feature: string;
  display_name: string;
  raw_value: number;
  shap_value: number;
  contribution_pct: number;
  direction: 'RISK_INCREASE' | 'RISK_DECREASE';
}

export interface MetricPoint {
  hour: string;
  avg_speed_mbps: number;
  latency_ms: number;
  packet_loss_pct: number;
  disconnects: number;
  connected_devices: number;
  signal_dbm: number;
  health_score?: number;
}

export interface ComplaintItem {
  ticket_id: string;
  date: string;
  complaint_text: string;
}

export interface PredictiveRouterSummary {
  router_id: string;
  model: string;
  firmware_version: string;
  building: string;
  room: number;
  user_type: string;
  current_health: number;
  health_status: 'HEALTHY' | 'WATCH' | 'AT_RISK' | 'CRITICAL';
  future_degradation_prob: number;
  future_risk_pct: number;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  is_anomaly: boolean;
  anomaly_score: number;
  priority_score: number;
  priority_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priority_breakdown: {
    future_risk_contrib: number;
    health_severity_contrib: number;
    user_impact_contrib: number;
    anomaly_contrib: number;
  };
  root_cause: string;
  evidence: string[];
  recommended_action: string;
  top_contributors: ShapContributor[];
  metrics_now: {
    speed_now: number;
    latency_now: number;
    packet_loss_now: number;
    disconnects_now: number;
    signal_now: number;
    devices_now: number;
  };
  metric_slopes: {
    latency_slope_6h: number;
    packet_loss_slope_6h: number;
    disconnect_slope_6h: number;
    speed_slope_6h: number;
    signal_slope_6h: number;
  };
  complaint_count: number;
}

export interface FleetBenchmarkItem {
  group_name: string;
  count: number;
  avg_health: number;
  high_risk_count: number;
  risk_rate_pct: number;
}

export interface RouterDetail extends PredictiveRouterSummary {
  history: MetricPoint[];
  complaints: ComplaintItem[];
  fleet_benchmark: {
    same_firmware: FleetBenchmarkItem;
    same_building: FleetBenchmarkItem;
    same_model: FleetBenchmarkItem;
  };
}

export interface FleetKpis {
  total_routers: number;
  healthy_count: number;
  watch_count: number;
  at_risk_count: number;
  critical_count: number;
  high_future_risk_count: number;
  anomalous_count: number;
  users_affected: number;
  total_connected_users: number;
  avg_fleet_health: number;
  model_recall: number;
  model_precision: number;
  model_roc_auc: number;
  model_f1: number;
}

export interface FleetPatternItem {
  category: string;
  value: string;
  total_routers: number;
  high_risk_routers: number;
  risk_rate_pct: number;
  fleet_baseline_rate_pct: number;
  risk_multiplier: number;
  is_systemic_pattern: boolean;
  avg_health_score: number;
  avg_latency_ms: number;
  avg_packet_loss_pct: number;
}

export interface SystemicAlert {
  dimension: string;
  group_name: string;
  total_in_group: number;
  affected_routers: number;
  risk_rate_pct: number;
  multiplier: number;
  statement: string;
  causation_note: string;
}

export interface FleetPatternsResponse {
  fleet_summary: {
    total_routers: number;
    high_risk_routers: number;
    baseline_risk_rate_pct: number;
  };
  patterns_by_dimension: {
    firmware_version?: FleetPatternItem[];
    model?: FleetPatternItem[];
    building?: FleetPatternItem[];
    user_type?: FleetPatternItem[];
  };
  systemic_alerts: SystemicAlert[];
}

export interface CopilotMLResponse {
  router_id?: string | null;
  answer: string;
  structured_evidence: Record<string, any>;
  suggested_followups: string[];
}

export interface ModelMetricsResponse {
  model_name: string;
  accuracy: number;
  recall: number;
  precision: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  confusion_matrix: {
    true_negatives: number;
    false_positives: number;
    false_negatives: number;
    true_positives: number;
  };
  train_samples: number;
  val_samples: number;
  test_samples: number;
  scale_pos_weight: number;
  global_feature_importance: Array<{
    feature: string;
    display_name: string;
    mean_abs_shap: number;
    importance_pct: number;
  }>;
  roc_curve: Array<{ fpr: number; tpr: number }>;
  pr_curve: Array<{ recall: number; precision: number }>;
}
