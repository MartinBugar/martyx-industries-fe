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
        <div className="token-timer__icon">⚠️</div>
        <div className="token-timer__content">
          <div className="token-timer__label">Session Status</div>
          <div className="token-timer__time">{timeRemaining}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`token-timer ${className || ''} ${
      isExpired ? 'token-timer--expired' : 
      isWarning ? 'token-timer--warning' : 
      'token-timer--active'
    }`}>
      <div className="token-timer__icon">
        {isExpired ? '🔴' : isWarning ? '⚠️' : '🕐'}
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