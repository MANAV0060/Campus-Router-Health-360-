"""
NetSentinel Master Training Pipeline
Loads raw CSV data, computes transparent health scores, generates supervised target labels,
extracts temporal features, executes chronological train/val/test splits, and trains the model.
"""

import sys
import os
import json
import pandas as pd
import numpy as np

# Ensure root workspace is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.config import (
    ROUTERS_CSV,
    METRICS_CSV,
    COMPLAINTS_CSV,
    PROCESSED_DATA_DIR,
)
from ml.create_labels import create_future_degradation_target
from ml.feature_engineering import extract_router_features
from ml.train import train_model

def run_pipeline():
    print("=" * 65)
    print("  NETSENTINEL: PREDICTIVE NETWORK OPERATIONS TRAINING PIPELINE")
    print("=" * 65)

    # 1. Load Raw Datasets
    print(f"Loading raw datasets from {ROUTERS_CSV.parent}...")
    if not ROUTERS_CSV.exists() or not METRICS_CSV.exists():
        raise FileNotFoundError(f"Missing raw CSV files. Ensure {ROUTERS_CSV} and {METRICS_CSV} exist.")

    routers_df = pd.read_csv(ROUTERS_CSV)
    metrics_df = pd.read_csv(METRICS_CSV)
    complaints_df = pd.read_csv(COMPLAINTS_CSV) if COMPLAINTS_CSV.exists() else None

    print(f"Routers: {len(routers_df)} | Metrics: {len(metrics_df)} rows | Complaints: {len(complaints_df) if complaints_df is not None else 0}")

    # 2. Supervised Target Label Generation (Strict Zero Data Leakage)
    print("Generating supervised target: future_degradation (next 24h)...")
    labeled_metrics_df = create_future_degradation_target(metrics_df)

    pos_target_count = labeled_metrics_df["future_degradation"].sum()
    total_target_count = len(labeled_metrics_df)
    print(f"Target Label Distribution -> Positive (Degradation in next 24h): {pos_target_count} ({round(pos_target_count/total_target_count*100, 1)}%) | Negative: {total_target_count - pos_target_count}")

    # 3. Temporal Feature Engineering (3h, 6h, 12h, 24h Rolling Windows)
    print("Extracting multi-window temporal, trajectory, and contextual features...")
    feat_df = extract_router_features(
        metrics_df=labeled_metrics_df,
        routers_df=routers_df,
        complaints_df=complaints_df
    )
    print(f"Engineered Feature Matrix Shape: {feat_df.shape}")

    # Save processed features
    processed_features_path = PROCESSED_DATA_DIR / "engineered_features.csv"
    feat_df.to_csv(processed_features_path, index=False)
    print(f"Saved processed features to {processed_features_path}")

    # 4. Train Model & Save Artifacts
    print("Training XGBoost Classifier & Isolation Forest with Chronological Splitting...")
    results = train_model(feat_df, routers_df=routers_df, complaints_df=complaints_df)

    print("=" * 65)
    print("  TRAINING PIPELINE COMPLETE")
    print(f"  Accuracy:  {results['metrics']['accuracy']}%")
    print(f"  Recall:    {results['metrics']['recall']}%")
    print(f"  Precision: {results['metrics']['precision']}%")
    print(f"  F1-Score:  {results['metrics']['f1_score']}%")
    print(f"  ROC-AUC:   {results['metrics']['roc_auc']}%")
    print("=" * 65)

    return results

if __name__ == "__main__":
    run_pipeline()
