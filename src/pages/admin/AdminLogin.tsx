import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { authApi, setAuthToken, removeAuthToken } from '../../services/api';
import { adminService } from '../../services/adminService';
import { isTokenExpired } from '../../services/apiUtils';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
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
      navigate('/admin/panel', { replace: true });
    } else if (adminFlag && !validToken) {
      window.localStorage.removeItem('adminAuthed');
    }
  }, [navigate]);

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

      // 3) Verify admin access with backend
      const isAdmin = await adminService.checkAdmin();
      if (isAdmin) {
        // Mark admin session and proceed
        localStorage.setItem('adminAuthed', 'true');
        navigate('/admin/panel', { replace: true });
        return;
      }

      // Not an admin -> clear token and show ACCES DENIED
      removeAuthToken();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setError('ACCES DENIED');
      setShowDeniedModal(true);
    } catch (err) {
      console.error('Admin login error:', err);
      setError('ACCES DENIED');
      setShowDeniedModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Admin Login">
      <form onSubmit={handleSubmit}>
        {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            placeholder="admin@example.com"
            disabled={loading}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6 }}
            placeholder="••••••••"
            disabled={loading}
          />
        </div>
        <button type="submit" style={{ width: '100%', background: '#111827', color: '#fff', padding: '10px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: loading ? 0.8 : 1 }} disabled={loading}>
          {loading ? 'Logging In…' : 'Log In'}
        </button>
      </form>

      {showDeniedModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '32px 28px', borderRadius: 12, maxWidth: 520, width: '90%', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }} role="dialog" aria-modal="true" aria-labelledby="admin-access-denied-title">
            <h2 id="admin-access-denied-title" style={{ fontSize: 32, margin: '0 0 16px', color: '#111827', letterSpacing: 1 }}>ACCES DENIED</h2>
            <p style={{ fontSize: 16, marginBottom: 24, color: '#374151' }}>You do not have permission to access the admin panel.</p>
            <button
              autoFocus
              onClick={() => setShowDeniedModal(false)}
              style={{ background: '#111827', color: '#fff', padding: '10px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLogin;
