import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '../../components/ui';
import './AdminLayout.css';
import '../../styles/admin-theme.css';

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
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: 24 }}>
          {title && <h1 style={{ margin: 0, marginBottom: 16, fontSize: 20 }}>{title}</h1>}
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
          <Link to="/admin/panel" className={location.pathname === '/admin/panel' ? 'admin-link-active' : ''}>Dashboard</Link>
          <Link to="/admin/users" className={location.pathname.startsWith('/admin/users') ? 'admin-link-active' : ''}>Users</Link>
          <Link to="/admin/products" className={location.pathname.startsWith('/admin/products') ? 'admin-link-active' : ''}>Products</Link>
          <Link to="/admin/categories" className={location.pathname.startsWith('/admin/categories') ? 'admin-link-active' : ''}>Categories</Link>
          <Link to="/admin/inventory" className={location.pathname.startsWith('/admin/inventory') ? 'admin-link-active' : ''}>Inventory / Sklad</Link>
          <Link to="/admin/reviews" className={location.pathname.startsWith('/admin/reviews') ? 'admin-link-active' : ''}>Reviews</Link>
          <Link to="/admin/orders" className={location.pathname.startsWith('/admin/orders') || location.pathname.startsWith('/admin/manual-orders') ? 'admin-link-active' : ''}>Orders</Link>
          <Link to="/admin/invoices" className={location.pathname.startsWith('/admin/invoices') ? 'admin-link-active' : ''}>Invoices</Link>
          <Link to="/admin/shipping" className={location.pathname.startsWith('/admin/shipping') ? 'admin-link-active' : ''}>Shipping</Link>
          <Link to="/admin/gallery" className={location.pathname.startsWith('/admin/gallery') ? 'admin-link-active' : ''}>Gallery</Link>
          <Link to="/admin/campaigns" className={location.pathname.startsWith('/admin/campaigns') ? 'admin-link-active' : ''}>Campaigns</Link>
          <Link to="/admin/discounts" className={location.pathname.startsWith('/admin/discounts') ? 'admin-link-active' : ''}>Discount Codes</Link>
          <Link to="/admin/referral-config" className={location.pathname.startsWith('/admin/referral-config') ? 'admin-link-active' : ''}>Referral Config</Link>
          <Link to="/admin/credit-usage-config" className={location.pathname.startsWith('/admin/credit-usage-config') ? 'admin-link-active' : ''}>Credit Usage Config</Link>
          <Link to="/admin/account-lockout-config" className={location.pathname.startsWith('/admin/account-lockout-config') ? 'admin-link-active' : ''}>Account Lockout Config</Link>
          <Link to="/admin/gift-tiers" className={location.pathname.startsWith('/admin/gift-tiers') ? 'admin-link-active' : ''}>Gift Tiers</Link>
          <Link to="/admin/segments" className={location.pathname.startsWith('/admin/segments') ? 'admin-link-active' : ''}>Segments</Link>
          <Link to="/admin/abandoned-carts" className={location.pathname.startsWith('/admin/abandoned-carts') ? 'admin-link-active' : ''}>Abandoned Carts</Link>
          <Link to="/admin/email-templates" className={location.pathname.startsWith('/admin/email-templates') ? 'admin-link-active' : ''}>Email Templates</Link>
          <Link to="/admin/cassandra" className={location.pathname === '/admin/cassandra' ? 'admin-link-active' : ''}>CASSANDRA</Link>
          <Link to="/admin/cassandra-ranks" className={location.pathname === '/admin/cassandra-ranks' ? 'admin-link-active' : ''}>Cassandra Ranks</Link>
          <Link to="/admin/xp-config" className={location.pathname === '/admin/xp-config' ? 'admin-link-active' : ''}>XP Configuration</Link>
        </nav>
        <div className="admin-logout-wrap">
          <button onClick={handleLogout}>Logout</button>
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
          <h1 className="admin-topbar-title">{title || 'Admin Panel'}</h1>
          {navTabs && navTabs}
        </header>
        <section className="admin-main">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </section>
      </div>
    </div>
  );
};

export default AdminLayout;
