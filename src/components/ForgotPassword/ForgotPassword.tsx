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
      <div className="forgot-password-background">
        <div className="forgot-password-glow forgot-password-glow-1"></div>
        <div className="forgot-password-glow forgot-password-glow-2"></div>
      </div>
      
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <div className="forgot-password-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M18 8h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2V7a6 6 0 1 1 12 0v1zm-2 0V7a4 4 0 1 0-8 0v1h8zm-5 6v4h2v-4h-2z" fill="currentColor"/>
            </svg>
          </div>
          <h1>Reset Password</h1>
          <p>Enter your email address and we'll send you a link to reset your password</p>
        </div>
        
        {error && (
          <div className="modern-error">
            <div className="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" fill="currentColor"/>
              </svg>
            </div>
            <div className="error-content">
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="modern-success">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071L16.659 7.515l-5.656 5.657-2.829-2.829L6.76 11.757l4.243 4.243z" fill="currentColor"/>
              </svg>
            </div>
            <div className="success-content">
              <h4>Email Sent!</h4>
              <p>{successMessage}</p>
              <Link to="/login" className="go-to-login-btn">
                Go to Login
              </Link>
            </div>
          </div>
        )}
        
        {!successMessage && (
          <form className="modern-forgot-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email" className="field-label">Email Address</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="none" d="M0 0h24v24H0z"/>
                    <path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm17 4.238l-7.928 7.1L4 7.216V19h16V7.238zM4.511 5l7.55 6.662L19.502 5H4.511z" fill="currentColor"/>
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className="field-input"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="forgot-submit-btn"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="loading-spinner"></span>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
        
        <div className="forgot-footer">
          {!successMessage && (
            <>
              <div className="divider">
                <span>Remember your password?</span>
              </div>
              <Link to="/login" className="back-to-login-link">
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;