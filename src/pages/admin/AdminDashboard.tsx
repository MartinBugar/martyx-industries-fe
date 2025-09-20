import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';

type DashboardSection = 'status' | 'visitors' | 'revenue';
import { doMetricsService } from '../../services/doMetricsService';
import { salesService, type SalesSummary } from '../../services/salesService';
import { visitorService, type VisitorAnalytics } from '../../services/visitorService';
import { adminOrdersService } from '../../services/adminOrdersService';
import { systemHealthService, type SystemHealthResponse, type DatabaseStatus } from '../../services/systemHealthService';
import VisitorChart from '../../components/Charts/VisitorChart';
import './AdminDashboard.css';

// Data interfaces for the dashboard
interface RevenueSeriesPoint {
  date: string;
  amount: number;
}

interface ChartStats {
  peak: number;
  avg: number;
}

interface ProductRevenue {
  productName: string;
  revenue: number;
}

// Components
interface KPICardProps {
  label: string;
  value: string | number;
  loading?: boolean;
  error?: string;
  accent?: 'blue' | 'green';
}

const KPICard: React.FC<KPICardProps> = ({ label, value, loading, error, accent = 'blue' }) => {
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
      <div className="kpi-accent" style={{ backgroundColor: accentColor }}></div>
    </div>
  );
};

interface SectionPillProps {
  label: string;
  color: 'blue' | 'green';
}

