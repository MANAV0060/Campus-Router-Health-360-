# backend/verify_backend.py

import os
import sys

# Add backend root to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.data_loader import reload_data, load_routers, load_metrics
from app.services.health_score import get_all_router_healths
from app.services.evidence_engine import get_router_evidence
from app.services.impact_engine import get_prioritized_intervention_list
from app.services.copilot import handle_copilot_chat

def main():
    print("=== NetSentinel Service & Telemetry Verification ===")
    
    # 1. Reload data
    print("\n[1] Loading CSV Datasets...")
    reload_data()
    routers_df = load_routers()
    metrics_df = load_metrics()
    print(f"    Loaded {len(routers_df)} routers metadata entries.")
    print(f"    Loaded {len(metrics_df)} metrics hourly entries.")
    
    # 2. Test Health Calculation
    print("\n[2] Calculating Router Health Scores...")
    healths = get_all_router_healths()
    print(f"    Calculated health for {len(healths)} routers.")
    
    critical_routers = [rid for rid, h in healths.items() if h["status"] == "Critical"]
    healthy_routers = [rid for rid, h in healths.items() if h["status"] == "Healthy"]
    print(f"    Healthy routers: {len(healthy_routers)}")
    print(f"    Critical routers: {len(critical_routers)} -> {critical_routers}")
    
    # Assert R-1042 is critical
    assert "R-1042" in critical_routers, "Error: R-1042 should be Critical!"
    print("    R-1042 is correctly classified as Critical.")
    
    # 3. Test Evidence Engine
    print("\n[3] Generating Evidence for R-1042...")
    evidence = get_router_evidence("R-1042")
    print(f"    Router: {evidence['router']['id']}")
    print(f"    Building: {evidence['router']['building']}, Model: {evidence['router']['model']}, Firmware: {evidence['router']['firmware']}")
    print(f"    Calculated Health: {evidence['health']['score']} ({evidence['health']['status']})")
    
    # Check 3 baselines
    print("\n    Three-tier Latency Baselines for R-1042:")
    print(f"      Current Latency: {evidence['current_metrics']['latency']:.1f} ms")
    print(f"      Global Baseline: {evidence['baselines']['global']['latency']:.1f} ms")
    print(f"      Peer Baseline:   {evidence['baselines']['peer']['latency']:.1f} ms")
    print(f"      Healthy Baseline: {evidence['baselines']['healthy']['latency']:.1f} ms")
    
    # Check trends
    print(f"\n    Temporal Latency Trend: Now: {evidence['trends']['latency']['now']:.1f} | 6h: {evidence['trends']['latency']['6h']:.1f} | 12h: {evidence['trends']['latency']['12h']:.1f} | 24h: {evidence['trends']['latency']['24h']:.1f}")
    
    # Check evidence indicators
    print("\n    Contributing Factors (Sorted by Evidence Score):")
    for ev in evidence["evidence"]:
        print(f"      - {ev['factor']}: Strength={ev['strength']}, Score={ev['score']}, Current={ev['current']}, Base={ev['baseline']}, Change={ev['change_percent']}%")
        
    print(f"\n    Deterministic Recommendation:")
    print(f"      Action: {evidence['recommendation']['action']}")
    print(f"      Reason: {evidence['recommendation']['reason']}")
    
    # 4. Test Impact Engine
    print("\n[4] Testing Priority Intervention Queue...")
    priority_list = get_prioritized_intervention_list()
    print("    Intervention queue order:")
    for idx, p in enumerate(priority_list[:5]):
        print(f"      {idx+1}. {p['router_id']} ({p['building']}) - Priority Score: {p['priority_score']:.1f} (Tier: {p['tier']}, Health: {p['health_score']})")
        
    # 5. Test Copilot Fallback
    print("\n[5] Testing AI Copilot Queries (Fallback Mode)...")
    
    q1 = "Why is R-1042 unhealthy?"
    print(f"\n    Q: '{q1}'")
    r1 = handle_copilot_chat(q1)
    print(f"    Source: {r1['source']}")
    print(f"    A:\n{r1['response']}")
    
    q2 = "Which firmware version has the most unhealthy routers?"
    print(f"\n    Q: '{q2}'")
    r2 = handle_copilot_chat(q2)
    print(f"    Source: {r2['source']}")
    print(f"    A:\n{r2['response']}")
    
    print("\n=== Verification Successful! ===")

if __name__ == "__main__":
    main()
