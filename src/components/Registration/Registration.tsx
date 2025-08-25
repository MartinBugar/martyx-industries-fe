import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registrationService } from '../../services/registrationService';
import './Registration.css';

interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const loginBtnRef = useRef<HTMLButtonElement | null>(null);
  
  useEffect(() => {
    if (successMessage && loginBtnRef.current) {
      loginBtnRef.current.focus();
    }
  }, [successMessage]);
  
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
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Password validation
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    // Password confirmation validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Process registration
    setIsProcessing(true);
    setError(null);
    
    try {
      const success = await registrationService.register(formData.email, formData.password);
      
      if (success) {
        // Show email confirmation message instead of immediate success
        setSuccessMessage(`Registration successful! We've sent a confirmation email to ${formData.email}. Please check your email and click the confirmation link to activate your account before logging in.`);
        // Clear form data
        setFormData({
          email: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === 'EMAIL_ALREADY_REGISTERED' || e.message === 'EMAIL_ALREADY_REGISTERED') {
        setError(e.message || 'Email is already in use');
      } else {
        setError('An error occurred during registration. Please try again.');
        console.error('Registration error:', err);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="registration-container">
      <div className="registration-background">
        <div className="registration-glow registration-glow-1"></div>
        <div className="registration-glow registration-glow-2"></div>
      </div>
      
      <div className="registration-card">
        {/* Header */}
        <div className="registration-header">
          <div className="registration-logo">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M14 14.252v2.09A6 6 0 0 0 6 22l-2-.001a8 8 0 0 1 10-7.748zM12 13c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm6 6v-3.5l5 4.5-5 4.5V19h-3v-2h3z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <h1>{successMessage ? 'Check Your Email' : 'Create Account'}</h1>
          <p>{successMessage ? 'We\'ve sent you a confirmation link' : 'Join us and start your journey today'}</p>
        </div>

        {/* Error Messages */}
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
        
        {/* Success Message */}
        {successMessage && (
          <div className="modern-success">
            <div className="success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071L16.659 7.515l-5.656 5.657-2.829-2.829L6.76 11.757l4.243 4.243z" fill="currentColor"/>
              </svg>
            </div>
            <div className="success-content">
              <h4>Registration Successful!</h4>
              <p>{successMessage}</p>
              <button 
                ref={loginBtnRef}
                className="go-to-login-btn" 
                onClick={() => navigate('/login')}
              >
                Go to Login
              </button>
            </div>
          </div>
        )}
        
        {/* Registration Form */}
        {!successMessage && (
          <form className="modern-registration-form" onSubmit={handleSubmit}>
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
                  placeholder="Enter your password (min. 6 characters)"
                  className="field-input"
                  autoComplete="new-password"
                  required
                  minLength={6}
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
            
            <div className="form-field">
              <label htmlFor="confirmPassword" className="field-label">Confirm Password</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                    <path fill="none" d="M0 0h24v24H0z"/>
                    <path d="M12 1l9.5 5.5v11L12 23l-9.5-6V6.5L12 1zm0 2.311L4.5 7.65v8.7l7.5 4.65 7.5-4.65V7.65L12 3.311zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor"/>
                  </svg>
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="field-input"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
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
            
            <button 
              type="submit" 
              className="registration-submit-btn"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="loading-spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}
        
        {/* Footer */}
        <div className="registration-footer">
          {!successMessage && (
            <>
              <div className="divider">
                <span>Already have an account?</span>
              </div>
              <Link to="/login" className="login-link">
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Registration;