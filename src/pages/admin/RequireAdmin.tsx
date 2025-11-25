import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isTokenExpired } from '../../services/apiUtils';
import { adminService } from '../../services/adminService';
import { logInfo, logError } from '../../services/logger';

interface Props {
  children: React.ReactNode;
}

/**
 * RequireAdmin - Secure admin route guard
 *
 * Security improvements:
 * 1. Always validates admin status via backend API (not just localStorage flag)
 * 2. Token expiration check before API call
 * 3. Loading state while validating
 * 4. Clears invalid admin flags automatically
 */
const RequireAdmin: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const validateAdminAccess = async () => {
      const hasWindow = typeof window !== 'undefined';
      if (!hasWindow) {
        setIsValidating(false);
        return;
      }

      const token = window.localStorage.getItem('token');

      // Quick check: no token or expired token = not authenticated
      if (!token || isTokenExpired(token)) {
        if (import.meta.env.DEV) {
          logInfo('🔐 Admin auth: No valid token');
        }
        // Clear any stale admin flag
        window.localStorage.removeItem('adminAuthed');
        setIsAdmin(false);
        setIsValidating(false);
        return;
      }

      try {
        // ALWAYS validate admin status with backend API
        // This prevents localStorage manipulation attacks
        const adminStatus = await adminService.checkAdmin();

        if (import.meta.env.DEV) {
          logInfo('🔐 Admin auth check:', {
            path: location.pathname,
            hasToken: true,
            backendAdminStatus: adminStatus
          });
        }

        if (adminStatus) {
          // Sync localStorage flag with backend status
          window.localStorage.setItem('adminAuthed', 'true');
          setIsAdmin(true);
        } else {
          // Backend says not admin - clear localStorage flag
          window.localStorage.removeItem('adminAuthed');
          setIsAdmin(false);
        }
      } catch (error) {
        logError('Admin validation error:', error);
        // On error, assume not admin for security
        window.localStorage.removeItem('adminAuthed');
        setIsAdmin(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateAdminAccess();
  }, [location.pathname]);

  // Show loading spinner while validating
  if (isValidating) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--background, #0b0f12)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(246, 200, 69, 0.2)',
          borderTopColor: 'var(--accent, #F6C845)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAdmin) {
    if (import.meta.env.DEV) {
      logInfo('❌ Admin access denied, redirecting to /admin');
    }
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default RequireAdmin;
