import React from 'react';
import ResetPasswordComponent from '../components/ResetPassword/ResetPassword';
import './Pages.css';

const ResetPassword: React.FC = () => {
  return (
    <div className="page-container reset-password-page">
      <h1>Reset Password</h1>
      <ResetPasswordComponent />
    </div>
  );
};

export default ResetPassword;