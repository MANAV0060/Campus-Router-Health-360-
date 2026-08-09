import type {
  RouterSummary,
  RouterDetail,
  FleetKpis,
  FleetPatternsResponse,
  CopilotResponse,
  ModelMetricsResponse
} from '../types';
import { API_BASE_URL } from './config';

export async function fetchFleetKpis(): Promise<FleetKpis> {
  const res = await fetch(`${API_BASE_URL}/predictive/kpis`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function fetchRoutersRanking(params?: {
  sortBy?: string;
  filterStatus?: string;
  filterBuilding?: string;
  filterRisk?: string;
  search?: string;
}): Promise<RouterSummary[]> {
  const query = new URLSearchParams();
  if (params?.sortBy) query.append('sort_by', params.sortBy);
  if (params?.filterStatus) query.append('filter_status', params.filterStatus);
  if (params?.filterBuilding) query.append('filter_building', params.filterBuilding);
  if (params?.filterRisk) query.append('filter_risk', params.filterRisk);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE_URL}/predictive/ranking?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function fetchRouterDetail(routerId: string): Promise<RouterDetail> {
  const res = await fetch(`${API_BASE_URL}/predictive/routers/${encodeURIComponent(routerId)}`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function fetchFleetPatterns(): Promise<FleetPatternsResponse> {
  const res = await fetch(`${API_BASE_URL}/predictive/patterns`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function fetchModelMetrics(): Promise<ModelMetricsResponse> {
  const res = await fetch(`${API_BASE_URL}/predictive/model/metrics`);
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}

export async function queryCopilot(question: string, routerId?: string): Promise<CopilotResponse> {
  const res = await fetch(`${API_BASE_URL}/predictive/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, router_id: routerId }),
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  return res.json();
}
