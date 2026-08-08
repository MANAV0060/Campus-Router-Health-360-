"""
NetSentinel Transparent Health Score Engine
Calculates an objective, normalized 0-100 score for router operational health.
Documented in README and UI. This score defines current state and constructs the future degradation target.
"""

import numpy as np
import pandas as pd
from typing import Union, Dict, Any
from ml.config import (
    HEALTH_WEIGHTS,
    SPEED_BASELINE_MBPS,
    LATENCY_OPTIMAL_MS,
    LATENCY_MAX_PENALTY_MS,
    PACKET_LOSS_MAX_PENALTY_PCT,
    DISCONNECTS_MAX_PENALTY,
    SIGNAL_MIN_DBM,
    SIGNAL_MAX_DBM,
    HEALTH_THRESHOLDS,
)

def normalize_speed(speed: Union[float, np.ndarray, pd.Series]) -> Union[float, np.ndarray, pd.Series]:
    """Speed quality: 0-100 normalized against 50 Mbps baseline."""
    return np.clip((speed / SPEED_BASELINE_MBPS) * 100.0, 0.0, 100.0)

def normalize_latency(latency: Union[float, np.ndarray, pd.Series]) -> Union[float, np.ndarray, pd.Series]:
    """Latency quality: 100 at <= 20ms, drops to 0 at >= 120ms."""
    normalized = 100.0 - ((latency - LATENCY_OPTIMAL_MS) / (LATENCY_MAX_PENALTY_MS - LATENCY_OPTIMAL_MS)) * 100.0
    return np.clip(normalized, 0.0, 100.0)

def normalize_packet_loss(packet_loss: Union[float, np.ndarray, pd.Series]) -> Union[float, np.ndarray, pd.Series]:
    """Packet loss quality: 100 at 0% loss, 0 at >= 5% packet loss."""
    normalized = 100.0 - (packet_loss / PACKET_LOSS_MAX_PENALTY_PCT) * 100.0
    return np.clip(normalized, 0.0, 100.0)

def normalize_disconnects(disconnects: Union[float, np.ndarray, pd.Series]) -> Union[float, np.ndarray, pd.Series]:
    """Disconnect quality: 100 at 0 disconnects, 0 at >= 4 disconnects per hour."""
    normalized = 100.0 - (disconnects / DISCONNECTS_MAX_PENALTY) * 100.0
    return np.clip(normalized, 0.0, 100.0)

def normalize_signal(signal_dbm: Union[float, np.ndarray, pd.Series]) -> Union[float, np.ndarray, pd.Series]:
    """Signal quality: -40 dBm is 100%, -85 dBm is 0%."""
    normalized = ((signal_dbm - SIGNAL_MIN_DBM) / (SIGNAL_MAX_DBM - SIGNAL_MIN_DBM)) * 100.0
    return np.clip(normalized, 0.0, 100.0)

def normalize_device_load(devices: Union[float, np.ndarray, pd.Series], max_capacity: float = 30.0) -> Union[float, np.ndarray, pd.Series]:
    """Load quality: 100 for normal device counts, penalizes severe congestion above capacity."""
    load_ratio = devices / max_capacity
    quality = 100.0 - np.maximum(0.0, (load_ratio - 1.0) * 100.0)
    return np.clip(quality, 0.0, 100.0)

def calculate_health_score(
    speed: Union[float, pd.Series],
    latency: Union[float, pd.Series],
    packet_loss: Union[float, pd.Series],
    disconnects: Union[float, pd.Series],
    signal: Union[float, pd.Series],
    devices: Union[float, pd.Series] = 10.0,
    max_capacity: float = 30.0
) -> Union[float, pd.Series]:
    """
    Computes overall Health Score (0-100) using transparent weighted combination.
    """
    q_speed = normalize_speed(speed)
    q_lat = normalize_latency(latency)
    q_loss = normalize_packet_loss(packet_loss)
    q_disc = normalize_disconnects(disconnects)
    q_sig = normalize_signal(signal)
    q_load = normalize_device_load(devices, max_capacity)

    health_score = (
        q_speed * HEALTH_WEIGHTS["speed"] +
        q_lat * HEALTH_WEIGHTS["latency"] +
        q_loss * HEALTH_WEIGHTS["packet_loss"] +
        q_disc * HEALTH_WEIGHTS["disconnects"] +
        q_sig * HEALTH_WEIGHTS["signal"] +
        q_load * HEALTH_WEIGHTS["load_factor"]
    )

    return np.clip(np.round(health_score, 1), 0.0, 100.0)

def get_health_category(health_score: float) -> str:
    """Returns human-readable health category and status badge."""
    if health_score >= HEALTH_THRESHOLDS["HEALTHY"]:
        return "HEALTHY"
    elif health_score >= HEALTH_THRESHOLDS["WATCH"]:
        return "WATCH"
    elif health_score >= HEALTH_THRESHOLDS["AT_RISK"]:
        return "AT_RISK"
    else:
        return "CRITICAL"

def compute_health_breakdown(
    speed: float,
    latency: float,
    packet_loss: float,
    disconnects: float,
    signal: float,
    devices: float = 10.0
) -> Dict[str, Any]:
    """Returns a full transparent breakdown of component sub-scores."""
    q_speed = float(normalize_speed(speed))
    q_lat = float(normalize_latency(latency))
    q_loss = float(normalize_packet_loss(packet_loss))
    q_disc = float(normalize_disconnects(disconnects))
    q_sig = float(normalize_signal(signal))
    q_load = float(normalize_device_load(devices))

    total = calculate_health_score(speed, latency, packet_loss, disconnects, signal, devices)

    return {
        "health_score": float(total),
        "category": get_health_category(total),
        "components": {
            "speed_quality": round(q_speed, 1),
            "latency_quality": round(q_lat, 1),
            "packet_loss_quality": round(q_loss, 1),
            "disconnect_quality": round(q_disc, 1),
            "signal_quality": round(q_sig, 1),
            "device_load_quality": round(q_load, 1),
        },
        "weights": HEALTH_WEIGHTS,
        "raw_metrics": {
            "speed_mbps": speed,
            "latency_ms": latency,
            "packet_loss_pct": packet_loss,
            "disconnects": disconnects,
            "signal_dbm": signal,
            "connected_devices": devices,
        }
    }
