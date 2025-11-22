/**
 * Debug utilities for authentication issues
 * These functions can be called from browser console for troubleshooting
 */

import { debugToken, clearAuthData } from './tokenUtils';
import { logInfo, logWarn, logError } from '../services/logger';

// Make functions available globally for console debugging
declare global {
  interface Window {
    debugAuth: {
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

// Attach to window for console access
if (typeof window !== 'undefined') {
  window.debugAuth = {
    debugToken,
    clearAuthData,
    quickFix
  };
  
  logInfo('🔧 Debug utilities available:');
  logInfo('- window.debugAuth.debugToken() - Show token info');
  logInfo('- window.debugAuth.clearAuthData() - Clear all auth data');
  logInfo('- window.debugAuth.quickFix() - Quick fix for JWT issues');
}

export { debugToken, clearAuthData, quickFix };
