import React, { useState, useEffect, type ReactNode } from 'react';
import { DevPasswordGateContext } from './DevPasswordGateContext';

// Props for the DevPasswordGateProvider component
interface DevPasswordGateProviderProps {
  children: ReactNode;
}

// The correct password for development access
const CORRECT_PASSWORD = 'demo';

// Local storage key for storing authentication state
const DEV_AUTH_KEY = 'dev_password_authenticated';

// DevPasswordGateProvider component to wrap the app and provide password gate functionality
export const DevPasswordGateProvider: React.FC<DevPasswordGateProviderProps> = ({ children }) => {
  // State to track if the user has entered the correct password
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Check if authentication state is stored in localStorage on initial load
  useEffect(() => {
    const storedAuth = localStorage.getItem(DEV_AUTH_KEY);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Function to authenticate with the development password
  const authenticate = (password: string): boolean => {
    const isCorrect = password === CORRECT_PASSWORD;
    
    if (isCorrect) {
      // Store authentication state in localStorage
      localStorage.setItem(DEV_AUTH_KEY, 'true');
      setIsAuthenticated(true);
    }
    
    return isCorrect;
  };

  // Provide the context to children components
  return (
    <DevPasswordGateContext.Provider value={{
      isAuthenticated,
      authenticate,
    }}>
      {children}
    </DevPasswordGateContext.Provider>
  );
};