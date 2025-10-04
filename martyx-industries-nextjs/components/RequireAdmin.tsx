'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { isTokenExpired } from '@/lib/services/apiUtils';

interface Props {
  children: React.ReactNode;
}

const RequireAdmin: React.FC<Props> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Ensure we're on client side before checking auth
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const token = window.localStorage.getItem('token');
    const adminFlag = window.localStorage.getItem('adminAuthed') === 'true';
    const validToken = !!token && !isTokenExpired(token);
    const authenticated = adminFlag && validToken;

    // Debug authentication status
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Admin auth check:', {
        path: pathname,
        hasToken: !!token,
        adminFlag,
        validToken,
        authenticated
      });
    }

    setIsAuthed(authenticated);

    if (!authenticated) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Admin access denied, redirecting to /admin');
      }
      router.replace('/admin');
    }
  }, [isClient, router, pathname]);

  // Show nothing during hydration or while checking auth
  if (!isClient || !isAuthed) {
    return null;
  }

  return <>{children}</>;
};

export default RequireAdmin;

