# backend/app/services/data_loader.py

import os
import pandas as pd
from app.config import ROUTERS_CSV, METRICS_CSV, COMPLAINTS_CSV

_cache = {
    "routers": None,
    "metrics": None,
    "complaints": None
}

def clean_df_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Helper to strip whitespace from headers and string values."""
    df.columns = [c.strip() for c in df.columns]
    for col in df.select_dtypes(include=['object']):
        df[col] = df[col].astype(str).str.strip()
    return df

def load_routers() -> pd.DataFrame:
    global _cache
    if _cache["routers"] is not None:
        return _cache["routers"]
    
    if not os.path.exists(ROUTERS_CSV):
        raise FileNotFoundError(f"Routers metadata CSV not found at {ROUTERS_CSV}")
        
    df = pd.read_csv(ROUTERS_CSV)
    df = clean_df_columns(df)
    # Parse issue_date if available
    if "issue_date" in df.columns:
        df["issue_date"] = pd.to_datetime(df["issue_date"], errors="coerce")
    
    _cache["routers"] = df
    return df

def load_metrics() -> pd.DataFrame:
    global _cache
    if _cache["metrics"] is not None:
        return _cache["metrics"]
        
    if not os.path.exists(METRICS_CSV):
        raise FileNotFoundError(f"Metrics CSV not found at {METRICS_CSV}")
        
    df = pd.read_csv(METRICS_CSV)
    df = clean_df_columns(df)
    
    # Parse hour timestamp
    if "hour" in df.columns:
        df["hour"] = pd.to_datetime(df["hour"], errors="coerce")
        
    # Ensure numeric columns are properly typed
    numeric_cols = ["avg_speed_mbps", "latency_ms", "packet_loss_pct", "disconnects", "connected_devices", "signal_dbm"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
            
    _cache["metrics"] = df
    return df

def load_complaints() -> pd.DataFrame:
    global _cache
    if _cache["complaints"] is not None:
        return _cache["complaints"]
        
    if not os.path.exists(COMPLAINTS_CSV):
        # Gracefully handle missing complaints file by creating an empty dataframe
        df = pd.DataFrame(columns=["ticket_id", "router_id", "date", "complaint_text"])
    else:
        df = pd.read_csv(COMPLAINTS_CSV)
        df = clean_df_columns(df)
        if "date" in df.columns:
            df["date"] = pd.to_datetime(df["date"], errors="coerce")
            
    _cache["complaints"] = df
    return df

def reload_data():
    """Clears the internal cache and forces reload from disk."""
    global _cache
    _cache["routers"] = None
    _cache["metrics"] = None
    _cache["complaints"] = None
    load_routers()
    load_metrics()
    load_complaints()
