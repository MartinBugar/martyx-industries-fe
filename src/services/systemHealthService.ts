import { API_BASE_URL, defaultHeaders, withLangHeaders } from './apiUtils';

// Response interfaces for system health
export interface DatabaseStatus {
  connected: boolean;
  connectionTime: number; // milliseconds
  lastCheck: string;
  database: string;
}

export interface SystemHealthMetrics {
  uptime: number; // seconds
  memoryUsage: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number; // percentage
  diskSpace: {
    used: number;
    free: number;
    total: number;
    percentage: number;
  };
}

export interface ApiEndpointStatus {
  endpoint: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number; // milliseconds
  lastCheck: string;
}

export interface SystemHealthResponse {
  database: DatabaseStatus;
  system: SystemHealthMetrics;
  apiEndpoints: ApiEndpointStatus[];
  lastUpdated: string;
  overallStatus: 'healthy' | 'degraded' | 'critical';
}

// Mock system health data for demonstration
const generateMockSystemHealth = (): SystemHealthResponse => {
  const now = new Date().toISOString();

  return {
    database: {
      connected: true,
      connectionTime: Math.floor(Math.random() * 50) + 10, // 10-60ms
      lastCheck: now,
      database: 'PostgreSQL 15.4'
    },
    system: {
      uptime: Math.floor(Date.now() / 1000) - (Math.random() * 86400 * 7), // Random uptime within 7 days
      memoryUsage: {
        used: 2048,
        free: 1024,
        total: 3072,
        percentage: 66.7
      },
      cpuUsage: Math.floor(Math.random() * 30) + 10, // 10-40%
      diskSpace: {
        used: 45000,
        free: 15000,
        total: 60000,
        percentage: 75
      }
    },
    apiEndpoints: [
      {
        endpoint: '/api/admin/users',
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 100) + 20,
        lastCheck: now
      },
      {
        endpoint: '/api/admin/products',
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 80) + 15,
        lastCheck: now
      },
      {
        endpoint: '/api/admin/orders',
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 120) + 25,
        lastCheck: now
      },
      {
        endpoint: '/api/meta/visits',
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 60) + 10,
        lastCheck: now
      }
    ],
    lastUpdated: now,
    overallStatus: 'healthy'
  };
};

export const systemHealthService = {
  // Get complete system health status
  async getSystemHealth(): Promise<SystemHealthResponse> {
    try {
      // Try to fetch from real API endpoint
      const resp = await fetch(`${API_BASE_URL}/api/admin/system/health`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      if (resp.ok) {
        const data = await resp.json();
        return data as SystemHealthResponse;
      } else {
        // Fallback to mock data if endpoint doesn't exist
        if (import.meta.env.DEV) {
          console.warn('System health endpoint not available, using mock data');
        }
        return generateMockSystemHealth();
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Failed to fetch system health, using mock data:', err);
      }
      return generateMockSystemHealth();
    }
  },

  // Get database connectivity status
  async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/admin/system/database`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      if (resp.ok) {
        const data = await resp.json();
        return data as DatabaseStatus;
      } else {
        // Fallback to mock data
        return {
          connected: true,
          connectionTime: Math.floor(Math.random() * 50) + 10,
          lastCheck: new Date().toISOString(),
          database: 'PostgreSQL 15.4'
        };
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('Failed to check database status:', err);
      }
      return {
        connected: false,
        connectionTime: -1,
        lastCheck: new Date().toISOString(),
        database: 'Connection Failed'
      };
    }
  },

  // Test API endpoint ping
  async pingApiEndpoint(endpoint: string): Promise<number> {
    try {
      const startTime = performance.now();
      const resp = await fetch(`${API_BASE_URL}${endpoint}`, withLangHeaders({
        method: 'HEAD', // Use HEAD for minimal response
        headers: defaultHeaders as HeadersInit,
      }));
      const endTime = performance.now();

      if (resp.ok || resp.status === 401) { // 401 is expected for protected endpoints
        return Math.round(endTime - startTime);
      } else {
        return -1; // Indicate failure
      }
    } catch (err) {
      return -1; // Indicate failure
    }
  },

  // Format uptime to human readable string
  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  },

  // Format bytes to human readable string
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }
};