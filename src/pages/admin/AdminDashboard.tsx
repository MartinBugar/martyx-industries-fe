import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { doMetricsService } from '../../services/doMetricsService';
import { salesService, type SalesSummary } from '../../services/salesService';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {

  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);

  const [bandwidth, setBandwidth] = useState<unknown | null>(null);
  const [bandwidthLoading, setBandwidthLoading] = useState<boolean>(true);
  const [bandwidthError, setBandwidthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

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

        {/* Sales */}
        <section>
          <h2 className="admin-section-title">Sales</h2>
          <div className="admin-cards-grid-280">
            {/* Sales summary (last 30 days) */}
            <div className="admin-card admin-card--compact">
              <div className="admin-card-label">Sales (30 days)</div>
              {salesSummary ? (
                <div>
                  <div className="admin-number">{salesSummary.ordersCount} orders</div>
                  <div className="admin-secondary-text">
                    Revenue: {Number(salesSummary.totalAmount || 0).toLocaleString(undefined, { style: 'currency', currency: salesSummary.currency || 'USD' })}
                  </div>
                </div>
              ) : (
                <div>Loading…</div>
              )}
            </div>

            {/* Sales chart removed - chart component not available */}
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
