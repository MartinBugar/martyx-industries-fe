import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/useAuth';
import { resetPasswordSchema, type ResetPasswordFormData } from '../../schemas/formSchemas';
import './ResetPassword.css';
import { logInfo, logWarn, logError } from '../../services/logger';

const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // React Hook Form setup with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
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

  // Handle form submission
  const handleResetPasswordSubmit = useCallback(async (formData: ResetPasswordFormData) => {
    // Check if token exists
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    setError(null);

    try {
      const result = await resetPassword(token, formData.password);

      if (result.success) {
        setSuccessMessage(result.message);
        reset();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      logError('Reset password error:', err);
    }
  }, [token, resetPassword, reset]);
  
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
          <form className="reset-password-form" onSubmit={handleSubmit(handleResetPasswordSubmit)}>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter new password (min. 6 characters)"
                className={`form-input ${errors.password ? 'error' : ''}`}
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <span className="field-error">{errors.password.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm your password"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword.message}</span>
              )}
            </div>

            <button
              type="submit"
              className="reset-password-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
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