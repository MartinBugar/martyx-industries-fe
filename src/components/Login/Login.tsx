import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { registrationService } from '../../services/registrationService';
import type { LoginErrorResponse } from '../../context/authTypes';
import './Login.css';

interface LoginFormData {
  email: string;
  password: string;
}

type ConfirmationStatus = 'success' | 'failed';

interface LoginProps {
  confirmationStatus?: ConfirmationStatus | null;
}

const Login: React.FC<LoginProps> = ({ confirmationStatus = null }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user starts typing again
    if (error) setError(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Process login
    setIsProcessing(true);
    setError(null);
    
    try {
      const result: boolean | LoginErrorResponse = await login(formData.email, formData.password);
      
      if (result === true) {
        // Redirect to home page after successful login
        navigate('/');
      } else if (typeof result === 'object' && 'type' in result && result.type === 'email_not_confirmed') {
        // Handle email not confirmed error
        setError(result.error);
        setShowResendConfirmation(true);
      } else {
        setError('Invalid email or password');
        setShowResendConfirmation(false);
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      setShowResendConfirmation(false);
      console.error('Login error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle resend confirmation email
  const handleResendConfirmation = async () => {
    setIsResending(true);
    try {
      const result = await registrationService.resendConfirmation(formData.email);
      
      if (result.success) {
        setError('Confirmation email sent! Please check your email and click the confirmation link.');
        setShowResendConfirmation(false);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Failed to resend confirmation email. Please try again.');
      console.error('Resend confirmation error:', error);
    } finally {
      setIsResending(false);
    }
  };
  
  return (
    <div className="login-container">
      {/* Confirmation banners inside the login container, above the form card */}
      {confirmationStatus === 'success' && (
        <div className="success-message">Your email has been confirmed successfully. You can now log in.</div>
      )}
      {confirmationStatus === 'failed' && (
        <div className="failure-message">Email confirmation failed. Please try again or contact support.</div>
      )}

      <div className="login-form-container">
        {error && (
          <div className={`error-message ${error.includes('Account not activated') ? 'account-not-activated' : ''}`}>
            {error.includes('Account not activated') ? (
              <>
                <div className="error-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <path fill="none" d="M0 0h24v24H0z"/>
                    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="error-content">
                  <h3>Account Not Activated</h3>
                  <p>Please check your email and confirm your registration to continue.</p>
                </div>
              </>
            ) : (
              error
            )}
          </div>
        )}
        
        {showResendConfirmation && (
          <div className="resend-confirmation">
            <div className="resend-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M3 13h6v-2H3V1.846a.5.5 0 0 1 .741-.438l18.462 10.154a.5.5 0 0 1 0 .876L3.741 22.592A.5.5 0 0 1 3 22.154V13z" fill="currentColor"/>
              </svg>
            </div>
            <div className="resend-content">
              <p>Need a new confirmation email?</p>
              <button 
                type="button" 
                onClick={handleResendConfirmation}
                disabled={isResending}
                className="resend-btn"
              >
                {isResending ? 'Sending...' : 'Resend Confirmation Email'}
              </button>
            </div>
          </div>
        )}
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isProcessing}
          >
            {isProcessing ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
          <p>Forgot your password? <Link to="/forgot-password">Reset it here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;