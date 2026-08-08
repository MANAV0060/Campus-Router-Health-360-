"""
NetSentinel Fleet-Level Pattern Analysis
Analyzes systemic risk concentration across firmware versions, router models, buildings, and user types.

CRITICAL PRINCIPLE:
Distinguishes statistical correlation from direct causation.
Flags "SYSTEMIC PATTERN" with clear evidence and risk multipliers without blindly blaming firmware or location.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any

def analyze_fleet_patterns(
    routers_df: pd.DataFrame,
    predictions_df: pd.DataFrame,
    risk_threshold: float = 0.50
) -> Dict[str, Any]:
    """
    Computes group-level risk distributions across categorical dimensions.
    Handles duplicate columns safely to prevent pandas suffix collisions (_x, _y).
    """
    # Ensure clean merge by avoiding column collision
    pred_cols = ["router_id", "future_degradation_prob", "current_health", "health_status", "is_anomaly", "anomaly_score"]
    if "latency_now" in predictions_df.columns:
        pred_cols.append("latency_now")
    if "packet_loss_now" in predictions_df.columns:
        pred_cols.append("packet_loss_now")

    clean_preds = predictions_df[[c for c in pred_cols if c in predictions_df.columns]].copy()
    
    # Merge with full router inventory
    merged = pd.merge(routers_df, clean_preds, on="router_id", how="inner")
    total_routers = len(merged)
    if total_routers == 0:
        return {
            "fleet_summary": {"total_routers": 0, "high_risk_routers": 0, "baseline_risk_rate_pct": 0.0},
            "patterns_by_dimension": {},
            "systemic_alerts": []
        }

    overall_high_risk = int((merged["future_degradation_prob"] >= risk_threshold).sum())
    fleet_baseline_rate = (overall_high_risk / total_routers) * 100.0 if total_routers > 0 else 0.0

    dimensions = ["firmware_version", "model", "building", "user_type"]
    fleet_analysis = {
        "fleet_summary": {
            "total_routers": total_routers,
            "high_risk_routers": overall_high_risk,
            "baseline_risk_rate_pct": round(fleet_baseline_rate, 1),
        },
        "patterns_by_dimension": {},
        "systemic_alerts": []
    }

    for dim in dimensions:
        if dim not in merged.columns:
            continue

        groups = []
        for name, group in merged.groupby(dim):
            group_total = len(group)
            group_high_risk = int((group["future_degradation_prob"] >= risk_threshold).sum())
            risk_rate = (group_high_risk / group_total) * 100.0 if group_total > 0 else 0.0
            risk_multiplier = round(risk_rate / fleet_baseline_rate, 2) if fleet_baseline_rate > 0 else 1.0

            is_systemic = (risk_rate >= 1.4 * fleet_baseline_rate) and (group_total >= 3) and (group_high_risk >= 2)

            group_data = {
                "category": dim,
                "value": str(name),
                "total_routers": group_total,
                "high_risk_routers": group_high_risk,
                "risk_rate_pct": round(risk_rate, 1),
                "fleet_baseline_rate_pct": round(fleet_baseline_rate, 1),
                "risk_multiplier": risk_multiplier,
                "is_systemic_pattern": is_systemic,
                "avg_health_score": round(float(group["current_health"].mean()), 1) if "current_health" in group.columns else 75.0,
                "avg_latency_ms": round(float(group["latency_now"].mean()), 1) if "latency_now" in group.columns else 35.0,
                "avg_packet_loss_pct": round(float(group["packet_loss_now"].mean()), 2) if "packet_loss_now" in group.columns else 0.5,
            }
            groups.append(group_data)

            if is_systemic:
                fleet_analysis["systemic_alerts"].append({
                    "dimension": dim,
                    "group_name": str(name),
                    "total_in_group": group_total,
                    "affected_routers": group_high_risk,
                    "risk_rate_pct": round(risk_rate, 1),
                    "multiplier": risk_multiplier,
                    "statement": f"{dim} '{name}' exhibits a {round(risk_rate, 1)}% risk rate ({risk_multiplier}x fleet baseline average of {round(fleet_baseline_rate, 1)}%).",
                    "causation_note": f"Correlation detected across {group_total} units. Verify physical switch ports or RF environment before triggering fleet-wide rollback."
                })

        # Sort groups by risk rate descending
        groups.sort(key=lambda x: x["risk_rate_pct"], reverse=True)
        fleet_analysis["patterns_by_dimension"][dim] = groups

    return fleet_analysis
