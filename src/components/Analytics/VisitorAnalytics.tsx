import React, { useEffect, useState } from 'react';
import { visitorService, type VisitorAnalytics } from '../../services/visitorService';
import './VisitorAnalytics.css';

interface VisitorAnalyticsComponentProps {
  days?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

const VisitorAnalyticsComponent: React.FC<VisitorAnalyticsComponentProps> = ({
  days = 30,
  autoRefresh = false,
  refreshInterval = 60
}) => {
  const [analytics, setAnalytics] = useState<VisitorAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await visitorService.getVisitorAnalytics(days);
      setAnalytics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load visitor analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();

    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadAnalytics, refreshInterval * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [days, autoRefresh, refreshInterval]);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading && !analytics) {
    return (
      <div className="visitor-analytics">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="visitor-analytics">
        <div className="analytics-error">
          <p>{error}</p>
          <button onClick={loadAnalytics} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="visitor-analytics">
      {/* Header with refresh info */}
      <div className="analytics-header">
        <h3>Visitor Analytics ({days} days)</h3>
        <div className="analytics-meta">
          {lastUpdated && (
            <span className="last-updated">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadAnalytics}
            className="refresh-button"
            disabled={loading}
            aria-label="Refresh analytics"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4a9 9 0 0 1-14.85 3.36L23 14" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="analytics-overview">
        <div className="metric-card">
          <div className="metric-value">{analytics.totalVisitors.toLocaleString()}</div>
          <div className="metric-label">Total Visitors</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{analytics.uniqueVisitors.toLocaleString()}</div>
          <div className="metric-label">Unique Visitors</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{analytics.totalPageViews.toLocaleString()}</div>
          <div className="metric-label">Page Views</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatDuration(analytics.averageSessionDuration)}</div>
          <div className="metric-label">Avg. Session</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatPercentage(analytics.bounceRate)}</div>
          <div className="metric-label">Bounce Rate</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatPercentage(analytics.conversionMetrics.conversionRate)}</div>
          <div className="metric-label">Conversion Rate</div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="analytics-grid">
        {/* Top Pages */}
        <div className="analytics-card">
          <h4>Top Pages</h4>
          <div className="analytics-list">
            {analytics.topPages.slice(0, 10).map((page, index) => (
              <div key={page.page} className="analytics-item">
                <div className="item-rank">#{index + 1}</div>
                <div className="item-details">
                  <div className="item-name" title={page.page}>{page.page}</div>
                  <div className="item-metric">{page.views.toLocaleString()} views</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="analytics-card">
          <h4>Traffic Sources</h4>
          <div className="analytics-list">
            {analytics.trafficSources.slice(0, 8).map((source, index) => (
              <div key={source.source} className="analytics-item">
                <div className="item-details">
                  <div className="item-name">{source.source || 'Direct'}</div>
                  <div className="item-metrics">
                    <span className="item-count">{source.count.toLocaleString()}</span>
                    <span className="item-percentage">{formatPercentage(source.percentage)}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${source.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Browser Stats */}
        <div className="analytics-card">
          <h4>Browsers</h4>
          <div className="analytics-list">
            {analytics.browserStats.slice(0, 6).map((browser) => (
              <div key={browser.browser} className="analytics-item">
                <div className="item-details">
                  <div className="item-name">{browser.browser}</div>
                  <div className="item-metrics">
                    <span className="item-count">{browser.count.toLocaleString()}</span>
                    <span className="item-percentage">{formatPercentage(browser.percentage)}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${browser.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Stats */}
        <div className="analytics-card">
          <h4>Devices</h4>
          <div className="analytics-list">
            {analytics.deviceStats.slice(0, 5).map((device) => (
              <div key={device.device} className="analytics-item">
                <div className="item-details">
                  <div className="item-name">{device.device}</div>
                  <div className="item-metrics">
                    <span className="item-count">{device.count.toLocaleString()}</span>
                    <span className="item-percentage">{formatPercentage(device.percentage)}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${device.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Data */}
        <div className="analytics-card">
          <h4>Countries</h4>
          <div className="analytics-list">
            {analytics.countryStats.slice(0, 8).map((country) => (
              <div key={country.country} className="analytics-item">
                <div className="item-details">
                  <div className="item-name">{country.country}</div>
                  <div className="item-metrics">
                    <span className="item-count">{country.count.toLocaleString()}</span>
                    <span className="item-percentage">{formatPercentage(country.percentage)}</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${country.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="analytics-card analytics-card--wide">
          <h4>Hourly Traffic Distribution</h4>
          <div className="hourly-chart">
            {analytics.hourlyDistribution.map((hour) => {
              const maxHourlyCount = Math.max(...analytics.hourlyDistribution.map(h => h.count));
              const percentage = maxHourlyCount > 0 ? (hour.count / maxHourlyCount) * 100 : 0;

              return (
                <div key={hour.hour} className="hourly-bar">
                  <div
                    className="bar-fill"
                    style={{ height: `${percentage}%` }}
                    title={`${hour.hour}:00 - ${hour.count} visitors`}
                  ></div>
                  <div className="bar-label">{hour.hour}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="conversion-funnel">
        <h4>Conversion Metrics</h4>
        <div className="funnel-metrics">
          <div className="funnel-step">
            <div className="step-label">Cart Adds</div>
            <div className="step-value">{analytics.conversionMetrics.cartAdds.toLocaleString()}</div>
          </div>
          <div className="funnel-arrow">→</div>
          <div className="funnel-step">
            <div className="step-label">Checkout Starts</div>
            <div className="step-value">{analytics.conversionMetrics.checkoutStarts.toLocaleString()}</div>
          </div>
          <div className="funnel-arrow">→</div>
          <div className="funnel-step">
            <div className="step-label">Purchases</div>
            <div className="step-value">{analytics.conversionMetrics.purchases.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorAnalyticsComponent;