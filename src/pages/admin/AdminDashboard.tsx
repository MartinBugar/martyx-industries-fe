import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { visitorService, type VisitorTimeSeriesPoint } from '../../services/visitorService';
import VisitorsTimeSeriesChart from '../../components/Charts/VisitorsTimeSeriesChart';
import { doMetricsService } from '../../services/doMetricsService';
import { salesService, type SalesTimeSeriesPoint, type SalesSummary } from '../../services/salesService';

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
      <div style={{ display: 'grid', gap: 24 }}>
        {/* Visit Management */}
        <section>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 18, color: '#111827' }}>Visit Management</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Total visitors */}
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Total Visitors</div>
              {loading ? (
                <div>Loading…</div>
              ) : error ? (
                <div style={{ color: '#b91c1c' }}>{error}</div>
              ) : (
                <div style={{ fontSize: 28, fontWeight: 700 }}>{count ?? 0}</div>
              )}
            </div>

            {/* Visitors over time */}
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Visitors Over Time</div>
              {seriesLoading ? (
                <div>Loading…</div>
              ) : seriesError ? (
                <div style={{ color: '#b91c1c' }}>{seriesError}</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <VisitorsTimeSeriesChart data={series ?? []} width={560} height={200} ariaLabel="Visitors over time" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Sales */}
        <section>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 18, color: '#111827' }}>Sales</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {/* Sales summary (last 30 days) */}
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Sales (30 days)</div>
              {salesSummary ? (
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{salesSummary.ordersCount} orders</div>
                  <div style={{ fontSize: 14, color: '#374151' }}>
                    Revenue: {Number(salesSummary.totalAmount || 0).toLocaleString(undefined, { style: 'currency', currency: salesSummary.currency || 'USD' })}
                  </div>
                </div>
              ) : (
                <div>Loading…</div>
              )}
            </div>

            {/* Sales over time */}
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Sales Over Time (Last 30 days)</div>
              {salesLoading ? (
                <div>Loading…</div>
              ) : salesError ? (
                <div style={{ color: '#b91c1c' }}>{salesError}</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <VisitorsTimeSeriesChart data={salesSeries ?? []} width={560} height={200} stroke="#10b981" fill="rgba(16, 185, 129, 0.15)" ariaLabel="Sales over time" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* System (optional) */}
        <section>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 18, color: '#111827' }}>System</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            {/* Daily Bandwidth card */}
            <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
              <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Daily Bandwidth</div>
              {bandwidthLoading ? (
                <div>Loading…</div>
              ) : bandwidthError ? (
                <div style={{ color: '#b91c1c' }}>{bandwidthError}</div>
              ) : (
                <div style={{ maxWidth: 420, overflowX: 'auto' }}>
                  {typeof bandwidth === 'string' ? (
                    <code>{bandwidth}</code>
                  ) : (
                    <pre style={{ margin: 0 }}>{JSON.stringify(bandwidth, null, 2)}</pre>
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
