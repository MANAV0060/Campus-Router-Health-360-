# backend/app/schemas.py

"""
NetSentinel Pydantic Schemas
Strict type definitions for API responses and requests.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class ShapContributor(BaseModel):
    feature: str
    display_name: str
    raw_value: float
    shap_value: float
    contribution_pct: float
    direction: str

class MetricPoint(BaseModel):
    hour: str
    avg_speed_mbps: float
    latency_ms: float
    packet_loss_pct: float
    disconnects: float
    connected_devices: float
    signal_dbm: float

class ComplaintItem(BaseModel):
    ticket_id: str
    date: str
    complaint_text: str

class RouterSummary(BaseModel):
    router_id: str
    model: str
    firmware_version: str
    building: str
    room: int
    user_type: str
    current_health: float
    health_status: str
    future_degradation_prob: float
    future_risk_pct: float
    risk_level: str
    is_anomaly: bool
    anomaly_score: float
    priority_score: float
    priority_level: str
    recommended_action: str
    root_cause: str
    connected_devices: float

class RouterDetail(BaseModel):
    router_id: str
    model: str
    firmware_version: str
    building: str
    room: int
    user_type: str
    current_health: float
    health_status: str
    health_components: Dict[str, float]
    future_degradation_prob: float
    future_risk_pct: float
    risk_level: str
    is_anomaly: bool
    anomaly_score: float
    priority_score: float
    priority_level: str
    priority_breakdown: Dict[str, float]
    root_cause: str
    evidence: List[str]
    recommended_action: str
    top_contributors: List[ShapContributor]
    metrics_now: Dict[str, float]
    metric_slopes: Dict[str, float]
    history: List[MetricPoint]
    complaints: List[ComplaintItem]
    fleet_benchmark: Dict[str, Any]

class FleetKpis(BaseModel):
    total_routers: int
    healthy_count: int
    watch_count: int
    at_risk_count: int
    critical_count: int
    high_future_risk_count: int
    anomalous_count: int
    users_affected: int
    avg_fleet_health: float
    model_recall: float
    model_precision: float
    model_roc_auc: float

class FleetPatternItem(BaseModel):
    category: str
    value: str
    total_routers: int
    high_risk_routers: int
    risk_rate_pct: float
    fleet_baseline_rate_pct: float
    risk_multiplier: float
    is_systemic_pattern: bool
    avg_health_score: float

class SystemicAlert(BaseModel):
    dimension: str
    group_name: str
    total_in_group: int
    affected_routers: int
    risk_rate_pct: float
    multiplier: float
    statement: str
    causation_note: str

class FleetPatternsResponse(BaseModel):
    fleet_summary: Dict[str, Any]
    patterns_by_dimension: Dict[str, List[FleetPatternItem]]
    systemic_alerts: List[SystemicAlert]

class CopilotQuery(BaseModel):
    router_id: Optional[str] = None
    question: str

class CopilotResponse(BaseModel):
    router_id: Optional[str]
    answer: str
    structured_evidence: Dict[str, Any]
    suggested_followups: List[str]

class ModelMetricsResponse(BaseModel):
    model_name: str
    accuracy: float
    recall: float
    precision: float
    f1_score: float
    roc_auc: float
    pr_auc: float
    confusion_matrix: Dict[str, int]
    train_samples: int
    val_samples: int
    test_samples: int
    scale_pos_weight: float
    global_feature_importance: List[Dict[str, Any]]
    roc_curve: List[Dict[str, float]]
    pr_curve: List[Dict[str, float]]
