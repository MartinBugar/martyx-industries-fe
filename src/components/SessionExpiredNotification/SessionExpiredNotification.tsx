import React, { useState, useEffect } from 'react';
import './SessionExpiredNotification.css';

const SessionExpiredNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleAuthLogout = (event: CustomEvent) => {
      const reason = event.detail?.reason;
      console.log('Session expired notification: Received auth:logout event with reason:', reason);
      
      // Only show notification for token expiration, not for manual logout or API errors
      if (reason === 'token_expired') {
        console.log('Token expired - showing session expired notification');
        setIsVisible(true);
        
        // Auto-hide the notification after 5 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      } else {
        console.log('Logout reason is not token expiration - not showing notification');
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
        <div className="session-expired-notification__icon">⚠️</div>
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
          ✕
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredNotification;