import React from 'react';
import ForgotPasswordComponent from '../components/ForgotPassword/ForgotPassword';
import './Pages.css';

const ForgotPassword: React.FC = () => {
  return (
    <div className="page-container forgot-password-page">
      <h1>Forgot Password</h1>
      <ForgotPasswordComponent />
    </div>
  );
};

export default ForgotPassword;