import React, { useEffect, useState } from 'react';
import './RateLimitNotification.css';

export interface RateLimitError {
  message: string;
  retryAfterSeconds: number;
  endpoint?: string;
}

interface RateLimitNotificationProps {
  error: RateLimitError | null;
  onClose: () => void;
}

/**
 * Notification komponent pre rate limit errors (429 Too Many Requests).
 * Zobrazuje používateľovi informáciu o prekročení limitu requestov a countdown do refresh.
 */
const RateLimitNotification: React.FC<RateLimitNotificationProps> = ({ error, onClose }) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    if (error) {
      setRemainingSeconds(error.retryAfterSeconds);
      setIsVisible(true);

      // Countdown timer
      const interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Auto-close po vypršaní countera
            setTimeout(() => {
              handleClose();
            }, 1000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [error]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  if (!error || !isVisible) {
    return null;
  }

  return (
    <div className="rate-limit-overlay" onClick={handleClose}>
      <div
        className="rate-limit-notification"
        onClick={(e) => e.stopPropagation()}
        role="alert"
        aria-live="assertive"
      >
        <div className="rate-limit-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="rate-limit-content">
          <h3 className="rate-limit-title">Rate Limit Exceeded</h3>
          <p className="rate-limit-message">{error.message}</p>

          <div className="rate-limit-countdown">
            <div className="countdown-circle">
              <svg viewBox="0 0 36 36" className="circular-chart">
                <path
                  className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="circle"
                  strokeDasharray={`${(remainingSeconds / error.retryAfterSeconds) * 100}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="countdown-text">
                <span className="countdown-number">{remainingSeconds}</span>
                <span className="countdown-label">sec</span>
              </div>
            </div>
            <p className="countdown-message">
              You can try again in <strong>{remainingSeconds}</strong> {remainingSeconds === 1 ? 'second' : 'seconds'}
            </p>
          </div>

          {error.endpoint && (
            <p className="rate-limit-endpoint">Endpoint: {error.endpoint}</p>
          )}
        </div>

        <button
          className="rate-limit-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default RateLimitNotification;
