/**
 * Debug utilities for authentication issues
 * These functions can be called from browser console for troubleshooting
 *
 * SECURITY: Only available in development mode
 */

import { debugToken, clearAuthData } from './tokenUtils';
import { logInfo, logWarn } from '../services/logger';

// Make functions available globally for console debugging (DEV only)
declare global {
  interface Window {
    debugAuth?: {
      debugToken: () => void;
      clearAuthData: () => void;
      quickFix: () => void;
    };
  }
}

/**
 * Quick fix for JWT authentication issues
 * Clears all auth data and provides instructions
 */
const quickFix = (): void => {
  // Only allow in development mode
  if (import.meta.env.PROD) {
    logWarn('Debug functions are disabled in production for security');
    return;
  }

  logInfo('🚨 JWT Authentication Quick Fix');
  logInfo('================================');

  // Debug current state first
  debugToken();

  // Clear all auth data
  clearAuthData();

  logInfo('');
  logInfo('📋 Next steps:');
  logInfo('1. Refresh the page (F5)');
  logInfo('2. Logout completely from the app');
  logInfo('3. Login again with your credentials');
  logInfo('4. Try uploading photos again');
  logInfo('');
  logInfo('If the problem persists, check:');
  logInfo('- Backend JWT secret configuration');
  logInfo('- Token expiration settings');
  logInfo('- CORS configuration');
};

/**
 * Wrapped debug functions that check for production mode
 */
const safeDebugToken = (): void => {
  if (import.meta.env.PROD) {
    logWarn('Debug functions are disabled in production for security');
    return;
  }
  debugToken();
};

const safeClearAuthData = (): void => {
  if (import.meta.env.PROD) {
    logWarn('Debug functions are disabled in production for security');
    return;
  }
  clearAuthData();
};

// Attach to window for console access - ONLY in development mode
if (typeof window !== 'undefined') {
  if (import.meta.env.DEV) {
    window.debugAuth = {
      debugToken: safeDebugToken,
      clearAuthData: safeClearAuthData,
      quickFix
    };

    logInfo('🔧 Debug utilities available (DEV only):');
    logInfo('- window.debugAuth.debugToken() - Show token info');
    logInfo('- window.debugAuth.clearAuthData() - Clear all auth data');
    logInfo('- window.debugAuth.quickFix() - Quick fix for JWT issues');
  } else {
    // In production, don't expose debug utilities
    delete window.debugAuth;
  }
}

export { safeDebugToken as debugToken, safeClearAuthData as clearAuthData, quickFix };
