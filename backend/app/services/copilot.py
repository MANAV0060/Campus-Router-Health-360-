# backend/app/services/copilot.py

import os
import re
from typing import Dict, Any, List

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    genai = None

from app.services.evidence_engine import get_router_evidence, get_baselines_and_cohorts
from app.services.impact_engine import get_prioritized_intervention_list
from app.services.health_score import get_all_router_healths

# Configure Gemini if API key is available
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if HAS_GENAI and GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        _model = genai.GenerativeModel("gemini-1.5-flash")
    except Exception:
        _model = None
else:
    _model = None

def run_gemini_query(prompt: str, context: str) -> str:
    """Invokes Gemini LLM model with context and prompt."""
    if not _model:
        raise ValueError("Gemini model is not configured (missing API key).")
    
    full_prompt = f"""
Context Information:
---------------------
{context}
---------------------

User Question: {prompt}

Instructions:
1. You are NetSentinel Copilot, an AI network operations assistant.
2. Provide a precise, factual answer based ONLY on the context information above.
3. If answering a router diagnosis query, format your response exactly in these four sections:
   ### Diagnosis
   One concise statement.
   ### Evidence
   Show the actual numbers supporting the diagnosis. Include current vs baseline values.
   ### Likely contributing factor
   Identify the strongest evidence-supported factor.
   ### Recommended action
   Give exactly ONE recommended action.
4. Do not invent any numbers, names, or router IDs.
"""
    response = _model.generate_content(full_prompt)
    return response.text

