import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Network,
  Cpu,
  Zap,
  Radio,
  Flame,
  ShieldCheck,
  RotateCw,
  Wind,
  Layers,
  Code,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Building,
  Server
} from 'lucide-react';
import type { DigitalTwinNode } from '../types';
import {
  fetchIoTNodes,
  fetchIoTNodeDetail,
  fetchIoTDtdl,
  actuateIoTNode
} from '../services/api';

export const CampusDigitalTwinView: React.FC = () => {
  const [nodes, setNodes] = useState<DigitalTwinNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('R-ENG-101');
  const [selectedNode, setSelectedNode] = useState<DigitalTwinNode | null>(null);
  const [activeBuilding, setActiveBuilding] = useState<string>('All');
  const [dtdlSchema, setDtdlSchema] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'sensors' | 'dtdl' | 'actuation'>('sensors');
  const [loading, setLoading] = useState<boolean>(true);
  const [actuating, setActuating] = useState<boolean>(false);
  const [commandFeedback, setCommandFeedback] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [nodesRes, dtdlRes] = await Promise.all([
        fetchIoTNodes(activeBuilding),
        fetchIoTDtdl()
      ]);
      setNodes(nodesRes);
      setDtdlSchema(dtdlRes);
      
      const currentId = selectedNodeId || (nodesRes[0]?.router_id);
      if (currentId) {
        const detail = await fetchIoTNodeDetail(currentId);
        setSelectedNode(detail);
      }
    } catch (err) {
      console.error('Failed to poll Digital Twins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [activeBuilding]);

  const handleSelectNode = async (routerId: string) => {
    setSelectedNodeId(routerId);
    try {
      const detail = await fetchIoTNodeDetail(routerId);
      setSelectedNode(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteCommand = async (command: string, params?: Record<string, any>) => {
    if (!selectedNode) return;
    setActuating(true);
    setCommandFeedback(null);
    try {
      const res = await actuateIoTNode(selectedNode.router_id, command, params);
      setCommandFeedback(res.result?.message || `Command ${command} executed successfully.`);
      const updated = await fetchIoTNodeDetail(selectedNode.router_id);
      setSelectedNode(updated);
      await loadData();
    } catch (err: any) {
      setCommandFeedback(`Error: ${err.message || 'Execution failed'}`);
    } finally {
      setActuating(false);
    }
  };

  const buildings = ['All', 'Engineering Hall', 'Science Complex', 'Central Library', 'Student Center', 'Administration'];

  const filteredNodes = activeBuilding === 'All'
    ? nodes
    : nodes.filter((n) => n.building.toLowerCase() === activeBuilding.toLowerCase());

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#101426] via-[#141b36] to-[#12192f] border border-indigo-500/30 p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-56 h-56 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Network className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Campus Edge Digital Twin Matrix
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  DTDL v2 (W3C Standard)
                </span>
              </h2>
            </div>
            <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
              Real-time synchronization between physical edge access router gateways and virtual digital twin nodes. Supports remote telemetry telemetry inspection and bi-directional edge actuation.
            </p>
          </div>

          {/* Building Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {buildings.map((b) => (
              <button
                key={b}
                onClick={() => setActiveBuilding(b)}
                className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                  activeBuilding === b
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Campus Map Grid (8 cols) + Digital Twin Inspector (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Campus Floor Grid (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121829] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Live Gateway Topology ({filteredNodes.length} Digital Twins)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Normal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Watch
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Critical
              </span>
            </div>
          </div>

          {/* Node Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredNodes.map((node) => {
              const isSelected = selectedNode?.router_id === node.router_id;
              const isCrit = node.health_status === 'CRITICAL';
              const isWatch = node.health_status === 'WATCH';

              return (
                <motion.div
                  key={node.router_id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectNode(node.router_id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/15 shadow-md ring-2 ring-indigo-500/30'
                      : isCrit
                      ? 'border-rose-500/50 bg-rose-500/5 dark:bg-rose-950/20'
                      : isWatch
                      ? 'border-amber-500/50 bg-amber-500/5 dark:bg-amber-950/20'
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40'
                  }`}
                >
                  {/* Top Row: Router ID & Status Dot */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-gray-900 dark:text-white truncate">
                      {node.router_id}
                    </span>
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isCrit ? 'bg-rose-500 shadow-rose-500/50 shadow-sm animate-ping' : isWatch ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mb-2">
                    {node.building} • Rm {node.room}
                  </p>

                  {/* Micro Sensor Stats */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono border-t border-gray-200/60 dark:border-gray-800/60 pt-1.5 text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="text-gray-400 text-[9px] block">Temp</span>
                      <span className={node.metrics.temperature_celsius > 85 ? 'text-rose-500 font-bold' : ''}>
                        {node.metrics.temperature_celsius.toFixed(0)}°C
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[9px] block">Power</span>
                      <span>{node.metrics.power_draw_w}W</span>
                    </div>
                  </div>

                  {node.active_fault && (
                    <div className="mt-1.5 text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded truncate">
                      ⚠️ {node.active_fault.replace('_', ' ')}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right: Digital Twin Inspector & Actuator (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121829] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            {/* Inspector Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800 mb-4">
              <div>
                <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider font-bold">
                  Digital Twin Inspector
                </span>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white font-mono">
                  {selectedNode?.router_id || 'Select a Gateway'}
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  selectedNode?.health_status === 'CRITICAL'
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    : selectedNode?.health_status === 'WATCH'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                }`}
              >
                {selectedNode?.health_status || 'UNKNOWN'}
              </span>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl text-xs mb-4">
              {[
                { id: 'sensors', label: 'Telemetry Gauges', icon: Sliders },
                { id: 'actuation', label: 'Remote Actuation', icon: Zap },
                { id: 'dtdl', label: 'DTDL Schema', icon: Code }
              ].map((tab) => {
                const Icon = tab.icon;
                const isTabActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg font-medium transition cursor-pointer ${
                      isTabActive
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs font-bold'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Live Sensor Telemetry Gauges */}
            {activeTab === 'sensors' && selectedNode && (
              <div className="space-y-3">
                {/* Identity Card */}
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between text-gray-500">
                    <span>URN Base:</span>
                    <span className="text-gray-900 dark:text-gray-200 truncate max-w-[200px]">{selectedNode.urn}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>IP / MAC:</span>
                    <span className="text-gray-900 dark:text-gray-200">{selectedNode.ip_address} ({selectedNode.mac_address})</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Model / Firmware:</span>
                    <span className="text-gray-900 dark:text-gray-200">{selectedNode.model} [{selectedNode.firmware}]</span>
                  </div>
                </div>

                {/* Progress Metric Gauges */}
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-500" /> Chassis Core Temperature
                      </span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">
                        {selectedNode.metrics.temperature_celsius}°C
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          selectedNode.metrics.temperature_celsius > 85 ? 'bg-rose-500' : selectedNode.metrics.temperature_celsius > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (selectedNode.metrics.temperature_celsius / 105) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5 text-indigo-500" /> CPU Load
                      </span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">
                        {selectedNode.metrics.cpu_load_pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${selectedNode.metrics.cpu_load_pct}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Active PoE+ Power Draw
                      </span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">
                        {selectedNode.metrics.power_draw_w} W
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (selectedNode.metrics.power_draw_w / 45) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 text-purple-500" /> RF Spectrum Noise Floor
                      </span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">
                        {selectedNode.metrics.noise_floor_dbm} dBm (Ch {selectedNode.channel})
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          selectedNode.metrics.noise_floor_dbm > -70 ? 'bg-rose-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.max(10, 100 + selectedNode.metrics.noise_floor_dbm)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Remote Edge Actuation Deck */}
            {activeTab === 'actuation' && selectedNode && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Dispatch DTDL command packets to the virtual edge controller. State synchronizes instantly across telemetry streams.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => handleExecuteCommand('engageEcoCooling')}
                    disabled={actuating}
                    className="w-full p-2.5 rounded-xl border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Wind className="w-4 h-4 text-blue-500" />
                      <span>Engage Max Turbo Cooling</span>
                    </div>
                    <span className="text-[10px] font-mono bg-blue-500/20 px-2 py-0.5 rounded">DTDL: engageEcoCooling</span>
                  </button>

                  <button
                    onClick={() => handleExecuteCommand('switchChannel', { targetChannel: 36 })}
                    disabled={actuating}
                    className="w-full p-2.5 rounded-xl border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-purple-500" />
                      <span>Hop to Clean DFS Channel 36</span>
                    </div>
                    <span className="text-[10px] font-mono bg-purple-500/20 px-2 py-0.5 rounded">DTDL: switchChannel</span>
                  </button>

                  <button
                    onClick={() => handleExecuteCommand('rebootGateway')}
                    disabled={actuating}
                    className="w-full p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <RotateCw className="w-4 h-4 text-amber-500" />
                      <span>Reboot Gateway Core</span>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded">DTDL: rebootGateway</span>
                  </button>

                  <button
                    onClick={() => handleExecuteCommand('clearFaults')}
                    disabled={actuating}
                    className="w-full p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-xs font-bold transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Purge Injected Chaos Faults</span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded">Reset Twin</span>
                  </button>
                </div>

                {/* Command Feedback Toast */}
                {commandFeedback && (
                  <div className="mt-3 p-2.5 rounded-xl bg-gray-900 border border-indigo-500/40 text-[11px] font-mono text-indigo-300 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{commandFeedback}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Formal DTDL Schema Definition */}
            {activeTab === 'dtdl' && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Standard W3C Digital Twin Definition Language (DTDL v2) model contract:
                </p>
                <div className="bg-[#0b0e17] border border-gray-800 rounded-xl p-3 h-64 overflow-y-auto font-mono text-[10px] text-emerald-300">
                  <pre>{JSON.stringify(dtdlSchema, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Actuation History Footer */}
          {selectedNode?.actuation_history && selectedNode.actuation_history.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 text-[10px] font-mono text-gray-400">
              <span className="font-bold text-gray-500 block mb-1">Recent Twin Actuation:</span>
              <div className="truncate text-emerald-600 dark:text-emerald-400">
                ✓ {selectedNode.actuation_history[selectedNode.actuation_history.length - 1].message}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
