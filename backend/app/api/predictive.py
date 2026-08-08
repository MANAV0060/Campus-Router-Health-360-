# backend/app/api/predictive.py

"""
NetSentinel API Router (Predictive ML Component)
Exposes predictive network operations REST APIs based on supervised XGBoost & SHAP explanations.
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.schemas import (
    RouterSummary,
    RouterDetail,
    FleetKpis,
    FleetPatternsResponse,
    CopilotQuery,
    CopilotResponse,
    ModelMetricsResponse,
)
from app.services.predictive_router_service import router_service
from app.services.predictive_copilot_service import copilot_service

router = APIRouter()

@router.get("/fleet/kpis", response_model=FleetKpis)
def get_fleet_kpis():
    """Returns high-level network operations summary metrics from the ML model."""
    return router_service.get_fleet_kpis()

@router.get("/predictive/kpis", response_model=FleetKpis)
def get_predictive_kpis():
    return router_service.get_fleet_kpis()

@router.get("/routers/ranking")
def get_routers_ranking(
    sort_by: str = Query("priority", description="Sorting field: priority, future_risk, current_health_asc, current_health_desc, devices"),
    filter_status: Optional[str] = Query("ALL", description="Filter by health status: ALL, HEALTHY, WATCH, AT_RISK, CRITICAL"),
    filter_building: Optional[str] = Query("ALL", description="Filter by building name"),
    filter_risk: Optional[str] = Query("ALL", description="Filter by risk level: ALL, HIGH, MEDIUM, LOW"),
    search: Optional[str] = Query(None, description="Search router_id, building, model, firmware")
):
    """Returns sorted and filtered router list with priority ranking and ML risk predictions."""
    return router_service.get_routers_ranking(
        sort_by=sort_by,
        filter_status=filter_status,
        filter_building=filter_building,
        filter_risk=filter_risk,
        search=search
    )

@router.get("/predictive/ranking")
def get_predictive_ranking(
    sort_by: str = Query("priority"),
    filter_status: Optional[str] = Query("ALL"),
    filter_building: Optional[str] = Query("ALL"),
    filter_risk: Optional[str] = Query("ALL"),
    search: Optional[str] = Query(None)
):
    return router_service.get_routers_ranking(
        sort_by=sort_by,
        filter_status=filter_status,
        filter_building=filter_building,
        filter_risk=filter_risk,
        search=search
    )

@router.get("/predictions/high-risk")
@router.get("/predictive/high-risk")
def get_high_risk_predictions():
    """Returns routers with future degradation risk >= 60% prioritized for early IT intervention."""
    all_routers = router_service.get_routers_ranking(sort_by="priority")
    high_risk = [r for r in all_routers if r.get("future_risk_pct", 0) >= 60.0 or r.get("risk_level") == "HIGH"]
    return {
        "count": len(high_risk),
        "high_risk_routers": high_risk
    }

@router.get("/routers/{router_id}")
@router.get("/predictive/routers/{router_id}")
def get_router_detail(router_id: str):
    """Returns comprehensive 360-degree diagnostic package for a single router."""
    detail = router_service.get_router_detail(router_id.strip())
    if not detail:
        raise HTTPException(status_code=404, detail=f"Router '{router_id}' not found in active inventory.")
    return detail

@router.get("/routers/{router_id}/prediction")
@router.get("/predictive/routers/{router_id}/prediction")
def get_router_prediction(router_id: str):
    """Returns pure ML prediction payload matching the exact hackathon API specification."""
    detail = router_service.get_router_detail(router_id.strip())
    if not detail:
        raise HTTPException(status_code=404, detail=f"Router '{router_id}' not found in active inventory.")
    
    return {
        "router_id": detail["router_id"],
        "current_health": detail["current_health"],
        "future_degradation_probability": detail["future_degradation_prob"],
        "risk_level": detail["risk_level"],
        "anomaly": detail["is_anomaly"],
        "top_contributors": [c["feature"] for c in detail.get("top_contributors", [])],
        "recommended_action": detail["recommended_action"]
    }

@router.get("/patterns")
@router.get("/predictive/patterns")
def get_fleet_patterns():
    """Returns systemic fleet-level patterns across firmware, building, model, and user type."""
    return router_service.fleet_patterns

@router.get("/model/metrics")
@router.get("/predictive/model/metrics")
def get_model_metrics():
    """Returns real test set evaluation metrics, confusion matrix, ROC points, and global SHAP rankings."""
    return router_service.eval_metrics

@router.post("/copilot", response_model=CopilotResponse)
@router.post("/predictive/copilot", response_model=CopilotResponse)
def query_copilot(payload: CopilotQuery):
    """AI Copilot query endpoint grounded in structured backend telemetry and ML evidence."""
    return copilot_service.answer_query(
        question=payload.question,
        router_id=payload.router_id
    )
