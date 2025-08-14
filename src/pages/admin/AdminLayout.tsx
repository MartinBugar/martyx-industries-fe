import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  title?: string;
  children?: React.ReactNode;
}

const sidebarLinkStyle: React.CSSProperties = {
  display: 'block',
  padding: '10px 12px',
  color: '#f0f0f0',
  textDecoration: 'none',
  borderRadius: 6,
  marginBottom: 6,
};

const activeLinkStyle: React.CSSProperties = {
  background: '#334155',
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = typeof window !== 'undefined' && window.localStorage.getItem('adminAuthed') === 'true';

  const handleLogout = () => {
    window.localStorage.removeItem('adminAuthed');
    navigate('/admin');
  };

  if (!isAuthed) {
    // Public view for admin login page
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: 24 }}>
          {title && <h1 style={{ margin: 0, marginBottom: 16, fontSize: 20 }}>{title}</h1>}
          {children}
        </div>
      </div>
    );
  }

  // Private admin layout with sidebar
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#111827', color: '#e5e7eb', padding: 16, position: 'relative' }}>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 18 }}>Admin Panel</div>
        <nav>
          <Link to="/admin/panel" style={{ ...sidebarLinkStyle, ...(location.pathname === '/admin/panel' ? activeLinkStyle : {}) }}>Dashboard</Link>
          <Link to="/admin/users" style={{ ...sidebarLinkStyle, ...(location.pathname.startsWith('/admin/users') ? activeLinkStyle : {}) }}>Users</Link>
          <Link to="/admin/products" style={{ ...sidebarLinkStyle, ...(location.pathname.startsWith('/admin/products') ? activeLinkStyle : {}) }}>Products</Link>
          <Link to="/admin/orders" style={{ ...sidebarLinkStyle, ...(location.pathname.startsWith('/admin/orders') ? activeLinkStyle : {}) }}>Orders</Link>
        </nav>
        <div style={{ position: 'absolute', bottom: 16 }}>
          <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Logout</button>
        </div>
      </aside>

      {/* Content */}
      <div style={{ flex: 1, background: '#f8fafc', color: '#0f172a' }}>
        <header style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '12px 16px' }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>{title ?? 'Admin'}</h1>
        </header>
        <section style={{ padding: 16 }}>
          {children}
        </section>
      </div>
    </div>
  );
};

export default AdminLayout;
