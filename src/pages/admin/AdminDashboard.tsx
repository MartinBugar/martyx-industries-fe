import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ margin: '0 auto', maxWidth: 1200 }}>
        <header style={{ marginBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: 24, color: '#0f172a' }}>Admin Dashboard</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#475569' }}>Manage your system entities. Access is restricted to ADMIN users.</p>
        </header>
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem'
        }}>
          {[{title: 'Users', desc:'Create, update, and manage users'},
            {title: 'Products', desc:'Manage catalog items'},
            {title: 'Orders', desc:'Track and update orders'},
            {title: 'Content', desc:'Pages, banners, and media'}].map((card) => (
            <div key={card.title} style={{
              border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', padding: '1rem'
            }}>
              <h2 style={{ margin: 0, fontSize: 18, color: '#111827' }}>{card.title}</h2>
              <p style={{ margin: '0.5rem 0 1rem', color: '#6b7280' }}>{card.desc}</p>
              <button onClick={() => navigate(`/admin/${card.title.toLowerCase()}`)} style={{
                padding: '8px 10px', borderRadius: 8, border: '1px solid #111827', background: '#111827', color: '#fff', cursor: 'pointer'
              }}>Open</button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
