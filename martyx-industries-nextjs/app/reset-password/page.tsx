'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/useAuth';
import styles from './ResetPassword.module.css';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPassword() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [token, setToken] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      setError(t('reset_password.invalid_token', 'Invalid or missing reset token. Please request a new password reset link.'));
    }
  }, [searchParams, t]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/account');
    }
  }, [isAuthenticated, authLoading, router]);

  const validateForm = (data: ResetPasswordFormData): string | null => {
    if (!data.password || !data.confirmPassword) {
      return t('reset_password.validation.required_fields', 'Please fill in all required fields');
    }

    if (data.password.length < 8) {
      return t('reset_password.validation.password_min_length', 'Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      return t('reset_password.validation.password_strength', 'Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    if (data.password !== data.confirmPassword) {
      return t('reset_password.validation.passwords_not_match', 'Passwords do not match');
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      // Frontend validation
      const validationError = validateForm(formData);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Check if token exists
      if (!token) {
        setError(t('reset_password.invalid_token', 'Invalid or missing reset token. Please request a new password reset link.'));
        return;
      }

      // Mock reset password - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock success
      setSuccessMessage(t('reset_password.success', 'Your password has been successfully reset. You can now sign in with your new password.'));
      
      // Clear form
      setFormData({
        password: '',
        confirmPassword: ''
      });
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      setError(t('reset_password.error', 'An error occurred. Please try again.'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>Loading...</div>
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.resetPasswordPage}>
      <div className={styles.resetPasswordContainer}>
        <div className={styles.resetPasswordCard}>
          {/* Header */}
          <div className={styles.resetPasswordHeader}>
            <div className={styles.mascotContainer}>
              <img
                src="/cassandra/Account-Cass.png"
                alt="Cassandra - Password Reset Assistant"
                className={styles.mascotImage}
                loading="eager"
              />
            </div>
            <h1>{t('reset_password.title', 'Reset Your Password')}</h1>
            <p>{t('reset_password.subtitle', 'Enter your new password below')}</p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
              <div>
                <h3>{t('reset_password.success_title', 'Password Reset Successful!')}</h3>
                <p>{successMessage}</p>
                <div className={styles.successActions}>
                  <Link href="/login" className={styles.loginBtn}>
                    {t('reset_password.go_to_login', 'Go to Login')}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={styles.errorMessage}>
              <div className={styles.errorIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              {error}
            </div>
          )}

          {/* Reset Password Form */}
          {!successMessage && token && (
            <form className={styles.resetPasswordForm} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="password">{t('reset_password.new_password.label', 'New Password')}</label>
                <div className={styles.inputGroup}>
                  <div className={styles.inputIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="16" r="1"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t('reset_password.new_password.placeholder', 'Enter your new password')}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">{t('reset_password.confirm_password.label', 'Confirm New Password')}</label>
                <div className={styles.inputGroup}>
                  <div className={styles.inputIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="16" r="1"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder={t('reset_password.confirm_password.placeholder', 'Confirm your new password')}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.passwordRequirements}>
                <h4>{t('reset_password.password_requirements.title', 'Password Requirements:')}</h4>
                <ul>
                  <li className={formData.password.length >= 8 ? styles.valid : ''}>
                    {t('reset_password.password_requirements.length', 'At least 8 characters')}
                  </li>
                  <li className={/(?=.*[a-z])/.test(formData.password) ? styles.valid : ''}>
                    {t('reset_password.password_requirements.lowercase', 'One lowercase letter')}
                  </li>
                  <li className={/(?=.*[A-Z])/.test(formData.password) ? styles.valid : ''}>
                    {t('reset_password.password_requirements.uppercase', 'One uppercase letter')}
                  </li>
                  <li className={/(?=.*\d)/.test(formData.password) ? styles.valid : ''}>
                    {t('reset_password.password_requirements.number', 'One number')}
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className={styles.spinner}></div>
                    {t('reset_password.resetting', 'Resetting Password...')}
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    {t('reset_password.reset_password', 'Reset Password')}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className={styles.resetPasswordFooter}>
            <p>
              {t('reset_password.remember_password', 'Remember your password?')}{' '}
              <Link href="/login" className={styles.loginLink}>
                {t('reset_password.back_to_login', 'Back to Login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
