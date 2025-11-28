import React, { useState, useEffect } from 'react';
import './SessionExpiredNotification.css';
import { logInfo } from '../../services/logger';

const SessionExpiredNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleAuthLogout = (event: CustomEvent) => {
      const reason = event.detail?.reason;
      logInfo('Session expired notification: Received auth:logout event with reason:', reason);

      // Session expiration reasons that should show the notification:
      // - 'token_expired': Access token expired (from TokenExpirationTimer)
      // - 'refresh_token_expired': Refresh token expired/revoked (from tokenRefresh.ts)
      // - 'api_error': Backend returned 401 (from apiUtils.ts)
      //
      // Do NOT show notification for:
      // - 'manual_logout': User clicked logout button
      // - undefined/null: Other programmatic logout
      const sessionExpiredReasons = ['token_expired', 'refresh_token_expired', 'api_error'];

      if (reason && sessionExpiredReasons.includes(reason)) {
        logInfo('Session expired - showing notification for reason:', reason);
        setIsVisible(true);

        // Auto-hide the notification after 6 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 6000);
      } else {
        logInfo('Not showing notification - reason is not session expiration:', reason);
      }
    };

    // Listen for auth:logout events
    window.addEventListener('auth:logout', handleAuthLogout as EventListener);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout as EventListener);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="session-expired-notification">
      <div className="session-expired-notification__content">
        <div className="session-expired-notification__icon">
          <svg viewBox="0 0 24 24" fill="none" width="24" height="24">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="session-expired-notification__message">
          <div className="session-expired-notification__title">Session Expired</div>
          <div className="session-expired-notification__text">
            Your session has expired. Please log in again to continue.
          </div>
        </div>
        <button 
          className="session-expired-notification__close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <path d="m18 6-12 12M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredNotification;