import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import UserProfile from '../../components/UserProfile/UserProfile';
import OrderHistory from '../../components/OrderHistory/OrderHistory';
import TokenExpirationTimer from '../../components/TokenExpirationTimer/TokenExpirationTimer';
import './UserAccount.css';

const UserAccount: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  
  // Show loading while authentication state is being restored
  if (isLoading) {
    return (
      <div className="user-account-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated (only after loading is complete)
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="user-account-container">
      <div className="account-sidebar">
        <div className="user-info">
          <div className="user-avatar">
            {user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
          </div>
          <div className="user-details">
            <h3>{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.name}</h3>
            <p className="user-email">{user?.email}{user?.id}</p>
          </div>
        </div>
        
        <TokenExpirationTimer />
        
        <nav className="account-nav">
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="nav-icon">👤</span>
            <span>My Profile</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span className="nav-icon">📦</span>
            <span>Order History</span>
          </button>
        </nav>
      </div>
      
      <div className="account-main">
        <div className="account-header">
          <h1>{activeTab === 'profile' ? 'My Profile' : 'Order History'}</h1>
        </div>
        
        <div className="account-content">
          {activeTab === 'profile' ? (
            <UserProfile />
          ) : (
            <OrderHistory />
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAccount;