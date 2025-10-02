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
        {error && <div className="login-error-message">{error}</div>}
        <div className="login-form-group">
          <label className="login-form-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-form-input"
            placeholder="admin@example.com"
            disabled={loading}
          />
        </div>
        <div className="login-form-group-spacing">
          <label className="login-form-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-form-input"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>
        <button type="submit" className="login-submit-button" disabled={loading}>
          {loading ? 'Logging In…' : 'Log In'}
        </button>
      </form>

      {showDeniedModal && (
        <div className="access-denied-modal-overlay">
          <div className="access-denied-modal-content" role="dialog" aria-modal="true" aria-labelledby="admin-access-denied-title">
            <h2 id="admin-access-denied-title" className="access-denied-title">ACCES DENIED</h2>
            <p className="access-denied-message">You do not have permission to access the admin panel.</p>
            <button
              autoFocus
              onClick={() => setShowDeniedModal(false)}
              className="access-denied-button"
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
