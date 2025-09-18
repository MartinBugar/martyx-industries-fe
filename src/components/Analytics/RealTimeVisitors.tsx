import React, { useEffect, useState, useRef } from 'react';
import { visitorService, type RealTimeData } from '../../services/visitorService';
import './RealTimeVisitors.css';

interface RealTimeVisitorsProps {
  refreshInterval?: number; // in seconds, default 5
  autoRefresh?: boolean;
  maxRecentVisitors?: number;
}

const RealTimeVisitors: React.FC<RealTimeVisitorsProps> = ({
  refreshInterval = 5,
  autoRefresh = true,
  maxRecentVisitors = 20
}) => {
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadRealTimeData = async () => {
    try {
      setError(null);
      const data = await visitorService.getRealTimeData();
      setRealTimeData(data);
      setLastUpdated(new Date());
      setIsConnected(true);
    } catch (err) {
      console.error('Failed to load real-time data:', err);
      setError('Failed to load real-time data');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadRealTimeData();

    // Set up auto-refresh
    if (autoRefresh) {
      intervalRef.current = setInterval(loadRealTimeData, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, autoRefresh]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        );
      case 'tablet':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        );
    }
  };

  const getCountryFlag = (country?: string) => {
    if (!country) return '🌍';

    // Simple country code to flag emoji mapping
    const flagMap: { [key: string]: string } = {
      'Slovakia': '🇸🇰',
      'Czech Republic': '🇨🇿',
      'Germany': '🇩🇪',
      'Austria': '🇦🇹',
      'Poland': '🇵🇱',
      'Hungary': '🇭🇺',
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Japan': '🇯🇵',
      'China': '🇨🇳',
      'Russia': '🇷🇺',
      'Brazil': '🇧🇷',
      'India': '🇮🇳',
      'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪',
      'Switzerland': '🇨🇭',
      'Sweden': '🇸🇪',
      'Norway': '🇳🇴',
      'Denmark': '🇩🇰',
      'Finland': '🇫🇮',
    };

    return flagMap[country] || '🌍';
  };

  if (loading && !realTimeData) {
    return (
      <div className="real-time-visitors">
        <div className="realtime-header">
          <h3>Real-Time Visitors</h3>
          <div className="connection-status connecting">
            <div className="status-dot"></div>
            Connecting...
          </div>
        </div>
        <div className="realtime-loading">
          <div className="loading-spinner"></div>
          <p>Loading real-time data...</p>
        </div>
      </div>
    );
  }

  if (error && !realTimeData) {
    return (
      <div className="real-time-visitors">
        <div className="realtime-header">
          <h3>Real-Time Visitors</h3>
          <div className="connection-status disconnected">
            <div className="status-dot"></div>
            Disconnected
          </div>
        </div>
        <div className="realtime-error">
          <p>{error}</p>
          <button onClick={loadRealTimeData} className="retry-button">
            Reconnect
          </button>
        </div>
      </div>
    );
  }

  if (!realTimeData) return null;

  return (
    <div className="real-time-visitors">
      {/* Header */}
      <div className="realtime-header">
        <h3>Real-Time Visitors</h3>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
      </div>

      {/* Active Visitors Counter */}
      <div className="active-visitors-counter">
        <div className="counter-value">
          {realTimeData.activeVisitors}
        </div>
        <div className="counter-label">
          {realTimeData.activeVisitors === 1 ? 'Active Visitor' : 'Active Visitors'}
        </div>
        <div className="pulse-animation">
          <div className="pulse-ring"></div>
          <div className="pulse-ring"></div>
          <div className="pulse-ring"></div>
        </div>
      </div>

      {/* Current Page Views */}
      <div className="current-activity">
        <h4>Current Page Activity</h4>
        <div className="page-activity-list">
          {realTimeData.currentPageViews.length > 0 ? (
            realTimeData.currentPageViews.slice(0, 10).map((page, index) => (
              <div key={page.page} className="page-activity-item">
                <div className="page-info">
                  <div className="page-path" title={page.page}>{page.page}</div>
                  <div className="visitor-count">
                    {page.count} {page.count === 1 ? 'visitor' : 'visitors'}
                  </div>
                </div>
                <div className="activity-indicator">
                  <div className="activity-bar" style={{ width: `${(page.count / Math.max(...realTimeData.currentPageViews.map(p => p.count))) * 100}%` }}></div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>No current page activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Visitors */}
      <div className="recent-visitors">
        <h4>Recent Visitors</h4>
        <div className="recent-visitors-list">
          {realTimeData.recentVisitors.length > 0 ? (
            realTimeData.recentVisitors.slice(0, maxRecentVisitors).map((visitor, index) => (
              <div key={`${visitor.id}-${index}`} className="recent-visitor-item">
                <div className="visitor-info">
                  <div className="visitor-location">
                    <span className="country-flag">{getCountryFlag(visitor.country)}</span>
                    <span className="country-name">{visitor.country || 'Unknown'}</span>
                  </div>
                  <div className="visitor-device">
                    {getDeviceIcon(visitor.device)}
                    <span className="device-name">{visitor.device}</span>
                  </div>
                </div>
                <div className="visitor-activity">
                  <div className="current-page" title={visitor.page}>{visitor.page}</div>
                  <div className="visit-time">{formatTimeAgo(visitor.timestamp)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-visitors">
              <p>No recent visitors</p>
            </div>
          )}
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="traffic-sources">
        <h4>Live Traffic Sources</h4>
        <div className="traffic-sources-list">
          {realTimeData.trafficSources.length > 0 ? (
            realTimeData.trafficSources.slice(0, 5).map((source, index) => (
              <div key={source.source || 'direct'} className="traffic-source-item">
                <div className="source-name">{source.source || 'Direct'}</div>
                <div className="source-count">{source.count}</div>
              </div>
            ))
          ) : (
            <div className="no-sources">
              <p>No active traffic sources</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer with update time */}
      <div className="realtime-footer">
        {lastUpdated && (
          <div className="last-update">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
        <div className="refresh-info">
          Updates every {refreshInterval}s
        </div>
      </div>
    </div>
  );
};

export default RealTimeVisitors;