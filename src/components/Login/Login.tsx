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
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="login-background">
        <div className="login-glow login-glow-1"></div>
        <div className="login-glow login-glow-2"></div>
      </div>
      
      {/* Confirmation banners */}
      {confirmationStatus === 'success' && (
        <div className="confirmation-banner success-banner">
          <div className="banner-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071L16.659 7.515l-5.656 5.657-2.829-2.829L6.76 11.757l4.243 4.243z" fill="currentColor"/>
            </svg>
          </div>
          <div className="banner-content">
            <h4>Email Confirmed!</h4>
            <p>Your email has been confirmed successfully. You can now log in.</p>
          </div>
        </div>
      )}
      
      {confirmationStatus === 'failed' && (
        <div className="confirmation-banner error-banner">
          <div className="banner-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
              <path fill="none" d="M0 0h24v24H0z"/>
              <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" fill="currentColor"/>
            </svg>
          </div>
          <div className="banner-content">
            <h4>Confirmation Failed</h4>
            <p>Email confirmation failed. Please try again or contact support.</p>
          </div>
        </div>
      )}

      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M4 22a8 8 0 1 1 16 0v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className={`modern-error ${error.includes('Account not activated') ? 'activation-error' : ''}`}>
            <div className="error-icon">
              {error.includes('Account not activated') ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="none" d="M0 0h24v24H0z"/>
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" fill="currentColor"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="none" d="M0 0h24v24H0z"/>
                  <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" fill="currentColor"/>
                </svg>
              )}
            </div>
            <div className="error-content">
              {error.includes('Account not activated') ? (
                <>
                  <h4>Account Not Activated</h4>
                  <p>Please check your email and confirm your registration to continue.</p>
                </>
              ) : (
                <p>{error}</p>
              )}
            </div>
          </div>
        )}
        
        {/* Resend Confirmation */}
        {showResendConfirmation && (
          <div className="resend-section">
            <div className="resend-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M18.537 19.778L12 14.308l-6.537 5.47-.963-1.156L12 13l7.5 5.622-.963 1.156zM12 10.5L5.5 16.122l-.963-1.156L12 9.692l7.463 5.274-.963 1.156L12 10.5z" fill="currentColor"/>
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
                {isResending ? (
                  <>
                    <span className="loading-spinner"></span>
                    Sending...
                  </>
                ) : (
                  'Resend Confirmation Email'
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Login Form */}
        <form className="modern-login-form" onSubmit={handleSubmit}>
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
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="field-input"
                inputMode="email"
                autoComplete="email"
                required
              />
            </div>
          </div>
          
          <div className="form-field">
            <label htmlFor="password" className="field-label">Password</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                  <path fill="none" d="M0 0h24v24H0z"/>
                  <path d="M18 8h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2V7a6 6 0 1 1 12 0v1zm-2 0V7a4 4 0 1 0-8 0v1h8zm-5 6v4h2v-4h-2z" fill="currentColor"/>
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="field-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="none" d="M0 0h24v24H0z"/>
                    <path d="M17.882 19.297A10.949 10.949 0 0 1 12 21C5.373 21 0 15.627 0 9s5.373-12 12-12c1.904 0 3.704.45 5.297 1.248l-2.335 2.335A6.978 6.978 0 0 0 12 3a6 6 0 1 0 0 12c1.027 0 2-.224 2.882-.618l2.335 2.335zM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="currentColor"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="none" d="M0 0h24v24H0z"/>
                    <path d="M12 3c5.392 0 9.878 3.88 10.819 9-.94 5.12-5.427 9-10.819 9S2.122 17.12 1.181 12C2.122 6.88 6.608 3 12 3zm0 16a9.005 9.005 0 0 0 8.777-7A9.005 9.005 0 0 0 12 5a9.005 9.005 0 0 0-8.777 7A9.005 9.005 0 0 0 12 19zm0-2.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="currentColor"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="form-options">
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            className="login-submit-btn"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        {/* Footer */}
        <div className="login-footer">
          <div className="divider">
            <span>Don't have an account?</span>
          </div>
          <Link to="/register" className="register-link">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;