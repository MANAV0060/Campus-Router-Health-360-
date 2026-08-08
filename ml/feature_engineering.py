"""
NetSentinel Advanced Temporal Pattern Matching & Feature Engineering Engine
Extracts multi-window temporal, trajectory, volatility, cross-metric interaction, and momentum features.

CRITICAL ZERO DATA LEAKAGE RULE:
At any timestamp t, features use strictly history k <= t.
"""

import pandas as pd
import numpy as np
from typing import List, Tuple
from ml.config import ROLLING_WINDOWS
from ml.health_score import calculate_health_score

def compute_slope(series: np.ndarray) -> float:
    """Computes linear regression slope over a rolling window."""
    n = len(series)
    if n < 2 or np.all(np.isnan(series)):
        return 0.0
    x = np.arange(n)
    x_mean = (n - 1) / 2.0
    y_mean = np.mean(series)
    denom = np.sum((x - x_mean) ** 2)
    if denom == 0:
        return 0.0
    numer = np.sum((x - x_mean) * (series - y_mean))
    return float(numer / denom)

def compute_ema(series: np.ndarray, span: int) -> float:
    """Computes Exponential Moving Average over recent window."""
    if len(series) == 0:
        return 0.0
    alpha = 2.0 / (span + 1.0)
    weights = (1 - alpha) ** np.arange(len(series))[::-1]
    weights /= weights.sum()
    return float(np.sum(weights * series))

