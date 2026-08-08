# backend/app/api/routers.py

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from app.services.health_score import get_all_router_healths
from app.services.evidence_engine import get_router_evidence
from app.services.copilot import handle_copilot_chat
from app.services.data_loader import load_metrics
from app.services.impact_engine import calculate_priority_score

router = APIRouter()

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
    health_data = get_all_router_healths()
    if router_id not in health_data:
        raise HTTPException(status_code=404, detail=f"Router {router_id} not found.")
        
    r = health_data[router_id]
    priority_info = {}
    if r["status"] != "Healthy":
        priority_info = calculate_priority_score(router_id, r)
        
    # Format detailed fields
    return {
        "router_id": r["router_id"],
        "health_score": r["health_score"],
        "status": r["status"],
        "building": r.get("building", "Unknown"),
        "room": r.get("room", "Unknown"),
        "model": r.get("model", "Unknown"),
        "firmware": r.get("firmware", "Unknown"),
        "user_type": r.get("user_type", "Unknown"),
        "averages": {
            "speed": r["averages"]["speed"],
            "latency": r["averages"]["latency"],
            "packet_loss": r["averages"]["packet_loss"],
            "disconnects": int(round(r["averages"]["disconnects"] * 24)),
            "signal": r["averages"]["signal"],
            "connected_devices": int(round(r["averages"]["device_load"]))
        },
        "sub_scores": r["sub_scores"],
        "priority": priority_info
    }

@router.get("/routers/{router_id}/history")
def get_router_history(router_id: str):
    metrics_df = load_metrics()
    r_metrics = metrics_df[metrics_df["router_id"] == router_id].sort_values("hour")
    
    if r_metrics.empty:
        raise HTTPException(status_code=404, detail=f"No performance history found for router {router_id}.")
        
    history = []
    for _, row in r_metrics.iterrows():
        history.append({
            "hour": row["hour"].strftime("%Y-%m-%dT%H:%M:%S") if row["hour"] else "Unknown",
            "speed": float(row["avg_speed_mbps"]) if not pd.isna(row["avg_speed_mbps"]) else None,
            "latency": float(row["latency_ms"]) if not pd.isna(row["latency_ms"]) else None,
            "packet_loss": float(row["packet_loss_pct"]) if not pd.isna(row["packet_loss_pct"]) else None,
            "disconnects": int(row["disconnects"]) if not pd.isna(row["disconnects"]) else None,
            "connected_devices": int(row["connected_devices"]) if not pd.isna(row["connected_devices"]) else None,
            "signal": float(row["signal_dbm"]) if not pd.isna(row["signal_dbm"]) else None
        })
        
    return {
        "router_id": router_id,
        "history": history
    }

@router.get("/routers/{router_id}/evidence")
def get_router_evidence_endpoint(router_id: str):
    try:
        evidence = get_router_evidence(router_id)
        return evidence
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/routers/{router_id}/diagnosis")
def get_router_diagnosis(router_id: str):
    # Formulate standard diagnostic query
    query = f"Why is {router_id} unhealthy?"
    copilot_res = handle_copilot_chat(query)
    return {
        "router_id": router_id,
        "query": query,
        "diagnosis_text": copilot_res["response"],
        "source": copilot_res["source"]
    }
import pandas as pd
