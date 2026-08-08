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
            return {
                "answer": f"Router {target_router_id} was not found in the active network inventory.",
                "evidence": {},
                "suggested_followups": ["Show all critical routers", "Which firmware has highest risk?"]
            }
            
        # If Gemini is available, use LLM
        if _model:
            try:
                context_str = f"Router: {target_router_id}\n"
                context_str += f"Health: {evidence.get('health_score')}/100 ({evidence.get('health_status')})\n"
                context_str += f"Building: {evidence.get('building')}, Room: {evidence.get('room')}\n"
                context_str += f"Firmware: {evidence.get('firmware_version')}, Model: {evidence.get('model')}\n"
                context_str += f"Metrics: {evidence.get('metrics')}\n"
                context_str += f"Evidence Bullet Points:\n" + "\n".join([f"- {e}" for e in evidence.get('evidence_bullets', [])])
                context_str += f"\nRecommended Action: {evidence.get('recommended_action')}\n"
                
                answer = run_gemini_query(query, context_str)
                return {
                    "answer": answer,
                    "evidence": evidence,
                    "suggested_followups": [
                        f"What is the historical trend for {target_router_id}?",
                        f"How does {target_router_id} compare to other routers in {evidence.get('building')}?",
                        "What is the priority score for this router?"
                    ]
                }
            except Exception as e:
                pass  # Fallback to structured deterministic output
                
        # Structured deterministic fallback
        ans_lines = [
            f"### Diagnosis",
            f"{target_router_id} is currently in {evidence.get('health_status')} state with a health score of {evidence.get('health_score')}/100.",
            f"",
            f"### Evidence",
        ]
        for bullet in evidence.get('evidence_bullets', []):
            ans_lines.append(f"- {bullet}")
            
        ans_lines.extend([
            f"",
            f"### Likely contributing factor",
            f"{evidence.get('root_cause_diagnosis', 'Network degradation signature')}",
            f"",
            f"### Recommended action",
            f"{evidence.get('recommended_action')}"
        ])
        
        return {
            "answer": "\n".join(ans_lines),
            "evidence": evidence,
            "suggested_followups": [
                f"Why is its risk higher than other routers in {evidence.get('building')}?",
                f"Is {evidence.get('firmware_version')} showing a fleet-wide systemic pattern?",
                f"What exact evidence supports the {evidence.get('recommended_action')} recommendation?"
            ]
        }
        
    # General queries (e.g. "which routers need attention?", "fleet summary")
    interventions = get_prioritized_intervention_list()
    top_critical = [item for item in interventions if item.get('priority_level') == 'CRITICAL'][:5]
    
    ans_lines = [
        "### Fleet Diagnostic Summary",
        f"There are currently {len(top_critical)} routers requiring immediate operational attention.",
        "",
        "### Top Priority Interventions"
    ]
    for item in top_critical:
        ans_lines.append(f"- **{item['router_id']}** (Priority: {item['priority_score']}, Health: {item['current_health']}): {item['recommended_action']}")
        
    return {
        "answer": "\n".join(ans_lines),
        "evidence": {"critical_count": len(top_critical)},
        "suggested_followups": [
            "Tell me more about R-1042",
            "Which firmware has highest failure rate?",
            "Show building-level failure distribution"
        ]
    }
