import React from 'react';
import './PullToRefresh.css';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
  isPulling: boolean;
}

/**
 * Pull-to-refresh indicator component.
 * Shows a spinning loader when refreshing, or an arrow when pulling.
 */
export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  threshold,
  isRefreshing,
  isPulling,
}) => {
  if (!isPulling && !isRefreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);
  const rotation = progress * 180; // Rotate arrow as you pull
  const opacity = Math.min(progress * 1.5, 1);
  const scale = 0.5 + progress * 0.5;

  return (
    <div
      className="pull-to-refresh-indicator"
      style={{
        transform: `translateY(${pullDistance - 60}px)`,
        opacity: opacity,
      }}
    >
      <div
        className={`pull-to-refresh-icon ${isRefreshing ? 'refreshing' : ''}`}
        style={{
          transform: isRefreshing ? undefined : `rotate(${rotation}deg) scale(${scale})`,
        }}
      >
        {isRefreshing ? (
          <svg className="spinner" viewBox="0 0 24 24" width="24" height="24">
            <circle
              className="spinner-circle"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              strokeWidth="3"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 4l-8 8h5v8h6v-8h5z" />
          </svg>
        )}
      </div>
      {!isRefreshing && progress >= 1 && (
        <span className="pull-to-refresh-text">Release to refresh</span>
      )}
    </div>
  );
};

export default PullToRefreshIndicator;
