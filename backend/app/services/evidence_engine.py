# backend/app/services/evidence_engine.py

from typing import Dict, Any, List
import pandas as pd
import numpy as np
from app.services.data_loader import load_metrics, load_routers, load_complaints
from app.services.health_score import get_all_router_healths, calculate_router_health
from app.config import MIN_COHORT_SIZE, RECOMMENDATION_RULES

def get_baselines_and_cohorts() -> Dict[str, Any]:
    """
    Computes global baseline, healthy baseline, and peer group statistics.
    Cached internally at query time.
    """
    health_data = get_all_router_healths()
    df_metrics = load_metrics()
    
    # 1. Global Baseline (average across all routers)
    global_grouped = df_metrics.groupby("router_id").agg({
        "avg_speed_mbps": "mean",
        "latency_ms": "mean",
        "packet_loss_pct": "mean",
        "disconnects": "mean",
        "connected_devices": "mean",
        "signal_dbm": "mean"
    }).mean()
    
    global_baseline = {
        "speed": float(global_grouped["avg_speed_mbps"]),
        "latency": float(global_grouped["latency_ms"]),
        "packet_loss": float(global_grouped["packet_loss_pct"]),
        "disconnects": float(global_grouped["disconnects"]),
        "device_load": float(global_grouped["connected_devices"]),
        "signal": float(global_grouped["signal_dbm"])
    }
    
    # 2. Healthy Baseline (average across healthy routers)
    healthy_rids = [rid for rid, h in health_data.items() if h["status"] == "Healthy"]
    if len(healthy_rids) > 0:
        healthy_grouped = df_metrics[df_metrics["router_id"].isin(healthy_rids)].groupby("router_id").agg({
            "avg_speed_mbps": "mean",
            "latency_ms": "mean",
            "packet_loss_pct": "mean",
            "disconnects": "mean",
            "connected_devices": "mean",
            "signal_dbm": "mean"
        }).mean()
        
        healthy_baseline = {
            "speed": float(healthy_grouped["avg_speed_mbps"]),
            "latency": float(healthy_grouped["latency_ms"]),
            "packet_loss": float(healthy_grouped["packet_loss_pct"]),
            "disconnects": float(healthy_grouped["disconnects"]),
            "device_load": float(healthy_grouped["connected_devices"]),
            "signal": float(healthy_grouped["signal_dbm"])
        }
    else:
        # Fallback to global if no healthy routers
        healthy_baseline = global_baseline.copy()
        
    return {
        "global": global_baseline,
        "healthy": healthy_baseline,
        "health_data": health_data,
        "df_metrics": df_metrics
    }

def calculate_peer_baseline(router_id: str, building: str, model: str, firmware: str, df_metrics: pd.DataFrame, health_data: Dict[str, Any]) -> Dict[str, float]:
    """
    Calculates peer baseline for building + model + firmware.
    Falls back to building + model or just building if cohort size is too small.
    """
    routers_df = load_routers()
    
    # Try 1: building + model + firmware
    peers = routers_df[
        (routers_df["building"] == building) & 
        (routers_df["model"] == model) & 
        (routers_df["firmware_version"] == firmware)
    ]["router_id"].tolist()
    
    # Try 2: building + model
    if len(peers) < MIN_COHORT_SIZE:
        peers = routers_df[
            (routers_df["building"] == building) & 
            (routers_df["model"] == model)
        ]["router_id"].tolist()
        
    # Try 3: building
    if len(peers) < MIN_COHORT_SIZE:
        peers = routers_df[
            (routers_df["building"] == building)
        ]["router_id"].tolist()
        
    # Exclude the target router itself if possible, but keep if it is the only one
    peer_rids = [p for p in peers if p != router_id]
    if not peer_rids:
        peer_rids = peers
        
    peer_grouped = df_metrics[df_metrics["router_id"].isin(peer_rids)].groupby("router_id").agg({
        "avg_speed_mbps": "mean",
        "latency_ms": "mean",
        "packet_loss_pct": "mean",
        "disconnects": "mean",
        "connected_devices": "mean",
        "signal_dbm": "mean"
    }).mean()
    
    return {
        "speed": float(peer_grouped["avg_speed_mbps"]),
        "latency": float(peer_grouped["latency_ms"]),
        "packet_loss": float(peer_grouped["packet_loss_pct"]),
        "disconnects": float(peer_grouped["disconnects"]),
        "device_load": float(peer_grouped["connected_devices"]),
        "signal": float(peer_grouped["signal_dbm"]),
        "cohort_size": len(peer_rids)
    }

