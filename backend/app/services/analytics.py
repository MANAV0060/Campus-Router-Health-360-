# backend/app/services/analytics.py

from typing import Dict, Any, List
from collections import defaultdict
from app.services.health_score import get_all_router_healths
from app.services.impact_engine import get_prioritized_intervention_list

def get_dashboard_summary() -> Dict[str, Any]:
    """
    Returns general stats for the dashboard header.
    """
    health_data = get_all_router_healths()
    
    total = len(health_data)
    counts = {
        "Healthy": 0,
        "Watch": 0,
        "At Risk": 0,
        "Critical": 0
    }
    
    for rid, h in health_data.items():
        status = h["status"]
        if status in counts:
            counts[status] += 1
            
    return {
        "total_routers": total,
        "healthy_count": counts["Healthy"],
        "watch_count": counts["Watch"],
        "at_risk_count": counts["At Risk"],
        "critical_count": counts["Critical"]
    }

def get_building_analytics() -> List[Dict[str, Any]]:
    """
    Aggregates router statuses by building.
    Returns list of dicts suitable for building bar charts.
    """
    health_data = get_all_router_healths()
    buildings = defaultdict(lambda: {"total": 0, "Healthy": 0, "Watch": 0, "At Risk": 0, "Critical": 0})
    
    for rid, h in health_data.items():
        bld = h.get("building", "Unknown")
        status = h["status"]
        buildings[bld]["total"] += 1
        buildings[bld][status] += 1
        
    result = []
    for bld, stats in buildings.items():
        # Calculate critical rate (percentage)
        rate = (stats["Critical"] / stats["total"] * 100) if stats["total"] > 0 else 0.0
        result.append({
            "building": bld,
            "total": stats["total"],
            "healthy": stats["Healthy"],
            "watch": stats["Watch"],
            "at_risk": stats["At Risk"],
            "critical": stats["Critical"],
            "critical_rate": float(round(rate, 1))
        })
        
    # Sort by critical count descending, then total descending
    result.sort(key=lambda x: (x["critical"], x["total"]), reverse=True)
    return result

def get_firmware_analytics() -> List[Dict[str, Any]]:
    """
    Aggregates router statuses by firmware version.
    Returns list of dicts suitable for firmware bar charts.
    """
    health_data = get_all_router_healths()
    firmwares = defaultdict(lambda: {"total": 0, "Healthy": 0, "Watch": 0, "At Risk": 0, "Critical": 0})
    
    for rid, h in health_data.items():
        fw = h.get("firmware", "Unknown")
        status = h["status"]
        firmwares[fw]["total"] += 1
        firmwares[fw][status] += 1
        
    result = []
    for fw, stats in firmwares.items():
        rate = (stats["Critical"] / stats["total"] * 100) if stats["total"] > 0 else 0.0
        result.append({
            "firmware": fw,
            "total": stats["total"],
            "healthy": stats["Healthy"],
            "watch": stats["Watch"],
            "at_risk": stats["At Risk"],
            "critical": stats["Critical"],
            "critical_rate": float(round(rate, 1))
        })
        
    # Sort by critical rate descending
    result.sort(key=lambda x: x["critical_rate"], reverse=True)
    return result

def get_model_analytics() -> List[Dict[str, Any]]:
    """
    Aggregates router statuses by hardware model.
    """
    health_data = get_all_router_healths()
    models = defaultdict(lambda: {"total": 0, "Healthy": 0, "Watch": 0, "At Risk": 0, "Critical": 0})
    
    for rid, h in health_data.items():
        mod = h.get("model", "Unknown")
        status = h["status"]
        models[mod]["total"] += 1
        models[mod][status] += 1
        
    result = []
    for mod, stats in models.items():
        rate = (stats["Critical"] / stats["total"] * 100) if stats["total"] > 0 else 0.0
        result.append({
            "model": mod,
            "total": stats["total"],
            "healthy": stats["Healthy"],
            "watch": stats["Watch"],
            "at_risk": stats["At Risk"],
            "critical": stats["Critical"],
            "critical_rate": float(round(rate, 1))
        })
        
    # Sort by total descending
    result.sort(key=lambda x: x["total"], reverse=True)
    return result
