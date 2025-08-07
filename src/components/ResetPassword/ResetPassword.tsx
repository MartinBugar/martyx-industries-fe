import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import './ResetPassword.css';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: ''
  });
  
  // Extract token from URL on component mount
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [searchParams]);
  
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
    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
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
    
    // Check if token exists
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }
    
    // Process reset password request
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await resetPassword(token, formData.password);
      
      if (result.success) {
        setSuccessMessage(result.message);
        // Clear form data
        setFormData({
          password: '',
          confirmPassword: ''
        });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="reset-password-container">
      <div className="reset-password-form-container">
        <h2>Reset Password</h2>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
            <button 
              className="go-to-login-btn" 
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </div>
        )}
        
        {!successMessage && token && (
          <form className="reset-password-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="reset-password-btn"
              disabled={isProcessing}
            >
              {isProcessing ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
        
        <div className="reset-password-footer">
          {!successMessage && (
            <p>Remember your password? <Link to="/login">Login here</Link></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;