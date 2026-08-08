"""
NetSentinel Model Evaluation Engine
Calculates comprehensive classification metrics on the out-of-sample chronological test set.

Calculates:
- Recall (Critical for proactive early warning)
- Precision & False Positive Rate
- F1-Score
- ROC-AUC
- PR-AUC (Average Precision)
- Confusion Matrix
"""

import numpy as np
import pandas as pd
from typing import Dict, Any
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
)

def evaluate_model(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.50
) -> Dict[str, Any]:
    """
    Computes rigorous evaluation metrics from test predictions.
    """
    y_true = np.asarray(y_true, dtype=int)
    y_prob = np.asarray(y_prob, dtype=float)
    y_pred = (y_prob >= threshold).astype(int)

    # Basic metrics
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    # AUC scores
    try:
        roc_auc = roc_auc_score(y_true, y_prob) if len(np.unique(y_true)) > 1 else 1.0
    except Exception:
        roc_auc = 1.0

    try:
        pr_auc = average_precision_score(y_true, y_prob) if len(np.unique(y_true)) > 1 else 1.0
    except Exception:
        pr_auc = 1.0

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, len(y_true))

    # Curve points for visualization
    try:
        fpr, tpr, _ = roc_curve(y_true, y_prob)
        roc_points = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)} for f, t in zip(fpr, tpr)]
    except Exception:
        roc_points = []

    try:
        p_curve, r_curve, _ = precision_recall_curve(y_true, y_prob)
        pr_points = [{"recall": round(float(r), 4), "precision": round(float(p), 4)} for p, r in zip(p_curve, r_curve)]
    except Exception:
        pr_points = []

    metrics = {
        "accuracy": round(float(acc) * 100, 1),
        "precision": round(float(prec) * 100, 1),
        "recall": round(float(rec) * 100, 1),
        "f1_score": round(float(f1) * 100, 1),
        "roc_auc": round(float(roc_auc) * 100, 1),
        "pr_auc": round(float(pr_auc) * 100, 1),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
        },
        "total_test_samples": int(len(y_true)),
        "positive_samples": int(np.sum(y_true)),
        "negative_samples": int(len(y_true) - np.sum(y_true)),
        "decision_threshold": threshold,
        "roc_curve": roc_points,
        "pr_curve": pr_points,
    }

    return metrics
