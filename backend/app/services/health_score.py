# backend/app/services/health_score.py

from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np
from app.config import SCORING_WEIGHTS, METRIC_RANGES, STATUS_THRESHOLDS
from app.services.data_loader import load_metrics, load_routers

def normalize_metric(val: float, metric_name: str) -> float:
    """Normalize a metric value to a 0-100 score based on range configuration."""
    if pd.isna(val):
        return 100.0  # Safe default if metric is missing
        
    cfg = METRIC_RANGES.get(metric_name)
    if not cfg:
        return 100.0
        
    min_val = cfg["min_val"]
    max_val = cfg["max_val"]
    invert = cfg["invert"]
    
    if invert:
        # Lower is better (e.g. latency, packet loss, disconnects)
        if val <= min_val:
            return 100.0
        if val >= max_val:
            return 0.0
        return 100.0 * (1.0 - (val - min_val) / (max_val - min_val))
    else:
        # Higher is better (e.g. speed, signal)
        if val <= min_val:
            return 0.0
        if val >= max_val:
            return 100.0
        return 100.0 * (val - min_val) / (max_val - min_val)

def score_to_status(score: float) -> str:
    """Map a 0-100 score to status category based on config thresholds."""
    sorted_thresholds = sorted(STATUS_THRESHOLDS.items(), key=lambda x: x[1], reverse=True)
    for status, thresh in sorted_thresholds:
        if score >= thresh:
            return status
    return "Critical"

def calculate_router_health(avg_metrics: Dict[str, float]) -> Tuple[int, str, Dict[str, float]]:
    """
    Calculate the health score (0-100) and status for a single router
    based on its averaged performance metrics.
    """
    sub_scores = {}
    for metric in SCORING_WEIGHTS.keys():
        val = avg_metrics.get(metric, np.nan)
        # If the metric key is disconnects, check if it's hourly or total
        # In avg_metrics, disconnects should be passed as the hourly average
        sub_scores[metric] = normalize_metric(val, metric)
        
    # Calculate weighted average
    weighted_score = 0.0
    for metric, weight in SCORING_WEIGHTS.items():
        weighted_score += sub_scores[metric] * weight
        
    health_score = int(round(weighted_score))
    status = score_to_status(health_score)
    
    return health_score, status, sub_scores

def get_all_router_healths() -> Dict[str, Dict[str, Any]]:
    """
    Computes health scores and status for all routers dynamically from metrics.
    Returns a dict mapping router_id to its health metadata.
    """
    metrics_df = load_metrics()
    routers_df = load_routers()
    
    # Group by router_id and calculate means
    grouped = metrics_df.groupby("router_id").agg({
        "avg_speed_mbps": "mean",
        "latency_ms": "mean",
        "packet_loss_pct": "mean",
        "disconnects": "mean",  # this is hourly average since data is hourly!
        "connected_devices": "mean",
        "signal_dbm": "mean"
    }).reset_index()
    
    health_results = {}
    for _, row in grouped.iterrows():
        rid = row["router_id"]
        avg_metrics = {
            "speed": row["avg_speed_mbps"],
            "latency": row["latency_ms"],
            "packet_loss": row["packet_loss_pct"],
            "disconnects": row["disconnects"],
            "device_load": row["connected_devices"],
            "signal": row["signal_dbm"]
        }
        
        score, status, subs = calculate_router_health(avg_metrics)
        
        health_results[rid] = {
            "router_id": rid,
            "health_score": score,
            "status": status,
            "averages": {
                "speed": float(row["avg_speed_mbps"]),
                "latency": float(row["latency_ms"]),
                "packet_loss": float(row["packet_loss_pct"]),
                "disconnects": float(row["disconnects"]),
                "device_load": float(row["connected_devices"]),
                "signal": float(row["signal_dbm"])
            },
            "sub_scores": subs
        }
        
    # Inject metadata from routers_df if available
    for _, row in routers_df.iterrows():
        rid = row["router_id"]
        if rid in health_results:
            health_results[rid].update({
                "model": row.get("model", "Unknown"),
                "firmware": row.get("firmware_version", "Unknown"),
                "building": row.get("building", "Unknown"),
                "room": str(row.get("room", "Unknown")),
                "user_type": row.get("user_type", "Unknown")
            })
            
    return health_results
