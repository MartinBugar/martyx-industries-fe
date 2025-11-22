import React, {useEffect, useState} from 'react';
import AdminLayout from './AdminLayout';
import {type VisitorAnalytics, visitorService} from '../../services/visitorService';
import {type SystemHealthResponse, systemHealthService} from '../../services/systemHealthService';
import {
    type DailyRevenue,
    revenueAnalyticsService,
    type RevenueSummary,
    type TopProduct
} from '../../services/revenueAnalyticsService';
import VisitorChart from '../../components/Charts/VisitorChart';
import './AdminDashboard.css';
import { logInfo, logError } from '../../services/logger';

type DashboardSection = 'status' | 'visitors' | 'revenue';

// Data interfaces for the dashboard
interface ChartStats {
    peak: number;
    avg: number;
}

// Components
interface KPICardProps {
    label: string;
    value: string | number;
    loading?: boolean;
    error?: string;
    accent?: 'blue' | 'green';
}

const KPICard: React.FC<KPICardProps> = ({label, value, loading, error, accent = 'blue'}) => {
    const accentColor = accent === 'blue' ? '#3B82F6' : '#10B981';

    return (
        <div className="kpi-card">
            <div className="kpi-label">{label}</div>
            {loading ? (
                <div className="kpi-loading">Loading…</div>
            ) : error ? (
                <div className="kpi-error">{error}</div>
            ) : (
                <div className="kpi-value">{typeof value === 'number' ? value.toLocaleString() : value}</div>
            )}
            <div className="kpi-accent" style={{backgroundColor: accentColor}}></div>
        </div>
    );
};

interface SectionPillProps {
    label: string;
    color: 'blue' | 'green';
}

const SectionPill: React.FC<SectionPillProps> = ({label, color}) => {
    const bgColor = color === 'blue' ? '#3B82F6' : '#10B981';

    return (
        <div className="section-header">
            <div className="section-pill" style={{backgroundColor: bgColor}}>
                {label}
            </div>
            <div className="section-divider"></div>
        </div>
    );
};

interface ProgressRowProps {
    code: string;
    name: string;
    percentage: number;
}

const ProgressRow: React.FC<ProgressRowProps> = ({code, name, percentage}) => {
    return (
        <div className="progress-row">
            <div className="progress-info">
                <span className="progress-flag">{code}</span>
                <span className="progress-name">{name}</span>
            </div>
            <div className="progress-bar-container">
                <div className="progress-bar" style={{width: `${percentage}%`}}></div>
            </div>
            <div className="progress-percentage">{percentage.toFixed(1)}%</div>
        </div>
    );
};


interface ProductRevenueRowProps {
    productName: string;
    revenue: number;
}

const ProductRevenueRow: React.FC<ProductRevenueRowProps> = ({productName, revenue}) => {
    return (
        <div className="product-revenue-row">
            <div className="product-info">
                <span className="product-name">{productName}</span>
            </div>
            <div className="product-revenue-amount">€{revenue.toLocaleString()}</div>
        </div>
    );
};

interface AreaLineChartProps {
    data: { date: string; value: number }[];
    title: string;
    subtitle?: string;
    color: 'blue' | 'green';
    peak: number;
    avg: number;
    unit: string;
}

