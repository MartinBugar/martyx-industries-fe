import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { doMetricsService } from '../../services/doMetricsService';
import { salesService, type SalesSummary } from '../../services/salesService';
import { visitorService, type VisitorAnalytics } from '../../services/visitorService';
import { adminOrdersService } from '../../services/adminOrdersService';
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

interface MiniStatCardProps {
  label: string;
  value: string;
}

const MiniStatCard: React.FC<MiniStatCardProps> = ({ label, value }) => {
  return (
    <div className="mini-stat-card">
      <div className="mini-stat-label">{label}</div>
      <div className="mini-stat-value">{value}</div>
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
  // Visitor analytics state
  const [visitorAnalytics, setVisitorAnalytics] = useState<VisitorAnalytics | null>(null);
  const [visitorLoading, setVisitorLoading] = useState<boolean>(true);
  const [visitorError, setVisitorError] = useState<string | null>(null);

  // Sales state
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [salesLoading, setSalesLoading] = useState<boolean>(true);
  const [revenueTimeSeries, setRevenueTimeSeries] = useState<RevenueSeriesPoint[]>([]);

  const [bandwidth, setBandwidth] = useState<unknown | null>(null);
  const [bandwidthLoading, setBandwidthLoading] = useState<boolean>(true);
  const [bandwidthError, setBandwidthError] = useState<string | null>(null);

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

  return (
    <AdminLayout title="Dashboard">
      <div className="dashboard-v3">
        {/* Top KPI Row */}
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

        {/* VISITORS Section */}
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

        {/* REVENUE Section */}
        <div className="dashboard-section">
          <SectionPill label="REVENUE" color="green" />
          <div className="revenue-content">
            <div className="card revenue-card">
              <div className="revenue-header">
                <div className="revenue-title-area">
                  <h3 className="card-title">Revenue — Last 30 days</h3>
                </div>
                <div className="mini-stats">
                  <MiniStatCard
                    label="Sales (30d)"
                    value={salesLoading ? "Loading..." : `${salesSummary?.ordersCount ?? 0} orders`}
                  />
                  <MiniStatCard
                    label="Revenue (30d)"
                    value={salesLoading ? "Loading..." : `${(salesSummary?.totalAmount ?? 0).toLocaleString()} €`}
                  />
                </div>
              </div>
              <div className="revenue-chart">
                {salesLoading ? (
                  <div className="chart-loading">Loading chart...</div>
                ) : !salesSummary ? (
                  <div className="chart-error">Failed to load data. Retry</div>
                ) : (
                  <AreaLineChart
                    data={revenueTimeSeries.map(d => ({ date: d.date, value: d.amount }))}
                    title=""
                    color="green"
                    peak={revenueStats.peak}
                    avg={revenueStats.avg}
                    unit=" €/day"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="bottom-row">
          <div className="data-status">
            <div className="card">
              <h3 className="card-title">Data Status</h3>
              <div className="status-info">
                <div className="status-text">
                  Last updated: {visitorAnalytics?.lastUpdated
                    ? new Date(visitorAnalytics.lastUpdated).toLocaleString('sk-SK')
                    : '20. 9. 2025 13:51:49'
                  }
                </div>
                <div className="status-text">Auto-refresh: every 3 hours</div>
                <div className="status-pill healthy">Healthy</div>
              </div>
            </div>
          </div>
          <div className="system-bandwidth">
            <div className="card">
              <h3 className="card-title">System — Daily Bandwidth</h3>
              <div className="bandwidth-content">
                {bandwidthLoading ? (
                  <div>Loading...</div>
                ) : bandwidthError || typeof bandwidth === 'string' ? (
                  <div className="bandwidth-unavailable">Metrics not available</div>
                ) : (
                  <div className="bandwidth-placeholder">Metrics not available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
