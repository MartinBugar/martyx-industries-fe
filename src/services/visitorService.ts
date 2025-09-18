import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

// Enhanced visitor data types
export interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  language: string;
  cookiesEnabled: boolean;
  screenResolution: string;
  timezone: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone: string;
}

export interface PageView {
  path: string;
  title: string;
  referrer?: string;
  timestamp: string;
  timeOnPage?: number;
  scrollDepth?: number;
}

export interface VisitorSession {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  pageViews: PageView[];
  totalPageViews: number;
  bounceRate: boolean;
  exitPage?: string;
}

export interface EnhancedVisitorData {
  sessionId: string;
  visitorId: string;
  ipAddress?: string;
  userAgent: string;
  browserInfo: BrowserInfo;
  deviceInfo: DeviceInfo;
  locationInfo?: LocationInfo;
  entryPage: string;
  exitPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sessionDuration?: number;
  pageViews: PageView[];
  totalClicks: number;
  scrollDepth: number;
  timestamp: string;
}

export interface VisitorAnalytics {
  totalVisitors: number;
  uniqueVisitors: number;
  totalPageViews: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number; }>;
  topReferrers: Array<{ referrer: string; count: number; }>;
  browserStats: Array<{ browser: string; count: number; percentage: number; }>;
  deviceStats: Array<{ device: string; count: number; percentage: number; }>;
  countryStats: Array<{ country: string; count: number; percentage: number; }>;
  trafficSources: Array<{ source: string; count: number; percentage: number; }>;
  hourlyDistribution: Array<{ hour: number; count: number; }>;
  dailyDistribution: Array<{ day: string; count: number; }>;
  conversionMetrics: {
    cartAdds: number;
    checkoutStarts: number;
    purchases: number;
    conversionRate: number;
  };
}

export interface RealTimeData {
  activeVisitors: number;
  currentPageViews: Array<{ page: string; count: number; }>;
  recentVisitors: Array<{
    id: string;
    country?: string;
    page: string;
    timestamp: string;
    device: string;
  }>;
  trafficSources: Array<{ source: string; count: number; }>;
}

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

// Utility functions for visitor data collection
const getBrowserInfo = (): BrowserInfo => {
  const ua = navigator.userAgent;
  const language = navigator.language;
  const cookiesEnabled = navigator.cookieEnabled;
  const screenResolution = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Simple browser detection
  let browser = 'Unknown';
  let version = '';
  let platform = navigator.platform;

  if (ua.includes('Chrome')) {
    browser = 'Chrome';
    const match = ua.match(/Chrome\/([\d.]+)/);
    version = match ? match[1] : '';
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox';
    const match = ua.match(/Firefox\/([\d.]+)/);
    version = match ? match[1] : '';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari';
    const match = ua.match(/Version\/([\d.]+)/);
    version = match ? match[1] : '';
  } else if (ua.includes('Edge')) {
    browser = 'Edge';
    const match = ua.match(/Edge\/([\d.]+)/);
    version = match ? match[1] : '';
  }

  return {
    name: browser,
    version,
    platform,
    language,
    cookiesEnabled,
    screenResolution,
    timezone
  };
};

const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent;
  const isMobile = /Mobi|Android/i.test(ua);
  const isTablet = /Tablet|iPad/i.test(ua);
  const isDesktop = !isMobile && !isTablet;

  let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (isMobile) type = 'mobile';
  else if (isTablet) type = 'tablet';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';

  return {
    type,
    os,
    isMobile,
    isTablet,
    isDesktop
  };
};

const getUTMParameters = (): { utmSource?: string; utmMedium?: string; utmCampaign?: string; } => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utmSource: urlParams.get('utm_source') || undefined,
    utmMedium: urlParams.get('utm_medium') || undefined,
    utmCampaign: urlParams.get('utm_campaign') || undefined
  };
};

const generateVisitorId = (): string => {
  // Generate or retrieve visitor ID from localStorage
  const existingId = localStorage.getItem('visitor_id');
  if (existingId) return existingId;

  const newId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('visitor_id', newId);
  return newId;
};

const generateSessionId = (): string => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Enhanced visitor tracking class
class VisitorTracker {
  private sessionId: string;
  private visitorId: string;
  private sessionStart: number;
  private pageViews: PageView[] = [];
  private totalClicks = 0;
  private maxScrollDepth = 0;
  private currentPageStart: number = Date.now();

  constructor() {
    this.sessionId = generateSessionId();
    this.visitorId = generateVisitorId();
    this.sessionStart = Date.now();

    this.setupEventListeners();
    this.trackPageView();
  }

