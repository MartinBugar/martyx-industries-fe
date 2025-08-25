import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import UserProfile from '../../components/UserProfile/UserProfile';
import OrderHistory from '../../components/OrderHistory/OrderHistory';
import TokenExpirationTimer from '../../components/TokenExpirationTimer/TokenExpirationTimer';
import './UserAccount.css';

const UserAccount: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'settings'>('profile');
  
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
      <div className="account-container">
        {/* Modern Header Section */}
        <header className="account-header">
          <div className="header-content">
            <div className="user-welcome">
              <div className="user-avatar-section">
                <div className="avatar-wrapper">
                  <div className="user-avatar">
                    {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="avatar-status"></div>
                </div>
              </div>
              <div className="welcome-content">
                <h1 className="welcome-title">
                  Welcome back, <span className="user-name">{user?.firstName || user?.name || 'User'}</span>
                </h1>
                <p className="user-email">{user?.email}</p>
                <div className="account-stats">
                  <div className="stat-item">
                    <span className="stat-label">Member since</span>
                    <span className="stat-value">2024</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Session Timer Card */}
            <div className="session-card">
              <TokenExpirationTimer />
            </div>
          </div>
        </header>

        {/* Modern Navigation Tabs */}
        <nav className="account-navigation" role="tablist">
          <button 
            className={`nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            role="tab"
            aria-selected={activeTab === 'profile'}
            aria-controls="profile-panel"
          >
            <div className="tab-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="tab-label">Profile</span>
            <span className="tab-indicator"></span>
          </button>
          
          <button 
            className={`nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            role="tab"
            aria-selected={activeTab === 'orders'}
            aria-controls="orders-panel"
          >
            <div className="tab-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 9h6m-6 4h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="tab-label">Orders</span>
            <span className="tab-indicator"></span>
          </button>

          <button 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            role="tab"
            aria-selected={activeTab === 'settings'}
            aria-controls="settings-panel"
          >
            <div className="tab-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <span className="tab-label">Settings</span>
            <span className="tab-indicator"></span>
          </button>
        </nav>

        {/* Content Panels */}
        <main className="account-content">
          <div 
            className={`content-panel ${activeTab === 'profile' ? 'active' : ''}`}
            id="profile-panel"
            role="tabpanel"
            aria-labelledby="profile-tab"
          >
            {activeTab === 'profile' && <UserProfile />}
          </div>
          
          <div 
            className={`content-panel ${activeTab === 'orders' ? 'active' : ''}`}
            id="orders-panel"
            role="tabpanel"
            aria-labelledby="orders-tab"
          >
            {activeTab === 'orders' && <OrderHistory />}
          </div>

          <div 
            className={`content-panel ${activeTab === 'settings' ? 'active' : ''}`}
            id="settings-panel"
            role="tabpanel"
            aria-labelledby="settings-tab"
          >
            {activeTab === 'settings' && (
              <div className="settings-content">
                <div className="settings-card">
                  <h2>Account Settings</h2>
                  <p>Advanced settings and preferences coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserAccount;