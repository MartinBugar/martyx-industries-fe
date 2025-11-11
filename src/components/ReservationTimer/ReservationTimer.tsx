import React, { useEffect, useState } from 'react';
import './ReservationTimer.css';

interface ReservationTimerProps {
  expiresAt: Date;
  onExpired: () => void;
}

/**
 * Displays countdown timer for stock reservation expiration
 * Shows remaining time until reservation expires (15 minutes from checkout start)
 */
export const ReservationTimer: React.FC<ReservationTimerProps> = ({ expiresAt, onExpired }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLowTime, setIsLowTime] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = expiresAt.getTime() - now;

      if (remaining <= 0) {
        setTimeLeft(0);
        onExpired();
        return false; // Stop interval
      }

      setTimeLeft(Math.floor(remaining / 1000));
      setIsLowTime(remaining < 120000); // Less than 2 minutes

      return true; // Continue interval
    };

    // Initial update
    if (!updateTimer()) return;

    // Update every second
    const interval = setInterval(() => {
      if (!updateTimer()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft === 0) {
    return null;
  }

  return (
    <div className={`reservation-timer ${isLowTime ? 'low-time' : ''}`}>
      <div className="timer-content">
        <span className="timer-icon">⏱️</span>
        <span className="timer-text">
          Items reserved for:{' '}
          <strong className="timer-countdown">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </strong>
        </span>
      </div>
      {isLowTime && (
        <div className="timer-warning">
          ⚠️ Hurry! Reservation expiring soon
        </div>
      )}
    </div>
  );
};