  private setupEventListeners() {
    // Track clicks
    document.addEventListener('click', () => {
      this.totalClicks++;
    });

    // Track scroll depth
    let ticking = false;
    document.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = Math.round((scrollTop / docHeight) * 100);
          this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent);
          ticking = false;
        });
        ticking = true;
      }
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.updateCurrentPageView();
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.updateCurrentPageView();
      this.sendSessionData();
    });
  }

  trackPageView(path?: string, title?: string) {
    // Update previous page view time
    this.updateCurrentPageView();

    const pageView: PageView = {
      path: path || window.location.pathname,
      title: title || document.title,
      referrer: document.referrer || undefined,
      timestamp: new Date().toISOString(),
      scrollDepth: 0
    };

    this.pageViews.push(pageView);
    this.currentPageStart = Date.now();
    this.maxScrollDepth = 0;
  }

  private updateCurrentPageView() {
    if (this.pageViews.length > 0) {
      const currentPage = this.pageViews[this.pageViews.length - 1];
      const timeOnPage = Date.now() - this.currentPageStart;
      currentPage.timeOnPage = Math.round(timeOnPage / 1000); // in seconds
      currentPage.scrollDepth = this.maxScrollDepth;
    }
  }

  trackEvent(eventType: string, eventData?: any) {
    // Track custom events like cart adds, purchases, etc.
    const eventPayload = {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      eventType,
      eventData,
      timestamp: new Date().toISOString(),
      page: window.location.pathname
    };

    // Send event to backend
    this.sendEventData(eventPayload);
  }

  private async sendEventData(eventData: any) {
    try {
      await fetch(`${API_BASE_URL}/api/admin/visits/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
    } catch (error) {
      console.warn('Failed to send event data:', error);
    }
  }

  private async sendSessionData() {
    this.updateCurrentPageView();

    const sessionData: EnhancedVisitorData = {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      ipAddress: undefined, // Will be set by backend
      userAgent: navigator.userAgent,
      browserInfo: getBrowserInfo(),
      deviceInfo: getDeviceInfo(),
      entryPage: this.pageViews[0]?.path || window.location.pathname,
      exitPage: this.pageViews[this.pageViews.length - 1]?.path,
      referrer: document.referrer || undefined,
      ...getUTMParameters(),
      sessionDuration: Math.round((Date.now() - this.sessionStart) / 1000),
      pageViews: this.pageViews,
      totalClicks: this.totalClicks,
      scrollDepth: this.maxScrollDepth,
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(`${API_BASE_URL}/api/admin/visits/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
    } catch (error) {
      console.warn('Failed to send session data:', error);
    }
  }

  // Method to manually send session data (for SPA route changes)
  flush() {
    this.sendSessionData();
  }
}

// Global visitor tracker instance
let visitorTracker: VisitorTracker | null = null;

export const initializeVisitorTracking = () => {
  if (!visitorTracker && typeof window !== 'undefined') {
    visitorTracker = new VisitorTracker();
  }
  return visitorTracker;
};

export const trackPageView = (path?: string, title?: string) => {
  if (visitorTracker) {
    visitorTracker.trackPageView(path, title);
  }
};

export const trackEvent = (eventType: string, eventData?: any) => {
  if (visitorTracker) {
    visitorTracker.trackEvent(eventType, eventData);
  }
};

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
  },

  // Enhanced analytics endpoints
  async getVisitorAnalytics(days: number = 30): Promise<VisitorAnalytics> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visitors/analytics?days=${days}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as VisitorAnalytics;
  },

  async getRealTimeData(): Promise<RealTimeData> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visitors/realtime`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as RealTimeData;
  },

  async getTopPages(days: number = 30): Promise<Array<{ page: string; views: number; avgTime: number; bounceRate: number; }>> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visitors/top-pages?days=${days}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as Array<{ page: string; views: number; avgTime: number; bounceRate: number; }>;
  },

  async getTrafficSources(days: number = 30): Promise<Array<{ source: string; count: number; percentage: number; conversionRate: number; }>> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visitors/traffic-sources?days=${days}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as Array<{ source: string; count: number; percentage: number; conversionRate: number; }>;
  },

  async getDeviceStats(days: number = 30): Promise<Array<{ device: string; browser: string; os: string; count: number; percentage: number; }>> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visitors/device-stats?days=${days}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as Array<{ device: string; browser: string; os: string; count: number; percentage: number; }>;
  },

  async getConversionFunnel(days: number = 30): Promise<Array<{ step: string; visitors: number; conversionRate: number; }>> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visitors/conversion-funnel?days=${days}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as Array<{ step: string; visitors: number; conversionRate: number; }>;
  },

  async getGeographicData(days: number = 30): Promise<Array<{ country: string; region?: string; city?: string; count: number; percentage: number; }>> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/visitors/geographic?days=${days}`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));
    return await handleResponse(resp) as Array<{ country: string; region?: string; city?: string; count: number; percentage: number; }>;
  }
};

// Initialize tracking when module is imported
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeVisitorTracking();
    });
  } else {
    initializeVisitorTracking();
  }
}
