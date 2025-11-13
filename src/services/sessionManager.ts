/**
 * Session and Visitor ID Management
 * Manages session tracking for analytics events
 */

const SESSION_ID_KEY = 'analytics_session_id';
const VISITOR_ID_KEY = 'analytics_visitor_id';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

/**
 * Generate a unique ID (UUID v4)
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Get or create visitor ID (persistent across sessions)
 * Stored in localStorage for long-term tracking
 */
export const getVisitorId = (): string => {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);

  if (!visitorId) {
    visitorId = generateUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
    console.log('[Analytics] New visitor ID created:', visitorId);
  }

  return visitorId;
};

/**
 * Get or create session ID (expires after 30 minutes of inactivity)
 * Stored in sessionStorage for current browsing session
 */
export const getSessionId = (): string => {
  const now = Date.now();
  const sessionData = sessionStorage.getItem(SESSION_ID_KEY);

  if (sessionData) {
    try {
      const { sessionId, lastActivity } = JSON.parse(sessionData);

      // Check if session is still valid (within timeout)
      if (now - lastActivity < SESSION_TIMEOUT) {
        // Update last activity timestamp
        sessionStorage.setItem(SESSION_ID_KEY, JSON.stringify({
          sessionId,
          lastActivity: now,
        }));
        return sessionId;
      }
    } catch (e) {
      console.warn('[Analytics] Failed to parse session data:', e);
    }
  }

  // Create new session
  const newSessionId = generateUUID();
  sessionStorage.setItem(SESSION_ID_KEY, JSON.stringify({
    sessionId: newSessionId,
    lastActivity: now,
  }));

  console.log('[Analytics] New session ID created:', newSessionId);
  return newSessionId;
};

/**
 * Refresh session activity timestamp
 * Call this on user interactions to keep session alive
 */
export const refreshSession = (): void => {
  const sessionData = sessionStorage.getItem(SESSION_ID_KEY);
  if (sessionData) {
    try {
      const { sessionId } = JSON.parse(sessionData);
      sessionStorage.setItem(SESSION_ID_KEY, JSON.stringify({
        sessionId,
        lastActivity: Date.now(),
      }));
    } catch (e) {
      // If parsing fails, getSessionId() will create a new session
    }
  }
};

/**
 * Clear session (useful for testing or logout)
 */
export const clearSession = (): void => {
  sessionStorage.removeItem(SESSION_ID_KEY);
  console.log('[Analytics] Session cleared');
};

/**
 * Clear visitor ID (useful for testing)
 */
export const clearVisitorId = (): void => {
  localStorage.removeItem(VISITOR_ID_KEY);
  console.log('[Analytics] Visitor ID cleared');
};

/**
 * Get session analytics data (for debugging)
 */
export const getSessionInfo = (): { sessionId: string; visitorId: string; isNewSession: boolean } => {
  const sessionId = getSessionId();
  const visitorId = getVisitorId();

  const sessionData = sessionStorage.getItem(SESSION_ID_KEY);
  const isNewSession = !sessionData;

  return {
    sessionId,
    visitorId,
    isNewSession,
  };
};
