/**
 * Logger Utility
 * Conditionally logs messages based on environment
 * Prevents console.log pollution in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log informational messages (only in development)
 */
export const logInfo = (...args: any[]): void => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * Log warnings (always shown, but formatted)
 */
export const logWarn = (...args: any[]): void => {
  console.warn(...args);
};

/**
 * Log errors (always shown)
 */
export const logError = (...args: any[]): void => {
  console.error(...args);
};

/**
 * Log debug messages (only in development, with [DEBUG] prefix)
 */
export const logDebug = (...args: any[]): void => {
  if (isDevelopment) {
    console.log('[DEBUG]', ...args);
  }
};

export default {
  info: logInfo,
  warn: logWarn,
  error: logError,
  debug: logDebug,
};
