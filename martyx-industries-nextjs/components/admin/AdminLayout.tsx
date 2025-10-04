'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import '@/app/admin/layout.css';

interface AdminLayoutProps {
  title?: string;
  children?: React.ReactNode;
  navTabs?: React.ReactNode;
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

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children, navTabs }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthed = typeof window !== 'undefined' && window.localStorage.getItem('adminAuthed') === 'true';

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    window.localStorage.removeItem('adminAuthed');
    router.push('/admin');
  };

  // Close sidebar when route changes
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

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
          <Link href="/admin/panel" style={{ ...sidebarLinkStyle, ...(pathname === '/admin/panel' ? activeLinkStyle : {}) }}>Dashboard</Link>
          <Link href="/admin/users" style={{ ...sidebarLinkStyle, ...(pathname?.startsWith('/admin/users') ? activeLinkStyle : {}) }}>Users</Link>
          <Link href="/admin/products" style={{ ...sidebarLinkStyle, ...(pathname?.startsWith('/admin/products') ? activeLinkStyle : {}) }}>Products</Link>
          <Link href="/admin/orders" style={{ ...sidebarLinkStyle, ...(pathname?.startsWith('/admin/orders') ? activeLinkStyle : {}) }}>Orders</Link>
        </nav>
        <div className="admin-logout-wrap">
          <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Logout</button>
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
          <h1 className="admin-topbar-title">{title || 'Admin'}</h1>
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
