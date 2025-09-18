import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { doMetricsService } from '../../services/doMetricsService';
import { salesService, type SalesSummary } from '../../services/salesService';
import { visitorService, type VisitorAnalytics } from '../../services/visitorService';
import VisitorChart from '../../components/Charts/VisitorChart';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  // Visitor analytics state
  const [visitorAnalytics, setVisitorAnalytics] = useState<VisitorAnalytics | null>(null);
  const [visitorLoading, setVisitorLoading] = useState<boolean>(true);
  const [visitorError, setVisitorError] = useState<string | null>(null);

  // Sales state
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);

  const [bandwidth, setBandwidth] = useState<unknown | null>(null);
  const [bandwidthLoading, setBandwidthLoading] = useState<boolean>(true);
  const [bandwidthError, setBandwidthError] = useState<string | null>(null);

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
        console.error('Failed to load visitor analytics:', err);
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
        console.log('Using cached visitor analytics (last fetch:', new Date(parseInt(lastFetch)).toLocaleString(), ')');
      } catch (_) {
        console.warn('Failed to parse cached visitor data, fetching fresh data');
        loadVisitorAnalytics();
      }
    } else {
      // Fetch fresh data
      console.log('Fetching fresh visitor analytics data');
      loadVisitorAnalytics();
    }

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
      } catch (_) {
        console.error('Failed to fetch sales summary');
      }
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <AdminLayout title="Dashboard">
      <div className="admin-dashboard">
        {/* Visitor Analytics */}
        <section>
          <h2 className="admin-section-title">Visitor Analytics</h2>
          <div className="admin-cards-grid-280">
            {/* Total Visitors */}
            <div className="admin-card admin-card--compact">
              <div className="admin-card-label">Total Visitors</div>
              {visitorLoading ? (
                <div>Loading…</div>
              ) : visitorError ? (
                <div className="admin-error">{visitorError}</div>
              ) : (
                <div className="admin-big-number">{visitorAnalytics?.totalVisits?.toLocaleString() ?? 0}</div>
              )}
            </div>

            {/* Today's Visitors */}
            <div className="admin-card admin-card--compact">
              <div className="admin-card-label">Today's Visitors</div>
              {visitorLoading ? (
                <div>Loading…</div>
              ) : visitorError ? (
                <div className="admin-error">{visitorError}</div>
              ) : (
                <div className="admin-number">{visitorAnalytics?.todayVisits?.toLocaleString() ?? 0}</div>
              )}
            </div>

            {/* Visitor Chart - Daily Visits (30 days) */}
            <div className="admin-card admin-card--wide">
              <div className="admin-card-label">Daily Visitors (Last 30 days)</div>
              {visitorLoading ? (
                <div>Loading…</div>
              ) : visitorError ? (
                <div className="admin-error">{visitorError}</div>
              ) : visitorAnalytics?.dailyData ? (
                <div className="overflow-x-auto">
                  <VisitorChart
                    data={visitorAnalytics.dailyData}
                    width={560}
                    height={200}
                    stroke="#3B82F6"
                    fill="rgba(59, 130, 246, 0.15)"
                    ariaLabel="Daily visitors chart"
                    showValueLabels={true}
                    showUniqueVisitors={false}
                  />
                </div>
              ) : (
                <div className="admin-error">No visitor data available</div>
              )}
            </div>
          </div>

          {/* Top Countries */}
          {visitorAnalytics?.topCountries && visitorAnalytics.topCountries.length > 0 && (
            <div className="admin-card" style={{ marginTop: '1rem' }}>
              <div className="admin-card-label">Top Countries</div>
              <div className="visitor-countries-list">
                {visitorAnalytics.topCountries.slice(0, 8).map((country, _) => (
                  <div key={country.countryCode} className="country-item">
                    <div className="country-info">
                      <span className="country-flag">{country.countryCode}</span>
                      <span className="country-name">{country.country}</span>
                    </div>
                    <div className="country-stats">
                      <span className="country-count">{country.count.toLocaleString()}</span>
                      <span className="country-percentage">({country.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Updated Info */}
          {visitorAnalytics?.lastUpdated && (
            <div className="admin-card admin-card--compact" style={{ marginTop: '1rem' }}>
              <div className="admin-card-label">Data Status</div>
              <div className="admin-secondary-text">
                Last updated: {new Date(visitorAnalytics.lastUpdated).toLocaleString()}
              </div>
              <div className="admin-secondary-text">
                Data refreshes every 3 hours
              </div>
            </div>
          )}
        </section>

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
