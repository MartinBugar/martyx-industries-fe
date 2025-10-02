import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

interface AdminLayoutProps {
  title?: string;
  children?: React.ReactNode;
  navTabs?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children, navTabs }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = typeof window !== 'undefined' && window.localStorage.getItem('adminAuthed') === 'true';

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    window.localStorage.removeItem('adminAuthed');
    navigate('/admin');
  };

  // Close sidebar when route changes
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  if (!isAuthed) {
    // Public view for admin login page
    return (
      <div className="public-login-container">
        <div className="public-login-card">
          {title && <h1 className="public-login-title">{title}</h1>}
          {children}
        </div>
      </div>
    );
  }

  // Private admin layout with responsive sidebar
  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`} id="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-title">Admin Panel</div>
        <nav>
          <Link to="/admin/panel" className={`sidebar-link ${location.pathname === '/admin/panel' ? 'sidebar-link-active' : ''}`}>Dashboard</Link>
          <Link to="/admin/users" className={`sidebar-link ${location.pathname.startsWith('/admin/users') ? 'sidebar-link-active' : ''}`}>Users</Link>
          <Link to="/admin/products" className={`sidebar-link ${location.pathname.startsWith('/admin/products') ? 'sidebar-link-active' : ''}`}>Products</Link>
          <Link to="/admin/orders" className={`sidebar-link ${location.pathname.startsWith('/admin/orders') ? 'sidebar-link-active' : ''}`}>Orders</Link>
        </nav>
        <div className="admin-logout-wrap">
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="admin-overlay" aria-hidden="true" onClick={() => setSidebarOpen(false)} />}

      {/* Content */}
      <div className="admin-content">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-burger"
            aria-label="Toggle sidebar"
            aria-controls="admin-sidebar"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(v => !v)}
          >
            ☰
          </button>
          <h1 className="admin-topbar-title">Products</h1>
          {navTabs && navTabs}
        </header>
        <section className="admin-main">
          {children}
        </section>
      </div>
    </div>
  );
};

export default AdminLayout;
