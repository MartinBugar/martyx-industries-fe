'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/useAuth';
import styles from './Account.module.css';

type TabType = 'profile' | 'orders' | 'collection' | 'settings';

interface Order {
  id: string;
  date: string;
  status: string;
  totalAmount: number;
  currency: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

export default function Account() {
  const { t } = useTranslation(['account', 'common']);
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [isAuthenticated, isLoading, router]);

  // Mock load orders
  useEffect(() => {
    if (isAuthenticated && activeTab === 'orders') {
      setLoadingOrders(true);
      // Mock API call
      setTimeout(() => {
        setOrders([
          {
            id: '1',
            date: '2024-01-15',
            status: 'DELIVERED',
            totalAmount: 89.99,
            currency: 'EUR',
            items: [
              { productName: 'Tiger I Tank Kit', quantity: 1, price: 89.99 }
            ]
          },
          {
            id: '2',
            date: '2024-01-10',
            status: 'PROCESSING',
            totalAmount: 45.50,
            currency: 'EUR',
            items: [
              { productName: 'Sherman STL Bundle', quantity: 1, price: 45.50 }
            ]
          }
        ]);
        setLoadingOrders(false);
      }, 1000);
    }
  }, [isAuthenticated, activeTab]);

  // Show loading while authentication state is being restored
  if (isLoading) {
    return (
      <div className={styles.accountPage}>
        <div className={styles.accountLoading}>
          <div className={styles.loadingAnimation}>
            <div className={styles.spinner}></div>
            <div className={styles.pulseRings}>
              <div className={styles.ring}></div>
              <div className={styles.ring}></div>
              <div className={styles.ring}></div>
            </div>
          </div>
          <h2>{t('account.loading.title', 'Loading Your Account')}</h2>
          <p>{t('account.loading.message', 'Please wait while we set up your dashboard...')}</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className={styles.tabContent}>
            <h3>{t('account.profile.title', 'Profile Information')}</h3>
            <div className={styles.profileForm}>
              <div className={styles.formGroup}>
                <label>{t('account.profile.email', 'Email')}</label>
                <input type="email" value={user?.email || ''} disabled />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>{t('account.profile.first_name', 'First Name')}</label>
                  <input type="text" value={user?.firstName || ''} placeholder="Enter first name" />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('account.profile.last_name', 'Last Name')}</label>
                  <input type="text" value={user?.lastName || ''} placeholder="Enter last name" />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>{t('account.profile.phone', 'Phone Number')}</label>
                <input type="tel" value={user?.phone || ''} placeholder="Enter phone number" />
              </div>
              <button className={styles.saveBtn}>
                {t('account.profile.save', 'Save Changes')}
              </button>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className={styles.tabContent}>
            <h3>{t('account.orders.title', 'Order History')}</h3>
            {loadingOrders ? (
              <div className={styles.loadingOrders}>
                <div className={styles.spinner}></div>
                <p>{t('account.orders.loading', 'Loading your orders...')}</p>
              </div>
            ) : orders.length > 0 ? (
              <div className={styles.ordersList}>
                {orders.map((order) => (
                  <div key={order.id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <div className={styles.orderInfo}>
                        <h4>Order #{order.id}</h4>
                        <p>{new Date(order.date).toLocaleDateString()}</p>
                      </div>
                      <div className={styles.orderStatus}>
                        <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className={styles.orderItems}>
                      {order.items.map((item, index) => (
                        <div key={index} className={styles.orderItem}>
                          <span>{item.productName}</span>
                          <span>Qty: {item.quantity}</span>
                          <span>{order.currency} {item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.orderTotal}>
                      <strong>Total: {order.currency} {order.totalAmount.toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </div>
                <h4>{t('account.orders.empty.title', 'No Orders Yet')}</h4>
                <p>{t('account.orders.empty.message', 'You haven\'t placed any orders yet.')}</p>
              </div>
            )}
          </div>
        );

      case 'collection':
        return (
          <div className={styles.tabContent}>
            <h3>{t('account.collection.title', 'My Collection')}</h3>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h4>{t('account.collection.empty.title', 'No Models Yet')}</h4>
              <p>{t('account.collection.empty.message', 'Your purchased models will appear here.')}</p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className={styles.tabContent}>
            <h3>{t('account.settings.title', 'Account Settings')}</h3>
            <div className={styles.settingsSection}>
              <h4>{t('account.settings.password.title', 'Change Password')}</h4>
              <div className={styles.passwordForm}>
                <div className={styles.formGroup}>
                  <label>{t('account.settings.password.current', 'Current Password')}</label>
                  <input type="password" placeholder="Enter current password" />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('account.settings.password.new', 'New Password')}</label>
                  <input type="password" placeholder="Enter new password" />
                </div>
                <div className={styles.formGroup}>
                  <label>{t('account.settings.password.confirm', 'Confirm New Password')}</label>
                  <input type="password" placeholder="Confirm new password" />
                </div>
                <button className={styles.saveBtn}>
                  {t('account.settings.password.update', 'Update Password')}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.accountPage}>
      {/* Floating Account Cassandra */}
      <div className={styles.accountFloatingMascot}>
        <img 
          src="/cassandra/Account-Cass.png" 
          alt="Cassandra - váš sprievodca účtom"
          className={styles.floatingMascotImageAccount}
          loading="lazy"
        />
      </div>
      
      <div className={styles.accountContainer}>
        {/* Compact Header with User Info */}
        <header className={styles.accountHeader}>
          <div className={styles.headerContent}>
            <div className={styles.userWelcome}>
              <div className={styles.userAvatarSection}>
                <div className={styles.avatarWrapper}>
                  <div className={styles.userAvatar}>
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <div className={styles.avatarStatus}></div>
                </div>
              </div>
              <div className={styles.welcomeContent}>
                <h1 className={styles.welcomeTitle}>
                  {t('account.welcome.title', 'Welcome back')}, <span className={styles.userName}>{user?.firstName || 'User'}</span>
                </h1>
                <p className={styles.userEmail}>{user?.email}</p>
              </div>
            </div>
            
            {/* Session Timer Card */}
            <div className={styles.sessionCard}>
              <div className={styles.sessionInfo}>
                <span className={styles.sessionStatus}>Active Session</span>
                <span className={styles.sessionTime}>2h 15m remaining</span>
              </div>
            </div>
          </div>
        </header>

        {/* Unified Tabbed Interface */}
        <div className={styles.accountTabbedInterface}>
          <nav className={styles.accountNavigation} role="tablist">
            <div className={styles.navTabs}>
              <button 
                className={`${styles.navTab} ${activeTab === 'profile' ? styles.active : ''}`}
                onClick={() => setActiveTab('profile')}
                role="tab"
                aria-selected={activeTab === 'profile'}
              >
                <div className={styles.tabIcon}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className={styles.tabLabel}>{t('account.tabs.profile', 'Profile')}</span>
              </button>
              
              <button 
                className={`${styles.navTab} ${activeTab === 'orders' ? styles.active : ''}`}
                onClick={() => setActiveTab('orders')}
                role="tab"
                aria-selected={activeTab === 'orders'}
              >
                <div className={styles.tabIcon}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 4H15a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className={styles.tabLabel}>{t('account.tabs.orders', 'Orders')}</span>
              </button>
              
              <button 
                className={`${styles.navTab} ${activeTab === 'collection' ? styles.active : ''}`}
                onClick={() => setActiveTab('collection')}
                role="tab"
                aria-selected={activeTab === 'collection'}
              >
                <div className={styles.tabIcon}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                </div>
                <span className={styles.tabLabel}>{t('account.tabs.collection', 'Collection')}</span>
              </button>
              
              <button 
                className={`${styles.navTab} ${activeTab === 'settings' ? styles.active : ''}`}
                onClick={() => setActiveTab('settings')}
                role="tab"
                aria-selected={activeTab === 'settings'}
              >
                <div className={styles.tabIcon}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className={styles.tabLabel}>{t('account.tabs.settings', 'Settings')}</span>
              </button>
            </div>
          </nav>

          {/* Tab Content */}
          <div className={styles.tabContentContainer}>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