def extract_router_features(
    metrics_df: pd.DataFrame,
    routers_df: pd.DataFrame = None,
    complaints_df: pd.DataFrame = None
) -> pd.DataFrame:
    """
    Transforms raw time-series metrics into high-dimensional temporal features with advanced pattern matching.
    """
    df = metrics_df.copy()

    if "hour" in df.columns:
        df["hour_dt"] = pd.to_datetime(df["hour"])
        df = df.sort_values(["router_id", "hour_dt"]).reset_index(drop=True)

    # Instantaneous health score
    df["health_now"] = calculate_health_score(
        speed=df["avg_speed_mbps"],
        latency=df["latency_ms"],
        packet_loss=df["packet_loss_pct"],
        disconnects=df["disconnects"],
        signal=df["signal_dbm"],
        devices=df["connected_devices"] if "connected_devices" in df.columns else 10.0
    )

    df["speed_now"] = df["avg_speed_mbps"]
    df["latency_now"] = df["latency_ms"].astype(float)
    df["packet_loss_now"] = df["packet_loss_pct"].astype(float)
    df["disconnects_now"] = df["disconnects"].astype(float)
    df["signal_now"] = df["signal_dbm"].astype(float)
    df["devices_now"] = df["connected_devices"].astype(float) if "connected_devices" in df.columns else 10.0

    feature_rows = []

    for router_id, group in df.groupby("router_id", sort=False):
        g = group.copy().reset_index(drop=True)
        n = len(g)

        lat = g["latency_now"].values
        loss = g["packet_loss_now"].values
        disc = g["disconnects_now"].values
        spd = g["speed_now"].values
        sig = g["signal_now"].values
        dev = g["devices_now"].values
        hlth = g["health_now"].values

        for i in range(n):
            row_dict = {
                "router_id": router_id,
                "hour": g.loc[i, "hour"] if "hour" in g.columns else str(i),
                "timestamp_idx": i,
                "health_now": float(hlth[i]),
                "speed_now": float(spd[i]),
                "latency_now": float(lat[i]),
                "packet_loss_now": float(loss[i]),
                "disconnects_now": float(disc[i]),
                "signal_now": float(sig[i]),
                "devices_now": float(dev[i]),
            }

            # 1-hour deltas (t vs t-1)
            row_dict["latency_delta"] = float(lat[i] - lat[i-1]) if i > 0 else 0.0
            row_dict["packet_loss_delta"] = float(loss[i] - loss[i-1]) if i > 0 else 0.0
            row_dict["disconnect_delta"] = float(disc[i] - disc[i-1]) if i > 0 else 0.0
            row_dict["speed_delta"] = float(spd[i] - spd[i-1]) if i > 0 else 0.0
            row_dict["signal_delta"] = float(sig[i] - sig[i-1]) if i > 0 else 0.0
            row_dict["devices_delta"] = float(dev[i] - dev[i-1]) if i > 0 else 0.0
            row_dict["health_delta"] = float(hlth[i] - hlth[i-1]) if i > 0 else 0.0

            # Advanced Cross-Metric Pattern Signatures
            row_dict["congestion_stress_index"] = float((lat[i] / 50.0) * (loss[i] + 0.1))
            row_dict["rf_client_contention"] = float((abs(sig[i]) / 50.0) * (dev[i] / 15.0))
            row_dict["instability_multiplier"] = float(disc[i] * (loss[i] + 0.5))
            row_dict["throughput_deficit_ratio"] = float(max(0.0, (50.0 - spd[i]) / 50.0) * (lat[i] / 40.0))

            # Multi-Scale Rolling Windows: 3h, 6h, 12h, 24h
            for w in ROLLING_WINDOWS:
                start_idx = max(0, i - w + 1)
                window_lat = lat[start_idx : i + 1]
                window_loss = loss[start_idx : i + 1]
                window_disc = disc[start_idx : i + 1]
                window_spd = spd[start_idx : i + 1]
                window_sig = sig[start_idx : i + 1]
                window_dev = dev[start_idx : i + 1]
                window_hlth = hlth[start_idx : i + 1]

                # Rolling Means
                row_dict[f"latency_mean_{w}h"] = float(np.mean(window_lat))
                row_dict[f"packet_loss_mean_{w}h"] = float(np.mean(window_loss))
                row_dict[f"disconnects_mean_{w}h"] = float(np.mean(window_disc))
                row_dict[f"speed_mean_{w}h"] = float(np.mean(window_spd))
                row_dict[f"signal_mean_{w}h"] = float(np.mean(window_sig))
                row_dict[f"devices_mean_{w}h"] = float(np.mean(window_dev))
                row_dict[f"health_mean_{w}h"] = float(np.mean(window_hlth))

                # Exponential Moving Averages (Momentum)
                row_dict[f"latency_ema_{w}h"] = compute_ema(window_lat, span=w)
                row_dict[f"packet_loss_ema_{w}h"] = compute_ema(window_loss, span=w)
                row_dict[f"health_ema_{w}h"] = compute_ema(window_hlth, span=w)

                # Volatility / Standard Deviation
                if w >= 6:
                    row_dict[f"latency_std_{w}h"] = float(np.std(window_lat))
                    row_dict[f"packet_loss_std_{w}h"] = float(np.std(window_loss))
                    row_dict[f"speed_std_{w}h"] = float(np.std(window_spd))
                    row_dict[f"signal_std_{w}h"] = float(np.std(window_sig))
                    row_dict[f"devices_std_{w}h"] = float(np.std(window_dev))
                    # Volatility-to-mean coefficient
                    lat_mean = np.mean(window_lat)
                    row_dict[f"latency_cv_{w}h"] = float(np.std(window_lat) / (lat_mean + 1e-5))

                # Rolling Min / Max
                if w in [6, 12]:
                    row_dict[f"latency_max_{w}h"] = float(np.max(window_lat))
                    row_dict[f"latency_min_{w}h"] = float(np.min(window_lat))
                    row_dict[f"packet_loss_max_{w}h"] = float(np.max(window_loss))
                    row_dict[f"speed_min_{w}h"] = float(np.min(window_spd))
                    row_dict[f"disconnects_max_{w}h"] = float(np.max(window_disc))

                # Linear Slopes / Trajectories (Key Degradation Predictors)
                if w in [6, 12]:
                    row_dict[f"latency_slope_{w}h"] = compute_slope(window_lat)
                    row_dict[f"packet_loss_slope_{w}h"] = compute_slope(window_loss)
                    row_dict[f"disconnect_slope_{w}h"] = compute_slope(window_disc)
                    row_dict[f"speed_slope_{w}h"] = compute_slope(window_spd)
                    row_dict[f"signal_slope_{w}h"] = compute_slope(window_sig)
                    row_dict[f"devices_slope_{w}h"] = compute_slope(window_dev)
                    row_dict[f"health_slope_{w}h"] = compute_slope(window_hlth)

            # Percentage changes over 6 hours
            start_6h = max(0, i - 6 + 1)
            baseline_lat = lat[start_6h] if lat[start_6h] > 0 else 1.0
            baseline_spd = spd[start_6h] if spd[start_6h] > 0 else 1.0
            baseline_dev = dev[start_6h] if dev[start_6h] > 0 else 1.0
            row_dict["latency_pct_change_6h"] = float((lat[i] - baseline_lat) / baseline_lat * 100.0)
            row_dict["speed_pct_change_6h"] = float((spd[i] - baseline_spd) / baseline_spd * 100.0)
            row_dict["devices_pct_change_6h"] = float((dev[i] - baseline_dev) / baseline_dev * 100.0)

            # Temporal / Calendar Context
            if "hour_dt" in g.columns:
                dt = g.loc[i, "hour_dt"]
                row_dict["hour_of_day"] = dt.hour
                row_dict["day_of_week"] = dt.dayofweek
                row_dict["is_weekend"] = 1 if dt.dayofweek >= 5 else 0
            else:
                row_dict["hour_of_day"] = i % 24
                row_dict["day_of_week"] = (i // 24) % 7
                row_dict["is_weekend"] = 0

            row_dict["device_load_ratio"] = float(dev[i] / 30.0)

            if "future_degradation" in g.columns:
                row_dict["future_degradation"] = int(g.loc[i, "future_degradation"])

            feature_rows.append(row_dict)

    feat_df = pd.DataFrame(feature_rows)

    if routers_df is not None:
        static_cols = ["router_id", "model", "firmware_version", "building", "room", "user_type"]
        avail_static = [c for c in static_cols if c in routers_df.columns]
        feat_df = feat_df.merge(routers_df[avail_static], on="router_id", how="left")

    if complaints_df is not None and "router_id" in complaints_df.columns:
        complaint_counts = complaints_df.groupby("router_id").size().to_dict()
        feat_df["prior_complaints_count"] = feat_df["router_id"].map(complaint_counts).fillna(0).astype(int)
    else:
        feat_df["prior_complaints_count"] = 0

    return feat_df
