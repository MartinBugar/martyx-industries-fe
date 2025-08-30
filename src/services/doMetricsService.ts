import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

// Minimal wrapper for a DigitalOcean metrics endpoint (or any bandwidth provider).
// If the backend endpoint is unavailable, this function will return a friendly string.
export const doMetricsService = {
  async getBandwidthDaily(): Promise<unknown> {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/do/bandwidth-daily`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));
      // If the endpoint exists, parse and return structured data
      return await handleResponse(resp);
    } catch {
      console.warn('Bandwidth endpoint not available, returning placeholder');
      return 'Bandwidth metrics not available';
    }
  },
};
