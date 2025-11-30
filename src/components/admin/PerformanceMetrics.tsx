import React, { useEffect, useState } from 'react';
import {type DashboardMetrics, dashboardMetricsService} from '../../services/dashboardMetricsService';
import { logInfo, logError } from '../../services/logger';
import './PerformanceMetrics.css';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    status?: 'healthy' | 'warning' | 'critical';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, status = 'healthy' }) => {
    const getStatusColor = () => {
        switch (status) {
            case 'healthy': return '#10B981';
            case 'warning': return '#F59E0B';
            case 'critical': return '#EF4444';
            default: return '#6B7280';
        }
    };

    return (
        <div className="metric-card" style={{ borderLeftColor: getStatusColor() }}>
            <div className="metric-title">{title}</div>
            <div className="metric-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
            {subtitle && <div className="metric-subtitle">{subtitle}</div>}
        </div>
    );
};

const PerformanceMetrics: React.FC = () => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const loadMetrics = async () => {
            try {
                logInfo('🔄 PerformanceMetrics: Loading metrics...');
                const data = await dashboardMetricsService.getComprehensiveMetrics();
                setMetrics(data);
                setError(null);
                logInfo('✅ PerformanceMetrics: Metrics loaded successfully');
            } catch (err) {
                logError('❌ PerformanceMetrics: Failed to load metrics:', err);
                setError('Failed to load performance metrics');
            } finally {
                setLoading(false);
            }
        };

        loadMetrics();

        // Auto-refresh every 30 seconds
        const interval = setInterval(loadMetrics, 30000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="performance-loading">Loading performance metrics...</div>;
    }

    if (error || !metrics) {
        return <div className="performance-error">{error || 'No data available'}</div>;
    }

    const { serverMetrics, databaseMetrics, cacheMetrics, businessMetrics, trafficMetrics, healthStatus } = metrics;

    // Determine status based on thresholds
    const getMemoryStatus = (): 'healthy' | 'warning' | 'critical' => {
        if (serverMetrics.memory.usagePercent >= 85) return 'critical';
        if (serverMetrics.memory.usagePercent >= 70) return 'warning';
        return 'healthy';
    };

    const getCpuStatus = (): 'healthy' | 'warning' | 'critical' => {
        if (serverMetrics.cpu.processCpuLoad >= 80) return 'critical';
        if (serverMetrics.cpu.processCpuLoad >= 60) return 'warning';
        return 'healthy';
    };

    const getDbStatus = (): 'healthy' | 'warning' | 'critical' => {
        if (databaseMetrics.connectionPool.usagePercent >= 80) return 'critical';
        if (databaseMetrics.connectionPool.usagePercent >= 60) return 'warning';
        return 'healthy';
    };

    const getCacheStatus = (): 'healthy' | 'warning' | 'critical' => {
        if (cacheMetrics.summary.overallHitRate >= 70) return 'healthy';
        if (cacheMetrics.summary.overallHitRate >= 50) return 'warning';
        return 'critical';
    };

    return (
        <div className="performance-metrics">
            {/* Health Status Banner */}
            <div className={`health-banner health-${healthStatus.overall.toLowerCase()}`}>
                <div className="health-status">
                    <span className="health-icon">●</span>
                    <span className="health-text">System Status: {healthStatus.overall}</span>
                </div>
                {healthStatus.warnings.length > 0 && (
                    <div className="health-warnings">
                        {healthStatus.warnings.map((warning, idx) => (
                            <div key={idx} className="warning-item">⚠️ {warning}</div>
                        ))}
                    </div>
                )}
            </div>

            {/* Server Metrics */}
            <section className="metrics-section">
                <h2 className="section-title">🖥️ Server Performance</h2>
                <div className="metrics-grid">
                    <MetricCard
                        title="System RAM"
                        value={`${serverMetrics.memory.usagePercent.toFixed(1)}%`}
                        subtitle={`${serverMetrics.memory.usedMemoryMB} MB / ${serverMetrics.memory.maxMemoryMB} MB`}
                        status={getMemoryStatus()}
                    />
                    {serverMetrics.jvmHeap && (
                        <MetricCard
                            title="JVM Heap"
                            value={`${serverMetrics.jvmHeap.usagePercent.toFixed(1)}%`}
                            subtitle={`${serverMetrics.jvmHeap.usedMB} MB / ${serverMetrics.jvmHeap.maxHeapMB} MB`}
                            status={serverMetrics.jvmHeap.usagePercent >= 85 ? 'critical' : serverMetrics.jvmHeap.usagePercent >= 70 ? 'warning' : 'healthy'}
                        />
                    )}
                    <MetricCard
                        title="CPU Load"
                        value={`${serverMetrics.cpu.processCpuLoad.toFixed(1)}%`}
                        subtitle={`${serverMetrics.cpu.availableProcessors} cores available`}
                        status={getCpuStatus()}
                    />
                    <MetricCard
                        title="Threads"
                        value={serverMetrics.threads.current}
                        subtitle={`Peak: ${serverMetrics.threads.peak}`}
                        status="healthy"
                    />
                    <MetricCard
                        title="Uptime"
                        value={serverMetrics.uptime.formatted}
                        subtitle="System uptime"
                        status="healthy"
                    />
                </div>

                {/* Garbage Collection */}
                <div className="gc-stats">
                    <h3>Garbage Collection</h3>
                    {serverMetrics.garbageCollection.map((gc, idx) => (
                        <div key={idx} className="gc-row">
                            <span className="gc-name">{gc.name}</span>
                            <span className="gc-count">{gc.collectionCount} collections</span>
                            <span className="gc-time">{gc.collectionTimeMs}ms total</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Database Metrics */}
            <section className="metrics-section">
                <h2 className="section-title">🗄️ Database Performance</h2>
                <div className="metrics-grid">
                    <MetricCard
                        title="Connection Pool"
                        value={`${databaseMetrics.connectionPool.usagePercent.toFixed(1)}%`}
                        subtitle={`${databaseMetrics.connectionPool.active} active / ${databaseMetrics.connectionPool.maxPoolSize} max`}
                        status={getDbStatus()}
                    />
                    <MetricCard
                        title="Idle Connections"
                        value={databaseMetrics.connectionPool.idle}
                        subtitle={`Min idle: ${databaseMetrics.connectionPool.minIdle}`}
                        status="healthy"
                    />
                    <MetricCard
                        title="Threads Awaiting"
                        value={databaseMetrics.connectionPool.threadsAwaiting}
                        subtitle="Waiting for connection"
                        status={databaseMetrics.connectionPool.threadsAwaiting > 0 ? 'warning' : 'healthy'}
                    />
                    <MetricCard
                        title="Total Orders"
                        value={databaseMetrics.entityCounts.totalOrders}
                        subtitle="Database records"
                        status="healthy"
                    />
                </div>

                <div className="entity-counts">
                    <h3>Entity Counts</h3>
                    <div className="entity-grid">
                        <div className="entity-item">
                            <span className="entity-label">Products:</span>
                            <span className="entity-value">{databaseMetrics.entityCounts.totalProducts}</span>
                        </div>
                        <div className="entity-item">
                            <span className="entity-label">Variants:</span>
                            <span className="entity-value">{databaseMetrics.entityCounts.totalVariants}</span>
                        </div>
                        <div className="entity-item">
                            <span className="entity-label">Users:</span>
                            <span className="entity-value">{databaseMetrics.entityCounts.totalUsers}</span>
                        </div>
                        <div className="entity-item">
                            <span className="entity-label">Orders:</span>
                            <span className="entity-value">{databaseMetrics.entityCounts.totalOrders}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cache Metrics */}
            <section className="metrics-section">
                <h2 className="section-title">⚡ Cache Performance</h2>
                <div className="metrics-grid">
                    <MetricCard
                        title="Overall Hit Rate"
                        value={`${cacheMetrics.summary.overallHitRate.toFixed(1)}%`}
                        subtitle="Cache effectiveness"
                        status={getCacheStatus()}
                    />
                    <MetricCard
                        title="Total Hits"
                        value={cacheMetrics.summary.totalHits}
                        subtitle="Successful cache lookups"
                        status="healthy"
                    />
                    <MetricCard
                        title="Total Misses"
                        value={cacheMetrics.summary.totalMisses}
                        subtitle="Cache misses"
                        status="healthy"
                    />
                    <MetricCard
                        title="Active Caches"
                        value={cacheMetrics.summary.totalCaches}
                        subtitle="Configured caches"
                        status="healthy"
                    />
                </div>

                <div className="cache-details">
                    <h3>Cache Details</h3>
                    <table className="cache-table">
                        <thead>
                            <tr>
                                <th>Cache Name</th>
                                <th>Size</th>
                                <th>Hit Rate</th>
                                <th>Hits</th>
                                <th>Misses</th>
                                <th>Evictions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cacheMetrics.caches.map((cache, idx) => (
                                <tr key={idx}>
                                    <td className="cache-name">{cache.name}</td>
                                    <td>{cache.size}</td>
                                    <td className={cache.hitRate >= 70 ? 'hit-rate-good' : cache.hitRate >= 50 ? 'hit-rate-ok' : 'hit-rate-bad'}>
                                        {cache.hitRate.toFixed(1)}%
                                    </td>
                                    <td>{cache.hitCount}</td>
                                    <td>{cache.missCount}</td>
                                    <td>{cache.evictionCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Business Metrics */}
            <section className="metrics-section">
                <h2 className="section-title">📊 Business Metrics</h2>
                <div className="business-grid">
                    <div className="business-card">
                        <h3>Today</h3>
                        <div className="business-stats">
                            <div className="stat-row">
                                <span>New Orders:</span>
                                <strong>{businessMetrics.today.newOrders}</strong>
                            </div>
                            <div className="stat-row">
                                <span>New Users:</span>
                                <strong>{businessMetrics.today.newUsers}</strong>
                            </div>
                            <div className="stat-row">
                                <span>Revenue:</span>
                                <strong>€{businessMetrics.today.revenue.toLocaleString()}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="business-card">
                        <h3>This Week</h3>
                        <div className="business-stats">
                            <div className="stat-row">
                                <span>Orders:</span>
                                <strong>{businessMetrics.thisWeek.orders}</strong>
                            </div>
                            <div className="stat-row">
                                <span>Users:</span>
                                <strong>{businessMetrics.thisWeek.users}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="business-card">
                        <h3>This Month</h3>
                        <div className="business-stats">
                            <div className="stat-row">
                                <span>Orders:</span>
                                <strong>{businessMetrics.thisMonth.orders}</strong>
                            </div>
                            <div className="stat-row">
                                <span>Users:</span>
                                <strong>{businessMetrics.thisMonth.users}</strong>
                            </div>
                            <div className="stat-row">
                                <span>Revenue:</span>
                                <strong>€{businessMetrics.thisMonth.revenue.toLocaleString()}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="business-card">
                        <h3>Products</h3>
                        <div className="business-stats">
                            <div className="stat-row">
                                <span>Active Products:</span>
                                <strong>{businessMetrics.products.activeMasterProducts} / {businessMetrics.products.totalMasterProducts}</strong>
                            </div>
                            <div className="stat-row">
                                <span>Active Variants:</span>
                                <strong>{businessMetrics.products.activeVariants} / {businessMetrics.products.totalVariants}</strong>
                            </div>
                            <div className="stat-row">
                                <span>Out of Stock:</span>
                                <strong className={businessMetrics.products.outOfStock > 0 ? 'text-warning' : ''}>
                                    {businessMetrics.products.outOfStock}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Traffic Metrics */}
            <section className="metrics-section">
                <h2 className="section-title">🌐 Traffic Metrics</h2>
                <div className="metrics-grid">
                    <MetricCard
                        title="Visits Today"
                        value={trafficMetrics.visits.today}
                        subtitle="Unique visits"
                        status="healthy"
                    />
                    <MetricCard
                        title="Visits This Week"
                        value={trafficMetrics.visits.thisWeek}
                        subtitle="7 days"
                        status="healthy"
                    />
                    <MetricCard
                        title="Requests/sec"
                        value={trafficMetrics.requests.requestsPerSecond.toFixed(2)}
                        subtitle="Average throughput"
                        status="healthy"
                    />
                    <MetricCard
                        title="Error Rate"
                        value={`${trafficMetrics.requests.errorRate.toFixed(2)}%`}
                        subtitle={`${trafficMetrics.requests.failed} / ${trafficMetrics.requests.total} failed`}
                        status={trafficMetrics.requests.errorRate > 5 ? 'critical' : trafficMetrics.requests.errorRate > 1 ? 'warning' : 'healthy'}
                    />
                </div>
            </section>

            <div className="metrics-footer">
                Last updated: {new Date(metrics.timestamp).toLocaleString()} • Auto-refreshes every 30s
            </div>
        </div>
    );
};

export default PerformanceMetrics;
