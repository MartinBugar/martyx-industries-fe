import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import UserProfile from '../../components/UserProfile/UserProfile';
import OrderHistory from '../../components/OrderHistory/OrderHistory';
import './UserAccount.css';

const UserAccount: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div className="user-account-container">
      <div className="account-header">
        <h1>My Account</h1>
        <p>Welcome back, {user?.firstName || user?.name}!</p>
      </div>
      
      <div className="account-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Order History
        </button>
      </div>
      
      <div className="account-content">
        {activeTab === 'profile' ? (
          <UserProfile />
        ) : (
          <OrderHistory />
        )}
      </div>
    </div>
  );
};

export default UserAccount;