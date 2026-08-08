"""
NetSentinel Deterministic Root-Cause & Recommendation Engine
Combines metric trends, SHAP feature attributions, anomaly scores, fleet patterns, and complaint tickets
into a deterministic, evidence-based root cause and exactly ONE actionable recommendation.
"""

from typing import Dict, Any, List
from ml.config import PRIORITY_WEIGHTS

def calculate_priority_score(
    future_degradation_prob: float,
    current_health: float,
    connected_devices: float,
    anomaly_score: float = 0.0,
    max_devices: float = 40.0
) -> Dict[str, Any]:
    """
    Computes transparent Operational Priority Score (0-100).

    Priority Formula:
      Priority = 0.45 * (P_future * 100) + 0.25 * (100 - Health) + 0.20 * min(100, (devices/40)*100) + 0.10 * (anomaly_score * 100)
    """
    risk_comp = future_degradation_prob * 100.0
    health_comp = max(0.0, 100.0 - current_health)
    device_comp = min(100.0, (connected_devices / max_devices) * 100.0)
    anomaly_comp = anomaly_score * 100.0

    raw_priority = (
        PRIORITY_WEIGHTS["future_risk"] * risk_comp +
        PRIORITY_WEIGHTS["current_severity"] * health_comp +
        PRIORITY_WEIGHTS["user_impact"] * device_comp +
        PRIORITY_WEIGHTS["anomaly_severity"] * anomaly_comp
    )
    score = round(min(100.0, max(0.0, raw_priority)), 1)

    if score >= 75.0:
        level = "CRITICAL"
    elif score >= 55.0:
        level = "HIGH"
    elif score >= 35.0:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "priority_score": score,
        "priority_level": level,
        "components": {
            "future_risk_contrib": round(PRIORITY_WEIGHTS["future_risk"] * risk_comp, 1),
            "health_severity_contrib": round(PRIORITY_WEIGHTS["current_severity"] * health_comp, 1),
            "user_impact_contrib": round(PRIORITY_WEIGHTS["user_impact"] * device_comp, 1),
            "anomaly_contrib": round(PRIORITY_WEIGHTS["anomaly_severity"] * anomaly_comp, 1),
        }
    }

def diagnose_router(
    router_id: str,
    current_health: float,
    future_prob: float,
    is_anomaly: bool,
    anomaly_score: float,
    metrics_now: Dict[str, float],
    metric_slopes: Dict[str, float],
    top_contributors: List[Dict[str, Any]],
    firmware_pattern_alert: bool = False,
    complaint_count: int = 0,
    complaint_texts: List[str] = None
) -> Dict[str, Any]:
    """
    Deterministic rule-based evidence aggregator.
    Calculates root cause and selects exactly ONE recommended action.
    """
    evidence = []
    actions = []

    spd = metrics_now.get("speed_now", 45.0)
    lat = metrics_now.get("latency_now", 30.0)
    loss = metrics_now.get("packet_loss_now", 0.5)
    disc = metrics_now.get("disconnects_now", 0)
    sig = metrics_now.get("signal_now", -55.0)
    dev = metrics_now.get("devices_now", 10.0)

    lat_slope = metric_slopes.get("latency_slope_6h", 0.0)
    loss_slope = metric_slopes.get("packet_loss_slope_6h", 0.0)
    disc_slope = metric_slopes.get("disconnect_slope_6h", 0.0)
    spd_slope = metric_slopes.get("speed_slope_6h", 0.0)
    sig_slope = metric_slopes.get("signal_slope_6h", 0.0)

    # 1. Check Network / Backhaul degradation
    if (loss > 2.5 or loss_slope > 0.3) and (lat > 80 or lat_slope > 5.0):
        evidence.append(f"Sharp upward trajectory in packet loss (+{round(loss_slope, 2)}%/6h) and latency (+{round(lat_slope, 1)}ms/6h).")
        root_cause = "Network Backhaul & Packet Drop Degradation"
        rec_action = "Investigate network/backhaul"

    # 2. Check Firmware-associated fleet pattern
    elif firmware_pattern_alert and future_prob >= 0.55:
        evidence.append(f"Firmware group demonstrates statistically elevated fleet-wide risk rate.")
        if disc > 2 or disc_slope > 0.5:
            evidence.append(f"Frequent connection drops ({disc}/hr, slope {round(disc_slope, 2)}) consistent with known driver timeout.")
        root_cause = "Firmware-Associated Fleet Instability"
        rec_action = "Update firmware"

    # 3. Check RF Signal / Physical Placement
    elif sig < -75.0 or sig_slope < -2.0:
        evidence.append(f"Degraded RF signal strength ({sig} dBm) causing physical layer attenuation.")
        root_cause = "RF Signal & Physical Placement Attenuation"
        rec_action = "Relocate router"

    # 4. Check High Device Overload & Congestion
    elif dev > 30 or dev / 30.0 > 1.2:
        evidence.append(f"Excessive connected device load ({int(dev)} active clients) exceeding optimal AP capacity.")
        root_cause = "High Client Load & Channel Contention"
        rec_action = "Investigate network/backhaul"

    # 5. Healthy metrics but complaints present
    elif current_health >= 75.0 and complaint_count > 0:
        evidence.append(f"Metrics appear stable but {complaint_count} user complaint ticket(s) logged.")
        root_cause = "User-Side Configuration or Local Interference"
        rec_action = "User education"

    # 6. High anomaly or hardware instability
    elif is_anomaly and disc >= 3:
        evidence.append(f"Unsupervised anomaly detector flagged abnormal disconnect cluster ({disc} disconnects/hr).")
        root_cause = "Hardware / Power Instability"
        rec_action = "Replace router"

    # 7. Default for healthy / watch without severe pattern
    elif future_prob >= 0.60:
        evidence.append(f"Multi-metric temporal indicators project near-term degradation within 24 hours.")
        root_cause = "Early Warning: Metric Drift Detected"
        rec_action = "Investigate network/backhaul"
    else:
        evidence.append("All key operational parameters within acceptable operating bounds.")
        root_cause = "Nominal Network Health"
        rec_action = "Monitor"

    # Priority calculation
    priority_info = calculate_priority_score(
        future_degradation_prob=future_prob,
        current_health=current_health,
        connected_devices=dev,
        anomaly_score=anomaly_score
    )

    return {
        "router_id": router_id,
        "root_cause": root_cause,
        "evidence": evidence,
        "recommended_action": rec_action,
        "priority_score": priority_info["priority_score"],
        "priority_level": priority_info["priority_level"],
        "priority_breakdown": priority_info["components"],
    }
