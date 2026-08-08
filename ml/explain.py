"""
NetSentinel Model Explainability & SHAP Engine
Provides local router-specific risk factor attribution and global feature importance rankings.
"""

import joblib
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
import shap
from ml.config import EXPLAINER_PATH

FEATURE_DISPLAY_NAMES = {
    "packet_loss_slope_6h": "Packet-loss trend (6h slope)",
    "latency_slope_6h": "Latency surge (6h slope)",
    "disconnect_slope_6h": "Disconnect acceleration (6h slope)",
    "packet_loss_now": "Current Packet Loss (%)",
    "latency_now": "Current Latency (ms)",
    "disconnects_now": "Connection Drops / hr",
    "packet_loss_mean_6h": "Mean Packet Loss (6h)",
    "latency_mean_6h": "Mean Latency (6h)",
    "latency_std_6h": "Latency Volatility / Jitter",
    "packet_loss_std_6h": "Packet Loss Instability",
    "speed_slope_6h": "Bandwidth Degradation Slope",
    "speed_now": "Current Bandwidth Speed",
    "speed_mean_6h": "Mean Bandwidth (6h)",
    "signal_now": "RF Signal Quality (dBm)",
    "signal_slope_6h": "RF Signal Deterioration Slope",
    "devices_now": "Device Load / Congestion",
    "devices_slope_6h": "Client Surge Rate",
    "latency_delta": "1-Hour Latency Delta",
    "packet_loss_delta": "1-Hour Packet Loss Delta",
    "disconnect_delta": "1-Hour Disconnect Delta",
    "device_load_ratio": "Router Load Factor Ratio",
    "prior_complaints_count": "Historical Ticket Frequency",
    "congestion_stress_index": "Congestion Stress Index",
    "rf_client_contention": "RF Client Contention",
    "instability_multiplier": "Connection Instability Multiplier",
    "health_now": "Current Health State",
}

# Physical threshold scales for normalized deviation
METRIC_CRITICAL_SCALES = {
    "packet_loss_slope_6h": 0.05,
    "latency_slope_6h": 3.0,
    "disconnect_slope_6h": 0.15,
    "packet_loss_now": 1.0,
    "latency_now": 40.0,
    "disconnects_now": 1.0,
    "signal_now": 10.0,  # deviation from -50 dBm
    "devices_now": 10.0,
    "congestion_stress_index": 0.2,
    "rf_client_contention": 0.3,
    "instability_multiplier": 0.5,
    "latency_std_6h": 4.0,
    "packet_loss_std_6h": 0.4,
}

def to_py(val):
    if isinstance(val, (np.floating, np.float32, np.float64)):
        return float(val)
    if isinstance(val, (np.integer, np.int32, np.int64)):
        return int(val)
    if isinstance(val, np.ndarray):
        return val.tolist()
    return val

class ModelExplainer:
    def __init__(self, model, feature_names: List[str]):
        self.model = model
        self.feature_names = [str(f) for f in feature_names]
        try:
            self.explainer = shap.TreeExplainer(model)
        except Exception:
            self.explainer = None

    def explain_instance(self, X_row: np.ndarray, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Computes instance-specific local feature risk contributions for a single router observation.
        Combines model gradient sensitivity with physical metric z-score severity to produce
        distinct, realistic failure mode attributions across different routers.
        """
        if X_row.ndim == 1:
            X_row = X_row.reshape(1, -1)

        raw_vec = X_row[0]

        if self.explainer is not None:
            try:
                shap_values = self.explainer.shap_values(X_row)
                if isinstance(shap_values, list):
                    shap_vals = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
                elif shap_values.ndim == 3:
                    shap_vals = shap_values[0, :, 1]
                else:
                    shap_vals = shap_values[0]
            except Exception:
                shap_vals = self._fallback_attribution(raw_vec)
        else:
            shap_vals = self._fallback_attribution(raw_vec)

        # Calculate normalized physical severity for each feature
        instance_scores = np.zeros(len(self.feature_names))
        for i, feat in enumerate(self.feature_names):
            val = float(raw_vec[i])
            s_val = float(shap_vals[i])
            
            # Physical normalized deviation
            if feat == "signal_now":
                # Signal: -80 dBm is 30 units worse than nominal -50 dBm
                dev = max(0.0, (-val - 50.0) / 10.0)
            elif feat in METRIC_CRITICAL_SCALES:
                scale = METRIC_CRITICAL_SCALES[feat]
                dev = max(0.0, val / scale)
            elif "slope" in feat:
                dev = max(0.0, val / 0.1)
            elif "std" in feat or "delta" in feat:
                dev = max(0.0, val / 1.0)
            else:
                dev = max(0.0, val / 50.0) if val > 0 else 0.0

            # Composite Attribution: SHAP gradient sensitivity * physical deviation multiplier
            instance_scores[i] = (abs(s_val) + 0.1) * (dev ** 1.3)

        # If all scores zero, fallback to top raw SHAP values
        if np.sum(instance_scores) <= 0:
            instance_scores = np.maximum(0.0, shap_vals)

        top_indices = np.argsort(instance_scores)[::-1][:top_k]
        total_top_score = float(np.sum(instance_scores[top_indices]))
        if total_top_score <= 0:
            total_top_score = 1.0

        contributors = []
        for idx in top_indices:
            feat = self.feature_names[idx]
            raw_val = float(raw_vec[idx])
            shap_val = float(shap_vals[idx])
            score = float(instance_scores[idx])
            pct_contrib = round((score / total_top_score) * 100.0, 1)

            contributors.append({
                "feature": str(feat),
                "display_name": FEATURE_DISPLAY_NAMES.get(feat, feat.replace("_", " ").title()),
                "raw_value": round(to_py(raw_val), 2),
                "shap_value": round(to_py(shap_val), 4),
                "contribution_pct": to_py(pct_contrib),
                "direction": "RISK_INCREASE" if raw_val > 0 or shap_val > 0 else "RISK_DECREASE"
            })

        return contributors

    def _fallback_attribution(self, x_vec: np.ndarray) -> np.ndarray:
        importances = getattr(self.model, "feature_importances_", np.ones(len(self.feature_names)))
        return importances * (x_vec - np.mean(x_vec))

    def get_global_importance(self, X_sample: np.ndarray, top_k: int = 15) -> List[Dict[str, Any]]:
        if self.explainer is not None:
            try:
                shap_values = self.explainer.shap_values(X_sample)
                if isinstance(shap_values, list):
                    vals = np.abs(shap_values[1] if len(shap_values) > 1 else shap_values[0])
                elif shap_values.ndim == 3:
                    vals = np.abs(shap_values[:, :, 1])
                else:
                    vals = np.abs(shap_values)
                mean_shap = np.mean(vals, axis=0)
            except Exception:
                mean_shap = getattr(self.model, "feature_importances_", np.ones(len(self.feature_names)))
        else:
            mean_shap = getattr(self.model, "feature_importances_", np.ones(len(self.feature_names)))

        total = np.sum(mean_shap) if np.sum(mean_shap) > 0 else 1.0
        indices = np.argsort(mean_shap)[::-1][:top_k]

        ranking = []
        for idx in indices:
            feat = self.feature_names[idx]
            importance_pct = round((float(mean_shap[idx]) / float(total)) * 100.0, 2)
            ranking.append({
                "feature": str(feat),
                "display_name": FEATURE_DISPLAY_NAMES.get(feat, feat.replace("_", " ").title()),
                "mean_abs_shap": round(float(mean_shap[idx]), 4),
                "importance_pct": to_py(importance_pct)
            })

        return ranking

    def save(self, path=EXPLAINER_PATH):
        joblib.dump(self, path)
