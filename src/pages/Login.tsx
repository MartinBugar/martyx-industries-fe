import React from 'react';
import LoginComponent from '../components/Login/Login';
import './Pages.css';

const Login: React.FC = () => {
  return (
    <div className="page-container login-page">
      <h1>Login</h1>
      <LoginComponent />
    </div>
  );
};

export default Login;