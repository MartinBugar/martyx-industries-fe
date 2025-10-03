'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, setAuthToken } from '@/lib/services/api';
import { isTokenExpired } from '@/lib/services/api';
import styles from './Admin.module.css';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeniedModal, setShowDeniedModal] = useState(false);

  // If already authenticated, redirect to panel (only if token is valid)
  useEffect(() => {
    const hasWindow = typeof window !== 'undefined';
    const adminFlag = hasWindow && window.localStorage.getItem('adminAuthed') === 'true';
    const token = hasWindow ? window.localStorage.getItem('token') : null;
    const validToken = !!token && !isTokenExpired(token);
    if (adminFlag && validToken) {
      router.replace('/admin/dashboard');
    } else if (adminFlag && !validToken) {
      window.localStorage.removeItem('adminAuthed');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      // 1) Authenticate against backend
      const loginResp = await authApi.login(email.trim(), password.trim());
      if (!loginResp?.token) {
        throw new Error('Invalid login response');
      }

      // 2) Store token and set auth header for subsequent admin check
      localStorage.setItem('token', loginResp.token);
      setAuthToken(loginResp.token);
      
      // Set cookies for middleware
      document.cookie = `token=${loginResp.token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
      document.cookie = `adminAuthed=true; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;

      // 3) Verify admin access with backend (mock for now)
      // const adminCheckResp = await adminService.checkAdminAccess();
      // if (!adminCheckResp?.isAdmin) {
      //   throw new Error('Access denied: Admin privileges required');
      // }

      // Mock admin check - replace with actual implementation
      const isAdmin = loginResp.user?.role === 'admin' || email.includes('admin');
      if (!isAdmin) {
        setShowDeniedModal(true);
        localStorage.removeItem('token');
        return;
      }

      // 4) Success: set admin flag and redirect
      localStorage.setItem('adminAuthed', 'true');
      router.push('/admin/dashboard');

    } catch (error: unknown) {
      console.error('Admin login error:', error);
      
      const err = error as Error & { message?: string };
      if (err.message?.includes('Access denied')) {
        setShowDeniedModal(true);
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
      
      // Clean up on error
      localStorage.removeItem('token');
      localStorage.removeItem('adminAuthed');
      
      // Clear cookies
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'adminAuthed=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } finally {
      setLoading(false);
    }
  };

  const closeDeniedModal = () => {
    setShowDeniedModal(false);
    setEmail('');
    setPassword('');
  };

  return (
    <div className={styles.adminLoginContainer}>
      <div className={styles.adminLoginCard}>
        <div className={styles.adminLoginHeader}>
          <h1>Admin Panel</h1>
          <p>Secure access required</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.adminLoginForm}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="admin@martyx-industries.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.loginButton}
          >
            {loading ? 'Authenticating...' : 'Login to Admin Panel'}
          </button>
        </form>

        <div className={styles.adminLoginFooter}>
          <p>Authorized personnel only</p>
        </div>
      </div>

      {/* Access Denied Modal */}
      {showDeniedModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Access Denied</h3>
            </div>
            <div className={styles.modalBody}>
              <p>You do not have administrator privileges.</p>
              <p>Please contact your system administrator if you believe this is an error.</p>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={closeDeniedModal} className={styles.modalButton}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
