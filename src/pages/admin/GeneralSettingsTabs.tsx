import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Home, Building, ShieldAlert } from 'lucide-react';

/**
 * GeneralSettingsTabs - Sub-navigation for General Settings section
 *
 * This component provides tabbed navigation between:
 * - System Settings (dev gate, OSS/tax config)
 * - Home Page Settings (section visibility, order)
 * - Company Settings (business info, legal)
 * - Security Settings (account lockout, access control)
 */
const GeneralSettingsTabs: React.FC = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const tabs = [
        { path: '/admin/settings', label: 'System', icon: <Settings size={16} /> },
        { path: '/admin/home-settings', label: 'Home Page', icon: <Home size={16} /> },
        { path: '/admin/company-settings', label: 'Company', icon: <Building size={16} /> },
        { path: '/admin/account-lockout-config', label: 'Security', icon: <ShieldAlert size={16} /> },
    ];

    return (
        <nav className="admin-nav-tabs" style={{ marginBottom: '24px', marginLeft: 0 }} aria-label="Settings sections">
            {tabs.map((tab) => (
                <Link
                    key={tab.path}
                    to={tab.path}
                    className={`admin-nav-tab ${currentPath === tab.path ? 'active' : ''}`}
                >
                    {tab.icon}
                    {tab.label}
                </Link>
            ))}
        </nav>
    );
};

export default GeneralSettingsTabs;
