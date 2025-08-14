import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

export type BandwidthDailyResponse = unknown; // Backend returns JSON string; keep flexible

export const doMetricsService = {
  async getBandwidthDaily(date?: string | Date): Promise<BandwidthDailyResponse> {
    let url = `${API_BASE_URL}/api/do/bandwidth-daily`;
    if (date) {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (!Number.isNaN(d.getTime())) {
        const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        url += `?date=${encodeURIComponent(isoDate)}`;
      }
    }

    const resp = await fetch(url, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });
    return await handleResponse(resp) as BandwidthDailyResponse;
  }
};
