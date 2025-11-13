import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import UserProfile from '../../components/UserProfile/UserProfile';
import OrderHistory from '../../components/OrderHistory/OrderHistory';
import ModelCollection from '../../components/ModelCollection/ModelCollection';
import GdprSettings from '../../components/GdprSettings/GdprSettings';
import PwaInstall from '../../components/PwaInstall/PwaInstall';
import MyCassandra from '../../components/MyCassandra/MyCassandra';
import ReferralDashboard from '../ReferralDashboard/ReferralDashboard';
import AvatarSelector from '../../components/AvatarSelector/AvatarSelector';
import cassandraRankService, { type UserCassandraDto } from '../../services/cassandraRankService';
import { userCreditsService, type UserCreditDto } from '../../services/referralService';
import type { Avatar } from '../../services/avatarService';
import './UserAccount.css';

const UserAccount: React.FC = () => {
  const { user, isAuthenticated, isLoading, fetchProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as 'profile' | 'orders' | 'collection' | 'cassandra' | 'referrals' | 'settings' | 'app' | null;
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'collection' | 'cassandra' | 'referrals' | 'settings' | 'app'>(tabFromUrl || 'profile');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(user?.avatar?.imageUrl || null);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [cassandraData, setCassandraData] = useState<UserCassandraDto | null>(null);
  const [creditsData, setCreditsData] = useState<UserCreditDto | null>(null);

  // Listen for profile edit state changes
  useEffect(() => {
    const handleProfileEditStart = () => setIsProfileEditing(true);
    const handleProfileEditEnd = () => setIsProfileEditing(false);

    window.addEventListener('profile:editStart', handleProfileEditStart);
    window.addEventListener('profile:editEnd', handleProfileEditEnd);

    return () => {
      window.removeEventListener('profile:editStart', handleProfileEditStart);
      window.removeEventListener('profile:editEnd', handleProfileEditEnd);
    };
  }, []);

  // Update userAvatar when user object changes
  useEffect(() => {
    setUserAvatar(user?.avatar?.imageUrl || null);
  }, [user?.avatar?.imageUrl]);

  // Load Cassandra data when cassandra tab is active
  useEffect(() => {
    if (activeTab === 'cassandra' && !cassandraData) {
      const loadCassandraData = async () => {
        try {
          const data = await cassandraRankService.getUserCassandraInfo();
          setCassandraData(data);
        } catch (error) {
          console.error('Failed to load Cassandra data:', error);
        }
      };
      loadCassandraData();
    }
  }, [activeTab, cassandraData]);

  // Load credits data for mini widget
  useEffect(() => {
    if (isAuthenticated) {
      const loadCreditsData = async () => {
        try {
          const data = await userCreditsService.getBalance();
          setCreditsData(data);
        } catch (error) {
          console.error('Failed to load credits data:', error);
        }
      };
      loadCreditsData();
    }
  }, [isAuthenticated]);

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
                {creditsData && creditsData.creditBalance > 0 && (
                  <div className="credits-mini-widget" onClick={() => setActiveTab('referrals')} style={{ cursor: 'pointer', marginTop: '8px' }}>
                    <span className="credits-icon" style={{ fontSize: '16px', marginRight: '6px' }}>💰</span>
                    <span className="credits-amount" style={{ fontWeight: '600', color: 'var(--primary)' }}>
                      €{creditsData.creditBalance.toFixed(2)} available
                    </span>
                    {creditsData.pendingBalance > 0 && (
                      <span className="credits-pending" style={{ marginLeft: '8px', fontSize: '0.85em', opacity: '0.7' }}>
                        (+€{creditsData.pendingBalance.toFixed(2)} pending)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Edit Actions - shown only when profile tab is active */}
            {activeTab === 'profile' && (
              <div className="profile-actions">
                {!isProfileEditing ? (
                  <button
                    className="edit-button"
                    onClick={() => window.dispatchEvent(new Event('editProfile'))}
                    aria-label="Edit profile"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Edit
                  </button>
                ) : (
                  <div className="edit-actions-group">
                    <button
                      className="save-button"
                      onClick={() => window.dispatchEvent(new Event('saveProfile'))}
                      aria-label="Save changes"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Save
                    </button>
                    <button
                      className="cancel-button"
                      onClick={() => window.dispatchEvent(new Event('cancelProfile'))}
                      aria-label="Cancel editing"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cassandra Rank Progress - shown only when cassandra tab is active */}
            {activeTab === 'cassandra' && cassandraData && (
              <div className="cassandra-rank-section">
                <div className="cassandra-rank-header">
                  <div className="rank-badges-compact">
                    <span className="rank-label">Rank:</span>
                    <span className="rank-badge-compact">{cassandraData.currentRankName}</span>
                    <span className="level-badge-compact">Lvl {cassandraData.currentRankLevel}</span>
                  </div>
                  <div className="xp-display-compact">
                    <span className="xp-current">{cassandraData.totalXp.toLocaleString()} XP</span>
                    {!cassandraData.isMaxRank && cassandraData.nextRankName && (
                      <span className="xp-next">→ {cassandraData.nextRankName} ({cassandraData.nextRankRequiredXp?.toLocaleString()} XP)</span>
                    )}
                    {cassandraData.isMaxRank && (
                      <span className="xp-max">🏆 Max Rank</span>
                    )}
                  </div>
                </div>

                {/* Progress bar - shown only if not max rank */}
                {!cassandraData.isMaxRank && cassandraData.progressPercentage !== undefined && (
                  <div className="rank-progress-bar-wrapper">
                    <div className="rank-progress-bar">
                      <div
                        className="rank-progress-fill"
                        style={{ width: `${cassandraData.progressPercentage}%` }}
                      >
                        <span className="rank-progress-text">{cassandraData.progressPercentage}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
              className={`sidebar-tab ${activeTab === 'cassandra' ? 'active' : ''}`}
              onClick={() => setActiveTab('cassandra')}
            >
              <div className="tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="tab-label">My Cassandra</span>
            </button>

            <button
              className={`sidebar-tab ${activeTab === 'referrals' ? 'active' : ''}`}
              onClick={() => setActiveTab('referrals')}
            >
              <div className="tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="tab-label">Referrals & Credits</span>
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

            <button
              className={`sidebar-tab ${activeTab === 'app' ? 'active' : ''}`}
              onClick={() => setActiveTab('app')}
            >
              <div className="tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="tab-label">Aplikácia</span>
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
              className={`mobile-tab ${activeTab === 'cassandra' ? 'active' : ''}`}
              onClick={() => setActiveTab('cassandra')}
            >
              <span className="mobile-tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="mobile-tab-label">Cassandra</span>
            </button>

            <button
              className={`mobile-tab ${activeTab === 'referrals' ? 'active' : ''}`}
              onClick={() => setActiveTab('referrals')}
            >
              <span className="mobile-tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="mobile-tab-label">Referrals</span>
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

            <button
              className={`mobile-tab ${activeTab === 'app' ? 'active' : ''}`}
              onClick={() => setActiveTab('app')}
            >
              <span className="mobile-tab-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="mobile-tab-label">App</span>
            </button>
          </nav>

          {/* Main Content Area */}
          <main className="account-main">
            {activeTab === 'profile' && <UserProfile />}
            {activeTab === 'orders' && <OrderHistory />}
            {activeTab === 'collection' && <ModelCollection />}
            {activeTab === 'cassandra' && <MyCassandra />}
            {activeTab === 'referrals' && <ReferralDashboard />}
            {activeTab === 'settings' && <GdprSettings />}
            {activeTab === 'app' && <PwaInstall />}
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
