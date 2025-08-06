import React, { useState, useEffect } from 'react';
import './SessionExpiredNotification.css';

const SessionExpiredNotification: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleAuthLogout = () => {
      console.log('Session expired notification: Received auth:logout event');
      setIsVisible(true);
      
      // Auto-hide the notification after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Listen for auth:logout events
    window.addEventListener('auth:logout', handleAuthLogout);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
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