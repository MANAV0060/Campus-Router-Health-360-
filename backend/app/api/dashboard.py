# backend/app/api/dashboard.py

from fastapi import APIRouter, Query
from typing import Optional, Dict, Any
from app.services.health_score import get_all_router_healths
from app.services.analytics import get_building_analytics, get_firmware_analytics, get_model_analytics

router = APIRouter()

def filter_data(health_data: dict, building: Optional[str], firmware: Optional[str], model: Optional[str], status: Optional[str]) -> dict:
    filtered = health_data.copy()
    if building:
        filtered = {rid: h for rid, h in filtered.items() if h.get("building") == building}
    if firmware:
        filtered = {rid: h for rid, h in filtered.items() if h.get("firmware") == firmware}
    if model:
        filtered = {rid: h for rid, h in filtered.items() if h.get("model") == model}
    if status:
        filtered = {rid: h for rid, h in filtered.items() if h.get("status") == status}
    return filtered

@router.get("/dashboard")
def get_dashboard(
    building: Optional[str] = Query(None),
    firmware: Optional[str] = Query(None),
    model: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    health_data = get_all_router_healths()
    filtered_data = filter_data(health_data, building, firmware, model, status)
    
    # 1. Re-calculate general statistics
    total = len(filtered_data)
    counts = {"Healthy": 0, "Watch": 0, "At Risk": 0, "Critical": 0}
    for h in filtered_data.values():
        counts[h["status"]] += 1
        
    # 2. Get worst 10 routers (sorted by health score ascending)
    sorted_routers = sorted(filtered_data.values(), key=lambda x: x["health_score"])
    worst_10 = sorted_routers[:10]
    
    # Clean up structure for front-end rendering
    worst_list = []
    for idx, r in enumerate(worst_10):
        worst_list.append({
            "rank": idx + 1,
            "router_id": r["router_id"],
            "health_score": r["health_score"],
            "status": r["status"],
            "building": r.get("building", "Unknown"),
            "model": r.get("model", "Unknown"),
            "firmware": r.get("firmware", "Unknown"),
            "latency": r["averages"]["latency"],
            "packet_loss": r["averages"]["packet_loss"],
            "disconnects": int(round(r["averages"]["disconnects"] * 24)),  # total 24h disconnects
            "signal": r["averages"]["signal"],
            "connected_devices": int(round(r["averages"]["device_load"]))
        })
        
    # 3. Dynamic aggregations for charts based on filtered routers
    building_counts = {}
    firmware_counts = {}
    
    # Campus baselines for charts
    for r in filtered_data.values():
        bld = r.get("building", "Unknown")
        fw = r.get("firmware", "Unknown")
        status = r["status"]
        
        if bld not in building_counts:
            building_counts[bld] = {"building": bld, "total": 0, "critical": 0, "healthy": 0}
        building_counts[bld]["total"] += 1
        if status == "Critical":
            building_counts[bld]["critical"] += 1
        else:
            building_counts[bld]["healthy"] += 1
            
        if fw not in firmware_counts:
            firmware_counts[fw] = {"firmware": fw, "total": 0, "critical": 0, "healthy": 0}
        firmware_counts[fw]["total"] += 1
        if status == "Critical":
            firmware_counts[fw]["critical"] += 1
        else:
            firmware_counts[fw]["healthy"] += 1
            
    building_chart_data = sorted(list(building_counts.values()), key=lambda x: x["critical"], reverse=True)
    firmware_chart_data = sorted(list(firmware_counts.values()), key=lambda x: x["critical"], reverse=True)
    
    return {
        "summary": {
            "total_routers": total,
            "healthy_count": counts["Healthy"],
            "watch_count": counts["Watch"],
            "at_risk_count": counts["At Risk"],
            "critical_count": counts["Critical"]
        },
        "worst_routers": worst_list,
        "building_distribution": building_chart_data,
        "firmware_distribution": firmware_chart_data,
        "status_distribution": [
            {"name": "Healthy", "value": counts["Healthy"]},
            {"name": "Watch", "value": counts["Watch"]},
            {"name": "At Risk", "value": counts["At Risk"]},
            {"name": "Critical", "value": counts["Critical"]}
        ]
    }
