import { apiClient } from './apiClient';

/**
 * Dashboard Metrics Service
 *
 * Fetches comprehensive performance metrics from backend
 */

export interface DashboardMetrics {
    timestamp: string;
    serverMetrics: ServerMetrics;
    databaseMetrics: DatabaseMetrics;
    cacheMetrics: CacheMetrics;
    businessMetrics: BusinessMetrics;
    trafficMetrics: TrafficMetrics;
    healthStatus: HealthStatus;
}

export interface ServerMetrics {
    memory: {
        maxMemoryMB: number;
        totalMemoryMB: number;
        usedMemoryMB: number;
        freeMemoryMB: number;
        usagePercent: number;
    };
    cpu: {
        availableProcessors: number;
        processCpuLoad: number;
        systemCpuLoad: number;
        processCpuTime: number;
    };
    garbageCollection: Array<{
        name: string;
        collectionCount: number;
        collectionTimeMs: number;
    }>;
    threads: {
        current: number;
        peak: number;
        daemon: number;
        totalStarted: number;
    };
    uptime: {
        milliseconds: number;
        formatted: string;
    };
}

export interface DatabaseMetrics {
    connectionPool: {
        active: number;
        idle: number;
        total: number;
        threadsAwaiting: number;
        maxPoolSize: number;
        minIdle: number;
        usagePercent: number;
    };
    entityCounts: {
        totalOrders: number;
        totalUsers: number;
        totalProducts: number;
        totalVariants: number;
    };
    queryPerformance: {
        status: string;
        enabled: boolean;
    };
}

export interface CacheMetrics {
    caches: Array<{
        name: string;
        size: number;
        hitCount: number;
        missCount: number;
        hitRate: number;
        loadSuccessCount: number;
        loadFailureCount: number;
        evictionCount: number;
    }>;
    summary: {
        totalCaches: number;
        totalHits: number;
        totalMisses: number;
        overallHitRate: number;
    };
}

export interface BusinessMetrics {
    today: {
        newOrders: number;
        newUsers: number;
        revenue: number;
    };
    thisWeek: {
        orders: number;
        users: number;
    };
    thisMonth: {
        orders: number;
        users: number;
        revenue: number;
    };
    products: {
        totalMasterProducts: number;
        activeMasterProducts: number;
        totalVariants: number;
        activeVariants: number;
        outOfStock: number;
    };
    users: {
        total: number;
        active: number;
        admins: number;
    };
}

export interface TrafficMetrics {
    visits: {
        today: number;
        thisWeek: number;
        thisMonth: number;
    };
    requests: {
        total: number;
        failed: number;
        errorRate: number;
        requestsPerSecond: number;
    };
}

export interface HealthStatus {
    overall: string;
    components: {
        database: string;
        memory: string;
        cpu: string;
    };
    warnings: string[];
}

class DashboardMetricsService {
    /**
     * Get comprehensive dashboard metrics
     *
     * Fetches real-time performance and business metrics
     */
    async getComprehensiveMetrics(): Promise<DashboardMetrics> {
        return apiClient.get<DashboardMetrics>('/api/admin/dashboard/metrics');
    }

    /**
     * Format bytes to human-readable format
     */
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    }

    /**
     * Format uptime to human-readable format
     */
    formatUptime(milliseconds: number): string {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Get health status color
     */
    getHealthColor(status: string): string {
        switch (status.toLowerCase()) {
            case 'healthy':
            case 'up':
                return '#10B981'; // Green
            case 'warning':
            case 'degraded':
                return '#F59E0B'; // Yellow
            case 'down':
            case 'critical':
                return '#EF4444'; // Red
            default:
                return '#6B7280'; // Gray
        }
    }
}

export const dashboardMetricsService = new DashboardMetricsService();
