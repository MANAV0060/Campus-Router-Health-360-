"""
NetSentinel Supervised Target Label Generation
Constructs the binary target: future_degradation (0 or 1) for each router at time t.

CRITICAL ZERO DATA LEAKAGE RULE:
Future metrics and future health scores are used ONLY during label creation.
No future metrics or future health scores are ever included in the feature vector X(t).
"""

import pandas as pd
import numpy as np
from typing import Tuple
from ml.config import (
    TARGET_FUTURE_WINDOW_HOURS,
    TARGET_DEGRADED_HEALTH_THRESHOLD,
    TARGET_SUSTAINED_HOURS,
)
from ml.health_score import calculate_health_score

def create_future_degradation_target(
    metrics_df: pd.DataFrame,
    future_window_hours: int = TARGET_FUTURE_WINDOW_HOURS,
    degraded_threshold: float = TARGET_DEGRADED_HEALTH_THRESHOLD,
    sustained_hours: int = TARGET_SUSTAINED_HOURS,
) -> pd.DataFrame:
    """
    Computes future degradation labels for time-series router metrics.

    For each router at timestamp t:
    Looks ahead at time indices (t+1, t+future_window_hours].
    future_degradation = 1 if:
      - Health Score drops below degraded_threshold (60.0) for >= sustained_hours (2h)
      - OR Health Score drops into Critical state (< 40.0) at any point in the future window.
    future_degradation = 0 otherwise.

    Returns DataFrame containing [router_id, hour, current_health, future_degradation].
    """
    df = metrics_df.copy()

    # Ensure chronological sort
    if "hour" in df.columns:
        df["hour_dt"] = pd.to_datetime(df["hour"])
        df = df.sort_values(["router_id", "hour_dt"]).reset_index(drop=True)

    # Compute current health score for each row
    df["current_health"] = calculate_health_score(
        speed=df["avg_speed_mbps"],
        latency=df["latency_ms"],
        packet_loss=df["packet_loss_pct"],
        disconnects=df["disconnects"],
        signal=df["signal_dbm"],
        devices=df["connected_devices"] if "connected_devices" in df.columns else 10.0
    )

    df["is_degraded"] = (df["current_health"] < degraded_threshold).astype(int)
    df["is_critical"] = (df["current_health"] < 40.0).astype(int)

    future_labels = []

    # Group by router to strictly prevent cross-router contamination
    for router_id, group in df.groupby("router_id", sort=False):
        n_rows = len(group)
        group_indices = group.index.values
        health_arr = group["current_health"].values
        degraded_arr = group["is_degraded"].values
        critical_arr = group["is_critical"].values

        for i in range(n_rows):
            # Future slice strictly after index i
            future_start = i + 1
            future_end = min(n_rows, i + 1 + future_window_hours)

            if future_start >= n_rows:
                # No future data available; default to 0 or drop during training
                has_degradation = 0
            else:
                future_degraded_slice = degraded_arr[future_start:future_end]
                future_critical_slice = critical_arr[future_start:future_end]

                # Check sustained degradation (e.g. 2 consecutive hours) or critical drop
                sustained_degradation = False
                if len(future_degraded_slice) >= sustained_hours:
                    # Rolling consecutive sum
                    consecutive_hits = np.convolve(future_degraded_slice, np.ones(sustained_hours, dtype=int), mode='valid')
                    sustained_degradation = np.any(consecutive_hits >= sustained_hours)
                elif len(future_degraded_slice) > 0:
                    sustained_degradation = np.all(future_degraded_slice == 1)

                has_critical = np.any(future_critical_slice == 1)
                has_degradation = 1 if (sustained_degradation or has_critical) else 0

            future_labels.append((group_indices[i], has_degradation))

    label_series = pd.Series(dict(future_labels))
    df["future_degradation"] = label_series

    return df
