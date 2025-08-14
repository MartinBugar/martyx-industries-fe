import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to panel
  useEffect(() => {
    const isAuthed = typeof window !== 'undefined' && window.localStorage.getItem('adminAuthed') === 'true';
    if (isAuthed) {
      navigate('/admin/panel', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple placeholder validation. Replace with real API authentication.
    if (email.trim() && password.trim()) {
      window.localStorage.setItem('adminAuthed', 'true');
      navigate('/admin/panel', { replace: true });
    } else {
      setError('Please enter email and password');
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
          />
        </div>
        <button type="submit" style={{ width: '100%', background: '#111827', color: '#fff', padding: '10px 12px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Log In
        </button>
      </form>
    </AdminLayout>
  );
};

export default AdminLogin;
