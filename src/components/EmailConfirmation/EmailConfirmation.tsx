import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { registrationService } from '../../services/registrationService';
import './EmailConfirmation.css';

const EmailConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid confirmation link. Please check your email for the correct link.');
        return;
      }

      try {
        const result = await registrationService.confirmEmail(token);
        
        if (result.success) {
          setStatus('success');
          setMessage(result.message);
        } else {
          setStatus('error');
          setMessage(result.message);
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again later.');
        console.error('Email confirmation error:', error);
      }
    };

    confirmEmail();
  }, [searchParams]);

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      const result = await registrationService.resendConfirmation(email);
      
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert('Failed to resend confirmation email. Please try again.');
      console.error('Resend confirmation error:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="email-confirmation-container">
      <div className="email-confirmation-content">
        <h2>Email Confirmation</h2>
        
        {status === 'loading' && (
          <div className="loading-message">
            <p>Confirming your email address...</p>
            <div className="loading-spinner"></div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <p>{message}</p>
            <p>Your account has been activated successfully!</p>
            <Link to="/login" className="login-btn">
              Go to Login
            </Link>
          </div>
        )}
        
        {status === 'error' && (
          <div className="error-message">
            <div className="error-icon">✗</div>
            <p>{message}</p>
            
            <div className="resend-section">
              <h3>Need a new confirmation email?</h3>
              <p>Enter your email address to receive a new confirmation link:</p>
              
              <div className="resend-form">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="email-input"
                />
                <button
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  className="resend-btn"
                >
                  {isResending ? 'Sending...' : 'Resend Confirmation'}
                </button>
              </div>
            </div>
            
            <div className="help-links">
              <Link to="/register" className="register-link">
                Register Again
              </Link>
              <Link to="/login" className="login-link">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmation;