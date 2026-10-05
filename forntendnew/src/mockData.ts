import {
  RouterItem,
  DashboardResponse,
  RouterEvidenceResponse,
  AnalyticsResponse,
  PrioritizedIntervention
} from './types';

export const INITIAL_ROUTERS: RouterItem[] = [
  {
    id: 'RTR-ENG-301',
    name: 'Engineering Core Node Alpha',
    building: 'Engineering Center',
    room: '301 North Lab',
    model: 'Cisco Catalyst 9300X',
    firmware: 'v4.12.1-LTS',
    ip: '10.240.12.45',
    mac: '74:83:C2:90:11:A4',
    uptime_days: 142,
    status: 'Critical',
    affected_users: 342,
    priority_score: 94,
    last_seen: '2 mins ago',
    latency_ms: 184,
    packet_loss_pct: 12.8,
    disconnects_24h: 38,
    throughput_mbps: 240
  },
  {
    id: 'RTR-SCI-104',
    name: 'Science Hall Main Gateway',
    building: 'Science Hall',
    room: '104 Server Closet',
    model: 'Juniper EX4400',
    firmware: 'v3.9.4-VULN',
    ip: '10.240.18.12',
    mac: 'AC:4B:C8:11:88:F2',
    uptime_days: 88,
    status: 'Critical',
    affected_users: 289,
    priority_score: 89,
    last_seen: 'Just now',
    latency_ms: 142,
    packet_loss_pct: 9.4,
    disconnects_24h: 27,
    throughput_mbps: 310
  },
  {
    id: 'RTR-LIB-202',
    name: 'Library Quiet Zone Distribution',
    building: 'Library Annex',
    room: '202 Study Mezzanine',
    model: 'Aruba CX 6300',
    firmware: 'v4.10.0-DEPR',
    ip: '10.240.32.88',
    mac: '00:1B:44:11:3A:09',
    uptime_days: 210,
    status: 'Watch',
    affected_users: 175,
    priority_score: 72,
    last_seen: '1 min ago',
    latency_ms: 68,
    packet_loss_pct: 3.2,
    disconnects_24h: 12,
    throughput_mbps: 620
  },
  {
    id: 'RTR-STU-101',
    name: 'Student Union Atrium AP Switch',
    building: 'Student Union',
    room: '101 Concourse Level',
    model: 'Ubiquiti UniFi Enterprise XG',
    firmware: 'v5.1.0-STABLE',
    ip: '10.240.40.15',
    mac: 'B8:27:EB:A9:12:33',
    uptime_days: 64,
    status: 'Watch',
    affected_users: 410,
    priority_score: 68,
    last_seen: 'Just now',
    latency_ms: 54,
    packet_loss_pct: 2.1,
    disconnects_24h: 8,
    throughput_mbps: 850
  },
  {
    id: 'RTR-TCH-405',
    name: 'Tech Tower Innovation Hub',
    building: 'Tech Tower',
    room: '405 Robotics Lab',
    model: 'Cisco Catalyst 9300X',
    firmware: 'v4.14.2-LTS',
    ip: '10.240.52.10',
    mac: '74:83:C2:88:EE:11',
    uptime_days: 18,
    status: 'Healthy',
    affected_users: 120,
    priority_score: 18,
    last_seen: '3 mins ago',
    latency_ms: 12,
    packet_loss_pct: 0.1,
    disconnects_24h: 0,
    throughput_mbps: 980
  },
  {
    id: 'RTR-MED-210',
    name: 'Medical Center Bio-Research Relay',
    building: 'Medical Research Center',
    room: '210 Cryo Core',
    model: 'Juniper EX4400',
    firmware: 'v4.14.2-LTS',
    ip: '10.240.64.04',
    mac: 'AC:4B:C8:90:77:E1',
    uptime_days: 305,
    status: 'Critical',
    affected_users: 198,
    priority_score: 91,
    last_seen: '4 mins ago',
    latency_ms: 210,
    packet_loss_pct: 14.2,
    disconnects_24h: 41,
    throughput_mbps: 180
  },
  {
    id: 'RTR-HUM-108',
    name: 'Humanities Auditorium Hub',
    building: 'Humanities Building',
    room: '108 Lecture Hall B',
    model: 'Aruba CX 6300',
    firmware: 'v4.12.1-LTS',
    ip: '10.240.70.33',
    mac: '00:1B:44:88:99:AA',
    uptime_days: 92,
    status: 'Healthy',
    affected_users: 85,
    priority_score: 22,
    last_seen: '1 min ago',
    latency_ms: 15,
    packet_loss_pct: 0.2,
    disconnects_24h: 1,
    throughput_mbps: 910
  },
  {
    id: 'RTR-ATH-101',
    name: 'Athletics Complex Arena Switch',
    building: 'Athletics Complex',
    room: '101 Press Box',
    model: 'Ubiquiti UniFi Enterprise XG',
    firmware: 'v3.9.4-VULN',
    ip: '10.240.82.19',
    mac: 'B8:27:EB:CC:33:12',
    uptime_days: 12,
    status: 'Watch',
    affected_users: 320,
    priority_score: 64,
    last_seen: '5 mins ago',
    latency_ms: 62,
    packet_loss_pct: 3.8,
    disconnects_24h: 15,
    throughput_mbps: 540
  },
  {
    id: 'RTR-ADM-012',
    name: 'Admin East Fiber Concentrator',
    building: 'Admin East',
    room: '012 MDF Vault',
    model: 'Cisco Catalyst 9300X',
    firmware: 'v4.14.2-LTS',
    ip: '10.240.05.02',
    mac: '74:83:C2:11:44:88',
    uptime_days: 410,
    status: 'Healthy',
    affected_users: 65,
    priority_score: 12,
    last_seen: 'Just now',
    latency_ms: 9,
    packet_loss_pct: 0.0,
    disconnects_24h: 0,
    throughput_mbps: 995
  },
  {
    id: 'RTR-ENG-102',
    name: 'Engineering South CAD Lab',
    building: 'Engineering Center',
    room: '102 CAD Studio',
    model: 'Aruba CX 6300',
    firmware: 'v4.10.0-DEPR',
    ip: '10.240.12.90',
    mac: '00:1B:44:22:55:77',
    uptime_days: 155,
    status: 'Watch',
    affected_users: 140,
    priority_score: 58,
    last_seen: '2 mins ago',
    latency_ms: 48,
    packet_loss_pct: 1.9,
    disconnects_24h: 7,
    throughput_mbps: 710
  },
  {
    id: 'RTR-SCI-204',
    name: 'Science Physics Particle Sim Network',
    building: 'Science Hall',
    room: '204 High Performance Room',
    model: 'Cisco Catalyst 9300X',
    firmware: 'v4.14.2-LTS',
    ip: '10.240.18.99',
    mac: '74:83:C2:55:00:11',
    uptime_days: 45,
    status: 'Healthy',
    affected_users: 50,
    priority_score: 15,
    last_seen: '1 min ago',
    latency_ms: 11,
    packet_loss_pct: 0.1,
    disconnects_24h: 0,
    throughput_mbps: 990
  },
  {
    id: 'RTR-LIB-105',
    name: 'Library Ground Floor Public Terminals',
    building: 'Library Annex',
    room: '105 East Commons',
    model: 'Netgear ProSAFE M4300',
    firmware: 'v3.9.4-VULN',
    ip: '10.240.32.14',
    mac: '10:DA:43:88:22:11',
    uptime_days: 31,
    status: 'Watch',
    affected_users: 210,
    priority_score: 61,
    last_seen: 'Just now',
    latency_ms: 59,
    packet_loss_pct: 2.8,
    disconnects_24h: 11,
    throughput_mbps: 590
  }
];

export function generateDashboardData(
  routers: RouterItem[],
  buildingFilter?: string,
  firmwareFilter?: string,
  modelFilter?: string,
  statusFilter?: string
): DashboardResponse {
  let filtered = [...routers];

  if (buildingFilter && buildingFilter !== 'All') {
    filtered = filtered.filter(r => r.building === buildingFilter);
  }
  if (firmwareFilter && firmwareFilter !== 'All') {
    filtered = filtered.filter(r => r.firmware === firmwareFilter);
  }
  if (modelFilter && modelFilter !== 'All') {
    filtered = filtered.filter(r => r.model === modelFilter);
  }
  if (statusFilter && statusFilter !== 'All') {
    filtered = filtered.filter(r => r.status === statusFilter);
  }

  const total = filtered.length;
  const healthy = filtered.filter(r => r.status === 'Healthy').length;
  const watch = filtered.filter(r => r.status === 'Watch').length;
  const critical = filtered.filter(r => r.status === 'Critical').length;

  const avgLatency = total > 0
    ? Math.round(filtered.reduce((sum, r) => sum + r.latency_ms, 0) / total)
    : 0;

  const avgLoss = total > 0
    ? Number((filtered.reduce((sum, r) => sum + r.packet_loss_pct, 0) / total).toFixed(1))
    : 0;

  const fleetHealth = total > 0
    ? Math.round(((healthy * 100) + (watch * 60) + (critical * 10)) / total)
    : 100;

  // Building Distribution
  const buildingsMap = new Map<string, { healthy: number; watch: number; critical: number }>();
  filtered.forEach(r => {
    const curr = buildingsMap.get(r.building) || { healthy: 0, watch: 0, critical: 0 };
    if (r.status === 'Healthy') curr.healthy++;
    else if (r.status === 'Watch') curr.watch++;
    else if (r.status === 'Critical') curr.critical++;
    buildingsMap.set(r.building, curr);
  });

  const by_building = Array.from(buildingsMap.entries()).map(([building, counts]) => ({
    building,
    ...counts
  }));

  // Model distribution
  const modelMap = new Map<string, { count: number; healthy: number }>();
  filtered.forEach(r => {
    const curr = modelMap.get(r.model) || { count: 0, healthy: 0 };
    curr.count++;
    if (r.status === 'Healthy') curr.healthy++;
    modelMap.set(r.model, curr);
  });

  const by_model = Array.from(modelMap.entries()).map(([model, info]) => ({
    model,
    count: info.count,
    health_pct: info.count > 0 ? Math.round((info.healthy / info.count) * 100) : 0
  }));

  // Firmware distribution
  const firmwareMap = new Map<string, { count: number; outdated: number }>();
  filtered.forEach(r => {
    const curr = firmwareMap.get(r.firmware) || { count: 0, outdated: 0 };
    curr.count++;
    if (r.firmware.includes('VULN') || r.firmware.includes('DEPR')) {
      curr.outdated++;
    }
    firmwareMap.set(r.firmware, curr);
  });

  const by_firmware = Array.from(firmwareMap.entries()).map(([firmware, info]) => ({
    firmware,
    count: info.count,
    outdated_count: info.outdated
  }));

  // Latency Histogram
  const latency_histogram = [
    { range: '0-20ms', count: filtered.filter(r => r.latency_ms <= 20).length },
    { range: '21-50ms', count: filtered.filter(r => r.latency_ms > 20 && r.latency_ms <= 50).length },
    { range: '51-100ms', count: filtered.filter(r => r.latency_ms > 50 && r.latency_ms <= 100).length },
    { range: '101-150ms', count: filtered.filter(r => r.latency_ms > 100 && r.latency_ms <= 150).length },
    { range: '>150ms', count: filtered.filter(r => r.latency_ms > 150).length }
  ];

  const worst_performing = [...filtered]
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 5);

  return {
    summary: {
      total,
      healthy,
      watch,
      critical,
      avg_latency_ms: avgLatency,
      avg_packet_loss_pct: avgLoss,
      fleet_health_score: fleetHealth
    },
    distributions: {
      by_building,
      by_model,
      by_firmware,
      latency_histogram
    },
    worst_performing
  };
}

