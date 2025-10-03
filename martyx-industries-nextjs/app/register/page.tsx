'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/useAuth';
import styles from './Register.module.css';

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
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  const validateForm = (data: RegisterFormData): string[] => {
    const validationErrors: string[] = [];

    // Email validation
    if (!data.email.trim()) {
      validationErrors.push(t('register.validation.email_required', 'Email is required'));
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      validationErrors.push(t('register.validation.email_invalid', 'Please enter a valid email address'));
    }

    // Password validation
    if (!data.password) {
      validationErrors.push(t('register.validation.password_required', 'Password is required'));
    } else if (data.password.length < 8) {
      validationErrors.push(t('register.validation.password_min_length', 'Password must be at least 8 characters long'));
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password)) {
      validationErrors.push(t('register.validation.password_strength', 'Password must contain at least one uppercase letter, one lowercase letter, and one number'));
    }

    // Confirm password validation
    if (!data.confirmPassword) {
      validationErrors.push(t('register.validation.confirm_password_required', 'Please confirm your password'));
    } else if (data.password !== data.confirmPassword) {
      validationErrors.push(t('register.validation.passwords_not_match', 'Passwords do not match'));
    }

    return validationErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (errors.length > 0) setErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors([]);
    setSuccessMessage(null);

    try {
      // Frontend validation
      const validationErrors = validateForm(formData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Mock registration - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock success
      setSuccessMessage(
        t('register.success', 'Registration successful! Please check your email for a confirmation link.')
      );
      
      // Clear form
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error: unknown) {
      console.error('Registration error:', error);
      setErrors([t('register.error', 'Registration failed. Please try again.')]);
    } finally {
      setIsLoading(false);
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
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        <div className={styles.registerCard}>
          {/* Header */}
          <div className={styles.registerHeader}>
            <div className={styles.mascotContainer}>
              <img
                src="/cassandra/Register-Cass.png"
                alt="Cassandra - Registration Assistant"
                className={styles.mascotImage}
                loading="eager"
              />
            </div>
            <h1>{t('register.title', 'Create Account')}</h1>
            <p>{t('register.subtitle', 'Join our community of RC enthusiasts')}</p>
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
                <h3>{t('register.success_title', 'Registration Successful!')}</h3>
                <p>{successMessage}</p>
                <div className={styles.successActions}>
                  <Link href="/login" className={styles.loginBtn}>
                    {t('register.go_to_login', 'Go to Login')}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className={styles.errorMessages}>
              {errors.map((error, index) => (
                <div key={index} className={styles.errorItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {error}
                </div>
              ))}
            </div>
          )}

          {/* Registration Form */}
          {!successMessage && (
            <form className={styles.registerForm} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="email">{t('register.email.label', 'Email Address')}</label>
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
                    placeholder={t('register.email.placeholder', 'Enter your email')}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">{t('register.password.label', 'Password')}</label>
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
                    placeholder={t('register.password.placeholder', 'Create a strong password')}
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
                <label htmlFor="confirmPassword">{t('register.confirm_password.label', 'Confirm Password')}</label>
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
                    placeholder={t('register.confirm_password.placeholder', 'Confirm your password')}
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
                <h4>{t('register.password_requirements.title', 'Password Requirements:')}</h4>
                <ul>
                  <li className={formData.password.length >= 8 ? styles.valid : ''}>
                    {t('register.password_requirements.length', 'At least 8 characters')}
                  </li>
                  <li className={/(?=.*[a-z])/.test(formData.password) ? styles.valid : ''}>
                    {t('register.password_requirements.lowercase', 'One lowercase letter')}
                  </li>
                  <li className={/(?=.*[A-Z])/.test(formData.password) ? styles.valid : ''}>
                    {t('register.password_requirements.uppercase', 'One uppercase letter')}
                  </li>
                  <li className={/(?=.*\d)/.test(formData.password) ? styles.valid : ''}>
                    {t('register.password_requirements.number', 'One number')}
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className={styles.spinner}></div>
                    {t('register.creating_account', 'Creating Account...')}
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <line x1="20" y1="8" x2="20" y2="14"/>
                      <line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                    {t('register.create_account', 'Create Account')}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className={styles.registerFooter}>
            <p>
              {t('register.have_account', 'Already have an account?')}{' '}
              <Link href="/login" className={styles.loginLink}>
                {t('register.sign_in', 'Sign in')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
