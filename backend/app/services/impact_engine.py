# backend/app/services/impact_engine.py

from typing import Dict, Any, List
from app.services.health_score import get_all_router_healths
from app.services.evidence_engine import get_router_evidence

def calculate_priority_score(router_id: str, health_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculates Priority Score = (100 - Health Score) * Average Connected Devices * Evidence Strength Multiplier.
    Returns priority details: score, tier, user impact, and severity.
    """
    health_score = health_info["health_score"]
    status = health_info["status"]
    avg_devices = health_info["averages"]["device_load"]
    
    # If router is healthy, it is low priority
    if status == "Healthy":
        return {
            "router_id": router_id,
            "priority_score": 0.0,
            "tier": "Low",
            "affected_users": int(round(avg_devices)),
            "severity_multiplier": 1.0
        }
        
    # Get evidence to determine strength multiplier
    evidence_package = get_router_evidence(router_id)
    evidence_list = evidence_package.get("evidence", [])
    
    # Base multiplier on the maximum evidence strength among indicators
    max_strength = "Weak"
    for item in evidence_list:
        str_val = item.get("strength", "Weak")
        if str_val == "Strong":
            max_strength = "Strong"
            break
        elif str_val == "Moderate":
            max_strength = "Moderate"
            
    multiplier = 1.0
    if max_strength == "Strong":
        multiplier = 1.5
    elif max_strength == "Moderate":
        multiplier = 1.2
        
    # Calculate score
    degradation_factor = 100.0 - health_score
    priority_score = degradation_factor * avg_devices * multiplier
    
    # Determine Priority Tier
    if priority_score >= 1200:
        tier = "Critical"
    elif priority_score >= 800:
        tier = "High"
    elif priority_score >= 300:
        tier = "Medium"
    else:
        tier = "Low"
        
    return {
        "router_id": router_id,
        "priority_score": float(round(priority_score, 1)),
        "tier": tier,
        "affected_users": int(round(avg_devices)),
        "evidence_strength": max_strength,
        "severity_multiplier": multiplier
    }

def get_prioritized_intervention_list() -> List[Dict[str, Any]]:
    """
    Returns all degraded routers sorted by priority score descending.
    """
    health_data = get_all_router_healths()
    prioritized_list = []
    
    for rid, h_info in health_data.items():
        if h_info["status"] != "Healthy":
            p_details = calculate_priority_score(rid, h_info)
            prioritized_list.append({
                "router_id": rid,
                "building": h_info.get("building", "Unknown"),
                "room": h_info.get("room", "Unknown"),
                "model": h_info.get("model", "Unknown"),
                "firmware": h_info.get("firmware", "Unknown"),
                "health_score": h_info["health_score"],
                "status": h_info["status"],
                "priority_score": p_details["priority_score"],
                "tier": p_details["tier"],
                "affected_users": p_details["affected_users"],
                "evidence_strength": p_details["evidence_strength"]
            })
            
    # Sort by priority score descending
    prioritized_list.sort(key=lambda x: x["priority_score"], reverse=True)
    return prioritized_list
