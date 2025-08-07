import React, { useState, type ReactNode } from 'react';
import { useDevPasswordGate } from '../../context/useDevPasswordGate';
import './DevPasswordGate.css';

// Props for the DevPasswordGate component
interface DevPasswordGateProps {
  children: ReactNode;
}

// DevPasswordGate component to render the password form or children
export const DevPasswordGate: React.FC<DevPasswordGateProps> = ({ children }) => {
  // Get authentication state and authenticate function from context
  const { isAuthenticated, authenticate } = useDevPasswordGate();
  
  // State for password input and error message
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setError('');
    
    // Check if password is correct
    const isCorrect = authenticate(password);
    
    // Show error if password is incorrect
    if (!isCorrect) {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };
  
  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }
  
  // Otherwise, render password form
  return (
    <div className="dev-password-gate">
      <div className="dev-password-gate-container">
        <h1>Development Access</h1>
        <p>This site is under development. Please enter the password to continue.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit">Access Site</button>
        </form>
      </div>
    </div>
  );
};