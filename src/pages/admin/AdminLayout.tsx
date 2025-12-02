import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '../../components/ui';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Users,
  Megaphone,
  Sparkles,
  Image,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import './AdminLayout.css';
import '../../styles/admin-theme.css';

interface AdminLayoutProps {
  title?: string;
  children?: React.ReactNode;
  navTabs?: React.ReactNode;
}

// Navigation structure with collapsible groups
interface NavItem {
  path: string;
  label: string;
  icon?: React.ReactNode;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items?: NavItem[];
  path?: string; // For top-level items without children
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ title, children, navTabs }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthed = typeof window !== 'undefined' && window.localStorage.getItem('adminAuthed') === 'true';

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Collapsible groups state - load from localStorage
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem('adminCollapsedGroups');
    // Default: all groups collapsed
    if (!saved) {
      return {
        catalog: true,
        sales: true,
        marketing: true,
        gamification: true,
        content: true,
        settings: true
      };
    }
    return JSON.parse(saved);
  });

  const handleLogout = () => {
    window.localStorage.removeItem('adminAuthed');
    navigate('/admin');
  };

  // Close sidebar when route changes
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('adminCollapsedGroups', JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Define navigation structure with logical grouping
  const navigationGroups: NavGroup[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      path: '/admin/panel'
    },
    {
      id: 'catalog',
      label: 'Catalog',
      icon: <ShoppingBag size={20} />,
      items: [
        { path: '/admin/products', label: 'Products' },
        { path: '/admin/products/import', label: 'Import / Export' },
        { path: '/admin/categories', label: 'Categories' },
        { path: '/admin/inventory', label: 'Inventory / Sklad' },
        { path: '/admin/reviews', label: 'Reviews' }
      ]
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: <ShoppingCart size={20} />,
      items: [
        { path: '/admin/orders', label: 'Orders' },
        { path: '/admin/invoices', label: 'Invoices' },
        { path: '/admin/shipping', label: 'Shipping' },
        { path: '/admin/reports', label: 'Reports' },
        { path: '/admin/funnel', label: 'Funnel Analytics' },
        { path: '/admin/cohorts', label: 'Cohort Analysis' }
      ]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users size={20} />,
      path: '/admin/users'
    },
    {
      id: 'marketing',
      label: 'Marketing',
      icon: <Megaphone size={20} />,
      items: [
        { path: '/admin/campaigns', label: 'Campaigns' },
        { path: '/admin/discounts', label: 'Discount Codes' },
        { path: '/admin/abandoned-carts', label: 'Abandoned Carts' },
        { path: '/admin/segments', label: 'Segments' }
      ]
    },
    {
      id: 'gamification',
      label: 'Gamification',
      icon: <Sparkles size={20} />,
      items: [
        { path: '/admin/xp-config', label: 'XP Configuration' },
        { path: '/admin/cassandra-ranks', label: 'Cassandra Ranks' },
        { path: '/admin/referral-config', label: 'Referral Config' },
        { path: '/admin/credit-usage-config', label: 'Credit Usage Config' },
        { path: '/admin/gift-tiers', label: 'Gift Tiers' }
      ]
    },
    {
      id: 'content',
      label: 'Content',
      icon: <Image size={20} />,
      items: [
        { path: '/admin/gallery', label: 'Gallery' },
        { path: '/admin/blog/posts', label: 'Blog' }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={20} />,
      items: [
        { path: '/admin/settings', label: 'System Settings' },
        { path: '/admin/email-templates', label: 'Email Templates' },
        { path: '/admin/account-lockout-config', label: 'Account Lockout Config' },
        { path: '/admin/cassandra', label: 'Cassandra DB' }
      ]
    }
  ];

  // Helper to check if path is active
  const isPathActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Helper to check if group has active item
  const isGroupActive = (group: NavGroup): boolean => {
    if (group.path) return isPathActive(group.path);
    return group.items?.some(item => isPathActive(item.path)) || false;
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

  // Private admin layout with responsive sidebar
  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? ' is-open' : ''}`} id="admin-sidebar" aria-label="Admin navigation">
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <img src="/logo/logo.png" alt="Martyx Industries" className="admin-logo-img" />
            <div className="admin-logo-text">
              <div className="admin-logo-line">MARTYX</div>
              <div className="admin-logo-line">INDUSTRIES</div>
            </div>
          </div>
        </div>

        <nav className="admin-nav">
          {navigationGroups.map((group) => {
            const isActive = isGroupActive(group);
            const isCollapsed = collapsedGroups[group.id];

            // Top-level link (no children)
            if (group.path) {
              return (
                <Link
                  key={group.id}
                  to={group.path}
                  className={`admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="admin-nav-icon">{group.icon}</span>
                  <span className="admin-nav-label">{group.label}</span>
                </Link>
              );
            }

            // Collapsible group
            return (
              <div key={group.id} className={`admin-nav-group ${isActive ? 'active' : ''}`}>
                <button
                  className="admin-nav-group-header"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={!isCollapsed}
                >
                  <span className="admin-nav-icon">{group.icon}</span>
                  <span className="admin-nav-label">{group.label}</span>
                  <span className="admin-nav-chevron">
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                {!isCollapsed && group.items && (
                  <div className="admin-nav-group-items">
                    {group.items.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`admin-nav-subitem ${isPathActive(item.path) ? 'active' : ''}`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V3.33333C2 2.97971 2.14048 2.64057 2.39052 2.39052C2.64057 2.14048 2.97971 2 3.33333 2H6M10.6667 11.3333L14 8M14 8L10.6667 4.66667M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Logout
          </button>
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
