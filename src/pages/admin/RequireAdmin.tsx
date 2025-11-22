import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isTokenExpired } from '../../services/apiUtils';
import { logInfo, logWarn, logError } from '../../services/logger';

interface Props {
  children: React.ReactNode;
}

const RequireAdmin: React.FC<Props> = ({ children }) => {
  const location = useLocation();

  const hasWindow = typeof window !== 'undefined';
  const token = hasWindow ? window.localStorage.getItem('token') : null;
  const adminFlag = hasWindow ? window.localStorage.getItem('adminAuthed') === 'true' : false;
  const validToken = !!token && !isTokenExpired(token!);
  const isAuthed = adminFlag && validToken;

  // Debug authentication status
  if (import.meta.env.DEV) {
    logInfo('🔐 Admin auth check:', {
      path: location.pathname,
      hasToken: !!token,
      adminFlag,
      validToken,
      isAuthed
    });
  }

  if (!isAuthed) {
    if (import.meta.env.DEV) {
      logInfo('❌ Admin access denied, redirecting to /admin');
    }
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default RequireAdmin;
