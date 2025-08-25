import React, { useState, useEffect } from 'react';
import { decodeJWT } from '../../services/apiUtils';
import './TokenExpirationTimer.css';

interface TokenExpirationTimerProps {
  className?: string;
}

const TokenExpirationTimer: React.FC<TokenExpirationTimerProps> = ({ className }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isWarning, setIsWarning] = useState<boolean>(false);
  const [logoutTriggered, setLogoutTriggered] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsValid(false);
        setTimeRemaining('No token found');
        return;
      }

      const payload = decodeJWT(token);
      
      if (!payload || !payload.exp) {
        setIsValid(false);
        setTimeRemaining('Invalid token');
        return;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const expirationTime = payload.exp;
      const remainingSeconds = expirationTime - currentTime;

      if (remainingSeconds <= 0) {
        setIsExpired(true);
        setIsWarning(false);
        setTimeRemaining('Token expired');
        
        // Automatically logout user when token expires (only once)
        if (!logoutTriggered) {
          console.log('Token has expired, triggering automatic logout');
          setLogoutTriggered(true);
          window.dispatchEvent(new CustomEvent('auth:logout', { 
            detail: { reason: 'token_expired' } 
          }));
        }
        return;
      }

      // Check if warning state (less than 5 minutes remaining)
      const isWarningTime = remainingSeconds <= 300; // 5 minutes = 300 seconds
      setIsWarning(isWarningTime);

      // Calculate hours, minutes, and seconds
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;

      // Format the time string
      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }

      setIsExpired(false);
      setIsValid(true);
      // Reset logout trigger flag for valid tokens
      setLogoutTriggered(false);
    };

    // Update immediately
    updateTimer();

    // Set up interval to update every second
    const interval = setInterval(updateTimer, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [logoutTriggered]);

  if (!isValid) {
    return (
      <div className={`token-timer ${className || ''} token-timer--invalid`}>
        <div className="token-timer__icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="token-timer__content">
          <div className="token-timer__label">Session Status</div>
          <div className="token-timer__time">{timeRemaining}</div>
        </div>
      </div>
    );
  }

  const renderIcon = () => {
    if (isExpired) {
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="m15 9-6 6m0-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    
    if (isWarning) {
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  return (
    <div className={`token-timer ${className || ''} ${
      isExpired ? 'token-timer--expired' : 
      isWarning ? 'token-timer--warning' : 
      'token-timer--active'
    }`}>
      <div className="token-timer__icon">
        {renderIcon()}
      </div>
      <div className="token-timer__content">
        <div className="token-timer__label">
          {isExpired ? 'Session Expired' : 'Session Expires In'}
        </div>
        <div className="token-timer__time">{timeRemaining}</div>
      </div>
    </div>
  );
};

export default TokenExpirationTimer;