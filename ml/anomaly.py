"""
NetSentinel Unsupervised Anomaly Detection Layer
Detects unusual, out-of-distribution router behavior using IsolationForest.

IMPORTANT DISTINCTION:
- Future Degradation Probability: Supervised P(future_degradation = 1 in next 24h)
- Anomaly Score: Unsupervised divergence from fleet baseline behavior
"""

import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from ml.config import ANOMALY_MODEL_PATH

ANOMALY_FEATURE_COLS = [
    "speed_now",
    "latency_now",
    "packet_loss_now",
    "disconnects_now",
    "signal_now",
    "devices_now",
    "latency_slope_6h",
    "packet_loss_slope_6h",
    "disconnect_slope_6h",
    "devices_slope_6h",
]

class AnomalyDetector:
    def __init__(self, contamination: float = 0.08, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            contamination=contamination,
            random_state=random_state,
            n_estimators=100,
            max_samples="auto"
        )
        self.scaler = StandardScaler()
        self.feature_cols = ANOMALY_FEATURE_COLS

    def fit(self, df: pd.DataFrame) -> "AnomalyDetector":
        """Fits Isolation Forest on selected fleet performance features."""
        avail_cols = [c for c in self.feature_cols if c in df.columns]
        X = df[avail_cols].fillna(0).values
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled)
        return self

    def predict(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Returns:
          is_anomaly: boolean array (True if anomalous, False if normal)
          anomaly_score: float array in [0, 1] (higher = more anomalous)
        """
        avail_cols = [c for c in self.feature_cols if c in df.columns]
        X = df[avail_cols].fillna(0).values
        X_scaled = self.scaler.transform(X)

        # IsolationForest decision_function: lower means more anomalous
        raw_scores = self.model.decision_function(X_scaled)
        # Normalize into [0, 1] where 1 is highest anomaly severity
        score_min, score_max = np.min(raw_scores), np.max(raw_scores)
        if score_max > score_min:
            normalized_scores = 1.0 - (raw_scores - score_min) / (score_max - score_min)
        else:
            normalized_scores = np.zeros_like(raw_scores)

        preds = self.model.predict(X_scaled)
        is_anomaly = preds == -1

        return is_anomaly, np.round(normalized_scores, 3)

    def save(self, filepath=ANOMALY_MODEL_PATH):
        joblib.dump({
            "model": self.model,
            "scaler": self.scaler,
            "feature_cols": self.feature_cols,
        }, filepath)

    @classmethod
    def load(cls, filepath=ANOMALY_MODEL_PATH) -> "AnomalyDetector":
        data = joblib.load(filepath)
        instance = cls()
        instance.model = data["model"]
        instance.scaler = data["scaler"]
        instance.feature_cols = data["feature_cols"]
        return instance
