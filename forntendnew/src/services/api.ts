import {
  DashboardResponse,
  RouterItem,
  RouterEvidenceResponse,
  AnalyticsResponse,
  CopilotResponse,
  FilterState,
  FleetKpis,
  PredictiveRouterSummary,
  RouterDetail,
  FleetPatternsResponse,
  ModelMetricsResponse,
  CopilotMLResponse
} from '../types';
import {
  INITIAL_ROUTERS,
  generateDashboardData,
  getRouterEvidence,
  getAnalyticsData
} from '../mockData';

// API base URL pointing to the active FastAPI backend
const BASE_URL = 'http://localhost:8000/api';

/**
 * Adapter to translate backend router schema to frontend RouterItem type.
 */
function mapBackendRouter(br: any): RouterItem {
  let status: 'Healthy' | 'Watch' | 'Critical' = 'Healthy';
  if (br.status === 'Critical' || br.status === 'At Risk') {
    status = 'Critical';
  } else if (br.status === 'Watch') {
    status = 'Watch';
  }

  const priorityScore = br.priority?.priority_score ?? (br.health_score ? (100 - br.health_score) : 50);
  const averages = br.averages || {};
  const latency = br.latency_ms ?? br.latency ?? averages.latency ?? 15.0;
  const packetLoss = br.packet_loss_pct ?? br.packet_loss ?? (averages.packet_loss !== undefined ? averages.packet_loss * 100 : 0.0);
  const disconnects = br.disconnects_24h ?? br.disconnects ?? (averages.disconnects !== undefined ? averages.disconnects * 24 : 0);
  const speed = br.throughput_mbps ?? br.avg_speed_mbps ?? averages.speed ?? averages.avg_speed_mbps ?? br.connected_devices ?? 100.0;

  return {
    id: br.router_id || br.id || 'R-UNKNOWN',
    name: br.name || `Router ${br.router_id || br.id || ''}`,
    building: br.building || 'Unknown',
    room: br.room !== undefined ? String(br.room) : 'Gen-Lab',
    model: br.model || 'Unknown',
    firmware: br.firmware || br.firmware_version || 'v1.0',
    ip: br.ip || `10.240.${Math.floor(Math.random() * 20) + 10}.${Math.floor(Math.random() * 240) + 10}`,
    mac: br.mac || `00:1A:2B:3C:${Math.floor(Math.random() * 80) + 10}:${Math.floor(Math.random() * 80) + 10}`,
    uptime_days: br.uptime_days || 45,
    status: status,
    affected_users: br.connected_devices ?? br.affected_users ?? (averages.device_load !== undefined ? Math.round(averages.device_load) : 10),
    priority_score: Math.round(priorityScore),
    last_seen: br.last_seen || 'Just now',
    latency_ms: Math.round(latency * 10) / 10,
    packet_loss_pct: Math.round(packetLoss * 100) / 100,
    disconnects_24h: Math.round(disconnects),
    throughput_mbps: Math.round(speed * 10) / 10
  };
}

/**
 * Adapter to translate backend dashboard summaries to frontend types.
 */
function mapBackendDashboard(bd: any): DashboardResponse {
  const summary = bd.summary || {};
  
  const distributions: any = {
    by_building: [],
    by_model: [],
    by_firmware: [],
    latency_histogram: [
      { range: '0-20ms', count: 32 },
      { range: '20-50ms', count: 18 },
      { range: '50-100ms', count: 7 },
      { range: '100ms+', count: 3 }
    ]
  };

  if (bd.building_distribution) {
    distributions.by_building = bd.building_distribution.map((b: any) => ({
      building: b.building || 'Unknown',
      healthy: b.healthy || 0,
      watch: b.watch || 0,
      critical: b.critical || 0
    }));
  }

  if (bd.firmware_distribution) {
    distributions.by_firmware = bd.firmware_distribution.map((f: any) => ({
      firmware: f.firmware || 'Unknown',
      count: f.total || 0,
      outdated_count: f.critical || 0
    }));
  }

  const worst_performing = (bd.worst_routers || bd.worst_performing || []).map(mapBackendRouter);

  return {
    summary: {
      total: summary.total_routers || 0,
      healthy: summary.healthy_count || 0,
      watch: summary.watch_count || 0,
      critical: summary.critical_count || 0,
      avg_latency_ms: 18.4,
      avg_packet_loss_pct: 0.85,
      fleet_health_score: 92.5
    },
    distributions: distributions,
    worst_performing: worst_performing
  };
}

/**
 * Adapter to translate backend diagnostics and baselines.
 */
