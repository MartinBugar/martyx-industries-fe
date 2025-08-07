import React from 'react';
import ResetPasswordRedirectComponent from '../components/ResetPasswordRedirect/ResetPasswordRedirect';
import './Pages.css';

const ResetPasswordRedirect: React.FC = () => {
  return (
    <div className="page-container reset-password-redirect-page">
      <ResetPasswordRedirectComponent />
    </div>
  );
};

export default ResetPasswordRedirect;