import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/useAuth';
import { decodeJWT } from '../../services/apiUtils';
import { refreshAccessToken } from '../../utils/tokenRefresh';
import { logInfo, logWarn } from '../../services/logger';
import './SessionTimeoutWarning.css';

// Show warning 5 minutes before expiration
const WARNING_THRESHOLD_MS = 5 * 60 * 1000;
// Check every 30 seconds
const CHECK_INTERVAL_MS = 30 * 1000;

/**
 * Session Timeout Warning Component
 *
 * Displays a modal warning when the user's session is about to expire.
 * Allows the user to extend their session or log out.
 */
const SessionTimeoutWarning: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);

  // Check token expiration
  const checkTokenExpiration = useCallback(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setShowWarning(false);
      return;
    }

    try {
      const payload = decodeJWT(token);
      if (!payload?.exp) {
        setShowWarning(false);
        return;
      }

      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const remaining = expirationTime - now;

      setTimeRemaining(Math.max(0, Math.floor(remaining / 1000)));

      // Show warning if within threshold
      if (remaining > 0 && remaining <= WARNING_THRESHOLD_MS) {
        if (!showWarning) {
          logInfo('[SessionWarning] Session expiring soon, showing warning');
        }
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    } catch (error) {
      logWarn('[SessionWarning] Failed to check token:', error);
      setShowWarning(false);
    }
  }, [isAuthenticated, showWarning]);

  // Check periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check immediately
    checkTokenExpiration();

    // Set up interval
    const interval = setInterval(checkTokenExpiration, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkTokenExpiration]);

  // Handle extend session
  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      await refreshAccessToken();
      logInfo('[SessionWarning] Session extended successfully');
      setShowWarning(false);
    } catch (error) {
      logWarn('[SessionWarning] Failed to extend session:', error);
      // Session refresh failed - user will be logged out when token expires
    } finally {
      setIsExtending(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setShowWarning(false);
  };

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showWarning) return null;

  return (
    <div className="session-warning-overlay" role="alertdialog" aria-modal="true">
      <div className="session-warning-modal">
        <div className="session-warning-icon">⏰</div>
        <h2 className="session-warning-title">
          {t('sessionWarning.title', 'Session Expiring')}
        </h2>
        <p className="session-warning-message">
          {t('sessionWarning.message', 'Your session will expire in {{time}}. Would you like to stay logged in?', {
            time: formatTime(timeRemaining)
          })}
        </p>
        <div className="session-warning-timer">
          {formatTime(timeRemaining)}
        </div>
        <div className="session-warning-actions">
          <button
            onClick={handleLogout}
            className="session-warning-btn session-warning-btn-secondary"
          >
            {t('sessionWarning.logout', 'Log Out')}
          </button>
          <button
            onClick={handleExtendSession}
            disabled={isExtending}
            className="session-warning-btn session-warning-btn-primary"
          >
            {isExtending
              ? t('sessionWarning.extending', 'Extending...')
              : t('sessionWarning.extend', 'Stay Logged In')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;