const SectionPill: React.FC<SectionPillProps> = ({ label, color }) => {
  const bgColor = color === 'blue' ? '#3B82F6' : '#10B981';

  return (
    <div className="section-header">
      <div className="section-pill" style={{ backgroundColor: bgColor }}>
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

const ProgressRow: React.FC<ProgressRowProps> = ({ code, name, percentage }) => {
  return (
    <div className="progress-row">
      <div className="progress-info">
        <span className="progress-flag">{code}</span>
        <span className="progress-name">{name}</span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="progress-percentage">{percentage.toFixed(1)}%</div>
    </div>
  );
};


interface ProductRevenueRowProps {
  productName: string;
  revenue: number;
}

const ProductRevenueRow: React.FC<ProductRevenueRowProps> = ({ productName, revenue }) => {
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

const AreaLineChart: React.FC<AreaLineChartProps> = ({ data, title, subtitle, color, peak, avg, unit }) => {
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
          data={data.map(d => ({ date: d.date, count: d.value, uniqueCount: d.value }))}
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

  // Sales state
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesLoading, setSalesLoading] = useState<boolean>(true);
  const [revenueTimeSeries, setRevenueTimeSeries] = useState<RevenueSeriesPoint[]>([]);
  const [topProducts, setTopProducts] = useState<ProductRevenue[]>([]);

  const [bandwidth, setBandwidth] = useState<unknown | null>(null);
  const [bandwidthLoading, setBandwidthLoading] = useState<boolean>(true);
  const [bandwidthError, setBandwidthError] = useState<string | null>(null);

  // System health state
  const [systemHealth, setSystemHealth] = useState<SystemHealthResponse | null>(null);
  const [systemHealthLoading, setSystemHealthLoading] = useState<boolean>(true);
  const [systemHealthError, setSystemHealthError] = useState<string | null>(null);

  // Calculate chart statistics
  const calculateVisitorStats = (): ChartStats => {
    if (!visitorAnalytics?.dailyData) return { peak: 0, avg: 0 };
    const values = visitorAnalytics.dailyData.map(d => d.uniqueCount);
    const peak = Math.max(...values, 0);
    const avg = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
    return { peak, avg };
  };

  const calculateRevenueStats = (): ChartStats => {
    if (!revenueTimeSeries.length) return { peak: 0, avg: 0 };
    const amounts = revenueTimeSeries.map(d => d.amount);
    const peak = Math.max(...amounts, 0);
    const avg = Math.round(amounts.reduce((sum, val) => sum + val, 0) / amounts.length);
    return { peak, avg };
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
          console.error('Failed to load visitor analytics:', err);
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

    // Load daily bandwidth (today)
    (async () => {
      try {
        const data = await doMetricsService.getBandwidthDaily();
        if (mounted) setBandwidth(data);
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch daily bandwidth', e);
        }
        if (mounted) setBandwidthError('Failed to load daily bandwidth');
      } finally {
        if (mounted) setBandwidthLoading(false);
      }
    })();

    // Load system health metrics
    (async () => {
      try {
        const healthData = await systemHealthService.getSystemHealth();
        if (mounted) {
          setSystemHealth(healthData);
          setSystemHealthError(null);
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('Failed to fetch system health:', e);
        }
        if (mounted) {
          setSystemHealthError('Failed to load system health');
        }
      } finally {
        if (mounted) {
          setSystemHealthLoading(false);
        }
      }
    })();


    // Load sales summary and revenue time series (last 30 days)
    (async () => {
      try {
        const [summary, timeSeries, orders] = await Promise.all([
          salesService.getSalesSummary(30),
          salesService.getSalesTimeSeries(30),
          adminOrdersService.getAllOrders()
        ]);

        if (mounted) {
          setSalesSummary(summary);

          // Calculate actual revenue for each day
          const revenueData: RevenueSeriesPoint[] = timeSeries.map(point => {
            const dayStart = new Date(point.timestamp);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            // Calculate revenue for this specific day
            const dayRevenue = orders
              .filter(order => {
                const dateStr = order.paymentDate || order.orderDate;
                if (!dateStr) return false;
                const orderDate = new Date(dateStr);
                return orderDate >= dayStart && orderDate < dayEnd;
              })
              .reduce((sum, order) => {
                const amount = typeof order.totalAmount === 'number'
                  ? order.totalAmount
                  : (order.orderItems?.reduce((itemSum, item) => {
                      const qty = typeof item.quantity === 'number' ? item.quantity : 1;
                      const price = typeof item.unitPrice === 'number'
                        ? item.unitPrice
                        : (typeof item.price === 'number' ? item.price : 0);
                      return itemSum + (qty * price);
                    }, 0) || 0);
                return sum + amount;
              }, 0);

            return {
              date: point.timestamp.split('T')[0],
              amount: Math.round(dayRevenue)
            };
          });

          setRevenueTimeSeries(revenueData);

          // Calculate top products revenue (last 30 days)
          const now = new Date();
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const productRevenueMap = new Map<string, number>();

          orders
            .filter(order => {
              const dateStr = order.paymentDate || order.orderDate;
              if (!dateStr) return false;
              const orderDate = new Date(dateStr);
              return orderDate >= thirtyDaysAgo && orderDate <= now;
            })
            .forEach(order => {
              order.orderItems?.forEach(item => {
                const productName = item.productName || item.name || item.title || 'Unknown Product';
                const qty = typeof item.quantity === 'number' ? item.quantity : 1;
                const price = typeof item.unitPrice === 'number'
                  ? item.unitPrice
                  : (typeof item.price === 'number' ? item.price : 0);
                const itemRevenue = qty * price;

                const currentRevenue = productRevenueMap.get(productName) || 0;
                productRevenueMap.set(productName, currentRevenue + itemRevenue);
              });
            });

          // Convert to array and sort by revenue
          const productRevenueArray: ProductRevenue[] = Array.from(productRevenueMap.entries())
            .map(([productName, revenue]) => ({
              productName,
              revenue: Math.round(revenue)
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5); // Top 5 products

          setTopProducts(productRevenueArray);
          setSalesLoading(false);
        }
      } catch {
        console.error('Failed to fetch sales summary');
        if (mounted) setSalesLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const visitorStats = calculateVisitorStats();
  const revenueStats = calculateRevenueStats();

  // Navigation tabs component
  const NavTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeSection === 'status' ? 'active' : ''}`}
        onClick={() => setActiveSection('status')}
      >
        Status
      </button>
      <button
        className={`dashboard-tab ${activeSection === 'visitors' ? 'active' : ''}`}
        onClick={() => setActiveSection('visitors')}
      >
        Visitors
      </button>
      <button
        className={`dashboard-tab ${activeSection === 'revenue' ? 'active' : ''}`}
        onClick={() => setActiveSection('revenue')}
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
              value={`€${(salesSummary?.totalAmount ?? 0).toLocaleString()}`}
              loading={salesLoading}
              error={salesSummary ? undefined : 'Failed to load'}
              accent="green"
            />
            <KPICard
              label="Avg Daily Revenue"
              value={`€${revenueStats.avg.toLocaleString()}`}
              loading={salesLoading}
              error={salesSummary ? undefined : 'Failed to load'}
              accent="green"
            />
          </div>
        )}

        {/* VISITORS Section */}
        {activeSection === 'visitors' && (
          <div className="dashboard-section">
            <SectionPill label="VISITORS" color="blue" />
            <div className="visitors-content">
              <div className="visitors-chart">
                {visitorLoading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : visitorError ? (
                  <div className="chart-error">Failed to load data. Retry</div>
                ) : visitorAnalytics?.dailyData ? (
                  <AreaLineChart
                    data={visitorAnalytics.dailyData.map(d => ({ date: d.date, value: d.uniqueCount }))}
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
                      {visitorAnalytics.topCountries.slice(0, 2).map((country) => (
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
            <SectionPill label="REVENUE" color="green" />
            <div className="revenue-content">
              <div className="revenue-chart">
                {salesLoading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : !salesSummary ? (
                  <div className="chart-error">Failed to load data. Retry</div>
                ) : (
                  <AreaLineChart
                    data={revenueTimeSeries.map(d => ({ date: d.date, value: d.amount }))}
                    title="Revenue — Last 30 days"
                    subtitle={`Total: ${(salesSummary?.totalAmount ?? 0).toLocaleString()} €`}
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
                  {salesLoading ? (
                    <div className="loading-products">Loading products...</div>
                  ) : topProducts.length > 0 ? (
                    <div className="products-list">
                      {topProducts.map((product, index) => (
                        <ProductRevenueRow
                          key={`${product.productName}-${index}`}
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
            <SectionPill label="STATUS" color="blue" />

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
                value={systemHealthLoading ? "Loading..." : systemHealth ? systemHealthService.formatUptime(Date.now() / 1000 - systemHealth.system.uptime) : "N/A"}
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
                      <div className="status-text" style={{ color: '#EF4444' }}>Error loading system health</div>
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
                        <div className={`status-pill ${systemHealth.overallStatus === 'healthy' ? 'healthy' : systemHealth.overallStatus === 'degraded' ? 'degraded' : 'critical'}`}>
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
