import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import UserProfile from '../../components/UserProfile/UserProfile';
import OrderHistory from '../../components/OrderHistory/OrderHistory';
import ModelCollection from '../../components/ModelCollection/ModelCollection';
import GdprSettings from '../../components/GdprSettings/GdprSettings';
import TokenExpirationTimer from '../../components/TokenExpirationTimer/TokenExpirationTimer';
import AvatarSelector from '../../components/AvatarSelector/AvatarSelector';
import type { Avatar } from '../../services/avatarService';
import './UserAccount.css';

const UserAccount: React.FC = () => {
  const { user, isAuthenticated, isLoading, fetchProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'collection' | 'settings'>('profile');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(user?.avatar?.imageUrl || null);

  // Update userAvatar when user object changes
  useEffect(() => {
    setUserAvatar(user?.avatar?.imageUrl || null);
  }, [user?.avatar?.imageUrl]);

  // Show loading while authentication state is being restored
  if (isLoading) {
    return (
      <div className="account-page">
        <div className="account-loading">
          <div className="loading-animation">
            <div className="spinner"></div>
            <div className="pulse-rings">
              <div className="ring"></div>
              <div className="ring"></div>
              <div className="ring"></div>
            </div>
          </div>
          <h2>Loading Your Account</h2>
          <p>Please wait while we set up your dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (only after loading is complete)
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="account-page">
      {/* Floating Account Cassandra */}
      <div className="account-floating-mascot">
        <img
          src="/cassandra/Account-Cass.png"
          alt="Cassandra - váš sprievodca účtom"
          className="floating-mascot-image-account"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Main Centered Container */}
      <div className="account-container">
        {/* Account Header */}
        <header className="account-header">
          <div className="header-content">
            <div className="user-welcome">
              <div className="user-avatar-section">
                <div className="avatar-wrapper" onClick={() => setShowAvatarSelector(true)} style={{ cursor: 'pointer' }} title="Click to change avatar">
                  <div className="user-avatar">
                    {userAvatar ? (
                      <img src={userAvatar} alt="User avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                    ) : (
                      user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="avatar-status"></div>
                  <div className="avatar-edit-badge" title="Change avatar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="welcome-content">
                <h1 className="welcome-title">
                  Welcome back, <span className="user-name">{user?.firstName || user?.name || 'User'}</span>
                </h1>
                <p className="user-email">{user?.email}</p>
              </div>
            </div>

            {/* Session Timer Card */}
            <div className="session-card">
              <TokenExpirationTimer />
            </div>
          </div>
        </header>

        {/* Content Wrapper - Grid Layout */}
        <div className="account-content-wrapper">
          {/* Desktop Sidebar Navigation */}
          <aside className="account-sidebar">
            <button
              className={`sidebar-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <div className="tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="tab-label">Profile</span>
            </button>

            <button
              className={`sidebar-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <div className="tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 9h6m-6 4h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="tab-label">Orders</span>
            </button>

            <button
              className={`sidebar-tab ${activeTab === 'collection' ? 'active' : ''}`}
              onClick={() => setActiveTab('collection')}
            >
              <div className="tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <span className="tab-label">Moja zbierka</span>
            </button>

            <button
              className={`sidebar-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <div className="tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <span className="tab-label">Settings</span>
            </button>
          </aside>

          {/* Mobile Tabs */}
          <nav className="mobile-tabs">
            <button
              className={`mobile-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className="mobile-tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="mobile-tab-label">Profile</span>
            </button>

            <button
              className={`mobile-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span className="mobile-tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 9h6m-6 4h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </span>
              <span className="mobile-tab-label">Orders</span>
            </button>

            <button
              className={`mobile-tab ${activeTab === 'collection' ? 'active' : ''}`}
              onClick={() => setActiveTab('collection')}
            >
              <span className="mobile-tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                  <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <span className="mobile-tab-label">Zbierka</span>
            </button>

            <button
              className={`mobile-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <span className="mobile-tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </span>
              <span className="mobile-tab-label">Settings</span>
            </button>
          </nav>

          {/* Main Content Area */}
          <main className="account-main">
            {activeTab === 'profile' && <UserProfile />}
            {activeTab === 'orders' && <OrderHistory />}
            {activeTab === 'collection' && <ModelCollection />}
            {activeTab === 'settings' && <GdprSettings />}
          </main>
        </div>
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          onClose={() => setShowAvatarSelector(false)}
          onAvatarSelected={async (avatar: Avatar) => {
            setUserAvatar(avatar.imageUrl);
            setShowAvatarSelector(false);
            // Reload user data from backend to update all instances including navbar
            await fetchProfile();
          }}
          currentAvatarId={user?.avatar?.id}
        />
      )}
    </div>
  );
};

export default UserAccount;