export function getRouterEvidence(routerId: string, allRouters: RouterItem[]): RouterEvidenceResponse {
  const router = allRouters.find(r => r.id === routerId) || allRouters[0];

  const isCritical = router.status === 'Critical';
  const isWatch = router.status === 'Watch';

  // Current metrics based on router status
  const current_metrics = {
    latency_ms: router.latency_ms,
    packet_loss_pct: router.packet_loss_pct,
    disconnects_24h: router.disconnects_24h,
    throughput_mbps: router.throughput_mbps,
    cpu_usage_pct: isCritical ? 92 : isWatch ? 68 : 28,
    memory_usage_pct: isCritical ? 88 : isWatch ? 64 : 35,
    connected_clients: isCritical ? 342 : isWatch ? 180 : 95
  };

  const baselines = {
    peer_avg: {
      latency_ms: 22,
      packet_loss_pct: 0.4,
      disconnects_24h: 2,
      throughput_mbps: 850
    },
    healthy_avg: {
      latency_ms: 12,
      packet_loss_pct: 0.1,
      disconnects_24h: 0,
      throughput_mbps: 960
    },
    global_avg: {
      latency_ms: 35,
      packet_loss_pct: 1.1,
      disconnects_24h: 4,
      throughput_mbps: 780
    }
  };

  // Generate 24h trend hourly points
  const trends = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60 * 60 * 1000);
    const timeStr = `${t.getHours().toString().padStart(2, '0')}:00`;
    
    // add drift towards current value
    const factor = (24 - i) / 24;
    const lat = Math.max(10, Math.round(15 + (router.latency_ms - 15) * Math.pow(factor, 1.5) + (Math.random() * 8 - 4)));
    const loss = Math.max(0, Number((0.1 + (router.packet_loss_pct - 0.1) * Math.pow(factor, 1.8) + (Math.random() * 0.4 - 0.2)).toFixed(1)));
    const disc = Math.max(0, Math.round(router.disconnects_24h * Math.pow(factor, 2) / 4 + (Math.random() * 2)));
    const speed = Math.min(1000, Math.max(100, Math.round(980 - (980 - router.throughput_mbps) * factor + (Math.random() * 40 - 20))));

    trends.push({
      timestamp: timeStr,
      latency_ms: lat,
      speed_mbps: speed,
      disconnects: disc,
      packet_loss: loss
    });
  }

  // Evidence list calculation comparing against healthy benchmark
  const latDev = Math.round(((router.latency_ms - baselines.healthy_avg.latency_ms) / baselines.healthy_avg.latency_ms) * 100);
  const lossDev = Math.round(((router.packet_loss_pct - baselines.healthy_avg.packet_loss_pct) / (baselines.healthy_avg.packet_loss_pct || 0.1)) * 100);
  const discDev = router.disconnects_24h > 0 ? router.disconnects_24h * 100 : 0;

  const evidence = [
    {
      metric: 'Round-Trip Latency',
      current: `${router.latency_ms} ms`,
      benchmark: `${baselines.healthy_avg.latency_ms} ms`,
      deviation_pct: Math.min(latDev, 1000),
      severity: isCritical ? ('critical' as const) : isWatch ? ('high' as const) : ('low' as const),
      description: `Latency exceeds healthy campus baseline by ${latDev}%.`
    },
    {
      metric: 'Packet Loss Rate',
      current: `${router.packet_loss_pct}%`,
      benchmark: `${baselines.healthy_avg.packet_loss_pct}%`,
      deviation_pct: Math.min(lossDev, 1000),
      severity: isCritical ? ('critical' as const) : isWatch ? ('medium' as const) : ('low' as const),
      description: `Sustained buffer drops under load causing TCP retransmissions.`
    },
    {
      metric: '24h Disconnect Events',
      current: `${router.disconnects_24h} drops`,
      benchmark: `0 drops`,
      deviation_pct: Math.min(discDev, 1000),
      severity: isCritical ? ('critical' as const) : isWatch ? ('high' as const) : ('low' as const),
      description: `Interface flap count logged across trunk interface ge-0/0/1.`
    },
    {
      metric: 'Throughput Degradation',
      current: `${router.throughput_mbps} Mbps`,
      benchmark: `${baselines.healthy_avg.throughput_mbps} Mbps`,
      deviation_pct: Math.round(((baselines.healthy_avg.throughput_mbps - router.throughput_mbps) / baselines.healthy_avg.throughput_mbps) * 100),
      severity: isCritical ? ('high' as const) : isWatch ? ('medium' as const) : ('low' as const),
      description: `Bandwidth throttled due to high CPU queue depth (${current_metrics.cpu_usage_pct}%).`
    }
  ];

  const action = isCritical
    ? `Emergency Firmware Patch & VLAN Buffer Realignment for ${router.model}`
    : isWatch
    ? `Schedule Optics Cleaning & Hot-Swap Power Unit Inspection`
    : `Routine Preventive Maintenance & Log Rollover`;

  const reason = isCritical
    ? `High priority anomaly: ${router.packet_loss_pct}% packet loss and ${router.disconnects_24h} interface drops impacting ${router.affected_users} connected users in ${router.building}.`
    : isWatch
    ? `Intermittent jitter and packet drift detected on firmware ${router.firmware}. Risk of degradation during peak class hours.`
    : `Operating within nominal tolerances. All telemetry lines match healthy baselines.`;

  return {
    router,
    health: {
      score: 100 - router.priority_score,
      status: router.status,
      trend_direction: isCritical ? 'degrading' : isWatch ? 'degrading' : 'stable'
    },
    current_metrics,
    baselines,
    trends,
    evidence,
    recommendation: {
      action,
      reason,
      estimated_impact: `Restores ~${Math.round(router.throughput_mbps * 2.5)} Mbps bandwidth for ${router.affected_users} users`,
      urgency: isCritical ? 'Immediate' : isWatch ? 'High' : 'Low'
    }
  };
}