def get_router_evidence(router_id: str) -> Dict[str, Any]:
    """
    Main diagnostic API function. Calculates:
    - Metadata
    - Current averages
    - Three-tier baselines
    - Temporal trends
    - Ranked contributing factors with evidence strength
    - Deterministic recommended action
    """
    baselines_info = get_baselines_and_cohorts()
    health_data = baselines_info["health_data"]
    global_b = baselines_info["global"]
    healthy_b = baselines_info["healthy"]
    df_metrics = baselines_info["df_metrics"]
    
    if router_id not in health_data:
        raise ValueError(f"Router {router_id} not found in the performance metrics dataset.")
        
    r_health = health_data[router_id]
    curr_averages = r_health["averages"]
    
    # Metadata
    building = r_health.get("building", "Unknown")
    model = r_health.get("model", "Unknown")
    firmware = r_health.get("firmware", "Unknown")
    room = r_health.get("room", "Unknown")
    user_type = r_health.get("user_type", "Unknown")
    
    # Peer Baseline
    peer_b = calculate_peer_baseline(router_id, building, model, firmware, df_metrics, health_data)
    cohort_size = peer_b.pop("cohort_size", 0)
    
    # Temporal Trends (Now, 6h, 12h, 24h)
    r_metrics = df_metrics[df_metrics["router_id"] == router_id].sort_values("hour")
    trends = {}
    if not r_metrics.empty:
        # Map fields to simplify JSON
        mapping = {
            "avg_speed_mbps": "speed",
            "latency_ms": "latency",
            "packet_loss_pct": "packet_loss",
            "disconnects": "disconnects",
            "connected_devices": "device_load",
            "signal_dbm": "signal"
        }
        for csv_col, json_key in mapping.items():
            vals = r_metrics[csv_col].tolist()
            trends[json_key] = {
                "now": float(vals[-1]) if len(vals) >= 1 else np.nan,
                "6h": float(vals[-6]) if len(vals) >= 6 else np.nan,
                "12h": float(vals[-12]) if len(vals) >= 12 else np.nan,
                "24h": float(vals[0]) if len(vals) >= 24 else np.nan,
                "history": [float(v) for v in vals]
            }
            
    # Calculate Contributing Factors Evidence Strength
    contributors = []
    
    # Latency (higher is worse)
    lat_curr = curr_averages["latency"]
    lat_base = healthy_b["latency"]
    lat_change = ((lat_curr - lat_base) / lat_base * 100) if lat_base > 0 else 0
    if lat_change > 10:
        strength = "Weak"
        score = 0.2 + min(0.3, lat_change / 500)
        if lat_change >= 150:
            strength = "Strong"
            score = 0.8 + min(0.2, lat_change / 1000)
        elif lat_change >= 50:
            strength = "Moderate"
            score = 0.5 + min(0.3, lat_change / 500)
        contributors.append({
            "factor": "latency",
            "strength": strength,
            "score": float(round(score, 2)),
            "current": float(round(lat_curr, 1)),
            "baseline": float(round(lat_base, 1)),
            "change_percent": float(round(lat_change, 1))
        })
        
    # Packet Loss (higher is worse)
    loss_curr = curr_averages["packet_loss"]
    loss_base = healthy_b["packet_loss"]
    loss_change = ((loss_curr - loss_base) / loss_base * 100) if loss_base > 0 else 0
    if loss_change > 10:
        strength = "Weak"
        score = 0.2 + min(0.3, loss_change / 500)
        if loss_change >= 200:
            strength = "Strong"
            score = 0.8 + min(0.2, loss_change / 1000)
        elif loss_change >= 50:
            strength = "Moderate"
            score = 0.5 + min(0.3, loss_change / 500)
        contributors.append({
            "factor": "packet_loss",
            "strength": strength,
            "score": float(round(score, 2)),
            "current": float(round(loss_curr, 2)),
            "baseline": float(round(loss_base, 2)),
            "change_percent": float(round(loss_change, 1))
        })
        
    # Disconnects (higher is worse)
    disc_curr = curr_averages["disconnects"]
    disc_base = healthy_b["disconnects"]
    disc_change = ((disc_curr - disc_base) / disc_base * 100) if disc_base > 0 else 0
    if disc_change > 10:
        strength = "Weak"
        score = 0.2 + min(0.3, disc_change / 500)
        if disc_change >= 200:
            strength = "Strong"
            score = 0.8 + min(0.2, disc_change / 1000)
        elif disc_change >= 50:
            strength = "Moderate"
            score = 0.5 + min(0.3, disc_change / 500)
        contributors.append({
            "factor": "disconnects",
            "strength": strength,
            "score": float(round(score, 2)),
            "current": float(round(disc_curr * 24, 1)),  # display total 24h disconnects
            "baseline": float(round(disc_base * 24, 1)),
            "change_percent": float(round(disc_change, 1))
        })
        
    # Signal Strength (more negative is worse)
    sig_curr = curr_averages["signal"]
    sig_base = healthy_b["signal"]
    sig_diff = sig_base - sig_curr  # Drop in dBm (e.g. -50 - (-73) = 23 dBm drop)
    if sig_diff > 3.0:
        strength = "Weak"
        score = 0.2 + min(0.3, sig_diff / 30)
        if sig_diff >= 15.0:
            strength = "Strong"
            score = 0.8 + min(0.2, sig_diff / 50)
        elif sig_diff >= 8.0:
            strength = "Moderate"
            score = 0.5 + min(0.3, sig_diff / 30)
        contributors.append({
            "factor": "signal",
            "strength": strength,
            "score": float(round(score, 2)),
            "current": float(round(sig_curr, 1)),
            "baseline": float(round(sig_base, 1)),
            "change_percent": float(round(sig_diff, 1))  # represent drop magnitude in dBm
        })
        
    # Speed Degradation (lower is worse)
    speed_curr = curr_averages["speed"]
    speed_base = healthy_b["speed"]
    speed_drop = ((speed_base - speed_curr) / speed_base * 100) if speed_base > 0 else 0
    if speed_drop > 10.0:
        strength = "Weak"
        score = 0.2 + min(0.3, speed_drop / 100)
        if speed_drop >= 50.0:
            strength = "Strong"
            score = 0.8 + min(0.2, speed_drop / 200)
        elif speed_drop >= 25.0:
            strength = "Moderate"
            score = 0.5 + min(0.3, speed_drop / 100)
        contributors.append({
            "factor": "speed",
            "strength": strength,
            "score": float(round(score, 2)),
            "current": float(round(speed_curr, 1)),
            "baseline": float(round(speed_base, 1)),
            "change_percent": float(round(speed_drop, 1))
        })
        
    # Device Load (higher is worse / overload)
    dev_curr = curr_averages["device_load"]
    dev_base = healthy_b["device_load"]
    dev_change = ((dev_curr - dev_base) / dev_base * 100) if dev_base > 0 else 0
    if dev_change > 5.0:
        strength = "Weak"
        score = 0.2 + min(0.3, dev_change / 100)
        if dev_change >= 40.0:
            strength = "Strong"
            score = 0.8 + min(0.2, dev_change / 200)
        elif dev_change >= 20.0:
            strength = "Moderate"
            score = 0.5 + min(0.3, dev_change / 100)
        contributors.append({
            "factor": "device_load",
            "strength": strength,
            "score": float(round(score, 2)),
            "current": float(round(dev_curr, 1)),
            "baseline": float(round(dev_base, 1)),
            "change_percent": float(round(dev_change, 1))
        })

    # Firmware Cohort Check
    # Check if this firmware has a high rate of critical routers
    fw_cohort = [rid for rid, h in health_data.items() if h.get("firmware") == firmware]
    if len(fw_cohort) >= MIN_COHORT_SIZE:
        fw_critical = [rid for rid in fw_cohort if health_data[rid]["status"] == "Critical"]
        fw_critical_rate = len(fw_critical) / len(fw_cohort)
        
        # Campus critical baseline
        total_routers = len(health_data)
        campus_critical = len([rid for rid, h in health_data.items() if h["status"] == "Critical"])
        campus_critical_rate = campus_critical / total_routers if total_routers > 0 else 0
        
        # If firmware has elevated critical rate compared to campus
        if fw_critical_rate > campus_critical_rate * 1.5 and len(fw_critical) > 1:
            strength = "Moderate"
            score = 0.5
            if fw_critical_rate >= 0.40:
                strength = "Strong"
                score = 0.8
            elif fw_critical_rate >= 0.25:
                strength = "Moderate"
                score = 0.6
                
            contributors.append({
                "factor": "firmware_cohort",
                "strength": strength,
                "score": float(round(score, 2)),
                "current": float(round(fw_critical_rate * 100, 1)),  # percentage critical
                "baseline": float(round(campus_critical_rate * 100, 1)),
                "change_percent": float(round((fw_critical_rate - campus_critical_rate) * 100, 1))
            })
            
    # Sort contributors by evidence score (descending)
    contributors.sort(key=lambda x: x["score"], reverse=True)
    
    # Determine the primary contributing factor
    primary_factor = contributors[0]["factor"] if contributors else "none"
    
    # 7. Apply Deterministic Recommendation Rules
    # We map severity states of factors to recommendation
    sev_map = {c["factor"]: c["strength"] for c in contributors}
    
    recommended_action = None
    reason = None
    
    # Rule 1: AP placement (Weak Signal + High Disconnects)
    if (sev_map.get("signal") == "Strong" or sev_map.get("signal") == "Moderate") and \
       (sev_map.get("disconnects") == "Strong" or sev_map.get("disconnects") == "Moderate"):
        rule = next(r for r in RECOMMENDATION_RULES if r["name"] == "ap_placement")
        recommended_action = rule["action"]
        reason = rule["reason"]
        
    # Rule 2: Firmware cohort pattern
    elif sev_map.get("firmware_cohort") == "Strong" and r_health["status"] == "Critical":
        recommended_action = f"Perform firmware downgrade or cohort audit for version {firmware}."
        reason = f"Firmware version {firmware} exhibits a high critical-router rate of {sev_map.get('firmware_cohort')} intensity, suggesting a systemic software instability."
        
    # Rule 3: Cabling (Packet loss is high but signal is fine)
    elif (sev_map.get("packet_loss") == "Strong" or sev_map.get("packet_loss") == "Moderate") and \
         sev_map.get("signal") != "Strong":
        rule = next(r for r in RECOMMENDATION_RULES if r["name"] == "cabling")
        recommended_action = rule["action"]
        reason = rule["reason"]
        
    # Rule 4: Router capacity (High latency + High device load)
    elif (sev_map.get("latency") == "Strong" or sev_map.get("latency") == "Moderate") and \
         (sev_map.get("device_load") == "Strong" or sev_map.get("device_load") == "Moderate"):
        rule = next(r for r in RECOMMENDATION_RULES if r["name"] == "capacity")
        recommended_action = rule["action"]
        reason = rule["reason"]
        
    # Rule 5: Latency issues
    elif sev_map.get("latency") == "Strong" or sev_map.get("latency") == "Moderate":
        rule = next(r for r in RECOMMENDATION_RULES if r["name"] == "latency")
        recommended_action = rule["action"]
        reason = rule["reason"]
        
    # Rule 6: Disconnect issues
    elif sev_map.get("disconnects") == "Strong" or sev_map.get("disconnects") == "Moderate":
        rule = next(r for r in RECOMMENDATION_RULES if r["name"] == "power")
        recommended_action = rule["action"]
        reason = rule["reason"]
        
    # Default fallback
    else:
        rule = next(r for r in RECOMMENDATION_RULES if r["name"] == "default")
        recommended_action = rule["action"]
        reason = rule["reason"]
        
    # Complaints context
    complaints_df = load_complaints()
    r_complaints = complaints_df[complaints_df["router_id"] == router_id]
    complaints_list = []
    for _, c_row in r_complaints.iterrows():
        complaints_list.append({
            "ticket_id": c_row.get("ticket_id"),
            "date": c_row.get("date").strftime("%Y-%m-%d") if not pd.isna(c_row.get("date")) else "Unknown",
            "complaint_text": c_row.get("complaint_text")
        })
        
    return {
        "router": {
            "id": router_id,
            "building": building,
            "model": model,
            "firmware": firmware,
            "room": room,
            "user_type": user_type,
            "complaints": complaints_list
        },
        "health": {
            "score": r_health["health_score"],
            "status": r_health["status"]
        },
        "current_metrics": curr_averages,
        "baselines": {
            "global": global_b,
            "peer": peer_b,
            "healthy": healthy_b
        },
        "trends": trends,
        "evidence": contributors,
        "recommendation": {
            "action": recommended_action,
            "reason": reason
        }
    }