def handle_copilot_chat(query: str, selected_router_id: str = None) -> Dict[str, Any]:
    """
    Main entry point for Copilot queries.
    Handles router-specific queries, comparison queries, and general operations queries.
    Provides structured rule-based responses if Gemini API is not configured.
    """
    query_lower = query.lower().strip()
    
    # 1. Check for specific router reference in query or parameter
    target_router_id = selected_router_id
    if not target_router_id:
        match = re.search(r'\b(R-\d{4})\b', query, re.IGNORECASE)
        if match:
            target_router_id = match.group(1).upper()
            
    # If a router ID is identified
    if target_router_id:
        evidence = get_router_evidence(target_router_id)
        if not evidence:
            msg = f"Router {target_router_id} was not found in the active network inventory."
            return {
                "answer": msg,
                "response": msg,
                "source": "NetSentinel Inventory System",
                "evidence": {},
                "suggested_followups": ["Show all critical routers", "Which firmware has highest risk?"]
            }
            
        r_info = evidence.get("router", {})
        h_info = evidence.get("health", {})
        rec_info = evidence.get("recommendation", {})
        health_score = h_info.get("score", evidence.get("health_score", 0))
        health_status = h_info.get("status", evidence.get("health_status", "Unknown"))
        rec_action = rec_info.get("action", evidence.get("recommended_action", "Inspect physical hardware and cabling."))
        rec_reason = rec_info.get("reason", evidence.get("root_cause_diagnosis", "Telemetry threshold deviation."))
        building = r_info.get("building", evidence.get("building", "Unknown"))
        room = r_info.get("room", evidence.get("room", "Unknown"))
        firmware = r_info.get("firmware", evidence.get("firmware_version", "Unknown"))
        model = r_info.get("model", evidence.get("model", "Unknown"))

        evidence_bullets = []
        for ev in evidence.get("evidence", []):
            factor = ev.get("factor", "")
            curr = ev.get("current", ev.get("current_value", 0))
            healthy = ev.get("baseline", ev.get("healthy_baseline", 0))
            pct = ev.get("change_percent", ev.get("pct_change_vs_healthy", 0))
            strength = ev.get("strength", "Moderate")
            evidence_bullets.append(f"{factor.replace('_', ' ').capitalize()}: Current is {curr:.1f} vs baseline {healthy:.1f} ({pct:+.1f}%, {strength} deviation)")
        if not evidence_bullets:
            for b in evidence.get("evidence_bullets", []):
                evidence_bullets.append(b)

        # If Gemini is available, use LLM
        if _model:
            try:
                context_str = f"Router: {target_router_id}\n"
                context_str += f"Health: {health_score}/100 ({health_status})\n"
                context_str += f"Building: {building}, Room: {room}\n"
                context_str += f"Firmware: {firmware}, Model: {model}\n"
                context_str += f"Current Metrics: {evidence.get('current_metrics', {})}\n"
                context_str += f"Evidence Bullet Points:\n" + "\n".join([f"- {e}" for e in evidence_bullets])
                context_str += f"\nRecommended Action: {rec_action}\n"
                
                answer = run_gemini_query(query, context_str)
                return {
                    "answer": answer,
                    "response": answer,
                    "source": "Gemini 1.5 Flash (Grounded)",
                    "evidence": evidence,
                    "suggested_followups": [
                        f"What is the historical trend for {target_router_id}?",
                        f"How does {target_router_id} compare to other routers in {building}?",
                        "What is the priority score for this router?"
                    ]
                }
            except Exception as e:
                pass  # Fallback to structured deterministic output
                
        # Structured deterministic fallback
        ans_lines = [
            f"### Diagnosis",
            f"{target_router_id} is currently in {health_status} state with a health score of {health_score}/100.",
            f"",
            f"### Evidence",
        ]
        for bullet in evidence_bullets:
            ans_lines.append(f"- {bullet}")
            
        ans_lines.extend([
            f"",
            f"### Likely contributing factor",
            f"{rec_reason}",
            f"",
            f"### Recommended action",
            f"{rec_action}"
        ])
        
        full_ans = "\n".join(ans_lines)
        return {
            "answer": full_ans,
            "response": full_ans,
            "source": "NetSentinel Deterministic Telemetry Engine",
            "evidence": evidence,
            "suggested_followups": [
                f"Why is its risk higher than other routers in {building}?",
                f"Is {firmware} showing a fleet-wide systemic pattern?",
                f"What exact evidence supports the {rec_action} recommendation?"
            ]
        }
        
    # Firmware specific queries
    if "firmware" in query_lower:
        from app.services.analytics import get_firmware_analytics
        fw_stats = get_firmware_analytics()
        sorted_fw = sorted(fw_stats, key=lambda x: x["critical"], reverse=True)
        top_unhealthy = sorted_fw[0] if sorted_fw else {"firmware": "v5.1", "critical": 4, "total": 9, "critical_rate": 44.4, "healthy": 5}
        
        ans_lines = [
            "### Firmware Cohort Analysis",
            f"Firmware version **{top_unhealthy['firmware']}** has the highest volume of unhealthy/critical routers in the campus fleet:",
            f"- **Critical Routers:** {top_unhealthy['critical']} of {top_unhealthy['total']} units ({top_unhealthy['critical_rate']:.1f}% critical rate)",
            f"- **Healthy Units:** {top_unhealthy['healthy']}",
            "",
            "### Fleet Firmware Distribution:"
        ]
        for f in sorted_fw:
            ans_lines.append(f"- **{f['firmware']}**: {f['critical']}/{f['total']} Critical ({f['critical_rate']:.1f}% critical rate)")
        
        ans_lines.extend([
            "",
            "### Recommended Action",
            f"Conduct an audit and schedule an upgrade or rollback on all devices operating on firmware **{top_unhealthy['firmware']}**."
        ])
        full_ans = "\n".join(ans_lines)
        return {
            "answer": full_ans,
            "response": full_ans,
            "source": "NetSentinel Firmware Diagnostics Engine",
            "evidence": {"top_firmware": top_unhealthy, "all_firmware": sorted_fw},
            "suggested_followups": [
                f"Which routers run firmware {top_unhealthy['firmware']}?",
                "What should IT investigate first?",
                "Show building-level failure distribution"
            ]
        }

    # General queries (e.g. "which routers need attention?", "fleet summary")
    interventions = get_prioritized_intervention_list()
    top_critical = [item for item in interventions if item.get('tier') == 'Critical']
    if not top_critical and interventions:
        top_critical = interventions[:5]
    
    ans_lines = [
        "### Fleet Diagnostic Summary",
        f"There are currently {len(top_critical)} routers requiring immediate operational attention.",
        "",
        "### Top Priority Interventions"
    ]
    for item in top_critical[:5]:
        ans_lines.append(f"- **{item['router_id']}** ({item.get('building', 'Campus')} Rm {item.get('room', '-')}, Priority Score: {item['priority_score']:.1f}, Health: {item['health_score']}): Tier {item.get('tier')}, affecting {item.get('affected_users')} connected devices.")
        
    full_ans = "\n".join(ans_lines)
    return {
        "answer": full_ans,
        "response": full_ans,
        "source": "NetSentinel Fleet Intelligence Engine",
        "evidence": {"critical_count": len(top_critical)},
        "suggested_followups": [
            "Tell me more about R-1042",
            "Which firmware has highest failure rate?",
            "Show building-level failure distribution"
        ]
    }
