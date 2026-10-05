# backend/app/services/iot_simulator.py
"""
NetSentinel IoT Fleet Simulator and Digital Twin Engine
Standards-Compliant:
 - IETF SenML (RFC 8428) Sensor Measurement Lists
 - Digital Twin Definition Language (DTDL v2)
 - Edge-to-Cloud IoT Reference Architecture (ISO/IEC 30141)
"""

import time
import random
import math
from typing import Dict, List, Any, Optional
from datetime import datetime

# DTDL v2 Interface Definition for Campus IoT Edge Router
DTDL_ROUTER_INTERFACE = {
    "@context": "dtmi:dtdl:context;2",
    "@id": "dtmi:netsentinel:campus:IoTEdgeRouter;1",
    "@type": "Interface",
    "displayName": "NetSentinel Campus IoT Edge Router Gateway",
    "description": "Digital Twin definition for high-density campus IoT edge access routers",
    "contents": [
        {
            "@type": "Telemetry",
            "name": "temperature_celsius",
            "schema": "double",
            "unit": "degreeCelsius",
            "description": "Internal SoC core and chassis thermal sensor"
        },
        {
            "@type": "Telemetry",
            "name": "cpu_load_pct",
            "schema": "double",
            "unit": "percent"
        },
        {
            "@type": "Telemetry",
            "name": "ram_usage_pct",
            "schema": "double",
            "unit": "percent"
        },
        {
            "@type": "Telemetry",
            "name": "latency_ms",
            "schema": "double",
            "unit": "millisecond"
        },
        {
            "@type": "Telemetry",
            "name": "packet_loss_pct",
            "schema": "double",
            "unit": "percent"
        },
        {
            "@type": "Telemetry",
            "name": "power_draw_w",
            "schema": "double",
            "unit": "watt",
            "description": "Active PoE+ power draw consumption"
        },
        {
            "@type": "Telemetry",
            "name": "noise_floor_dbm",
            "schema": "double",
            "unit": "dBm",
            "description": "RF spectrum background noise floor"
        },
        {
            "@type": "Command",
            "name": "rebootGateway",
            "request": {"name": "gracePeriodSec", "schema": "integer"},
            "response": {"name": "status", "schema": "string"}
        },
        {
            "@type": "Command",
            "name": "switchChannel",
            "request": {"name": "targetChannel", "schema": "integer"},
            "response": {"name": "status", "schema": "string"}
        },
        {
            "@type": "Command",
            "name": "engageEcoCooling",
            "request": {"name": "fanProfile", "schema": "string"},
            "response": {"name": "status", "schema": "string"}
        }
    ]
}

