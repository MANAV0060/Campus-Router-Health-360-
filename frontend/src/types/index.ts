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

export interface RouterSummary {
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

export interface RouterDetail extends RouterSummary {
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

export interface CopilotResponse {
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
