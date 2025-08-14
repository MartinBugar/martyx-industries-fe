import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { visitorService, type VisitorTimeSeriesPoint } from '../../services/visitorService';
import VisitorsTimeSeriesChart from '../../components/Charts/VisitorsTimeSeriesChart';

const AdminDashboard: React.FC = () => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [series, setSeries] = useState<VisitorTimeSeriesPoint[] | null>(null);
  const [seriesLoading, setSeriesLoading] = useState<boolean>(true);
  const [seriesError, setSeriesError] = useState<string | null>(null);

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

    return () => { mounted = false; };
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {/* Total visitors card (unchanged) */}
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, minWidth: 220 }}>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Total Visitors</div>
            {loading ? (
              <div>Loading…</div>
            ) : error ? (
              <div style={{ color: '#b91c1c' }}>{error}</div>
            ) : (
              <div style={{ fontSize: 28, fontWeight: 700 }}>{count ?? 0}</div>
            )}
          </div>

          {/* Visitors over time chart card */}
          <div style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, minWidth: 320, flex: 1 }}>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Visitors Over Time</div>
            {seriesLoading ? (
              <div>Loading…</div>
            ) : seriesError ? (
              <div style={{ color: '#b91c1c' }}>{seriesError}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <VisitorsTimeSeriesChart data={series ?? []} width={560} height={200} />
              </div>
            )}
          </div>
        </div>
        <p>Welcome to the admin dashboard.</p>
        <ul>
          <li>Use the sidebar to navigate between sections.</li>
          <li>Users: manage application users.</li>
          <li>Products: manage products/catalog.</li>
          <li>Orders: review and manage orders.</li>
        </ul>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
