# backend/app/api/iot.py
"""
NetSentinel IoT Fleet Simulator & Digital Twin API Endpoints
Standards-Compliant:
 - IETF SenML (RFC 8428)
 - Digital Twin Definition Language (DTDL v2)
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from app.services.iot_simulator import iot_simulator, DTDL_ROUTER_INTERFACE

router = APIRouter(prefix="/iot", tags=["IoT Simulator & Digital Twin"])

class ControlRequest(BaseModel):
    is_running: Optional[bool] = None
    speed_multiplier: Optional[float] = Field(None, ge=0.1, le=20.0)
    trigger_step: Optional[bool] = False

class FaultInjectionRequest(BaseModel):
    router_id: str
    fault_type: str = Field(..., description="thermal_runaway | memory_leak | rogue_ap_interference | packet_flood")
    severity: float = Field(0.8, ge=0.1, le=1.0)

class ClearFaultRequest(BaseModel):
    router_id: Optional[str] = None  # None clears all

class ActuationRequest(BaseModel):
    router_id: str
    command: str = Field(..., description="rebootGateway | switchChannel | engageEcoCooling | clearFaults")
    params: Optional[Dict[str, Any]] = None

@router.get("/summary")
def get_fleet_summary():
    """Retrieve IoT fleet-wide telemetry, health distribution, and standards compliance."""
    iot_simulator.step()  # Advance dynamics
    return iot_simulator.get_fleet_summary()

@router.get("/nodes")
def get_all_digital_twins(building: Optional[str] = None, health: Optional[str] = None):
    """Retrieve all simulated IoT edge router digital twins."""
    iot_simulator.step()
    nodes = list(iot_simulator.nodes.values())
    if building and building != "All":
        nodes = [n for n in nodes if n.building.lower() == building.lower()]
    if health and health != "All":
        nodes = [n for n in nodes if n.health_status.lower() == health.lower()]
    return [n.to_dict() for n in nodes]

@router.get("/nodes/{router_id}")
def get_digital_twin_detail(router_id: str):
    """Retrieve deep digital twin state, sensor telemetry, and actuation logs for a specific router."""
    if router_id not in iot_simulator.nodes:
        raise HTTPException(status_code=404, detail=f"Digital Twin {router_id} not found in campus fleet.")
    node = iot_simulator.nodes[router_id]
    data = node.to_dict()
    data["senml"] = node.to_senml()
    data["dtdl_ref"] = "dtmi:netsentinel:campus:IoTEdgeRouter;1"
    return data

@router.get("/dtdl")
def get_dtdl_interface():
    """Returns the formal Digital Twin Definition Language (DTDL v2) interface model."""
    return DTDL_ROUTER_INTERFACE

@router.get("/senml/recent")
def get_recent_senml_stream(limit: int = Query(40, ge=5, le=100)):
    """Retrieve recent standard IETF RFC 8428 SenML telemetry records."""
    iot_simulator.step()
    return iot_simulator.senml_history[:limit]

@router.post("/control")
def update_simulator_control(req: ControlRequest):
    """Control the real-time simulation engine (play, pause, speed, step)."""
    if req.is_running is not None:
        iot_simulator.is_running = req.is_running
    if req.speed_multiplier is not None:
        iot_simulator.speed_multiplier = req.speed_multiplier
    if req.trigger_step:
        iot_simulator.step()
    return {
        "status": "SUCCESS",
        "is_running": iot_simulator.is_running,
        "speed_multiplier": iot_simulator.speed_multiplier,
        "tick_count": iot_simulator.tick_count
    }

@router.post("/faults/inject")
def inject_fault(req: FaultInjectionRequest):
    """Inject a chaos/degradation fault into a targeted digital twin."""
    try:
        result = iot_simulator.inject_fault(req.router_id, req.fault_type, req.severity)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/faults/clear")
def clear_faults(req: ClearFaultRequest):
    """Clear injected faults and restore nominal twin parameters."""
    if req.router_id:
        if req.router_id in iot_simulator.nodes:
            res = iot_simulator.nodes[req.router_id].actuate("clearFaults")
            return {"status": "SUCCESS", "message": f"Cleared faults on {req.router_id}", "detail": res}
        raise HTTPException(status_code=404, detail=f"Router {req.router_id} not found.")
    else:
        # Clear all
        count = 0
        for node in iot_simulator.nodes.values():
            if node.active_fault:
                node.actuate("clearFaults")
                count += 1
        return {"status": "SUCCESS", "message": f"Cleared chaos faults across {count} twins."}

@router.post("/actuate")
def actuate_twin_command(req: ActuationRequest):
    """Issue downlink actuation command to an edge gateway digital twin."""
    if req.router_id not in iot_simulator.nodes:
        raise HTTPException(status_code=404, detail=f"Router {req.router_id} not found.")
    node = iot_simulator.nodes[req.router_id]
    result = node.actuate(req.command, req.params)
    return {
        "status": "SUCCESS",
        "router_id": req.router_id,
        "command": req.command,
        "result": result,
        "twin_state": node.to_dict()
    }
