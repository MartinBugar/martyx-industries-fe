import React from 'react';
import RegistrationComponent from '../components/Registration/Registration';
import './Pages.css';

const Registration: React.FC = () => {
  return (
    <div className="page-container registration-page">
      <h1>Create an Account</h1>
      <RegistrationComponent />
    </div>
  );
};

export default Registration;