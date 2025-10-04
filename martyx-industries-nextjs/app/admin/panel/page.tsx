'use client';

import React, { useEffect, useState } from 'react';
import RequireAdmin from '@/components/RequireAdmin';
import AdminLayout from '@/components/admin/AdminLayout';
import VisitorChart, { type VisitorChartDataPoint } from '@/components/Charts/VisitorChart';
import { visitorService } from '@/lib/services/visitorService';
import { systemHealthService, type SystemHealthResponse } from '@/lib/services/systemHealthService';
import { revenueAnalyticsService, type RevenueAnalytics } from '@/lib/services/revenueAnalyticsService';
import './AdminDashboard.css';

type DashboardSection = 'status' | 'visitors' | 'revenue';

// KPI Card Component (from old implementation)
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

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<DashboardSection>('status');

  // Status data
  const [systemHealth, setSystemHealth] = useState<SystemHealthResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Visitors data
  const [visitorData, setVisitorData] = useState<VisitorChartDataPoint[]>([]);
  const [topCountries, setTopCountries] = useState<Array<{ country: string; count: number }>>([]);
  const [loadingVisitors, setLoadingVisitors] = useState(true);

  // Revenue data
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(true);

  useEffect(() => {
    // Load data based on active section - no auth check needed, RequireAdmin handles it
    if (activeSection === 'status') {
      loadSystemHealth();
    } else if (activeSection === 'visitors') {
      loadVisitorData();
    } else if (activeSection === 'revenue') {
      loadRevenueData();
    }
  }, [activeSection]);

  const loadSystemHealth = async () => {
    setLoadingStatus(true);
    try {
      const data = await systemHealthService.getSystemHealth();
      setSystemHealth(data);
    } catch (err) {
      console.error('Failed to load system health:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadVisitorData = async () => {
    setLoadingVisitors(true);
    try {
      const analytics = await visitorService.getVisitorAnalytics(30);
      const dailyData = await visitorService.getVisitorDailyData(30);

      setVisitorData(dailyData);
      setTopCountries(analytics.topCountries || []);
    } catch (err) {
      console.error('Failed to load visitor data:', err);
    } finally {
      setLoadingVisitors(false);
    }
  };

  const loadRevenueData = async () => {
    setLoadingRevenue(true);
    try {
      const data = await revenueAnalyticsService.getRevenueAnalytics(30);
      setRevenueAnalytics(data);
    } catch (err) {
      console.error('Failed to load revenue data:', err);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const navTabs = (
    <div className="admin-nav-tabs">
      <button
        className={`admin-nav-tab${activeSection === 'status' ? ' active' : ''}`}
        onClick={() => setActiveSection('status')}
      >
        📊 Status
      </button>
      <button
        className={`admin-nav-tab${activeSection === 'visitors' ? ' active' : ''}`}
        onClick={() => setActiveSection('visitors')}
      >
        👥 Visitors
      </button>
      <button
        className={`admin-nav-tab${activeSection === 'revenue' ? ' active' : ''}`}
        onClick={() => setActiveSection('revenue')}
      >
        💰 Revenue
      </button>
    </div>
  );

  return (
    <RequireAdmin>
      <AdminLayout title="Dashboard" navTabs={navTabs}>
      {/* Status Section */}
      {activeSection === 'status' && (
        <div className="dashboard-section">
          <div className="section-header">
            <div className="section-pill" style={{ backgroundColor: '#3B82F6' }}>
              STATUS
            </div>
            <div className="section-divider"></div>
          </div>

          {/* System Health KPIs */}
          <div className="kpi-row">
            <KPICard
              label="Database"
              value={loadingStatus ? "Loading..." : systemHealth?.database.connected ? "Connected" : "Disconnected"}
              loading={loadingStatus}
              error={systemHealth ? undefined : 'Failed to load'}
              accent={systemHealth?.database.connected ? "green" : "blue"}
            />
            <KPICard
              label="DB Response Time"
              value={loadingStatus ? "Loading..." : systemHealth?.database.connected ? `${systemHealth.database.connectionTime}ms` : "N/A"}
              loading={loadingStatus}
              error={systemHealth ? undefined : 'Failed to load'}
              accent="blue"
            />
            <KPICard
              label="System Uptime"
              value={loadingStatus ? "Loading..." : systemHealth ? `${Math.floor(systemHealth.system.uptime / 3600)}h` : "N/A"}
              loading={loadingStatus}
              error={systemHealth ? undefined : 'Failed to load'}
              accent="green"
            />
            <KPICard
              label="CPU Usage"
              value={loadingStatus ? "Loading..." : systemHealth ? `${systemHealth.system.cpuUsage}%` : "N/A"}
              loading={loadingStatus}
              error={systemHealth ? undefined : 'Failed to load'}
              accent={systemHealth && systemHealth.system.cpuUsage > 80 ? "blue" : "green"}
            />
          </div>

          {/* System Details */}
          <div className="bottom-row">
            <div className="data-status">
              <div className="card">
                <h3 className="card-title">System Health</h3>
                <div className="status-info">
                  {loadingStatus ? (
                    <div className="status-text">Loading system metrics...</div>
                  ) : !systemHealth ? (
                    <div className="status-text" style={{ color: '#EF4444' }}>Error loading system health</div>
                  ) : (
                    <>
                      <div className="status-text">
                        Memory: {(systemHealth.system.memoryUsage.used / 1024).toFixed(1)}GB / {(systemHealth.system.memoryUsage.total / 1024).toFixed(1)}GB ({systemHealth.system.memoryUsage.percentage.toFixed(1)}%)
                      </div>
                      <div className="status-text">
                        Disk: {(systemHealth.system.diskSpace.used / 1024).toFixed(1)}GB / {(systemHealth.system.diskSpace.total / 1024).toFixed(1)}GB ({systemHealth.system.diskSpace.percentage.toFixed(1)}%)
                      </div>
                      <div className="status-text">
                        Database: {systemHealth.database.database}
                      </div>
                      <div className={`status-pill ${systemHealth.overallStatus === 'healthy' ? 'healthy' : systemHealth.overallStatus === 'degraded' ? 'degraded' : 'critical'}`}>
                        {systemHealth.overallStatus.charAt(0).toUpperCase() + systemHealth.overallStatus.slice(1)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="system-bandwidth">
              <div className="card">
                <h3 className="card-title">API Endpoints</h3>
                <div className="bandwidth-content">
                  {loadingStatus ? (
                    <div>Loading endpoints...</div>
                  ) : !systemHealth ? (
                    <div className="bandwidth-unavailable">Failed to load endpoint status</div>
                  ) : systemHealth.apiEndpoints && systemHealth.apiEndpoints.length > 0 ? (
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

      {/* Visitors Section */}
      {activeSection === 'visitors' && (
        <div className="dashboard-section">
          <h2 className="section-title">Visitor Analytics</h2>

          {loadingVisitors ? (
            <div className="loading-state">Loading visitor data...</div>
          ) : (
            <>
              {/* KPI Row */}
              <div className="kpi-row">
                <div className="kpi-card">
                  <div className="kpi-label">Total Visits (30d)</div>
                  <div className="kpi-value">
                    {visitorData.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Unique Visitors (30d)</div>
                  <div className="kpi-value">
                    {visitorData.reduce((sum, d) => sum + d.uniqueCount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Avg. Daily Visits</div>
                  <div className="kpi-value">
                    {visitorData.length > 0
                      ? Math.round(visitorData.reduce((sum, d) => sum + d.count, 0) / visitorData.length)
                      : 0}
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Peak Day</div>
                  <div className="kpi-value">
                    {visitorData.length > 0
                      ? Math.max(...visitorData.map(d => d.count))
                      : 0}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="chart-container">
                <h3 className="subsection-title">Daily Visitors (Last 30 Days)</h3>
                <div className="chart-wrapper">
                  <VisitorChart
                    data={visitorData}
                    width={800}
                    height={300}
                    stroke="#3B82F6"
                    fill="rgba(59, 130, 246, 0.15)"
                    showValueLabels={false}
                    tooltipLabel="visitors"
                  />
                </div>
              </div>

              {/* Top Countries */}
              <div className="top-countries">
                <h3 className="subsection-title">Top Countries</h3>
                <div className="country-list">
                  {topCountries.length > 0 ? (
                    topCountries.map((c, idx) => (
                      <div key={idx} className="country-item">
                        <div className="country-rank">#{idx + 1}</div>
                        <div className="country-name">{c.country}</div>
                        <div className="country-count">{c.count.toLocaleString()} visits</div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No country data available</div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Revenue Section */}
      {activeSection === 'revenue' && (
        <div className="dashboard-section">
          <h2 className="section-title">Revenue Analytics</h2>

          {loadingRevenue ? (
            <div className="loading-state">Loading revenue data...</div>
          ) : revenueAnalytics ? (
            <>
              {/* KPI Row */}
              <div className="kpi-row">
                <div className="kpi-card">
                  <div className="kpi-label">Total Revenue (30d)</div>
                  <div className="kpi-value">€{revenueAnalytics.totalRevenue.toLocaleString()}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Total Orders</div>
                  <div className="kpi-value">{revenueAnalytics.totalOrders.toLocaleString()}</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Avg. Order Value</div>
                  <div className="kpi-value">
                    €{revenueAnalytics.totalOrders > 0
                      ? (revenueAnalytics.totalRevenue / revenueAnalytics.totalOrders).toFixed(2)
                      : '0.00'}
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Peak Day Revenue</div>
                  <div className="kpi-value">
                    €{revenueAnalytics.dailyRevenue.length > 0
                      ? Math.max(...revenueAnalytics.dailyRevenue.map(d => d.count)).toLocaleString()
                      : 0}
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="chart-container">
                <h3 className="subsection-title">Daily Revenue (Last 30 Days)</h3>
                <div className="chart-wrapper">
                  <VisitorChart
                    data={revenueAnalytics.dailyRevenue}
                    width={800}
                    height={300}
                    stroke="#10B981"
                    fill="rgba(16, 185, 129, 0.15)"
                    showValueLabels={false}
                    tooltipUnit="€"
                    tooltipLabel="revenue"
                  />
                </div>
              </div>

              {/* Top Products */}
              <div className="top-products">
                <h3 className="subsection-title">Top Products by Revenue</h3>
                <div className="product-list">
                  {revenueAnalytics.topProducts.length > 0 ? (
                    revenueAnalytics.topProducts.map((p, idx) => (
                      <div key={idx} className="product-item">
                        <div className="product-rank">#{idx + 1}</div>
                        <div className="product-details">
                          <div className="product-name">{p.name}</div>
                          <div className="product-sales">{p.quantity} sold</div>
                        </div>
                        <div className="product-revenue">€{p.revenue.toLocaleString()}</div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">No product data available</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="error-state">Failed to load revenue data</div>
          )}
        </div>
      )}
    </AdminLayout>
    </RequireAdmin>
  );
}