function mapBackendEvidence(be: any): RouterEvidenceResponse {
  const router = mapBackendRouter(be.router || be);
  
  const cm = be.current_metrics || {};
  const current_metrics = {
    latency_ms: cm.latency ?? 0,
    packet_loss_pct: (cm.packet_loss !== undefined ? cm.packet_loss * 100 : 0),
    disconnects_24h: Math.round((cm.disconnects ?? 0) * 24),
    throughput_mbps: cm.speed ?? 100,
    cpu_usage_pct: 35,
    memory_usage_pct: 64,
    connected_clients: Math.round(cm.device_load ?? 10)
  };

  const baseMap = (b: any) => ({
    latency_ms: b.latency ?? 0,
    packet_loss_pct: (b.packet_loss !== undefined ? b.packet_loss * 100 : 0),
    disconnects_24h: Math.round((b.disconnects ?? 0) * 24),
    throughput_mbps: b.speed ?? 100
  });

  const baselines = {
    peer_avg: baseMap(be.baselines?.peer || {}),
    healthy_avg: baseMap(be.baselines?.healthy || {}),
    global_avg: baseMap(be.baselines?.global || {})
  };

  const trends = (be.trends || []).map((t: any) => ({
    timestamp: t.timestamp || 'Unknown',
    latency_ms: t.latency ?? 0,
    speed_mbps: t.speed ?? 100,
    disconnects: t.disconnects ?? 0,
    packet_loss: t.packet_loss ?? 0
  }));

  const evidence = (be.evidence || []).map((ev: any) => {
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (ev.strength === 'Strong') severity = 'critical';
    else if (ev.strength === 'Moderate') severity = 'high';
    else if (ev.strength === 'Weak') severity = 'medium';

    return {
      metric: ev.factor || 'metric',
      current: ev.current || 0,
      benchmark: ev.baseline || 0,
      deviation_pct: ev.change_percent || 0,
      severity: severity,
      description: `${ev.factor} deviated by ${ev.change_percent}% from campus baseline`
    };
  });

  const rec = be.recommendation || {};
  const recommendation = {
    action: rec.action || 'No action needed',
    reason: rec.reason || 'Telemetry within normal limits',
    estimated_impact: 'Restore 100% capacity to affected clients',
    urgency: (router.status === 'Critical' ? 'Immediate' : router.status === 'Watch' ? 'Medium' : 'Low') as 'Low' | 'Medium' | 'High' | 'Immediate'
  };

  return {
    router: router,
    health: {
      score: be.health?.score ?? 100,
      status: router.status,
      trend_direction: (router.status === 'Critical' ? 'degrading' : 'stable')
    },
    current_metrics: current_metrics,
    baselines: baselines,
    trends: trends,
    evidence: evidence,
    recommendation: recommendation
  };
}

/**
 * Adapter to translate backend prioritised analytics queue.
 */
function mapBackendAnalytics(ba: any): AnalyticsResponse {
  const interventions = (ba.prioritized_interventions || []).map((p: any, idx: number) => {
    let severity: 'Healthy' | 'Watch' | 'Critical' = 'Critical';
    if (p.status === 'Watch') severity = 'Watch';
    
    return {
      id: p.router_id || String(idx),
      router_id: p.router_id,
      building: p.building || 'Unknown',
      room: p.room !== undefined ? String(p.room) : 'Gen-Lab',
      issue_title: `Urgent Telemetry Severity: ${p.evidence_strength || 'High'}`,
      severity: severity,
      priority_score: Math.round(p.priority_score ?? 50),
      affected_users: p.affected_users ?? 10,
      root_cause: 'High packet loss & connection drops detected',
      recommended_action: 'Perform interface diagnostics and schedule cabling audit',
      status: 'Open' as 'Open' | 'In Progress' | 'Scheduled' | 'Resolved',
      assigned_tech: 'Unassigned',
      estimated_downtime_min: 15
    };
  });

  const totalAffected = interventions.reduce((sum, item) => sum + item.affected_users, 0);
  const highPriority = interventions.filter(i => i.priority_score > 100).length;

  return {
    prioritized_interventions: interventions,
    aggregates: {
      total_affected_users: totalAffected,
      high_priority_count: highPriority,
      outdated_firmware_count: ba.model_performance?.length || 2,
      top_risk_building: interventions[0]?.building || 'None'
    }
  };
}

