# backend/app/services/predictive_copilot_service.py

"""
NetSentinel Grounded AI Copilot Service (Predictive Component)
Synthesizes technical evidence, ML SHAP attributions, metric trajectories, and fleet patterns
into concise, authoritative network operations explanations without hallucinations.
"""

from typing import Dict, Any, List, Optional
from app.services.predictive_router_service import router_service

class CopilotService:
    def answer_query(self, question: str, router_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Grounded inference engine that maps questions to calculated backend evidence.
        """
        q_lower = question.lower().strip()
        
        # If router_id is not specified in payload, try detecting it in question text (e.g. "R-1042")
        if not router_id:
            for rid in router_service.predictions.keys():
                if rid.lower() in q_lower:
                    router_id = rid
                    break

        if router_id and router_id in router_service.predictions:
            detail = router_service.get_router_detail(router_id)
            return self._answer_router_query(q_lower, detail)
        else:
            return self._answer_fleet_query(q_lower)

    def _answer_router_query(self, query: str, router: Dict[str, Any]) -> Dict[str, Any]:
        rid = router["router_id"]
        health = router["current_health"]
        risk_pct = router["future_risk_pct"]
        health_status = router["health_status"]
        rec_action = router["recommended_action"]
        root_cause = router["root_cause"]
        firmware = router["firmware_version"]
        building = router["building"]
        top_contribs = router.get("top_contributors", [])
        evidence_list = router.get("evidence", [])
        bench = router.get("fleet_benchmark", {})
        fw_bench = bench.get("same_firmware", {})

        # Top 3 SHAP contributor formatted string
        top_factors = []
        for c in top_contribs[:3]:
            top_factors.append(f"{c['display_name']} ({c['contribution_pct']}% attribution)")
        factors_str = ", ".join(top_factors) if top_factors else "multi-metric temporal trajectory"

        structured_evidence = {
            "router_id": rid,
            "current_health": health,
            "health_status": health_status,
            "future_degradation_prob": router["future_degradation_prob"],
            "future_risk_pct": risk_pct,
            "priority_score": router["priority_score"],
            "priority_level": router["priority_level"],
            "root_cause": root_cause,
            "evidence": evidence_list,
            "top_contributors": top_contribs,
            "recommended_action": rec_action,
            "firmware_version": firmware,
            "building": building,
            "is_anomaly": router["is_anomaly"],
            "anomaly_score": router["anomaly_score"],
            "metrics_now": router["metrics_now"],
            "metric_slopes": router["metric_slopes"],
            "complaints_count": len(router.get("complaints", [])),
        }

        # 1. "Why is this router at risk?" or general degradation risk
        if "why" in query or "risk" in query or "reason" in query:
            ans = (
                f"{rid} currently exhibits an operational Health Score of {health}/100 ({health_status}), "
                f"but our trained XGBoost model projects a {risk_pct}% probability of entering a degraded state in the next 24 hours. "
                f"The primary risk contributors identified by SHAP are: {factors_str}. "
                f"Recent trajectory analysis indicates: {'; '.join(evidence_list)}. "
                f"Recommended preventive action: {rec_action}."
            )
            followups = [
                f"Why is its risk higher than other routers in {building}?",
                f"Is {firmware} showing a fleet-wide systemic pattern?",
                f"What exact evidence supports the {rec_action} recommendation?"
            ]

        # 2. Fleet pattern or firmware question
        elif "pattern" in query or "firmware" in query or "systemic" in query or "compare" in query:
            fw_risk_rate = fw_bench.get("risk_rate_pct", 0)
            ans = (
                f"{rid} operates on firmware {firmware} in {building}. "
                f"Across the campus fleet, routers on firmware {firmware} have a {fw_risk_rate}% degradation risk rate "
                f"({fw_bench.get('high_risk_count', 0)} of {fw_bench.get('count', 0)} routers at elevated risk). "
                f"Root cause classification: '{root_cause}'. "
                f"Note: This reflects a strong statistical correlation with recent network load. {rec_action} is advised."
            )
            followups = [
                f"Why is {rid} predicted to degrade in the next 24 hours?",
                f"Show the 24-hour metric trends for {rid}.",
                f"How was the priority score calculated for {rid}?"
            ]

        # 3. Evidence / Verification question
        elif "evidence" in query or "data" in query or "metrics" in query or "numbers" in query:
            metrics_str = (
                f"Speed: {router['metrics_now']['speed_now']} Mbps, "
                f"Latency: {router['metrics_now']['latency_now']} ms (6h slope: +{round(router['metric_slopes']['latency_slope_6h'], 1)}), "
                f"Packet Loss: {router['metrics_now']['packet_loss_now']}% (6h slope: +{round(router['metric_slopes']['packet_loss_slope_6h'], 2)}), "
                f"Disconnects: {router['metrics_now']['disconnects_now']}/hr, "
                f"RF Signal: {router['metrics_now']['signal_now']} dBm, "
                f"Active Clients: {int(router['metrics_now']['devices_now'])}."
            )
            ans = (
                f"The predictive diagnosis for {rid} is supported by the following measured telemetry: {metrics_str} "
                f"Isolation Forest flagged anomaly status: {'Anomalous' if router['is_anomaly'] else 'Normal'} "
                f"(Score: {router['anomaly_score']}). Evidence summary: {'; '.join(evidence_list)}."
            )
            followups = [
                f"What preventive action should IT take for {rid}?",
                f"Is this router part of a larger fleet pattern?",
                f"What is the difference between current health and future risk for {rid}?"
            ]

        # 4. Recommended action question
        elif "action" in query or "prevent" in query or "fix" in query or "do" in query:
            ans = (
                f"The single recommended preventive action for {rid} is: **{rec_action}**. "
                f"This decision is grounded in root cause analysis: '{root_cause}' with calculated priority score {router['priority_score']} ({router['priority_level']}). "
                f"Taking action now prevents customer-impacting degradation across {int(router['metrics_now']['devices_now'])} connected users."
            )
            followups = [
                f"Why is {rid} at risk in the next 24 hours?",
                f"Show top SHAP risk contributors for {rid}.",
                f"Show fleet patterns for firmware {firmware}."
            ]

        # 5. Default router response
        else:
            ans = (
                f"{rid} (Model: {router['model']}, Firmware: {firmware}, Location: {building} Rm {router['room']}) "
                f"has Current Health: {health}/100 ({health_status}) and Future Degradation Risk: {risk_pct}% ({router['risk_level']}). "
                f"Root cause: {root_cause}. Top risk contributor: {top_contribs[0]['display_name'] if top_contribs else 'Metric volatility'}. "
                f"Recommended action: {rec_action}."
            )
            followups = [
                f"Why is {rid} at risk?",
                f"Is this part of a larger pattern?",
                f"What evidence supports the prediction?"
            ]

        return {
            "router_id": rid,
            "answer": ans,
            "structured_evidence": structured_evidence,
            "suggested_followups": followups
        }

    def _answer_fleet_query(self, query: str) -> Dict[str, Any]:
        kpis = router_service.get_fleet_kpis()
        patterns = router_service.fleet_patterns
        alerts = patterns.get("systemic_alerts", [])

        alerts_summary = ""
        if alerts:
            alerts_summary = f" Systemic risk pattern detected: {alerts[0]['statement']} (Risk rate {alerts[0]['risk_rate_pct']}%)."

        ans = (
            f"Across the monitored network fleet of {kpis['total_routers']} routers: "
            f"{kpis['healthy_count']} are Healthy, {kpis['watch_count']} in Watch/Moderate state, "
            f"{kpis['at_risk_count']} At Risk, and {kpis['critical_count']} currently Critical. "
            f"Our supervised ML model flags {kpis['high_future_risk_count']} routers with high near-term degradation risk (Next 24h), "
            f"affecting an estimated {kpis['users_affected']} connected users.{alerts_summary} "
            f"Model verification: Recall {kpis['model_recall']}%, Precision {kpis['model_precision']}%, ROC-AUC {kpis['model_roc_auc']}%."
        )

        followups = [
            "Why is R-1042 at risk?",
            "Which firmware version shows the highest degradation rate?",
            "What is the difference between Current Health and Future Risk in NetSentinel?"
        ]

        return {
            "router_id": None,
            "answer": ans,
            "structured_evidence": {
                "fleet_kpis": kpis,
                "systemic_alerts": alerts
            },
            "suggested_followups": followups
        }

copilot_service = CopilotService()
