import React from 'react';
import RegistrationComponent from '../components/Registration/Registration';
import './Pages.css';

const Registration: React.FC = () => {
  return (
    <div className="registration-page">
      <RegistrationComponent />
    </div>
  );
};

export default Registration;