import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCw,
  Flame,
  Radio,
  Bomb,
  Droplets,
  Wind,
  ShieldCheck,
  Zap,
  Activity,
  Cpu,
  Wifi,
  Sliders,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import type { IoTSummary, DigitalTwinNode } from '../types';
import {
  fetchIoTSummary,
  fetchIoTNodes,
  updateIoTControl,
  injectIoTFault,
  actuateIoTNode,
  clearIoTFaults
} from '../services/api';

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  sourceX: number;
  sourceY: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
  isError: boolean;
}

interface VisualNode {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  zone: string;
  temp: number;
  cpu: number;
  power: number;
  health: 'HEALTHY' | 'WATCH' | 'CRITICAL';
  activeFault: string | null;
  sensorCount: number;
}

export const VisualIoTSimulatorArena: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [summary, setSummary] = useState<IoTSummary | null>(null);
  const [nodes, setNodes] = useState<DigitalTwinNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('R-ENG-101');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [actuating, setActuating] = useState<boolean>(false);
  const [visualNotice, setVisualNotice] = useState<{ title: string; color: string } | null>({
    title: 'Visual IoT Simulation Arena Active • 60 FPS Particle Telemetry Engine',
    color: 'emerald'
  });

  // Simulator Nodes for Canvas
  const [visualNodes, setVisualNodes] = useState<VisualNode[]>([
    { id: 'R-ENG-101', label: 'Engineering Gateway', sub: 'Catalyst 9130AX', x: 200, y: 150, zone: 'Engineering', temp: 46, cpu: 28, power: 18.5, health: 'HEALTHY', activeFault: null, sensorCount: 6 },
    { id: 'R-SCI-201', label: 'Science Complex', sub: 'Aruba AP-555', x: 680, y: 150, zone: 'Science', temp: 45, cpu: 32, power: 19.2, health: 'HEALTHY', activeFault: null, sensorCount: 8 },
    { id: 'R-LIB-102', label: 'Central Library', sub: 'Juniper Mist AP43', x: 180, y: 460, zone: 'Library', temp: 52, cpu: 40, power: 21.0, health: 'WATCH', activeFault: 'rogue_ap_interference', sensorCount: 12 },
    { id: 'R-STU-301', label: 'Student Center', sub: 'Catalyst 9120', x: 700, y: 460, zone: 'Student', temp: 43, cpu: 24, power: 16.8, health: 'HEALTHY', activeFault: null, sensorCount: 15 },
    { id: 'R-ADM-101', label: 'Administration Hub', sub: 'UniFi U6 Enterprise', x: 440, y: 550, zone: 'Admin', temp: 44, cpu: 22, power: 15.4, health: 'HEALTHY', activeFault: null, sensorCount: 5 }
  ]);

  const activeSelected = visualNodes.find((n) => n.id === selectedNodeId) || visualNodes[0];

  const loadData = async () => {
    try {
      const [sumRes, nodesRes] = await Promise.all([
        fetchIoTSummary(),
        fetchIoTNodes()
      ]);
      setSummary(sumRes);
      setNodes(nodesRes);

      // Sync backend state into visual nodes
      setVisualNodes((prev) =>
        prev.map((vn) => {
          const match = nodesRes.find((r) => r.router_id === vn.id);
          if (match) {
            return {
              ...vn,
              temp: match.metrics.temperature_celsius,
              cpu: match.metrics.cpu_load_pct,
              power: match.metrics.power_draw_w,
              health: match.health_status,
              activeFault: match.active_fault
            };
          }
          return vn;
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  // 60 FPS Particle Canvas Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Particle[] = [];
    const coreHub = { x: 440, y: 310 };

    // Initialize particles
    for (let i = 0; i < 70; i++) {
      const srcNode = visualNodes[Math.floor(Math.random() * visualNodes.length)];
      particles.push({
        x: srcNode.x,
        y: srcNode.y,
        sourceX: srcNode.x,
        sourceY: srcNode.y,
        targetX: coreHub.x,
        targetY: coreHub.y,
        progress: Math.random(),
        speed: 0.006 + Math.random() * 0.009,
        color: '#10b981',
        size: 3 + Math.random() * 2,
        isError: false
      });
    }

    let waveAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      waveAngle += 0.03;

      // Draw background grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Connection Beams from Gateways to Core Hub
      visualNodes.forEach((node) => {
        const isFaulty = node.activeFault !== null;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(coreHub.x, coreHub.y);
        ctx.strokeStyle = isFaulty ? 'rgba(244, 63, 94, 0.35)' : 'rgba(16, 185, 129, 0.25)';
        ctx.lineWidth = isFaulty ? 2.5 : 1.5;
        if (isFaulty) {
          ctx.setLineDash([6, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw animated RF coverage rings
        const ringRadius = 45 + Math.sin(waveAngle + node.x) * 8;
        ctx.beginPath();
        ctx.arc(node.x, node.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = isFaulty
          ? 'rgba(244, 63, 94, 0.4)'
          : node.health === 'WATCH'
          ? 'rgba(245, 158, 11, 0.35)'
          : 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Draw Peripheral Satellite IoT Sensors
        const sensorR = 34;
        for (let s = 0; s < 4; s++) {
          const sAngle = waveAngle * 0.5 + (s * (Math.PI / 2));
          const sx = node.x + Math.cos(sAngle) * sensorR;
          const sy = node.y + Math.sin(sAngle) * sensorR;

          ctx.beginPath();
          ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = isFaulty ? '#f43f5e' : '#38bdf8';
          ctx.fill();

          // Sensor connector thread
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      });

      // Update & Render Moving Telemetry Packets
      particles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress >= 1.0) {
          p.progress = 0;
          const randomNode = visualNodes[Math.floor(Math.random() * visualNodes.length)];
          p.sourceX = randomNode.x;
          p.sourceY = randomNode.y;
          p.targetX = coreHub.x;
          p.targetY = coreHub.y;
          p.isError = randomNode.activeFault !== null;
          p.color = p.isError ? '#f43f5e' : Math.random() > 0.4 ? '#10b981' : '#38bdf8';
        }

        // Interpolate position
        p.x = p.sourceX + (p.targetX - p.sourceX) * p.progress;
        p.y = p.sourceY + (p.targetY - p.sourceY) * p.progress;

        // If error, add jitter spark
        if (p.isError) {
          p.x += (Math.random() - 0.5) * 6;
          p.y += (Math.random() - 0.5) * 6;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.isError ? 12 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw Center Core Hub (Campus Cloud Aggregator)
      const corePulse = 28 + Math.sin(waveAngle * 2) * 3;
      ctx.beginPath();
      ctx.arc(coreHub.x, coreHub.y, corePulse + 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(coreHub.x, coreHub.y, corePulse, 0, Math.PI * 2);
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#818cf8';
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Hub Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CAMPUS CORE', coreHub.x, coreHub.y - 4);
      ctx.fillStyle = '#a5b4fc';
      ctx.font = '9px monospace';
      ctx.fillText('IoT BROKER', coreHub.x, coreHub.y + 9);

      // Draw Gateway Node Disks
      visualNodes.forEach((node) => {
        const isSelected = node.id === selectedNodeId;
        const isHovered = node.id === hoveredNodeId;
        const isCrit = node.health === 'CRITICAL' || node.activeFault !== null;
        const isWatch = node.health === 'WATCH';

        const nodeRadius = isSelected ? 26 : 22;

        // Outer glow on selection / fault
        if (isCrit) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius + 14 + Math.sin(waveAngle * 4) * 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
          ctx.fill();
        } else if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
          ctx.fill();
        }

        // Base Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = isCrit ? '#3f121e' : isWatch ? '#3b250d' : '#06281e';
        ctx.strokeStyle = isCrit ? '#f43f5e' : isWatch ? '#f59e0b' : isSelected ? '#818cf8' : '#10b981';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = isCrit ? 22 : 12;
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Node ID label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.id, node.x, node.y - 2);

        // Temp Badge below
        ctx.fillStyle = node.temp > 85 ? '#f43f5e' : node.temp > 70 ? '#f59e0b' : '#34d399';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`${node.temp.toFixed(0)}°C | ${node.power.toFixed(0)}W`, node.x, node.y + 11);

        // Building Title Above
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText(node.label, node.x, node.y - nodeRadius - 8);

        // Active Chaos Icon badge
        if (node.activeFault) {
          ctx.fillStyle = '#f43f5e';
          ctx.font = 'bold 11px system-ui';
          ctx.fillText('⚠️ FAULT', node.x, node.y + nodeRadius + 15);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Canvas Click Listener to select nodes
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

      visualNodes.forEach((node) => {
        const dist = Math.hypot(node.x - clickX, node.y - clickY);
        if (dist <= 30) {
          setSelectedNodeId(node.id);
        }
      });
    };

    // Canvas Move Listener for cursor hover
    const handleCanvasMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const moveX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const moveY = ((e.clientY - rect.top) / rect.height) * canvas.height;

      let found: string | null = null;
      visualNodes.forEach((node) => {
        const dist = Math.hypot(node.x - moveX, node.y - moveY);
        if (dist <= 30) {
          found = node.id;
        }
      });
      setHoveredNodeId(found);
      canvas.style.cursor = found ? 'pointer' : 'default';
    };

    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleCanvasMove);
    };
  }, [visualNodes, selectedNodeId, hoveredNodeId]);

  // Visual Anomaly Triggers
  const triggerChaos = async (faultType: string, label: string) => {
    try {
      await injectIoTFault(selectedNodeId, faultType, 0.95);
      setVisualNotice({
        title: `🔥 ANOMALY INJECTED: ${label} on [${selectedNodeId}]! Observe particle drop & temperature surge.`,
        color: 'rose'
      });
      await loadData();
    } catch (e: any) {
      console.error(e);
    }
  };

  // Visual Countermeasures
  const triggerActuation = async (command: string, label: string, params?: any) => {
    setActuating(true);
    try {
      await actuateIoTNode(selectedNodeId, command, params);
      setVisualNotice({
        title: `⚡ COUNTERMEASURE DEPLOYED: ${label} executed on [${selectedNodeId}]!`,
        color: 'emerald'
      });
      await loadData();
    } catch (e: any) {
      console.error(e);
    } finally {
      setActuating(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearIoTFaults();
      setVisualNotice({
        title: '🛡️ ALL CHAOS PURGED: Nominal IoT telemetry restored across campus mesh.',
        color: 'emerald'
      });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Live Notice Bar */}
      {visualNotice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-2xl text-xs font-mono font-bold flex items-center justify-between border shadow-lg ${
            visualNotice.color === 'rose'
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${visualNotice.color === 'rose' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${visualNotice.color === 'rose' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            </span>
            <span>{visualNotice.title}</span>
          </div>
          <span className="text-[10px] text-gray-400 font-normal">CLICK ANY GATEWAY ON CANVAS TO TARGET</span>
        </motion.div>
      )}

      {/* Main Visual Arena Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Animated 60FPS Canvas Topology Simulator (8 cols) */}
        <div className="xl:col-span-8 bg-[#070a12] border border-gray-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          {/* Canvas Top HUD */}
          <div className="flex items-center justify-between z-10 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  IoT Mesh Particle Topology Arena
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    60 FPS Live
                  </span>
                </h3>
                <p className="text-xs text-gray-400">
                  Real-time telemetry packets flowing from peripheral sensors through edge router gateways to the campus core.
                </p>
              </div>
            </div>

            {/* Quick Engine Speed Toggle */}
            <div className="flex items-center gap-1 bg-gray-900/90 border border-gray-800 p-1 rounded-xl text-xs font-mono">
              {[1, 2, 5].map((sp) => (
                <button
                  key={sp}
                  onClick={() => updateIoTControl({ speed_multiplier: sp })}
                  className="px-2.5 py-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 font-bold transition cursor-pointer"
                >
                  {sp}x
                </button>
              ))}
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-bold text-[10px] ml-1 cursor-pointer"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Canvas Element */}
          <div className="relative w-full h-[580px] bg-radial from-[#0d1428] to-[#04060b] rounded-2xl border border-gray-800/80 overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              width={880}
              height={580}
              className="w-full h-full block"
            />

            {/* In-Canvas Floating Legend */}
            <div className="absolute bottom-3 left-3 bg-gray-900/85 backdrop-blur-md border border-gray-800 rounded-xl p-2.5 text-[10px] font-mono text-gray-300 flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-emerald-400 shadow-xs" /> Healthy Packet
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sky-400 shadow-xs" /> Sensor Telemetry
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-rose-500 shadow-xs animate-ping" /> Dropped / Jitter Spark
              </span>
            </div>

            {/* Targeted Gateway Pill */}
            <div className="absolute top-3 right-3 bg-indigo-950/90 backdrop-blur-md border border-indigo-500/40 rounded-xl px-3 py-1.5 text-xs font-mono text-indigo-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <span>Target: <strong className="text-white">{selectedNodeId}</strong> ({activeSelected.zone})</span>
            </div>
          </div>
        </div>

        {/* Right: Visual Hardware Twin Cockpit & Action Triggers (4 cols) */}
        <div className="xl:col-span-4 space-y-6">
          {/* Virtual 1U Hardware Faceplate Visualizer */}
          <div className="bg-[#0b0f19] border border-gray-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-3">
              <div>
                <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest font-extrabold block">
                  PHYSICAL DIGITAL TWIN CHASSIS
                </span>
                <h4 className="text-sm font-extrabold text-white font-mono">
                  {activeSelected.id} • {activeSelected.sub}
                </h4>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  activeSelected.health === 'CRITICAL' || activeSelected.activeFault
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                }`}
              >
                {activeSelected.activeFault ? activeSelected.activeFault.toUpperCase() : 'NOMINAL 100%'}
              </span>
            </div>

            {/* Simulated 1U Faceplate */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 border border-gray-700/80 rounded-xl p-4 shadow-inner text-white mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-mono font-bold tracking-wider text-gray-400">NETSENTINEL X-9000</span>
                <span className="text-[9px] font-mono text-gray-500">{activeSelected.zone} BLD</span>
              </div>

              {/* Hardware LED Bank */}
              <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-mono border-y border-gray-800 py-2.5 my-2">
                <div>
                  <span className="block text-gray-500 text-[8px]">PWR</span>
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-emerald-400 shadow-xs" />
                </div>
                <div>
                  <span className="block text-gray-500 text-[8px]">SYS</span>
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full shadow-xs ${
                      activeSelected.cpu > 70 ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
                    }`}
                  />
                </div>
                <div>
                  <span className="block text-gray-500 text-[8px]">ALM</span>
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full shadow-xs ${
                      activeSelected.activeFault ? 'bg-rose-500 animate-ping' : 'bg-gray-700'
                    }`}
                  />
                </div>
                <div>
                  <span className="block text-gray-500 text-[8px]">RF 6G</span>
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
              </div>

              {/* PoE Active Port Matrix */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[8px] text-gray-500 font-mono">PoE+ GbE PORTS 1-8</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((port) => (
                    <span
                      key={port}
                      className={`w-2 h-2 rounded-xs ${
                        port <= (activeSelected.sensorCount % 8) + 2
                          ? 'bg-emerald-400 shadow-emerald-400/50 shadow-xs'
                          : 'bg-gray-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Circular / Progress Gauges */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" /> Chassis Core Temp
                  </span>
                  <span className={`font-bold ${activeSelected.temp > 85 ? 'text-rose-500' : 'text-emerald-400'}`}>
                    {activeSelected.temp.toFixed(1)} °C
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      activeSelected.temp > 85 ? 'bg-rose-500' : activeSelected.temp > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (activeSelected.temp / 105) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" /> SoC Compute Load
                  </span>
                  <span className="font-bold text-indigo-300">{activeSelected.cpu.toFixed(0)} %</span>
                </div>
                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${activeSelected.cpu}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-gray-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> PoE+ Power Load
                  </span>
                  <span className="font-bold text-amber-300">{activeSelected.power.toFixed(1)} W</span>
                </div>
                <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{ width: `${Math.min(100, (activeSelected.power / 40) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Chaos Triggers (Visual Weapons) */}
          <div className="bg-[#0b0f19] border border-gray-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-rose-500" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Visual Chaos Anomaly Triggers
              </h4>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">
              Click to instantly inject visible physical and RF perturbations onto <strong className="text-indigo-400 font-mono">{selectedNodeId}</strong>:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerChaos('thermal_runaway', 'Thermal Overload')}
                className="p-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md text-left"
              >
                <Flame className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="truncate">Ignite Heat Meltdown</span>
              </button>

              <button
                onClick={() => triggerChaos('rogue_ap_interference', 'RF Jamming')}
                className="p-2.5 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md text-left"
              >
                <Radio className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="truncate">Jam RF Spectrum</span>
              </button>

              <button
                onClick={() => triggerChaos('packet_flood', 'DDoS Packet Storm')}
                className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md text-left"
              >
                <Bomb className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">DDoS Flood Storm</span>
              </button>

              <button
                onClick={() => triggerChaos('memory_leak', 'Memory Leak')}
                className="p-2.5 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md text-left"
              >
                <Droplets className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate">Corrupt Buffer RAM</span>
              </button>
            </div>
          </div>

          {/* Interactive Countermeasures (Visual Shield) */}
          <div className="bg-[#0b0f19] border border-gray-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Visual Mitigation Countermeasures
              </h4>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => triggerActuation('engageEcoCooling', 'Auxiliary Cryo Turbo Fan')}
                disabled={actuating}
                className="w-full p-2.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span>Deploy Cryo Turbo Cooling</span>
                </div>
                <span className="text-[9px] font-mono bg-cyan-500/20 px-2 py-0.5 rounded">Cooldown</span>
              </button>

              <button
                onClick={() => triggerActuation('switchChannel', 'DFS Channel 36 Hop', { targetChannel: 36 })}
                disabled={actuating}
                className="w-full p-2.5 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-purple-400" />
                  <span>Hop to Clean DFS Spectrum</span>
                </div>
                <span className="text-[9px] font-mono bg-purple-500/20 px-2 py-0.5 rounded">Mitigate RF</span>
              </button>

              <button
                onClick={() => triggerActuation('rebootGateway', 'Quantum Core Reboot')}
                disabled={actuating}
                className="w-full p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-emerald-400" />
                  <span>Flush Memory & Hard Reboot</span>
                </div>
                <span className="text-[9px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded">Full Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
