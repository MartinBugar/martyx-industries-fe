import React from 'react';
import ForgotPasswordComponent from '../components/ForgotPassword/ForgotPassword';
import './Pages.css';

const ForgotPassword: React.FC = () => {
  return (
    <div className="forgot-password-page">
      <ForgotPasswordComponent />
    </div>
  );
};

export default ForgotPassword;