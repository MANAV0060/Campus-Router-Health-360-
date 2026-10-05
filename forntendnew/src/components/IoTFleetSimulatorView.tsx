import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  RotateCw,
  Zap,
  Flame,
  Droplets,
  Radio,
  Bomb,
  ShieldCheck,
  Server,
  Activity,
  Terminal,
  RefreshCw,
  Cpu,
  Layers,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import type { IoTSummary, DigitalTwinNode, SenMLRecord } from '../types';
import {
  fetchIoTSummary,
  fetchIoTNodes,
  fetchRecentSenML,
  updateIoTControl,
  injectIoTFault,
  clearIoTFaults,
  actuateIoTNode
} from '../services/api';

interface IoTFleetSimulatorViewProps {
  onSelectRouter?: (routerId: string) => void;
}

export const IoTFleetSimulatorView: React.FC<IoTFleetSimulatorViewProps> = ({ onSelectRouter }) => {
  const [summary, setSummary] = useState<IoTSummary | null>(null);
  const [nodes, setNodes] = useState<DigitalTwinNode[]>([]);
  const [senmlStream, setSenmlStream] = useState<SenMLRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterBuilding, setFilterBuilding] = useState<string>('All');
  const [filterHealth, setFilterHealth] = useState<string>('All');

  // Chaos Injection state
  const [selectedTarget, setSelectedTarget] = useState<string>('R-ENG-101');
  const [selectedFault, setSelectedFault] = useState<string>('thermal_runaway');
  const [faultSeverity, setFaultSeverity] = useState<number>(0.85);
  const [injecting, setInjecting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [sumRes, nodesRes, senmlRes] = await Promise.all([
        fetchIoTSummary(),
        fetchIoTNodes(filterBuilding, filterHealth),
        fetchRecentSenML(25)
      ]);
      setSummary(sumRes);
      setNodes(nodesRes);
      setSenmlStream(senmlRes);
      if (nodesRes.length > 0 && !selectedTarget) {
        setSelectedTarget(nodesRes[0].router_id);
      }
    } catch (err) {
      console.error('Failed to poll IoT simulator:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2500);
    return () => clearInterval(interval);
  }, [filterBuilding, filterHealth]);

  const handleToggleRunning = async () => {
    if (!summary) return;
    try {
      await updateIoTControl({ is_running: summary.status !== 'RUNNING' });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetSpeed = async (speed: number) => {
    try {
      await updateIoTControl({ speed_multiplier: speed });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStep = async () => {
    try {
      await updateIoTControl({ trigger_step: true });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleInjectFault = async () => {
    if (!selectedTarget) return;
    setInjecting(true);
    setFeedbackMsg(null);
    try {
      const res = await injectIoTFault(selectedTarget, selectedFault, faultSeverity);
      setFeedbackMsg({ type: 'success', text: res.message || `Injected ${selectedFault} on ${selectedTarget}` });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to inject fault' });
    } finally {
      setInjecting(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearIoTFaults();
      setFeedbackMsg({ type: 'success', text: 'All active chaos faults cleared across fleet.' });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to clear faults' });
    }
  };

  const handleQuickReboot = async (routerId: string) => {
    try {
      await actuateIoTNode(routerId, 'rebootGateway');
      setFeedbackMsg({ type: 'success', text: `Reboot sequence completed for ${routerId}.` });
      await loadData();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Reboot failed' });
    }
  };

  const faultDefinitions = [
    { id: 'thermal_runaway', name: 'Thermal Runaway', icon: Flame, color: 'text-amber-500', desc: 'Simulates heat creep > 95°C' },
    { id: 'memory_leak', name: 'Buffer Memory Leak', icon: Droplets, color: 'text-blue-500', desc: 'Consumes RAM until buffer drops' },
    { id: 'rogue_ap_interference', name: 'RF Noise & Jamming', icon: Radio, color: 'text-purple-500', desc: 'Surges noise floor to -58 dBm' },
    { id: 'packet_flood', name: 'Broadcast DDoS Storm', icon: Bomb, color: 'text-rose-500', desc: 'Floods port & pegs CPU at 99%' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Control Deck */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#111c38] to-[#151a30] border border-emerald-500/30 p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${summary?.status === 'RUNNING' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${summary?.status === 'RUNNING' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                IoT Edge Fleet Simulator
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  IETF SenML RFC 8428
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
              Real-time physics engine simulating autonomous campus router gateways, environmental thermal inertia, diurnal traffic loads, PoE+ power draw, and RF spectrum degradation.
            </p>
          </div>

          {/* Engine Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleToggleRunning}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                summary?.status === 'RUNNING'
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {summary?.status === 'RUNNING' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{summary?.status === 'RUNNING' ? 'Pause Engine' : 'Resume Engine'}</span>
            </button>

            <button
              onClick={handleStep}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition cursor-pointer"
              title="Step Single Simulation Tick"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Step Tick</span>
            </button>

            {/* Speed Multiplier Pills */}
            <div className="flex items-center bg-gray-900/80 p-1 rounded-xl border border-gray-800 text-xs">
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSetSpeed(s)}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition cursor-pointer ${
                    summary?.speed_multiplier === s
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Chaos</span>
            </button>
          </div>
        </div>

        {/* Live Feedback Message */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-4 p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedbackMsg.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
              <button
                onClick={() => setFeedbackMsg(null)}
                className="text-xs text-gray-400 hover:text-white font-mono ml-4"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Virtual Gateways', value: summary?.total_nodes ?? '--', sub: 'Simulated Twins', icon: Server, color: 'text-indigo-500' },
          { label: 'Active Anomalies', value: summary?.active_fault_count ?? '--', sub: 'Chaos Injected', icon: Flame, color: 'text-amber-500' },
          { label: 'Fleet Temp', value: `${summary?.avg_temperature_celsius ?? '--'} °C`, sub: 'Chassis Core', icon: Cpu, color: 'text-rose-500' },
          { label: 'PoE+ Power Draw', value: `${summary?.total_power_draw_watts ?? '--'} W`, sub: 'Active Load', icon: Zap, color: 'text-amber-400' },
          { label: 'Connected IoT Clients', value: summary?.total_connected_iot_clients?.toLocaleString() ?? '--', sub: 'Campus Sensors', icon: Layers, color: 'text-cyan-500' },
          { label: 'SenML Throughput', value: `${summary?.senml_rate_per_sec ?? '--'}/s`, sub: 'RFC 8428 Stream', icon: Activity, color: 'text-emerald-500' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white dark:bg-[#121829] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs mb-1.5">
                <span className="truncate">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="text-xl font-extrabold text-gray-900 dark:text-white font-mono">{card.value}</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Chaos Laboratory & Live SenML Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chaos Injection Lab (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121829] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Chaos & Fault Injection Lab</h3>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                Dynamic Anomaly
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Directly perturb digital twin states to test ML predictive degradation, SHAP attribution, and copilot anomaly response.
            </p>

            {/* Target Router Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Target Gateway Twin
              </label>
              <select
                value={selectedTarget}
                onChange={(e) => setSelectedTarget(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              >
                {nodes.map((n) => (
                  <option key={n.router_id} value={n.router_id}>
                    {n.router_id} ({n.building} - Rm {n.room}) [{n.health_status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Fault Type Selection Grid */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Anomaly Archetype
              </label>
              <div className="grid grid-cols-2 gap-2">
                {faultDefinitions.map((f) => {
                  const Icon = f.icon;
                  const isSelected = selectedFault === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFault(f.id)}
                      className={`text-left p-3 rounded-xl border text-xs transition cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-900 dark:text-white font-bold shadow-xs'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-3.5 h-3.5 ${f.color}`} />
                        <span className="font-semibold text-[11px] truncate">{f.name}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-1">{f.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity Slider */}
            <div className="mb-4">
              <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Anomaly Severity</span>
                <span className="font-mono font-bold text-amber-500">{Math.round(faultSeverity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={faultSeverity}
                onChange={(e) => setFaultSeverity(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={handleInjectFault}
            disabled={injecting}
            className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4" />
            <span>{injecting ? 'Injecting Chaos...' : `Inject Fault on ${selectedTarget}`}</span>
          </button>
        </div>

        {/* Live SenML Telemetry Stream (7 cols) */}
        <div className="lg:col-span-7 bg-[#0b0e17] border border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-gray-300">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Terminal className="w-4 h-4" />
                <h3 className="text-sm font-bold text-white">Live SenML Stream Ticker</h3>
                <span className="flex h-2 w-2 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-400">
                JSON Sensor Measurement List (RFC 8428)
              </span>
            </div>

            {/* Stream Terminal Window */}
            <div className="bg-[#06080d] border border-gray-800/80 rounded-xl p-3 h-72 overflow-y-auto font-mono text-[11px] space-y-1.5">
              {senmlStream.map((record, i) => (
                <div key={i} className="hover:bg-gray-900/60 p-1 rounded transition flex items-start gap-2">
                  <span className="text-gray-600 select-none text-[9px] mt-0.5">[{i + 1}]</span>
                  <div className="flex-1 break-all">
                    {record.bn ? (
                      <span className="text-cyan-400 font-bold">{record.bn} </span>
                    ) : null}
                    <span className="text-amber-300">"{record.n}"</span>: {' '}
                    <span className="text-emerald-300 font-bold">{record.v}</span>
                    {record.u && <span className="text-purple-300 ml-1">({record.u})</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400 font-mono">
            <span>Protocol: MQTT / WebSocket Bridge</span>
            <span className="text-emerald-400">Status: 200 OK (Continuous)</span>
          </div>
        </div>
      </div>

      {/* Fleet Gateways Live Table */}
      <div className="bg-white dark:bg-[#121829] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-500" />
              <span>Simulated Campus Fleet Gateway Nodes ({nodes.length})</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Live telemetry snapshot updated every simulation tick with physical thermal & RF metrics.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-2.5 py-1.5 text-gray-700 dark:text-gray-300"
            >
              <option value="All">All Buildings</option>
              <option value="Engineering Hall">Engineering Hall</option>
              <option value="Science Complex">Science Complex</option>
              <option value="Central Library">Central Library</option>
              <option value="Student Center">Student Center</option>
              <option value="Administration">Administration</option>
            </select>

            <select
              value={filterHealth}
              onChange={(e) => setFilterHealth(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-2.5 py-1.5 text-gray-700 dark:text-gray-300"
            >
              <option value="All">All Health Statuses</option>
              <option value="HEALTHY">Healthy</option>
              <option value="WATCH">Watch</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-semibold">
                <th className="pb-3 px-3">Gateway ID</th>
                <th className="pb-3 px-3">Location</th>
                <th className="pb-3 px-3">Model</th>
                <th className="pb-3 px-3 text-right">Temp (°C)</th>
                <th className="pb-3 px-3 text-right">CPU / RAM</th>
                <th className="pb-3 px-3 text-right">Power</th>
                <th className="pb-3 px-3 text-right">Latency / Loss</th>
                <th className="pb-3 px-3">Active State</th>
                <th className="pb-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-mono">
              {nodes.map((node) => {
                const isCrit = node.health_status === 'CRITICAL';
                const isWatch = node.health_status === 'WATCH';
                return (
                  <tr key={node.router_id} className="hover:bg-gray-50 dark:hover:bg-gray-850/40 transition">
                    <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${isCrit ? 'bg-rose-500' : isWatch ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span>{node.router_id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans text-gray-600 dark:text-gray-300">
                      {node.building} - Rm {node.room}
                    </td>
                    <td className="py-3 px-3 font-sans text-gray-500 dark:text-gray-400">
                      {node.model}
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span className={node.metrics.temperature_celsius > 85 ? 'text-rose-500' : node.metrics.temperature_celsius > 70 ? 'text-amber-500' : 'text-emerald-500'}>
                        {node.metrics.temperature_celsius.toFixed(1)}°C
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-300">
                      {node.metrics.cpu_load_pct.toFixed(0)}% / {node.metrics.ram_usage_pct.toFixed(0)}%
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-300">
                      {node.metrics.power_draw_w} W
                    </td>
                    <td className="py-3 px-3 text-right text-gray-700 dark:text-gray-300">
                      {node.metrics.latency_ms.toFixed(0)}ms ({node.metrics.packet_loss_pct}%)
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {node.active_fault ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/30">
                          <Flame className="w-3 h-3" />
                          {node.active_fault.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <ShieldCheck className="w-3 h-3" />
                          Synchronized
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleQuickReboot(node.router_id)}
                          className="px-2 py-1 rounded-lg text-[10px] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition cursor-pointer"
                          title="Send DTDL Reboot Command"
                        >
                          Reboot
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
