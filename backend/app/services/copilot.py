# backend/app/services/copilot.py

import os
import re
from typing import Dict, Any, List
import google.generativeai as genai
from app.services.evidence_engine import get_router_evidence, get_baselines_and_cohorts
from app.services.impact_engine import get_prioritized_intervention_list
from app.services.health_score import get_all_router_healths

# Configure Gemini if API key is available
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Use standard gemini model
    _model = genai.GenerativeModel("gemini-1.5-flash")
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
5. If the context does not contain the answer, say 'I cannot answer that based on the available data.'
"""
    response = _model.generate_content(full_prompt)
    return response.text

def run_deterministic_fallback(prompt: str) -> str:
    """Deterministic fallback when LLM is unavailable."""
    prompt_lower = prompt.lower()
    
    # 1. Check for specific router ID, e.g., R-1042, R-1002
    router_match = re.search(r"r-\d{4}", prompt_lower)
    if router_match:
        router_id = router_match.group(0).upper()
        try:
            evidence = get_router_evidence(router_id)
            status = evidence["health"]["status"]
            score = evidence["health"]["score"]
            
            # Format evidence list
            ev_points = []
            primary_factor_desc = ""
            for item in evidence["evidence"]:
                factor = item["factor"].replace("_", " ").title()
                curr = item["current"]
                base = item["baseline"]
                change = item["change_percent"]
                
                # Custom verbal representations
                if item["factor"] == "latency":
                    ev_points.append(f"• Latency is {curr} ms, compared with a {base} ms baseline.")
                elif item["factor"] == "packet_loss":
                    ev_points.append(f"• Packet loss is {curr}%, compared with a {base}% baseline.")
                elif item["factor"] == "disconnects":
                    ev_points.append(f"• Disconnects are {int(curr)} total, compared with a {int(base)} baseline.")
                elif item["factor"] == "signal":
                    ev_points.append(f"• Signal strength is {curr} dBm, compared with a {base} dBm baseline.")
                elif item["factor"] == "speed":
                    ev_points.append(f"• Speed decreased to {curr} Mbps, compared with a {base} Mbps baseline.")
                elif item["factor"] == "device_load":
                    ev_points.append(f"• Connected devices average {curr}, compared with a {base} baseline.")
                elif item["factor"] == "firmware_cohort":
                    ev_points.append(f"• Firmware cohort exhibits a {curr}% critical-router rate, compared with a campus baseline of {base}%.")
            
            if evidence["evidence"]:
                top_factor = evidence["evidence"][0]
                factor_name = top_factor["factor"].replace("_", " ").title()
                primary_factor_desc = f"{factor_name} is the strongest observed degradation signal."
            else:
                primary_factor_desc = "No major metric degradation is observed."
                
            rec_action = evidence["recommendation"]["action"]
            
            # Format into the strict diagnosis structure
            return f"""### Diagnosis
{router_id} is experiencing network degradation, currently classified as {status.upper()} (Health Score: {score}/100).

### Evidence
{chr(10).join(ev_points)}

### Likely contributing factor
{primary_factor_desc}

### Recommended action
{rec_action}"""
            
        except Exception as e:
            return f"I encountered an error retrieving data for router {router_id}: {str(e)}"
            
    # 2. Check for building cohort questions, e.g., "Hostel B", "Library"
    buildings = ["hostel-a", "hostel-b", "library", "lab-complex", "main-block", "staff-qtrs"]
    matched_building = None
    for b in buildings:
        # standard matches with or without hyphens
        if b in prompt_lower or b.replace("-", " ") in prompt_lower:
            matched_building = b
            break
            
    if matched_building:
        health_data = get_all_router_healths()
        b_name = matched_building.replace("-", " ").title()
        # Find routers in building
        building_routers = [h for h in health_data.values() if h.get("building", "").lower() == matched_building]
        if not building_routers:
            # try fuzzy matching
            building_routers = [h for h in health_data.values() if matched_building.split("-")[0] in h.get("building", "").lower()]
            if building_routers:
                b_name = building_routers[0].get("building")
                
        if building_routers:
            total_r = len(building_routers)
            critical_r = [r for r in building_routers if r["status"] == "Critical"]
            watch_r = [r for r in building_routers if r["status"] == "Watch"]
            at_risk_r = [r for r in building_routers if r["status"] == "At Risk"]
            
            summary = f"Building **{b_name}** has {total_r} active routers.\n"
            summary += f"- Critical: {len(critical_r)}\n"
            summary += f"- Healthy: {total_r - len(critical_r) - len(watch_r) - len(at_risk_r)}\n\n"
            
            if critical_r:
                summary += "The following critical routers require immediate attention:\n"
                for cr in critical_r:
                    # Let's see issues
                    ev_pkg = get_router_evidence(cr["router_id"])
                    top_issues = [f"{e['factor'].replace('_', ' ')} ({e['strength']})" for e in ev_pkg["evidence"][:2]]
                    summary += f"- **{cr['router_id']}** (Health: {cr['health_score']}/100) — Primary issues: {', '.join(top_issues)}. Action: {ev_pkg['recommendation']['action']}\n"
            else:
                summary += "All routers in this building are currently performing within healthy operational limits."
            return summary

    # 3. Check for firmware performance questions
    if "firmware" in prompt_lower:
        health_data = get_all_router_healths()
        firmwares = {}
        for rid, h in health_data.items():
            fw = h.get("firmware", "Unknown")
            if fw not in firmwares:
                firmwares[fw] = {"total": 0, "critical": 0}
            firmwares[fw]["total"] += 1
            if h["status"] == "Critical":
                firmwares[fw]["critical"] += 1
                
        # Sort by number of critical, then by critical rate
        sorted_fw = sorted(firmwares.items(), key=lambda x: (x[1]["critical"], x[1]["critical"]/x[1]["total"] if x[1]["total"] > 0 else 0), reverse=True)
        
        response = "### Firmware Performance Audit\n\n"
        response += "Here is the critical-router rate grouped by firmware version across the campus network:\n\n"
        for fw, stats in sorted_fw:
            rate = (stats["critical"] / stats["total"]) * 100
            response += f"- **Firmware {fw}**: {stats['critical']} Critical / {stats['total']} Total ({rate:.1f}% Critical-router rate)\n"
            
        top_fw = sorted_fw[0][0]
        top_rate = (sorted_fw[0][1]["critical"] / sorted_fw[0][1]["total"]) * 100
        if sorted_fw[0][1]["critical"] > 0:
            response += f"\n**Conclusion**: Firmware **{top_fw}** is associated with the highest proportion of critical routers, with a {top_rate:.1f}% critical-router rate. Fleet update or rollback should be investigated."
        else:
            response += "\n**Conclusion**: All firmware versions are currently operating with 100% healthy profiles."
        return response

    # 4. Check for IT Priority list questions
    if "investigate first" in prompt_lower or "priority" in prompt_lower or "worst routers" in prompt_lower:
        priorities = get_prioritized_intervention_list()
        if not priorities:
            return "All routers are healthy. There are no critical interventions required at this time."
            
        response = "### IT Intervention Priority Queue (Priority Score Rank)\n\n"
        response += "Here are the top routers requiring troubleshooting, prioritized by severity, user impact, and evidence strength:\n\n"
        
        for idx, pr in enumerate(priorities[:5]):
            response += f"{idx+1}. **{pr['router_id']}** ({pr['building']}, Room {pr['room']})\n"
            response += f"   - **Priority Tier**: {pr['tier']} (Score: {pr['priority_score']})\n"
            response += f"   - **Health**: {pr['health_score']}/100 ({pr['status']})\n"
            response += f"   - **Impacted Users**: {pr['affected_users']} average connected devices\n"
            
            ev_pkg = get_router_evidence(pr["router_id"])
            rec = ev_pkg["recommendation"]["action"]
            reason = ev_pkg["recommendation"]["reason"]
            response += f"   - **Recommended Action**: {rec}\n"
            response += f"   - **Reason**: {reason}\n\n"
            
        return response

    # Default general response
    return """I am NetSentinel Copilot, your campus network operations assistant. I can help you analyze the router datasets.