class DigitalTwinNode:
    """Represents a single IoT Edge Router Digital Twin."""
    def __init__(self, router_id: str, building: str, floor: int, room: int, model: str):
        self.router_id = router_id
        self.urn = f"urn:dev:campus:gateway:{router_id}"
        self.building = building
        self.floor = floor
        self.room = room
        self.model = model
        self.firmware = "v17.9.4a-iot"
        self.ip_address = f"10.24.{random.randint(10, 80)}.{random.randint(2, 250)}"
        self.mac_address = ":".join([f"{random.randint(0, 255):02X}" for _ in range(6)])
        self.channel = random.choice([1, 6, 11, 36, 44, 149])
        
        # Baselines
        self.base_temp = random.uniform(42.0, 48.0)
        self.base_cpu = random.uniform(18.0, 35.0)
        self.base_ram = random.uniform(38.0, 52.0)
        self.base_power = random.uniform(14.0, 22.0)
        self.base_noise = random.uniform(-95.0, -88.0)
        self.base_latency = random.uniform(8.0, 18.0)
        self.connected_devices = random.randint(15, 65)

        # Dynamic State
        self.temp_celsius = self.base_temp
        self.cpu_load_pct = self.base_cpu
        self.ram_usage_pct = self.base_ram
        self.power_draw_w = self.base_power
        self.noise_floor_dbm = self.base_noise
        self.latency_ms = self.base_latency
        self.packet_loss_pct = 0.05
        self.jitter_ms = random.uniform(1.2, 3.5)

        # Fault injection state
        self.active_fault: Optional[str] = None
        self.fault_severity: float = 0.0
        self.fault_start_time: Optional[float] = None

        # Digital Twin synchronization state
        self.health_status = "HEALTHY"
        self.twin_sync_status = "SYNCHRONIZED"
        self.last_sync_timestamp = time.time()
        self.actuation_history: List[Dict[str, Any]] = []

    def update_tick(self, time_step: float, load_factor: float):
        """Advance simulation physics and sensor dynamics."""
        now = time.time()
        jitter = random.uniform(-0.8, 0.8)

        # Base nominal dynamics
        target_cpu = self.base_cpu * load_factor + random.uniform(-3, 3)
        self.cpu_load_pct = max(5.0, min(100.0, self.cpu_load_pct * 0.85 + target_cpu * 0.15))

        # Thermal inertia: temperature follows CPU + ambient
        target_temp = self.base_temp + (self.cpu_load_pct / 100.0) * 22.0 + jitter
        self.temp_celsius = max(35.0, min(105.0, self.temp_celsius * 0.90 + target_temp * 0.10))

        # Power draw in Watts (PoE+ load)
        self.power_draw_w = max(10.0, round(self.base_power + (self.cpu_load_pct * 0.14) + (self.connected_devices * 0.08), 2))

        # Normal network health
        target_latency = self.base_latency + (self.cpu_load_pct * 0.15) + random.uniform(-1, 2)
        self.latency_ms = max(4.0, round(target_latency, 2))
        self.packet_loss_pct = max(0.0, round(random.uniform(0.01, 0.15), 3))
        self.noise_floor_dbm = round(self.base_noise + random.uniform(-1.5, 1.5), 1)

        # Apply active chaos/fault effects
        if self.active_fault:
            if self.active_fault == "thermal_runaway":
                self.temp_celsius = min(104.5, self.temp_celsius + 1.8 * self.fault_severity)
                self.cpu_load_pct = min(100.0, self.cpu_load_pct + 12.0)
                self.power_draw_w += 12.5
                self.latency_ms += 45.0
                self.packet_loss_pct = min(28.0, self.packet_loss_pct + 1.2)
            elif self.active_fault == "memory_leak":
                self.ram_usage_pct = min(99.4, self.ram_usage_pct + (0.9 * self.fault_severity))
                if self.ram_usage_pct > 90:
                    self.packet_loss_pct = min(35.0, self.packet_loss_pct + 2.4)
                    self.latency_ms += 65.0
            elif self.active_fault == "rogue_ap_interference":
                self.noise_floor_dbm = -58.0 + random.uniform(-3, 3)
                self.packet_loss_pct = min(42.0, self.packet_loss_pct + 3.8)
                self.latency_ms += 120.0
                self.jitter_ms = random.uniform(25.0, 85.0)
            elif self.active_fault == "packet_flood":
                self.cpu_load_pct = 98.5 + random.uniform(-1, 1)
                self.packet_loss_pct = min(68.0, self.packet_loss_pct + 5.5)
                self.latency_ms += 240.0
                self.connected_devices += random.randint(5, 15)

        # Update Health Classification
        if self.temp_celsius > 85.0 or self.packet_loss_pct > 15.0 or self.ram_usage_pct > 92.0:
            self.health_status = "CRITICAL"
        elif self.temp_celsius > 72.0 or self.packet_loss_pct > 3.0 or self.ram_usage_pct > 80.0:
            self.health_status = "WATCH"
        else:
            self.health_status = "HEALTHY"

        self.last_sync_timestamp = now

    def to_senml(self) -> List[Dict[str, Any]]:
        """RFC 8428 SenML representation of current sensor and telemetry readings."""
        bt = int(self.last_sync_timestamp)
        return [
            {"bn": f"{self.urn}:", "bt": bt},
            {"n": "temperature_celsius", "u": "Cel", "v": round(self.temp_celsius, 2)},
            {"n": "cpu_load_pct", "u": "%", "v": round(self.cpu_load_pct, 2)},
            {"n": "ram_usage_pct", "u": "%", "v": round(self.ram_usage_pct, 2)},
            {"n": "power_draw_w", "u": "W", "v": self.power_draw_w},
            {"n": "latency_ms", "u": "ms", "v": self.latency_ms},
            {"n": "packet_loss_pct", "u": "%", "v": round(self.packet_loss_pct, 2)},
            {"n": "noise_floor_dbm", "u": "dBm", "v": self.noise_floor_dbm},
            {"n": "active_clients", "v": self.connected_devices},
            {"n": "rf_channel", "v": self.channel}
        ]

    def to_dict(self) -> Dict[str, Any]:
        """Digital Twin snapshot."""
        return {
            "router_id": self.router_id,
            "urn": self.urn,
            "building": self.building,
            "floor": self.floor,
            "room": self.room,
            "model": self.model,
            "firmware": self.firmware,
            "ip_address": self.ip_address,
            "mac_address": self.mac_address,
            "channel": self.channel,
            "health_status": self.health_status,
            "twin_sync_status": self.twin_sync_status,
            "active_fault": self.active_fault,
            "fault_severity": self.fault_severity,
            "last_sync_timestamp": self.last_sync_timestamp,
            "metrics": {
                "temperature_celsius": round(self.temp_celsius, 2),
                "cpu_load_pct": round(self.cpu_load_pct, 2),
                "ram_usage_pct": round(self.ram_usage_pct, 2),
                "power_draw_w": self.power_draw_w,
                "latency_ms": round(self.latency_ms, 2),
                "packet_loss_pct": round(self.packet_loss_pct, 2),
                "jitter_ms": round(self.jitter_ms, 2),
                "noise_floor_dbm": self.noise_floor_dbm,
                "connected_devices": self.connected_devices
            },
            "actuation_history": self.actuation_history[-5:]
        }

    def actuate(self, command: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Execute remote actuation command on the digital twin gateway."""
        now_iso = datetime.utcnow().isoformat() + "Z"
        result = {"command": command, "timestamp": now_iso, "status": "SUCCESS"}

        if command == "rebootGateway":
            self.temp_celsius = self.base_temp
            self.cpu_load_pct = 15.0
            self.ram_usage_pct = self.base_ram
            self.packet_loss_pct = 0.02
            self.active_fault = None
            self.health_status = "HEALTHY"
            result["message"] = f"Gateway {self.router_id} reboot sequence completed. Memory cleared and cache re-initialized."
        elif command == "switchChannel":
            target = params.get("targetChannel", random.choice([36, 44, 149])) if params else 36
            self.channel = target
            self.noise_floor_dbm = -94.0
            if self.active_fault == "rogue_ap_interference":
                self.active_fault = None
                self.packet_loss_pct = 0.04
            result["message"] = f"Channel hopped to Clean DFS Channel {target}. RF noise floor mitigated."
        elif command == "engageEcoCooling":
            self.temp_celsius = max(self.base_temp - 5.0, 39.0)
            if self.active_fault == "thermal_runaway":
                self.active_fault = None
            result["message"] = "Auxiliary fan profile set to MAX_TURBO. Thermal throttling resolved."
        elif command == "clearFaults":
            self.active_fault = None
            self.fault_severity = 0.0
            result["message"] = "All injected chaos faults cleared. Nominal state restored."
        else:
            result["status"] = "UNKNOWN_COMMAND"
            result["message"] = f"Command {command} not recognized by DTDL interface."

        self.actuation_history.append(result)
        return result

class IoTSimulatorService:
    """Master Fleet Simulator and Digital Twin Broker Service."""
    def __init__(self):
        self.is_running = True
        self.speed_multiplier = 1.0
        self.tick_count = 0
        self.nodes: Dict[str, DigitalTwinNode] = {}
        self.senml_history: List[Dict[str, Any]] = []
        self._initialize_default_fleet()

    def _initialize_default_fleet(self):
        """Pre-populate a diverse campus IoT router fleet."""
        buildings = [
            ("Engineering Hall", ["Catalyst 9130AX", "Aruba AP-555"], 4),
            ("Science Complex", ["Juniper Mist AP43", "Catalyst 9120"], 3),
            ("Central Library", ["Aruba AP-635", "UniFi U6 Enterprise"], 3),
            ("Student Center", ["Cisco Catalyst 9130AX", "Meraki MR56"], 2),
            ("Administration", ["Aruba AP-535", "Catalyst 9115"], 2),
        ]
        
        for b_name, models, floors in buildings:
            for f in range(1, floors + 1):
                for r in [1, 2, 3]:
                    prefix = b_name.split()[0][:3].upper()
                    r_id = f"R-{prefix}-{f}{r:02d}"
                    model = random.choice(models)
                    self.nodes[r_id] = DigitalTwinNode(
                        router_id=r_id,
                        building=b_name,
                        floor=f,
                        room=(f * 100) + r,
                        model=model
                    )

        if "R-ENG-201" in self.nodes:
            self.nodes["R-ENG-201"].active_fault = "thermal_runaway"
            self.nodes["R-ENG-201"].fault_severity = 0.85
            self.nodes["R-ENG-201"].fault_start_time = time.time() - 120
            self.nodes["R-ENG-201"].temp_celsius = 89.2
            self.nodes["R-ENG-201"].health_status = "CRITICAL"

        if "R-CEN-102" in self.nodes:
            self.nodes["R-CEN-102"].active_fault = "rogue_ap_interference"
            self.nodes["R-CEN-102"].fault_severity = 0.70
            self.nodes["R-CEN-102"].fault_start_time = time.time() - 300
            self.nodes["R-CEN-102"].noise_floor_dbm = -61.0
            self.nodes["R-CEN-102"].health_status = "WATCH"

    def step(self):
        """Advance simulation one tick across all digital twins."""
        if not self.is_running:
            return

        self.tick_count += 1
        hour = (datetime.utcnow().hour + (self.tick_count * 0.05 * self.speed_multiplier)) % 24
        diurnal_factor = 0.7 + 0.6 * math.sin((hour - 6) * math.pi / 12) if 6 <= hour <= 22 else 0.45

        recent_batch = []
        for node in self.nodes.values():
            node.update_tick(time_step=1.0 * self.speed_multiplier, load_factor=diurnal_factor)
            if random.random() < 0.25:
                recent_batch.extend(node.to_senml())

        if recent_batch:
            self.senml_history = (recent_batch + self.senml_history)[:120]

    def get_fleet_summary(self) -> Dict[str, Any]:
        """Aggregate KPIs for the entire simulated IoT fleet."""
        total = len(self.nodes)
        healthy = sum(1 for n in self.nodes.values() if n.health_status == "HEALTHY")
        watch = sum(1 for n in self.nodes.values() if n.health_status == "WATCH")
        critical = sum(1 for n in self.nodes.values() if n.health_status == "CRITICAL")
        active_faults = sum(1 for n in self.nodes.values() if n.active_fault is not None)

        avg_temp = sum(n.temp_celsius for n in self.nodes.values()) / max(1, total)
        avg_cpu = sum(n.cpu_load_pct for n in self.nodes.values()) / max(1, total)
        total_power = sum(n.power_draw_w for n in self.nodes.values())
        total_iot_clients = sum(n.connected_devices for n in self.nodes.values())

        return {
            "status": "RUNNING" if self.is_running else "PAUSED",
            "speed_multiplier": self.speed_multiplier,
            "tick_count": self.tick_count,
            "total_nodes": total,
            "healthy_count": healthy,
            "watch_count": watch,
            "critical_count": critical,
            "active_fault_count": active_faults,
            "avg_temperature_celsius": round(avg_temp, 2),
            "avg_cpu_load_pct": round(avg_cpu, 2),
            "total_power_draw_watts": round(total_power, 2),
            "total_connected_iot_clients": total_iot_clients,
            "senml_rate_per_sec": round(len(self.nodes) * 1.5 * self.speed_multiplier, 1),
            "standards_compliance": [
                "IETF SenML (RFC 8428)",
                "DTDL v2 (Digital Twin Definition Language)",
                "ISO/IEC 30141 IoT Reference Architecture"
            ]
        }

    def inject_fault(self, router_id: str, fault_type: str, severity: float = 0.8) -> Dict[str, Any]:
        """Inject chaos / failure event into target digital twin."""
        if router_id not in self.nodes:
            raise ValueError(f"Router ID {router_id} not found in digital twin fleet.")
        
        node = self.nodes[router_id]
        node.active_fault = fault_type
        node.fault_severity = min(1.0, max(0.1, severity))
        node.fault_start_time = time.time()
        node.twin_sync_status = "DEGRADED_STATE"
        
        return {
            "router_id": router_id,
            "fault": fault_type,
            "severity": node.fault_severity,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "message": f"Chaos fault '{fault_type}' successfully injected into twin {router_id}."
        }

# Global Singleton Instance
iot_simulator = IoTSimulatorService()
