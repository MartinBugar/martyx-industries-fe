import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import './ForgotPassword.css';

const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Clear error when user starts typing again
    if (error) setError(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Process forgot password request
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setSuccessMessage(result.message);
        setEmail(''); // Clear the form
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Forgot password error:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="forgot-password-container">
      <div className="forgot-password-form-container">
        <h2>Forgot Password</h2>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
            <button 
              className="go-to-login-btn" 
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </button>
          </div>
        )}
        
        {!successMessage && (
          <form className="forgot-password-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="forgot-password-btn"
              disabled={isProcessing}
            >
              {isProcessing ? 'Sending...' : 'Reset Password'}
            </button>
          </form>
        )}
        
        <div className="forgot-password-footer">
          {!successMessage && (
            <>
              <p>Remember your password? <Link to="/login">Login here</Link></p>
              <p>Don't have an account? <Link to="/register">Register here</Link></p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;