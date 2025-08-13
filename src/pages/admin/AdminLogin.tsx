import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await login(email, password);
      if (result === true) {
        // After login, navigate to admin panel. Backend/guard will confirm ADMIN role.
        navigate('/admin/panel');
      } else if (typeof result === 'object' && 'error' in result) {
        setError(result.error);
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #f5f7fb, #eef2f7)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#ffffff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
      }}>
        <div style={{ padding: '1.25rem 1.25rem 0.5rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: 1.2 }}>ADMIN AREA</div>
          <h1 style={{ margin: '0.5rem 0 0', fontSize: 22, color: '#0f172a' }}>Sign in to Admin Console</h1>
          <p style={{ margin: '0.25rem 0 1rem', fontSize: 13, color: '#475569' }}>Access is restricted to users with the ADMIN role.</p>
        </div>
        {error && (
          <div style={{
            margin: '0 1.25rem 0.5rem',
            padding: '0.75rem 0.875rem',
            borderRadius: 8,
            background: '#fff1f2',
            color: '#991b1b',
            border: '1px solid #fecdd3',
            fontSize: 14
          }}>{error}</div>
        )}
        <form onSubmit={handleSubmit} style={{ padding: '0 1.25rem 1.25rem' }}>
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="admin-email" style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 6 }}>Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                outline: 'none'
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="admin-password" style={{ display: 'block', fontSize: 13, color: '#334155', marginBottom: 6 }}>Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                outline: 'none'
              }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isProcessing}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              background: '#111827',
              color: '#ffffff',
              border: '1px solid #111827',
              cursor: 'pointer',
              opacity: isProcessing ? 0.8 : 1
            }}
          >{isProcessing ? 'Signing in...' : 'Sign in'}</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
