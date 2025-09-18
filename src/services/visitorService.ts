import { API_BASE_URL, defaultHeaders, withLangHeaders } from './apiUtils';

// Response interfaces
export interface VisitorCountResponse {
  totalCount: number;
  todayCount: number;
}

export interface VisitorDailyData {
  date: string; // YYYY-MM-DD format
  count: number;
  uniqueCount: number;
}

export interface VisitorLocationStats {
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
}

export interface VisitorAnalytics {
  totalVisits: number;
  todayVisits: number;
  dailyData: VisitorDailyData[]; // Last 30 days
  topCountries: VisitorLocationStats[]; // Top 10 countries
  lastUpdated: string;
}

// Track visit request interface
export interface TrackVisitRequest {
  userAgent?: string;
  referrer?: string;
  language?: string;
  screenResolution?: string;
  timezone?: string;
}

export const visitorService = {
  // Track a single visit - called once per session
  async trackVisit(): Promise<VisitorCountResponse | null> {
    try {
      // Gather browser information
      const trackData: TrackVisitRequest = {
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const resp = await fetch(`${API_BASE_URL}/api/meta/visits/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': navigator.language || 'en'
        },
        body: JSON.stringify(trackData)
      });

      if (!resp.ok) {
        console.warn('Visit tracking failed:', resp.status, resp.statusText);
        return null;
      }

      const data = await resp.json();
      return data as VisitorCountResponse;
    } catch (e) {
      console.warn('Visitor tracking failed:', e);
      return null;
    }
  },

  // Get current visitor statistics
  async getVisitorCount(): Promise<VisitorCountResponse> {
    try {
      console.log('🔍 getVisitorCount: Authorization header =', defaultHeaders['Authorization'] ? 'Present' : 'Missing');
      
      const resp = await fetch(`${API_BASE_URL}/api/admin/visits/count`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      console.log('🔍 getVisitorCount: Response status =', resp.status);

      if (!resp.ok) {
        const errorText = await resp.text();
        console.warn('Failed to fetch visitor count:', resp.status, resp.statusText, 'Response:', errorText);
        return { totalCount: 0, todayCount: 0 };
      }

      const data = await resp.json();
      console.log('🔍 getVisitorCount: Success data =', data);
      return data as VisitorCountResponse;
    } catch (e) {
      console.warn('Visitor count failed:', e);
      return { totalCount: 0, todayCount: 0 };
    }
  },

  // Get daily visitor data for the last N days
  async getVisitorDailyData(days: number = 30): Promise<VisitorDailyData[]> {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/admin/visits/daily?days=${encodeURIComponent(days)}`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      if (!resp.ok) {
        console.warn('Failed to fetch daily visitor data:', resp.status, resp.statusText);
        return this.generateEmptyDailyData(days);
      }

      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        return data as VisitorDailyData[];
      }

      return this.generateEmptyDailyData(days);
    } catch (err) {
      console.warn('Failed to get daily visitor data:', err);
      return this.generateEmptyDailyData(days);
    }
  },

  // Get visitor location statistics
  async getVisitorLocationStats(): Promise<VisitorLocationStats[]> {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/admin/visits/locations`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      if (!resp.ok) {
        console.warn('Failed to fetch location stats:', resp.status, resp.statusText);
        return [];
      }

      const data = await resp.json();
      return Array.isArray(data) ? data as VisitorLocationStats[] : [];
    } catch (err) {
      console.warn('Failed to get location stats:', err);
      return [];
    }
  },

  // Get complete analytics data
  async getVisitorAnalytics(days: number = 30): Promise<VisitorAnalytics> {
    try {
      const [countData, dailyData, locationData] = await Promise.all([
        this.getVisitorCount(),
        this.getVisitorDailyData(days),
        this.getVisitorLocationStats()
      ]);

      return {
        totalVisits: countData.totalCount,
        todayVisits: countData.todayCount,
        dailyData,
        topCountries: locationData.slice(0, 10), // Top 10 countries
        lastUpdated: new Date().toISOString()
      };
    } catch (err) {
      console.warn('Failed to get visitor analytics:', err);
      return {
        totalVisits: 0,
        todayVisits: 0,
        dailyData: this.generateEmptyDailyData(days),
        topCountries: [],
        lastUpdated: new Date().toISOString()
      };
    }
  },

  // Generate empty daily data structure for fallback
  generateEmptyDailyData(days: number): VisitorDailyData[] {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const emptyData: VisitorDailyData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD format
      emptyData.push({
        date: dateStr,
        count: 0,
        uniqueCount: 0
      });
    }
    return emptyData;
  }
};