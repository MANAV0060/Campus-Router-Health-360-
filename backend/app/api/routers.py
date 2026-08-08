# backend/app/api/routers.py

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.services.health_score import get_all_router_healths
from app.services.evidence_engine import get_router_evidence
from app.services.copilot import handle_copilot_chat
from app.services.data_loader import load_metrics
from app.services.impact_engine import calculate_priority_score
from app.services.predictive_router_service import router_service

router = APIRouter()

@router.get("/routers/ranking")
def get_predictive_routers_ranking(
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

@router.get("/routers")
def get_routers(
    building: Optional[str] = Query(None),
    firmware: Optional[str] = Query(None),
    model: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1)
):
    health_data = get_all_router_healths()
    
    # Filtering
    filtered = health_data.values()
    if building:
        filtered = [r for r in filtered if r.get("building") == building]
    if firmware:
        filtered = [r for r in filtered if r.get("firmware") == firmware]
    if model:
        filtered = [r for r in filtered if r.get("model") == model]
    if status:
        filtered = [r for r in filtered if r.get("status") == status]
    if search:
        search_lower = search.lower()
        filtered = [
            r for r in filtered 
            if search_lower in r["router_id"].lower() 
            or search_lower in r.get("building", "").lower() 
            or search_lower in r.get("model", "").lower()
        ]
        
    # Sort by health score ascending by default (worst first)
    sorted_routers = sorted(filtered, key=lambda x: x["health_score"])
    
    total = len(sorted_routers)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_routers = sorted_routers[start_idx:end_idx]
    
    # Format list
    result_list = []
    for r in paginated_routers:
        # Include priority info if it's not healthy
        priority_info = {}
        if r["status"] != "Healthy":
            priority_info = calculate_priority_score(r["router_id"], r)
            
        result_list.append({
            "router_id": r["router_id"],
            "health_score": r["health_score"],
            "status": r["status"],
            "building": r.get("building", "Unknown"),
            "room": r.get("room", "Unknown"),
            "model": r.get("model", "Unknown"),
            "firmware": r.get("firmware", "Unknown"),
            "latency": r["averages"]["latency"],
            "packet_loss": r["averages"]["packet_loss"],
            "disconnects": int(round(r["averages"]["disconnects"] * 24)),  # total 24h disconnects
            "signal": r["averages"]["signal"],
            "connected_devices": int(round(r["averages"]["device_load"])),
            "priority": priority_info
        })
        
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "routers": result_list
    }

@router.get("/routers/{router_id}")
def get_router_detail(router_id: str):
    # Check if predictive router service has detailed 360 diagnostic
    predictive_detail = router_service.get_router_detail(router_id.strip())
    if predictive_detail:
        return predictive_detail

    health_data = get_all_router_healths()
    if router_id not in health_data:
        raise HTTPException(status_code=404, detail=f"Router {router_id} not found.")
        
    r = health_data[router_id]
    priority_info = {}
    if r["status"] != "Healthy":
        priority_info = calculate_priority_score(r["router_id"], r)
        
    evidence_data = get_router_evidence(router_id)
    
    # Fetch historical hourly metrics for sparklines
    all_metrics = load_metrics()
    router_metrics = [m for m in all_metrics if m["router_id"] == router_id]
    
    return {
        "router_id": r["router_id"],
        "health_score": r["health_score"],
        "status": r["status"],
        "building": r.get("building", "Unknown"),
        "room": r.get("room", "Unknown"),
        "model": r.get("model", "Unknown"),
        "firmware": r.get("firmware", "Unknown"),
        "user_type": r.get("user_type", "Unknown"),
        "metrics_summary": r["averages"],
        "priority": priority_info,
        "evidence": evidence_data,
        "history": router_metrics
    }
