import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, setAuthToken, removeAuthToken } from '../../services/api';
import { adminService } from '../../services/adminService';
import { isTokenExpired } from '../../services/apiUtils';
import './AdminLogin.css';

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
      setError('ACCESS DENIED');
      setShowDeniedModal(true);
    } catch (err) {
      console.error('Admin login error:', err);
      setError('ACCESS DENIED');
      setShowDeniedModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1 className="admin-login-title">Admin Portal</h1>
          <p className="admin-login-subtitle">Secure Administrative Access</p>
          <div className="security-badge">
            <svg className="security-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11.5C15.4,11.5 16,12.4 16,13V16C16,17.4 15.4,18 14.8,18H9.2C8.6,18 8,17.4 8,16V13C8,12.4 8.6,11.5 9.2,11.5V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.5,8.7 10.5,10V11.5H13.5V10C13.5,8.7 12.8,8.2 12,8.2Z" />
            </svg>
            Encrypted Connection
          </div>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="admin@martyx-industries.com"
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••••••"
              disabled={loading}
              autoComplete="current-password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="login-button" 
            disabled={loading}
          >
            {loading ? (
              <div className="login-button-loading">
                <div className="loading-spinner"></div>
                Authenticating...
              </div>
            ) : (
              'Access Admin Portal'
            )}
          </button>
        </form>
      </div>

      {showDeniedModal && (
        <div className="access-denied-overlay">
          <div className="access-denied-modal" role="dialog" aria-modal="true" aria-labelledby="access-denied-title">
            <div className="access-denied-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ff6b6b' }}>
                <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z" />
              </svg>
            </div>
            <h2 id="access-denied-title" className="access-denied-title">Access Denied</h2>
            <p className="access-denied-message">
              You do not have administrator privileges to access this portal. 
              Please contact your system administrator if you believe this is an error.
            </p>
            <button
              autoFocus
              onClick={() => setShowDeniedModal(false)}
              className="access-denied-button"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
