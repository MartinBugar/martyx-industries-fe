import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { visitorService, type VisitorTimeSeriesPoint } from '../../services/visitorService';
import VisitorsTimeSeriesChart from '../../components/Charts/VisitorsTimeSeriesChart';
import { doMetricsService } from '../../services/doMetricsService';
import { salesService, type SalesTimeSeriesPoint, type SalesSummary } from '../../services/salesService';
import VisitorAnalyticsComponent from '../../components/Analytics/VisitorAnalytics';
import RealTimeVisitors from '../../components/Analytics/RealTimeVisitors';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [series, setSeries] = useState<VisitorTimeSeriesPoint[] | null>(null);
  const [seriesLoading, setSeriesLoading] = useState<boolean>(true);
  const [seriesError, setSeriesError] = useState<string | null>(null);

  const [salesSeries, setSalesSeries] = useState<SalesTimeSeriesPoint[] | null>(null);
  const [salesLoading, setSalesLoading] = useState<boolean>(true);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);

  const [bandwidth, setBandwidth] = useState<unknown | null>(null);
  const [bandwidthLoading, setBandwidthLoading] = useState<boolean>(true);
  const [bandwidthError, setBandwidthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Load total count
    (async () => {
      try {
        const resp = await visitorService.getVisitorCount();
        if (mounted) {
          setCount(resp.totalCount);
        }
      } catch (e) {
        console.error('Failed to fetch visitor count', e);
        if (mounted) setError('Failed to load visitor count');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    // Load time series (last 30 days)
    (async () => {
      try {
        const resp = await visitorService.getVisitorTimeSeries(30);
        if (mounted) setSeries(resp);
      } catch (e) {
        console.error('Failed to fetch visitor time series', e);
        if (mounted) setSeriesError('Failed to load visitor time series');
      } finally {
        if (mounted) setSeriesLoading(false);
      }
    })();

    // Load daily bandwidth (today)
    (async () => {
      try {
        const data = await doMetricsService.getBandwidthDaily();
        if (mounted) setBandwidth(data);
      } catch (e) {
        console.error('Failed to fetch daily bandwidth', e);
        if (mounted) setBandwidthError('Failed to load daily bandwidth');
      } finally {
        if (mounted) setBandwidthLoading(false);
      }
    })();

    // Load sales time series (last 30 days)
    (async () => {
      try {
        const sales = await salesService.getSalesTimeSeries(30);
        if (mounted) setSalesSeries(sales);
      } catch (e) {
        console.error('Failed to fetch sales time series', e);
        if (mounted) setSalesError('Failed to load sales time series');
      } finally {
        if (mounted) setSalesLoading(false);
      }
    })();

    // Load sales summary (last 30 days)
    (async () => {
      try {
        const summary = await salesService.getSalesSummary(30);
        if (mounted) setSalesSummary(summary);
      } catch (e) {
        console.error('Failed to fetch sales summary', e);
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div className="admin-dashboard">
        {/* Real-Time Overview */}
        <section>
          <h2 className="admin-section-title">Real-Time Overview</h2>
          <div className="admin-cards-grid-wide">
            {/* Real-time visitors */}
            <div className="admin-card admin-card--realtime">
              <RealTimeVisitors refreshInterval={5} autoRefresh={true} />
            </div>

            {/* Quick stats */}
            <div className="admin-card admin-card--stats">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Total Visitors</div>
                  {loading ? (
                    <div className="stat-loading">Loading…</div>
                  ) : error ? (
                    <div className="stat-error">{error}</div>
                  ) : (
                    <div className="stat-value">{count?.toLocaleString() ?? 0}</div>
                  )}
                </div>

                {salesSummary && (
                  <>
                    <div className="stat-item">
                      <div className="stat-label">Orders (30d)</div>
                      <div className="stat-value">{salesSummary.ordersCount.toLocaleString()}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Revenue (30d)</div>
                      <div className="stat-value">
                        {Number(salesSummary.totalAmount || 0).toLocaleString(undefined, {
                          style: 'currency',
                          currency: salesSummary.currency || 'EUR'
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Analytics */}
        <section>
          <h2 className="admin-section-title">Visitor Analytics</h2>
          <div className="admin-card admin-card--full-width">
            <VisitorAnalyticsComponent days={30} autoRefresh={false} />
          </div>
        </section>

        {/* Charts Section */}
        <section>
          <h2 className="admin-section-title">Trends & Performance</h2>
          <div className="admin-cards-grid-280">
            {/* Visitors over time */}
            <div className="admin-card">
              <div className="admin-card-label">Visitors Over Time (30 days)</div>
              {seriesLoading ? (
                <div>Loading…</div>
              ) : seriesError ? (
                <div className="admin-error">{seriesError}</div>
              ) : (
                <div className="overflow-x-auto">
                  <VisitorsTimeSeriesChart data={series ?? []} width={560} height={200} ariaLabel="Visitors over time" />
                </div>
              )}
            </div>

            {/* Sales over time */}
            <div className="admin-card">
              <div className="admin-card-label">Sales Over Time (30 days)</div>
              {salesLoading ? (
                <div>Loading…</div>
              ) : salesError ? (
                <div className="admin-error">{salesError}</div>
              ) : (
                <div className="overflow-x-auto">
                  <VisitorsTimeSeriesChart data={salesSeries ?? []} width={560} height={200} stroke="#10b981" fill="rgba(16, 185, 129, 0.15)" ariaLabel="Sales over time" />
                </div>
              )}
            </div>
          </div>
        </section>


        {/* System (optional) */}
        <section>
          <h2 className="admin-section-title">System</h2>
          <div className="admin-cards-grid-320">
            {/* Daily Bandwidth card */}
            <div className="admin-card">
              <div className="admin-card-label">Daily Bandwidth</div>
              {bandwidthLoading ? (
                <div>Loading…</div>
              ) : bandwidthError ? (
                <div className="admin-error">{bandwidthError}</div>
              ) : (
                <div className="max-w-420 overflow-x-auto">
                  {typeof bandwidth === 'string' ? (
                    <code>{bandwidth}</code>
                  ) : (
                    <pre className="pre-reset">{JSON.stringify(bandwidth, null, 2)}</pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