const AreaLineChart: React.FC<AreaLineChartProps> = ({data, title, subtitle, color, peak, avg, unit}) => {
    const strokeColor = color === 'blue' ? '#3B82F6' : '#10B981';
    const fillColor = color === 'blue' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(18, 110, 93, 0.15)';

    const tooltipUnit = color === 'green' ? '€' : '';
    const tooltipLabel = color === 'green' ? 'revenue' : 'visitors';

    return (
        <div className="chart-container">
            <div className="chart-header">
                <h3 className="chart-title">{title}</h3>
                {subtitle && <p className="chart-subtitle">{subtitle}</p>}
            </div>
            <div className="chart-wrapper">
                <VisitorChart
                    data={data.map(d => ({date: d.date, count: d.value, uniqueCount: d.value}))}
                    width={560}
                    height={200}
                    stroke={strokeColor}
                    fill={fillColor}
                    ariaLabel={`${title} chart`}
                    showValueLabels={false}
                    showUniqueVisitors={false}
                    tooltipUnit={tooltipUnit}
                    tooltipLabel={tooltipLabel}
                />
            </div>
            <div className="chart-legend">
                Peak {peak.toLocaleString()}{unit} • Avg {avg.toLocaleString()}{unit}
            </div>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    // Active section state
    const [activeSection, setActiveSection] = useState<DashboardSection>('status');

    // Visitor analytics state
    const [visitorAnalytics, setVisitorAnalytics] = useState<VisitorAnalytics | null>(null);
    const [visitorLoading, setVisitorLoading] = useState<boolean>(true);
    const [visitorError, setVisitorError] = useState<string | null>(null);

    // Revenue analytics state (new optimized backend data)
    const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
    const [revenueLoading, setRevenueLoading] = useState<boolean>(true);
    const [revenueTimeSeries, setRevenueTimeSeries] = useState<DailyRevenue[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

    // System health state
    const [systemHealth, setSystemHealth] = useState<SystemHealthResponse | null>(null);
    const [systemHealthLoading, setSystemHealthLoading] = useState<boolean>(true);
    const [systemHealthError, setSystemHealthError] = useState<string | null>(null);

    // Calculate chart statistics
    const calculateVisitorStats = (): ChartStats => {
        if (!visitorAnalytics?.dailyData) return {peak: 0, avg: 0};
        const values = visitorAnalytics.dailyData.map(d => d.uniqueCount);
        const peak = Math.max(...values, 0);
        const avg = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
        return {peak, avg};
    };

    const calculateRevenueStats = (): ChartStats => {
        if (!revenueTimeSeries.length) return {peak: 0, avg: 0};
        const amounts = revenueTimeSeries.map(d => d.amount);
        const peak = Math.max(...amounts, 0);
        const avg = Math.round(amounts.reduce((sum, val) => sum + val, 0) / amounts.length);
        return {peak, avg};
    };


    useEffect(() => {
        let mounted = true;

        // Constants
        const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
        const CACHE_KEY_VISITOR = 'adminDashboard_visitorAnalytics';
        const CACHE_KEY_TIMESTAMP = 'adminDashboard_lastFetch';

        // Load visitor analytics with 3-hour caching
        const loadVisitorAnalytics = async () => {
            try {
                const analytics = await visitorService.getVisitorAnalytics(30);
                if (mounted) {
                    setVisitorAnalytics(analytics);
                    setVisitorError(null);

                    // Cache the data
                    localStorage.setItem(CACHE_KEY_VISITOR, JSON.stringify(analytics));
                    localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
                }
            } catch (err) {
                if (import.meta.env.DEV) {
                    logError('Failed to load visitor analytics:', err);
                }
                if (mounted) {
                    setVisitorError('Failed to load visitor data');
                }
            } finally {
                if (mounted) {
                    setVisitorLoading(false);
                }
            }
        };

        // Check if we have cached data that's less than 3 hours old
        const lastFetch = localStorage.getItem(CACHE_KEY_TIMESTAMP);
        const cachedData = localStorage.getItem(CACHE_KEY_VISITOR);
        const now = Date.now();
        const shouldFetch = !lastFetch || (now - parseInt(lastFetch)) > CACHE_DURATION;

        if (!shouldFetch && cachedData) {
            // Use cached data
            try {
                const analytics = JSON.parse(cachedData) as VisitorAnalytics;
                if (mounted) {
                    setVisitorAnalytics(analytics);
                    setVisitorLoading(false);
                    setVisitorError(null);
                }
            } catch {
                // If cached data is corrupted, fetch fresh data
                loadVisitorAnalytics();
            }
        } else {
            // Fetch fresh data
            loadVisitorAnalytics();
        }

        // Load system health metrics
        (async () => {
            try {
                logInfo('🚀 AdminDashboard: Starting system health data loading...');
                const healthData = await systemHealthService.getSystemHealth();
                logInfo('📊 AdminDashboard: Received health data:', healthData);
                if (mounted) {
                    setSystemHealth(healthData);
                    setSystemHealthError(null);
                    logInfo('✅ AdminDashboard: System health state updated');
                }
            } catch (e) {
                logError('❌ AdminDashboard: Failed to fetch system health:', e);
                if (mounted) {
                    setSystemHealthError('Failed to load system health');
                }
            } finally {
                if (mounted) {
                    setSystemHealthLoading(false);
                    logInfo('🏁 AdminDashboard: System health loading finished');
                }
            }
        })();


        // Load revenue analytics from optimized backend endpoint
        (async () => {
            try {
                logInfo('🚀 AdminDashboard: Starting revenue analytics loading...');

                const revenueData = await revenueAnalyticsService.getRevenueAnalytics(30);

                if (mounted) {
                    // Set the new revenue data structure
                    setRevenueSummary(revenueData.summary);
                    setRevenueTimeSeries(revenueData.dailyRevenue);
                    setTopProducts(revenueData.topProducts);

                    logInfo('✅ AdminDashboard: Revenue analytics loaded successfully');
                    logInfo('📊 Revenue Summary:', revenueData.summary);
                    logInfo('📊 Daily Revenue Data Points:', revenueData.dailyRevenue.length);
                    logInfo('📊 Top Products:', revenueData.topProducts.length);
                }
            } catch (error) {
                logError('❌ AdminDashboard: Failed to load revenue analytics:', error);
            } finally {
                if (mounted) {
                    setRevenueLoading(false);
                    logInfo('🏁 AdminDashboard: Revenue analytics loading finished');
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    const visitorStats = calculateVisitorStats();
    const revenueStats = calculateRevenueStats();

    // Navigation tabs component
    const NavTabs = (
        <nav className="dashboard-tabs">
            <button
                className={`dashboard-tab ${activeSection === 'status' ? 'active' : ''}`}
                data-tab="status"
                onClick={() => setActiveSection('status')}
                aria-label="System status and health monitoring"
            >
                Status
            </button>
            <button
                className={`dashboard-tab ${activeSection === 'visitors' ? 'active' : ''}`}
                data-tab="visitors"
                onClick={() => setActiveSection('visitors')}
                aria-label="Visitor analytics and statistics"
            >
                Visitors
            </button>
            <button
                className={`dashboard-tab ${activeSection === 'revenue' ? 'active' : ''}`}
                data-tab="revenue"
                onClick={() => setActiveSection('revenue')}
                aria-label="Revenue analytics and top products"
            >
                Revenue
            </button>
        </nav>
    );

    return (
        <AdminLayout title="Dashboard" navTabs={NavTabs}>
            <div className="dashboard-v3">
                {/* Top KPI Row */}
                {activeSection === 'visitors' && (
                    <div className="kpi-row">
                        <KPICard
                            label="Total Visitors"
                            value={visitorAnalytics?.totalVisits ?? 0}
                            loading={visitorLoading}
                            error={visitorError || undefined}
                            accent="blue"
                        />
                        <KPICard
                            label="Today's Visitors"
                            value={visitorAnalytics?.todayVisits ?? 0}
                            loading={visitorLoading}
                            error={visitorError || undefined}
                            accent="blue"
                        />
                    </div>
                )}

                {activeSection === 'revenue' && (
                    <div className="kpi-row">
                        <KPICard
                            label="Total Revenue"
                            value={revenueLoading ? "Loading..." : `€${(revenueSummary?.totalRevenue ?? 0).toLocaleString()}`}
                            loading={revenueLoading}
                            error={revenueSummary ? undefined : 'Failed to load'}
                            accent="green"
                        />
                        <KPICard
                            label="Avg Daily Revenue"
                            value={revenueLoading ? "Loading..." : `€${(revenueSummary?.avgDailyRevenue ?? 0).toLocaleString()}`}
                            loading={revenueLoading}
                            error={revenueSummary ? undefined : 'Failed to load'}
                            accent="green"
                        />
                    </div>
                )}

                {/* VISITORS Section */}
                {activeSection === 'visitors' && (
                    <div className="dashboard-section">
                        <SectionPill label="VISITORS" color="blue"/>
                        <div className="visitors-content">
                            <div className="visitors-chart">
                                {visitorLoading ? (
                                    <div className="chart-loading">Loading chart...</div>
                                ) : visitorError ? (
                                    <div className="chart-error">Failed to load data. Retry</div>
                                ) : visitorAnalytics?.dailyData ? (
                                    <AreaLineChart
                                        data={visitorAnalytics.dailyData.map(d => ({
                                            date: d.date,
                                            value: d.uniqueCount
                                        }))}
                                        title="Visitors — Last 30 days"
                                        subtitle="Unique sessions"
                                        color="blue"
                                        peak={visitorStats.peak}
                                        avg={visitorStats.avg}
                                        unit="/day"
                                    />
                                ) : (
                                    <div className="chart-error">No data for selected period</div>
                                )}
                            </div>
                            <div className="visitors-countries">
                                <div className="card">
                                    <h3 className="card-title">Top Countries</h3>
                                    {visitorAnalytics?.topCountries && visitorAnalytics.topCountries.length > 0 ? (
                                        <div className="countries-list">
                                            {visitorAnalytics.topCountries.map((country) => (
                                                <ProgressRow
                                                    key={country.countryCode}
                                                    code={country.countryCode}
                                                    name={country.country}
                                                    percentage={country.percentage}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-data">No country data available</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* REVENUE Section */}
                {activeSection === 'revenue' && (
                    <div className="dashboard-section">
                        <SectionPill label="REVENUE" color="green"/>
                        <div className="revenue-content">
                            <div className="revenue-chart">
                                {revenueLoading ? (
                                    <div className="chart-loading">Loading chart...</div>
                                ) : !revenueSummary ? (
                                    <div className="chart-error">Failed to load data. Retry</div>
                                ) : (
                                    <AreaLineChart
                                        data={revenueTimeSeries.map(d => ({date: d.date, value: d.amount}))}
                                        title="Revenue — Last 30 days"
                                        subtitle={`Total: ${(revenueSummary?.totalRevenue ?? 0).toLocaleString()} €`}
                                        color="green"
                                        peak={revenueStats.peak}
                                        avg={revenueStats.avg}
                                        unit=" €/day"
                                    />
                                )}
                            </div>
                            <div className="revenue-products">
                                <div className="card">
                                    <h3 className="card-title">Top Products</h3>
                                    {revenueLoading ? (
                                        <div className="loading-products">Loading products...</div>
                                    ) : topProducts.length > 0 ? (
                                        <div className="products-list">
                                            {topProducts.map((product, index) => (
                                                <ProductRevenueRow
                                                    key={`${product.productId}-${index}`}
                                                    productName={product.productName}
                                                    revenue={product.revenue}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-data">No product data available</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STATUS Section */}
                {activeSection === 'status' && (
                    <div className="dashboard-section">
                        <SectionPill label="STATUS" color="blue"/>

                        {/* System Health KPIs */}
                        <div className="kpi-row">
                            <KPICard
                                label="Database"
                                value={systemHealthLoading ? "Loading..." : systemHealth?.database.connected ? "Connected" : "Disconnected"}
                                loading={systemHealthLoading}
                                error={systemHealthError || undefined}
                                accent={systemHealth?.database.connected ? "green" : "blue"}
                            />
                            <KPICard
                                label="DB Response Time"
                                value={systemHealthLoading ? "Loading..." : systemHealth?.database.connected ? `${systemHealth.database.connectionTime}ms` : "N/A"}
                                loading={systemHealthLoading}
                                error={systemHealthError || undefined}
                                accent="blue"
                            />
                            <KPICard
                                label="System Uptime"
                                value={systemHealthLoading ? "Loading..." : systemHealth ? systemHealthService.formatUptime(systemHealth.system.uptime) : "N/A"}
                                loading={systemHealthLoading}
                                error={systemHealthError || undefined}
                                accent="green"
                            />
                            <KPICard
                                label="CPU Usage"
                                value={systemHealthLoading ? "Loading..." : systemHealth ? `${systemHealth.system.cpuUsage}%` : "N/A"}
                                loading={systemHealthLoading}
                                error={systemHealthError || undefined}
                                accent={systemHealth && systemHealth.system.cpuUsage > 80 ? "blue" : "green"}
                            />
                        </div>

                        {/* System Details */}
                        <div className="bottom-row">
                            <div className="data-status">
                                <div className="card">
                                    <h3 className="card-title">System Health</h3>
                                    <div className="status-info">
                                        {systemHealthLoading ? (
                                            <div className="status-text">Loading system metrics...</div>
                                        ) : systemHealthError ? (
                                            <div className="status-text" style={{color: '#EF4444'}}>Error loading system
                                                health</div>
                                        ) : systemHealth ? (
                                            <>
                                                <div className="status-text">
                                                    Memory: {systemHealthService.formatBytes(systemHealth.system.memoryUsage.used * 1024 * 1024)} / {systemHealthService.formatBytes(systemHealth.system.memoryUsage.total * 1024 * 1024)} ({systemHealth.system.memoryUsage.percentage.toFixed(1)}%)
                                                </div>
                                                <div className="status-text">
                                                    Disk: {systemHealthService.formatBytes(systemHealth.system.diskSpace.used * 1024 * 1024)} / {systemHealthService.formatBytes(systemHealth.system.diskSpace.total * 1024 * 1024)} ({systemHealth.system.diskSpace.percentage.toFixed(1)}%)
                                                </div>
                                                <div className="status-text">
                                                    Database: {systemHealth.database.database}
                                                </div>
                                                <div
                                                    className={`status-pill ${systemHealth.overallStatus === 'healthy' ? 'healthy' : systemHealth.overallStatus === 'degraded' ? 'degraded' : 'critical'}`}>
                                                    {systemHealth.overallStatus.charAt(0).toUpperCase() + systemHealth.overallStatus.slice(1)}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="status-text">No system data available</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="system-bandwidth">
                                <div className="card">
                                    <h3 className="card-title">API Endpoints</h3>
                                    <div className="bandwidth-content">
                                        {systemHealthLoading ? (
                                            <div>Loading endpoints...</div>
                                        ) : systemHealthError ? (
                                            <div className="bandwidth-unavailable">Failed to load endpoint status</div>
                                        ) : systemHealth?.apiEndpoints ? (
                                            <div className="endpoints-list">
                                                {systemHealth.apiEndpoints.map((endpoint, index) => (
                                                    <div key={index} className="endpoint-row">
                                                        <div className="endpoint-name">{endpoint.endpoint}</div>
                                                        <div className="endpoint-time">{endpoint.responseTime}ms</div>
                                                        <div className={`endpoint-status ${endpoint.status}`}>
                                                            {endpoint.status}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bandwidth-placeholder">No endpoint data available</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
