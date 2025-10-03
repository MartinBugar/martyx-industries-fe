'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/useAuth';
import styles from './Login.module.css';

type ConfirmationStatus = 'success' | 'failed' | null;

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationStatus, setConfirmationStatus] = useState<ConfirmationStatus>(null);

  // Check for confirmation status in URL params
  useEffect(() => {
    const confirmation = searchParams.get('confirmation') || searchParams.get('status');
    if (confirmation) {
      const status = ['success', 'confirmed', 'true', 'ok'].includes(confirmation.toLowerCase()) 
        ? 'success' 
        : 'failed';
      setConfirmationStatus(status);
      
      // Clean URL after reading status
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

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
    setIsLoading(true);
    setError(null);

    try {
      // Mock login - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock success - redirect to intended page
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    } catch (error: unknown) {
      console.error('Login error:', error);
      setError(t('login.error', 'Invalid email or password. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      // Mock resend confirmation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConfirmationStatus('success');
    } catch (error) {
      console.error('Resend confirmation error:', error);
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

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          {/* Header */}
          <div className={styles.loginHeader}>
            <div className={styles.mascotContainer}>
              <img
                src="/cassandra/Account-Cass.png"
                alt="Cassandra - Login Assistant"
                className={styles.mascotImage}
                loading="eager"
              />
            </div>
            <h1>{t('login.title', 'Welcome Back')}</h1>
            <p>{t('login.subtitle', 'Sign in to your account to continue')}</p>
          </div>

          {/* Confirmation Banner */}
          {confirmationStatus && (
            <div className={`${styles.confirmationBanner} ${confirmationStatus === 'success' ? styles.successBanner : styles.errorBanner}`}>
              <div className={styles.bannerIcon}>
                {confirmationStatus === 'success' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                )}
              </div>
              <div className={styles.bannerContent}>
                <h4>
                  {confirmationStatus === 'success' 
                    ? t('login.confirmation.success.title', 'Email Confirmed!') 
                    : t('login.confirmation.failed.title', 'Confirmation Failed')
                  }
                </h4>
                <p>
                  {confirmationStatus === 'success'
                    ? t('login.confirmation.success.message', 'Your email has been successfully confirmed. You can now sign in.')
                    : t('login.confirmation.failed.message', 'Email confirmation failed. Please try again or contact support.')
                  }
                </p>
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

          {/* Login Form */}
          <form className={styles.loginForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="email">{t('login.email.label', 'Email Address')}</label>
              <div className={styles.inputGroup}>
                <div className={styles.inputIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t('login.email.placeholder', 'Enter your email')}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">{t('login.password.label', 'Password')}</label>
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
                  placeholder={t('login.password.placeholder', 'Enter your password')}
                  required
                  autoComplete="current-password"
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

            <div className={styles.formOptions}>
              <Link href="/reset-password" className={styles.forgotPassword}>
                {t('login.forgot_password', 'Forgot your password?')}
              </Link>
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner}></div>
                  {t('login.signing_in', 'Signing in...')}
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10,17 15,12 10,7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                  {t('login.sign_in', 'Sign In')}
                </>
              )}
            </button>
          </form>

          {/* Resend Confirmation */}
          {confirmationStatus === 'failed' && (
            <div className={styles.resendSection}>
              <div className={styles.resendIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23,4 23,10 17,10"/>
                  <polyline points="1,20 1,14 7,14"/>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                </svg>
              </div>
              <div className={styles.resendContent}>
                <p>{t('login.resend.message', 'Need a new confirmation email?')}</p>
                <button 
                  type="button" 
                  onClick={handleResendConfirmation}
                  className={styles.resendBtn}
                >
                  {t('login.resend.button', 'Resend Email')}
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className={styles.loginFooter}>
            <p>
              {t('login.no_account', "Don't have an account?")}{' '}
              <Link href="/register" className={styles.registerLink}>
                {t('login.sign_up', 'Sign up')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
