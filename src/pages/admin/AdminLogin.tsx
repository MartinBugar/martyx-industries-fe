import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, setAuthToken, removeAuthToken } from '../../services/api';
import { adminService } from '../../services/adminService';
import { isTokenExpired } from '../../services/apiUtils';
import ParticlesBackground from '../../components/ParticlesBackground/ParticlesBackground';
import './AdminLogin.css';
import { logError } from '../../services/logger';

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
      logError('Admin login error:', err);
      setError('ACCESS DENIED');
      setShowDeniedModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="martyx-admin-login">
      {/* Yellow Particles Background Effect */}
      <ParticlesBackground particleCount={120} speed={0.3} />

      <div className="martyx-admin-bg"></div>

      <div className="martyx-admin-content">
        <div className="martyx-admin-card">
          {/* Header */}
          <div className="martyx-admin-header">
            <div className="martyx-admin-shield">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h1>Admin Portal</h1>
            <p>Secure System Access</p>
          </div>

          {/* Error */}
          {error && (
            <div className="martyx-admin-error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="martyx-admin-form">
            <div className="martyx-form-field">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                required
              />
            </div>

            <div className="martyx-form-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="martyx-admin-submit">
              {loading ? (
                <div className="martyx-admin-loading">
                  <div className="martyx-spinner"></div>
                  <span>Authenticating...</span>
                </div>
              ) : (
                <span>Access Portal</span>
              )}
            </button>
          </form>

          {/* Footer Badge */}
          <div className="martyx-admin-footer">
            <div className="martyx-security-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              <span>Encrypted Connection</span>
            </div>
          </div>
        </div>
      </div>

      {/* Access Denied Modal */}
      {showDeniedModal && (
        <div className="martyx-modal-overlay" onClick={() => setShowDeniedModal(false)}>
          <div className="martyx-modal" onClick={(e) => e.stopPropagation()}>
            <div className="martyx-modal-icon">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2>Access Denied</h2>
            <p>
              You do not have administrator privileges to access this portal.
              Please contact your system administrator if you believe this is an error.
            </p>
            <button onClick={() => setShowDeniedModal(false)}>
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
