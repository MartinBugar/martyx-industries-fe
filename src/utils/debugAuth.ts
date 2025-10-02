/**
 * Debug utilities for authentication issues
 * These functions can be called from browser console for troubleshooting
 */

import { debugToken, clearAuthData } from './tokenUtils';

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
  console.log('🚨 JWT Authentication Quick Fix');
  console.log('================================');
  
  // Debug current state first
  debugToken();
  
  // Clear all auth data
  clearAuthData();
  
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Refresh the page (F5)');
  console.log('2. Logout completely from the app');
  console.log('3. Login again with your credentials');
  console.log('4. Try uploading photos again');
  console.log('');
  console.log('If the problem persists, check:');
  console.log('- Backend JWT secret configuration');
  console.log('- Token expiration settings');
  console.log('- CORS configuration');
};

// Attach to window for console access
if (typeof window !== 'undefined') {
  window.debugAuth = {
    debugToken,
    clearAuthData,
    quickFix
  };
  
  console.log('🔧 Debug utilities available:');
  console.log('- window.debugAuth.debugToken() - Show token info');
  console.log('- window.debugAuth.clearAuthData() - Clear all auth data');
  console.log('- window.debugAuth.quickFix() - Quick fix for JWT issues');
}

export { debugToken, clearAuthData, quickFix };
