"""
NetSentinel ML Configuration & Constants
Defines health score weights, normalization baselines, model hyperparameters, and operational priority formulas.
"""

import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
ML_DIR = BASE_DIR / "ml"
ARTIFACTS_DIR = ML_DIR / "artifacts"

# Ensure directories exist
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

# Data paths
ROUTERS_CSV = RAW_DATA_DIR / "routers.csv"
METRICS_CSV = RAW_DATA_DIR / "metrics.csv"
COMPLAINTS_CSV = RAW_DATA_DIR / "complaints.csv"

# Model artifact paths
MODEL_PATH = ARTIFACTS_DIR / "model.pkl"
ANOMALY_MODEL_PATH = ARTIFACTS_DIR / "anomaly_model.pkl"
EXPLAINER_PATH = ARTIFACTS_DIR / "shap_explainer.pkl"
METRICS_OUTPUT_PATH = ARTIFACTS_DIR / "evaluation_metrics.json"
FLEET_PATTERNS_PATH = ARTIFACTS_DIR / "fleet_patterns.json"
ROUTER_PREDICTIONS_PATH = ARTIFACTS_DIR / "router_predictions.json"
FEATURE_NAMES_PATH = ARTIFACTS_DIR / "feature_names.json"

# Health Score Formula Weights (Sum = 1.00)
# Documented in README & UI:
# - Packet Loss: 25% (Critical reliability metric)
# - Latency: 25% (Interactive performance)
# - Speed: 20% (Bandwidth throughput quality)
# - Disconnects: 15% (Connection stability)
# - Signal Strength: 10% (RF environment quality)
# - Device Load Factor: 5% penalty modifier
HEALTH_WEIGHTS = {
    "speed": 0.20,
    "latency": 0.25,
    "packet_loss": 0.25,
    "disconnects": 0.15,
    "signal": 0.10,
    "load_factor": 0.05,
}

# Metric Normalization Baselines
SPEED_BASELINE_MBPS = 50.0  # 50+ Mbps is considered 100% throughput quality
LATENCY_OPTIMAL_MS = 20.0   # <= 20ms is 100% quality
LATENCY_MAX_PENALTY_MS = 120.0 # >= 120ms drops latency quality to near 0
PACKET_LOSS_MAX_PENALTY_PCT = 5.0 # >= 5% packet loss drops quality to 0
DISCONNECTS_MAX_PENALTY = 4.0 # >= 4 disconnects/hr drops quality to 0
SIGNAL_MIN_DBM = -85.0     # -85 dBm or worse is 0% signal quality
SIGNAL_MAX_DBM = -40.0     # -40 dBm or better is 100% signal quality

# Health State Thresholds (0-100 scale)
HEALTH_THRESHOLDS = {
    "HEALTHY": 80.0,    # 80 - 100
    "WATCH": 60.0,      # 60 - 79 (Moderate)
    "AT_RISK": 40.0,    # 40 - 59
    "CRITICAL": 0.0,    # 0 - 39
}

# Supervised Target Construction Parameters
# Target definition: Router enters degraded state (Health < 60) in future 24 hours
TARGET_FUTURE_WINDOW_HOURS = 24
TARGET_DEGRADED_HEALTH_THRESHOLD = 60.0
TARGET_SUSTAINED_HOURS = 2 # At least 2 hours below threshold or single critical drop (<40)

# Rolling Window Configurations for Feature Engineering
ROLLING_WINDOWS = [3, 6, 12, 24]

# Chronological Split Ratios (Strict Zero Data Leakage)
TRAIN_RATIO = 0.70
VAL_RATIO = 0.15
TEST_RATIO = 0.15

# Priority Score Formula Weights
PRIORITY_WEIGHTS = {
    "future_risk": 0.45,       # P(degradation) * 100
    "current_severity": 0.25,  # (100 - Current Health)
    "user_impact": 0.20,      # Connected devices normalized
    "anomaly_severity": 0.10, # Anomaly score * 100
}