export function getAnalyticsData(routers: RouterItem[]): AnalyticsResponse {
  const criticalAndWatch = routers.filter(r => r.status !== 'Healthy');
  
  const prioritized_interventions: PrioritizedIntervention[] = criticalAndWatch.map((r, idx) => ({
    id: `INT-${1000 + idx}`,
    router_id: r.id,
    building: r.building,
    room: r.room,
    issue_title: r.status === 'Critical'
      ? `Severe Buffer Drops & High Latency (${r.latency_ms}ms)`
      : `Firmware Deprecation & Intermittent Jitter`,
    severity: r.status,
    priority_score: r.priority_score,
    affected_users: r.affected_users,
    root_cause: r.firmware.includes('VULN') || r.firmware.includes('DEPR')
      ? `Outdated firmware (${r.firmware}) memory leak in ARP table buffer.`
      : `Transceiver optical degradation or SFP thermal throttling.`,
    recommended_action: r.status === 'Critical'
      ? `Dispatch IT Technician for SFP module replacement & force update to v4.14.2-LTS.`
      : `Schedule off-hours firmware upgrade window and port reboot.`,
    status: (idx === 0 ? 'In Progress' : idx === 1 ? 'Open' : 'Scheduled') as 'Open' | 'In Progress' | 'Scheduled' | 'Resolved',
    assigned_tech: ['Alex Vance (Tier 3)', 'Marcus Chen (Lead)', 'Sarah Jenkins (NetOps)', 'David Ross (Field Tech)'][idx % 4],
    estimated_downtime_min: r.status === 'Critical' ? 15 : 5
  })).sort((a, b) => b.priority_score - a.priority_score);

  const total_affected_users = criticalAndWatch.reduce((acc, r) => acc + r.affected_users, 0);
  const high_priority_count = prioritized_interventions.filter(i => i.priority_score >= 70).length;
  const outdated_firmware_count = routers.filter(r => r.firmware.includes('VULN') || r.firmware.includes('DEPR')).length;
  
  // Find top risk building
  const buildingRiskMap = new Map<string, number>();
  criticalAndWatch.forEach(r => {
    const current = buildingRiskMap.get(r.building) || 0;
    buildingRiskMap.set(r.building, current + r.priority_score);
  });
  let topRiskBuilding = 'Engineering Center';
  let maxRisk = 0;
  buildingRiskMap.forEach((risk, bld) => {
    if (risk > maxRisk) {
      maxRisk = risk;
      topRiskBuilding = bld;
    }
  });

  return {
    prioritized_interventions,
    aggregates: {
      total_affected_users,
      high_priority_count,
      outdated_firmware_count,
      top_risk_building: topRiskBuilding
    }
  };
}
