'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/useAuth';
import { registrationService } from '@/lib/services/registrationService';
import './Register.css';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const loginBtnRef = useRef<HTMLButtonElement | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // Focus on login button after success
  useEffect(() => {
    if (successMessage && loginBtnRef.current) {
      loginBtnRef.current.focus();
    }
  }, [successMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setGeneralError(null);

    try {
      // Frontend validation
      if (formData.password !== formData.confirmPassword) {
        setGeneralError(t('register.validation.passwords_not_match', 'Passwords do not match'));
        return;
      }

      if (formData.password.length < 6) {
        setGeneralError(t('register.validation.password_min_length', 'Password must be at least 6 characters long'));
        return;
      }

      // Call API
      const result = await registrationService.register({
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        setSuccessMessage(
          t('register.success', `Registration successful! We've sent a confirmation email to ${formData.email}. Please check your email and click the verification link.`)
        );
        // Clear form
        setFormData({ email: '', password: '', confirmPassword: '' });
      } else {
        setGeneralError(result.message || t('register.error', 'Registration failed. Please try again.'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError(t('register.error', 'An error occurred during registration. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = useCallback(() => {
    router.push('/login');
  }, [router]);

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className="registration-page">
        <div className="registration-main-container">
          <div className="registration-form-container">
            <div className="btn-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  // Success view
  if (successMessage) {
    return (
      <div className="registration-page">
        <div className="registration-main-container">
          {/* Cassandra section */}
          <div className="registration-mascot-section">
            <img
              src="/cassandra/Register-Cass.png"
              alt="Cassandra - Registration Assistant"
              className="mascot-image-register"
              loading="eager"
            />
          </div>

          {/* Success section */}
          <div className="registration-form-container">
            <div className="form-header">
              <div className="form-icon success">
                <svg viewBox="0 0 24 24" width="32" height="32">
                  <path fill="currentColor" d="M14 14.252v2.09A6 6 0 0 0 6 22l-2-.001a8 8 0 0 1 10-7.748zM12 13c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm6 6v-3.5l5 4.5-5 4.5V19h-3v-2h3z"/>
                </svg>
              </div>
              <h1 className="form-title">{t('register.check_email_title', 'Check Your Email')}</h1>
              <p className="form-subtitle">{t('register.check_email_subtitle', 'We sent you a confirmation link')}</p>
            </div>

            <div className="success-message">
              <div className="success-content">
                <h3>{t('register.success_title', 'Registration Successful!')}</h3>
                <p>{successMessage}</p>
              </div>
              <button
                ref={loginBtnRef}
                className="form-submit-btn success"
                onClick={handleGoToLogin}
                type="button"
              >
                {t('register.go_to_login', 'Go to Login')}
                <svg className="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration form view
  return (
    <div className="registration-page">
      <div className="registration-main-container">
        {/* Cassandra section */}
        <div className="registration-mascot-section">
          <img
            src="/cassandra/Register-Cass.png"
            alt="Cassandra - Registration Assistant"
            className="mascot-image-register"
            loading="eager"
          />
        </div>

        {/* Form section */}
        <div className="registration-form-container">
          <div className="form-header">
            <div className="form-icon">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path fill="currentColor" d="M14 14.252v2.09A6 6 0 0 0 6 22l-2-.001a8 8 0 0 1 10-7.748zM12 13c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm6 6v-3.5l5 4.5-5 4.5V19h-3v-2h3z"/>
              </svg>
            </div>
            <h1 className="form-title">{t('register.title', 'Create Account')}</h1>
            <p className="form-subtitle">{t('register.subtitle', 'Join us and start your journey')}</p>
          </div>

          {/* Error message */}
          {generalError && (
            <div className="form-error">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>{generalError}</span>
            </div>
          )}

          {/* Registration form */}
          <form className="registration-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {t('register.email_label', 'Email Address')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('register.email_placeholder', 'Enter your email')}
                className="form-input"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                {t('register.password_label', 'Password')}
              </label>
              <div className="input-with-toggle">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t('register.password_placeholder', 'Enter password (min. 6 characters)')}
                  className="form-input"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                {t('register.confirm_password_label', 'Confirm Password')}
              </label>
              <div className="input-with-toggle">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder={t('register.confirm_password_placeholder', 'Confirm your password')}
                  className="form-input"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="form-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="btn-spinner"></div>
                  {t('register.loading', 'Registering...')}
                </>
              ) : (
                <>
                  {t('register.submit_button', 'Create Account')}
                  <svg className="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="form-footer">
            <span className="footer-text">{t('register.have_account', 'Already have an account?')}</span>
            <Link href="/login" className="footer-link">
              {t('register.login_link', 'Sign in')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
