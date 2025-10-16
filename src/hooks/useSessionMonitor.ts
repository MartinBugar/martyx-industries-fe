import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Session monitoring hook with inactivity timeout.
 * Automatically logs out admin users after 15 minutes of inactivity.
 */
export function useSessionMonitor(isAdminRoute: boolean, inactivityTimeout: number = 15 * 60 * 1000) {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const logout = useCallback(() => {
    // Clear admin session
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('adminAuthed');
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
    }
    navigate('/admin');
  }, [navigate]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      console.warn('Session expired due to inactivity');
      logout();
    }, inactivityTimeout);
  }, [inactivityTimeout, logout]);

  useEffect(() => {
    // Only monitor admin routes
    if (!isAdminRoute) {
      return;
    }

    // Activity event listeners
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAdminRoute, resetTimer]);

  return {
    lastActivity: lastActivityRef.current,
    resetTimer
  };
}