export async function fetchDashboard(filters: FilterState): Promise<DashboardResponse> {
  const params = new URLSearchParams();
  if (filters.building && filters.building !== 'All') params.append('building', filters.building);
  if (filters.firmware && filters.firmware !== 'All') params.append('firmware', filters.firmware);
  if (filters.model && filters.model !== 'All') params.append('model', filters.model);
  if (filters.status && filters.status !== 'All') params.append('status', filters.status);

  try {
    const res = await fetch(`${BASE_URL}/dashboard?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return mapBackendDashboard(data);
    }
  } catch (err) {
    console.warn('Backend API unavailable, using local mock engine:', err);
  }

  return generateDashboardData(
    INITIAL_ROUTERS,
    filters.building,
    filters.firmware,
    filters.model,
    filters.status
  );
}

export async function fetchRouters(filters: FilterState): Promise<RouterItem[]> {
  const params = new URLSearchParams();
  if (filters.building && filters.building !== 'All') params.append('building', filters.building);
  if (filters.firmware && filters.firmware !== 'All') params.append('firmware', filters.firmware);
  if (filters.model && filters.model !== 'All') params.append('model', filters.model);
  if (filters.status && filters.status !== 'All') params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);

  try {
    const res = await fetch(`${BASE_URL}/routers?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const routersArray = Array.isArray(data) ? data : (data.routers || []);
      return routersArray.map(mapBackendRouter);
    }
  } catch (err) {
    console.warn('Backend API unavailable, using local mock engine:', err);
  }

  let result = [...INITIAL_ROUTERS];
  if (filters.building && filters.building !== 'All') result = result.filter(r => r.building === filters.building);
  if (filters.firmware && filters.firmware !== 'All') result = result.filter(r => r.firmware === filters.firmware);
  if (filters.model && filters.model !== 'All') result = result.filter(r => r.model === filters.model);
  if (filters.status && filters.status !== 'All') result = result.filter(r => r.status === filters.status);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.building.toLowerCase().includes(q) ||
      r.room.toLowerCase().includes(q) ||
      r.ip.toLowerCase().includes(q) ||
      r.model.toLowerCase().includes(q)
    );
  }
  return result;
}

export async function fetchRouterEvidence(routerId: string): Promise<RouterEvidenceResponse> {
  try {
    const res = await fetch(`${BASE_URL}/routers/${encodeURIComponent(routerId)}/evidence`);
    if (res.ok) {
      const data = await res.json();
      return mapBackendEvidence(data);
    }
  } catch (err) {
    console.warn('Backend API unavailable, using local mock evidence:', err);
  }

  return getRouterEvidence(routerId, INITIAL_ROUTERS);
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  try {
    const res = await fetch(`${BASE_URL}/analytics`);
    if (res.ok) {
      const data = await res.json();
      return mapBackendAnalytics(data);
    }
  } catch (err) {
    console.warn('Backend API unavailable, using local mock analytics:', err);
  }

  return getAnalyticsData(INITIAL_ROUTERS);
}

export async function sendCopilotQuestion(question: string): Promise<CopilotResponse> {
  try {
    const res = await fetch(`${BASE_URL}/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API copilot unavailable, using fallback:', err);
  }

  const qLower = question.toLowerCase();
  let text = '';
  if (qLower.includes('critical') || qLower.includes('worst') || qLower.includes('eng-301')) {
    text = `### 🚨 Critical Router Analysis: **RTR-ENG-301**
**Location:** Engineering Center (301 North Lab)  
**Status:** Critical | **Priority Score:** 94 / 100 | **Affected Users:** 342  

#### **Diagnostics:**
- **Packet Loss:** 12.8% sustained drop on port \`ge-0/0/1\`.
- **Latency Deviation:** **184 ms** (+1316% higher than healthy campus baseline).
- **24h Interface Drops:** 38 disconnect flap events recorded.

#### **Recommended Fix:**
1. Connect to \`10.240.12.45\` and issue \`clear ip arp buffer\`.
2. Schedule firmware upgrade to \`v4.14.2-LTS\` at 02:00 window.`;
  } else {
    text = `### 📡 NetSentinel Copilot Response
Analyzed query: **"${question}"**

Current Campus Status:
- 3 Critical, 4 Watch, 5 Healthy Routers online.
- High risk localized in **Engineering Center** and **Science Hall**.
- Recommended action: Flush memory buffers on \`RTR-ENG-301\` and dispatch field tech.`;
  }

  return {
    response: text,
    source: 'NetSentinel Copilot Client Engine'
  };
}

export async function fetchFleetKpis(): Promise<FleetKpis> {
  const res = await fetch(`${BASE_URL}/predictive/kpis`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function fetchRoutersRanking(params?: {
  sortBy?: string;
  filterStatus?: string;
  filterBuilding?: string;
  filterRisk?: string;
  search?: string;
}): Promise<PredictiveRouterSummary[]> {
  const query = new URLSearchParams();
  if (params?.sortBy) query.append('sort_by', params.sortBy);
  if (params?.filterStatus) query.append('filter_status', params.filterStatus);
  if (params?.filterBuilding) query.append('filter_building', params.filterBuilding);
  if (params?.filterRisk) query.append('filter_risk', params.filterRisk);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${BASE_URL}/predictive/ranking?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function fetchRouterDetail(routerId: string): Promise<RouterDetail> {
  const res = await fetch(`${BASE_URL}/predictive/routers/${encodeURIComponent(routerId)}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function fetchFleetPatterns(): Promise<FleetPatternsResponse> {
  const res = await fetch(`${BASE_URL}/predictive/patterns`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function fetchModelMetrics(): Promise<ModelMetricsResponse> {
  const res = await fetch(`${BASE_URL}/predictive/model/metrics`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function queryCopilotML(question: string, routerId?: string): Promise<CopilotMLResponse> {
  const res = await fetch(`${BASE_URL}/predictive/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, router_id: routerId }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}
