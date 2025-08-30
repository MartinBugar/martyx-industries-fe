import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

export interface VisitorCountResponse {
  totalCount: number;
}

export interface VisitorTimeSeriesPoint {
  timestamp: string; // ISO date-time string
  count: number;     // visits during bucket
}

// Legacy Visitor shape kept for compatibility with any older endpoints if needed
export interface Visitor {
  id: string | number;
  totalCount: number;
  lastVisitAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

// Visit entity aligned with backend `Visit` (visitedAt + optional meta)
export interface Visit {
  id: string | number;
  visitedAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  path?: string | null;
  referrer?: string | null;
  user?: unknown;
  [key: string]: unknown;
}

export const visitorService = {
  // Track a visit via admin-protected endpoint. Swallow auth errors to avoid affecting user session.
  async trackVisit(): Promise<VisitorCountResponse | null> {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/admin/visits/track`, withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
      }));
      if (!resp.ok) {
        // Do not use global handleResponse here to avoid clearing tokens on 401 from this endpoint
        return null;
      }
      // Best-effort parse
      const data = await resp.json().catch(() => null);
      return (data as VisitorCountResponse) ?? null;
    } catch (e) {
      console.warn('Visitor tracking failed:', e);
      return null;
    }
  },

  // Admin endpoint: returns current total count
  async getVisitorCount(): Promise<VisitorCountResponse> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visitors/count`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as VisitorCountResponse;
  },

  // Admin endpoint: returns time series of visits (default: last 30 days)
  async getVisitorTimeSeries(days: number = 30): Promise<VisitorTimeSeriesPoint[]> {
    try {
      // Fetch all Visit records (admin-only endpoint)
      const visits = await this.getAllVisits();

      // Prepare day buckets for the last `days` days (including today)
      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const dayKeys: string[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(startOfToday);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        dayKeys.push(key);
      }

      // Initialize counts map with zeros for continuity in the chart
      const counts = new Map<string, number>();
      dayKeys.forEach(k => counts.set(k, 0));

      // Aggregate by local date key using `visitedAt`
      for (const v of visits) {
        const ts = (v as Visit).visitedAt as string | undefined;
        if (!ts) continue;
        const dt = new Date(ts);
        if (!Number.isFinite(dt.getTime())) continue;
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        if (counts.has(key)) {
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      }

      // Build the result with timestamps at local midnight for each day bucket
      const series: VisitorTimeSeriesPoint[] = dayKeys.map(k => {
        const [Y, M, D] = k.split('-').map(Number);
        const localMidnight = new Date(Y, (M as number) - 1, D as number, 0, 0, 0, 0);
        return {
          timestamp: localMidnight.toISOString(),
          count: counts.get(k) || 0,
        };
      });

      return series;
    } catch (err) {
      console.error('Failed to compute visitor time series from visits. Trying legacy endpoint...', err);
      // Fallback to legacy timeseries endpoint if available
      const url = `${API_BASE_URL}/api/admin/visitors/timeseries?days=${encodeURIComponent(days)}`;
      const resp = await fetch(url, {
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      });
      const data = await handleResponse(resp);
      return Array.isArray(data) ? (data as VisitorTimeSeriesPoint[]) : [];
    }
  },

  // Admin endpoint: returns all Visit records
  async getAllVisits(): Promise<Visit[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visits`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    const data = await handleResponse(resp);
    return Array.isArray(data) ? (data as Visit[]) : [];
  },

  // Legacy: Admin endpoint returning generic visitors (kept for compatibility if used elsewhere)
  async getAllVisitors(): Promise<Visitor[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visitors`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    const data = await handleResponse(resp);
    return Array.isArray(data) ? (data as Visitor[]) : [];
  }
};
