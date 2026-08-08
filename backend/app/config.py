# backend/app/config.py

import os

# Port and server options
PORT = 8000
HOST = "0.0.0.0"

# Files path
DATA_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ROUTERS_CSV = os.path.join(DATA_DIR, "routers(in).csv")
METRICS_CSV = os.path.join(DATA_DIR, "metrics(in).csv")
COMPLAINTS_CSV = os.path.join(DATA_DIR, "COMPLA~1(in).csv")

# Minimum size for firmware/building peer cohort analysis
MIN_COHORT_SIZE = 3

# Configurable Health Scoring Weights
SCORING_WEIGHTS = {
    "latency": 0.25,
    "packet_loss": 0.25,
    "disconnects": 0.20,
    "speed": 0.10,
    "signal": 0.10,
    "device_load": 0.10
}

# Configurable Metric Ranges for Normalization (0-100 sub-scores)
# "invert": True means higher is worse (latency, packet loss, disconnects, device_load).
# "invert": False means higher is better (speed, signal).
METRIC_RANGES = {
    "latency": {"min_val": 15.0, "max_val": 100.0, "invert": True},
    "packet_loss": {"min_val": 0.2, "max_val": 3.0, "invert": True},
    "disconnects": {"min_val": 0.0, "max_val": 2.0, "invert": True},  # hourly average
    "speed": {"min_val": 15.0, "max_val": 60.0, "invert": False},
    "signal": {"min_val": -75.0, "max_val": -50.0, "invert": False},
    "device_load": {"min_val": 15.0, "max_val": 35.0, "invert": True}
}

# Status score thresholds
STATUS_THRESHOLDS = {
    "Healthy": 80,
    "Watch": 65,
    "At Risk": 50,
    "Critical": 0
}

# Deterministic Recommendation Mapping Rules
# Checks metric severity rankings and outputs recommended action and reason.
# Priorities are evaluated sequentially; first matching rule applies.
RECOMMENDATION_RULES = [
    {
        "name": "ap_placement",
        "action": "Investigate AP placement and coverage / local physical obstructions.",
        "reason": "The router exhibits severe signal degradation accompanied by high disconnect rates, indicating poor coverage or physical interference."
    },
    {
        "name": "cabling",
        "action": "Investigate physical cable connectivity and upstream network switch port.",
        "reason": "Elevated packet loss with stable signal strength suggests local network cabling or ethernet switch connection issues."
    },
    {
        "name": "capacity",
        "action": "Upgrade router to a higher-capacity model or load-balance device connections.",
        "reason": "High latency paired with an elevated connected device load indicates router capacity saturation."
    },
    {
        "name": "latency",
        "action": "Audit upstream ISP peering or perform a local gateway traceroute.",
        "reason": "Significant latency elevation with normal traffic characteristics suggests gateway congestion or external routing delays."
    },
    {
        "name": "power",
        "action": "Perform a power cycle and check for electrical power line instability.",
        "reason": "High disconnect frequency in the absence of signal loss typically points to router power supply issues or firmware reboots."
    },
    {
        "name": "default",
        "action": "Conduct a general network interface audit and restart the router.",
        "reason": "Performance parameters are showing overall deviation from baseline; a soft reset is recommended to clear temporary cache."
    }
]