You can ask me questions such as:
1. "Why is R-1042 unhealthy?"
2. "What is wrong with the routers in Hostel B?"
3. "Which firmware version has the most unhealthy routers?"
4. "What should IT investigate first?"
"""

def handle_copilot_chat(query: str) -> Dict[str, Any]:
    """
    Main entry point for API copilot queries.
    Assembles context if necessary and calls Gemini (falling back to deterministic generator if not configured).
    """
    try:
        # Try LLM if configured
        if GEMINI_API_KEY and _model:
            # Build context dynamically
            baselines_info = get_baselines_and_cohorts()
            health_data = baselines_info["health_data"]
            global_b = baselines_info["global"]
            healthy_b = baselines_info["healthy"]
            
            # Simple keyword matching to limit context size
            context_pieces = []
            
            # 1. Router ID context
            router_match = re.search(r"r-\d{4}", query.lower())
            if router_match:
                router_id = router_match.group(0).upper()
                if router_id in health_data:
                    evidence = get_router_evidence(router_id)
                    context_pieces.append(f"Router {router_id} Details: {str(evidence)}")
            
            # 2. Building context
            buildings = ["hostel-a", "hostel-b", "library", "lab-complex", "main-block", "staff-qtrs"]
            matched_b = next((b for b in buildings if b in query.lower() or b.replace("-", " ") in query.lower()), None)
            if matched_b:
                b_routers = [h for h in health_data.values() if h.get("building", "").lower() == matched_b]
                context_pieces.append(f"Routers in building {matched_b}: {str(b_routers)}")
                
            # 3. General firmware cohort rates
            if "firmware" in query.lower():
                fw_stats = {}
                for rid, h in health_data.items():
                    fw = h.get("firmware", "Unknown")
                    if fw not in fw_stats:
                        fw_stats[fw] = {"total": 0, "critical": 0}
                    fw_stats[fw]["total"] += 1
                    if h["status"] == "Critical":
                        fw_stats[fw]["critical"] += 1
                context_pieces.append(f"Firmware Performance Stats (Total/Critical): {str(fw_stats)}")
                
            # 4. IT Priorities
            if "investigate" in query.lower() or "priority" in query.lower() or "worst" in query.lower():
                priorities = get_prioritized_intervention_list()
                context_pieces.append(f"Top degraded routers priority queue: {str(priorities[:8])}")
                
            # Fallback general context if nothing matched
            if not context_pieces:
                # Add basic statistics
                total_routers = len(health_data)
                critical_routers = [rid for rid, h in health_data.items() if h["status"] == "Critical"]
                context_pieces.append(f"General Campus Summary: {total_routers} total routers, {len(critical_routers)} critical status routers. Critical router IDs: {critical_routers}")
            
            context_str = "\n\n".join(context_pieces)
            ai_response = run_gemini_query(query, context_str)
            return {
                "query": query,
                "response": ai_response,
                "source": "Gemini-1.5-Flash"
            }
    except Exception as e:
        # Log error internally and use deterministic generator
        pass
        
    # Run deterministic fallback
    fallback_response = run_deterministic_fallback(query)
    return {
        "query": query,
        "response": fallback_response,
        "source": "Deterministic-Fallback"
    }
