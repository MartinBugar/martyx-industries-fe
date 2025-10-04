'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenExpired } from '@/lib/services/apiUtils';
import AdminLayout from '@/components/admin/AdminLayout';
import VisitorChart, { type VisitorChartDataPoint } from '@/components/Charts/VisitorChart';
import { visitorService } from '@/lib/services/visitorService';
import { systemHealthService, type SystemHealthData } from '@/lib/services/systemHealthService';
import { revenueAnalyticsService, type RevenueAnalytics } from '@/lib/services/revenueAnalyticsService';
import './AdminDashboard.css';

type DashboardSection = 'status' | 'visitors' | 'revenue';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<DashboardSection>('status');

  // Status data
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Visitors data
  const [visitorData, setVisitorData] = useState<VisitorChartDataPoint[]>([]);
  const [topCountries, setTopCountries] = useState<Array<{ country: string; count: number }>>([]);
  const [loadingVisitors, setLoadingVisitors] = useState(true);

  // Revenue data
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(true);

  useEffect(() => {
    const hasWindow = typeof window !== 'undefined';
    const adminFlag = hasWindow && window.localStorage.getItem('adminAuthed') === 'true';
    const token = hasWindow ? window.localStorage.getItem('token') : null;
    const validToken = !!token && !isTokenExpired(token);

    if (!adminFlag || !validToken) {
      router.replace('/admin');
      return;
    }

    // Load data based on active section
    if (activeSection === 'status') {
      loadSystemHealth();
    } else if (activeSection === 'visitors') {
      loadVisitorData();
    } else if (activeSection === 'revenue') {
      loadRevenueData();
    }
  }, [activeSection, router]);

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
    <AdminLayout title="Dashboard" navTabs={navTabs}>
      {/* Status Section */}
      {activeSection === 'status' && (
        <div className="dashboard-section">
          <h2 className="section-title">System Status</h2>

          {loadingStatus ? (
            <div className="loading-state">Loading system health...</div>
          ) : systemHealth ? (
            <>
              {/* KPI Row */}
              <div className="kpi-row">
                <div className="kpi-card">
                  <div className="kpi-label">Overall Health</div>
                  <div className={`kpi-value status-${systemHealth.overall.toLowerCase()}`}>
                    {systemHealth.overall}
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Database</div>
                  <div className={`kpi-value status-${systemHealth.database.status.toLowerCase()}`}>
                    {systemHealth.database.status}
                  </div>
                  <div className="kpi-subtext">{systemHealth.database.responseTime}ms</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">CPU Usage</div>
                  <div className="kpi-value">{systemHealth.cpu.usage}%</div>
                  <div className="kpi-subtext">{systemHealth.cpu.cores} cores</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-label">Memory</div>
                  <div className="kpi-value">{systemHealth.memory.usagePercent}%</div>
                  <div className="kpi-subtext">{systemHealth.memory.used} / {systemHealth.memory.total}</div>
                </div>
              </div>

              {/* Services Status */}
              <div className="services-grid">
                <h3 className="subsection-title">Services</h3>
                <div className="service-cards">
                  <div className="service-card">
                    <div className="service-name">Disk</div>
                    <div className={`service-status status-${systemHealth.disk.status.toLowerCase()}`}>
                      {systemHealth.disk.status}
                    </div>
                    <div className="service-detail">{systemHealth.disk.usagePercent}% used ({systemHealth.disk.used} / {systemHealth.disk.total})</div>
                  </div>

                  {systemHealth.services.map((service, idx) => (
                    <div key={idx} className="service-card">
                      <div className="service-name">{service.name}</div>
                      <div className={`service-status status-${service.status.toLowerCase()}`}>
                        {service.status}
                      </div>
                      <div className="service-detail">{service.responseTime}ms</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="error-state">Failed to load system health data</div>
          )}
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
  );
}
