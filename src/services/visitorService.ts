import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

export interface VisitorCountResponse {
  totalCount: number;
}

export interface VisitorTimeSeriesPoint {
  timestamp: string; // ISO date-time string
  count: number;     // visits during bucket
}

export interface Visitor {
  id: string | number;
  totalCount: number;
  lastVisitAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export const visitorService = {
  // Public endpoint: increments the counter and returns the current count
  async trackVisit(): Promise<VisitorCountResponse> {
    const resp = await fetch(`${API_BASE_URL}/api/visit`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
    });
    return await handleResponse(resp) as VisitorCountResponse;
  },

  // Admin endpoint: returns current total count
  async getVisitorCount(): Promise<VisitorCountResponse> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visitors/count`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    return await handleResponse(resp) as VisitorCountResponse;
  },

  // Admin endpoint: returns time series of visits (default: last 30 days)
  async getVisitorTimeSeries(days: number = 30): Promise<VisitorTimeSeriesPoint[]> {
    const url = `${API_BASE_URL}/api/admin/visitors/timeseries?days=${encodeURIComponent(days)}`;
    const resp = await fetch(url, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    const data = await handleResponse(resp);
    // Expecting an array of { timestamp, count }
    return Array.isArray(data) ? (data as VisitorTimeSeriesPoint[]) : [];
  },

  // Admin endpoint: returns all visitor records
  async getAllVisitors(): Promise<Visitor[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visitors`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    const data = await handleResponse(resp);
    return Array.isArray(data) ? (data as Visitor[]) : [];
  }
};
