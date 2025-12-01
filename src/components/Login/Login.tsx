/**
 * Login komponent - Refactored with react-hook-form + zod
 * Používa zdieľané komponenty a utility funkcie pre lepšiu údržbu kódu
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/useAuth';
import { registrationService } from '../../services/registrationService';
import type { LoginErrorResponse } from '../../context/authTypes';
import { loginSchema, type LoginFormData } from '../../schemas/formSchemas';
import { logError } from '../../services/logger';
import './Login.css';

// Zdieľané komponenty a utility
import {
  LoadingSpinner,
  EmailIcon,
  PasswordIcon,
  EyeIcon,
  EyeOffIcon,
  ErrorIcon,
} from '../shared/FormComponents';

// ===== INTERFACES =====
type ConfirmationStatus = 'success' | 'failed';

interface LoginProps {
  confirmationStatus?: ConfirmationStatus | null;
}

interface ConfirmationBannerProps {
  status: ConfirmationStatus;
}

interface ResendConfirmationProps {
  onResend: () => Promise<void>;
  isResending: boolean;
}

// ===== POMOCNÉ KOMPONENTY =====

/**
 * Banner pre zobrazenie stavu email konfirmácie
 */
const ConfirmationBanner: React.FC<ConfirmationBannerProps> = ({ status }) => {
  const isSuccess = status === 'success';
  
  return (
    <div className={`confirmation-banner ${isSuccess ? 'success-banner' : 'error-banner'}`}>
      <div className="banner-icon">
        {isSuccess ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071L16.659 7.515l-5.656 5.657-2.829-2.829L6.76 11.757l4.243 4.243z" fill="currentColor"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" fill="currentColor"/>
          </svg>
        )}
      </div>
      <div className="banner-content">
        <h4>{isSuccess ? 'Email potvrdený!' : 'Potvrdenie zlyhalo'}</h4>
        <p>
          {isSuccess 
            ? 'Váš email bol úspešne potvrdený. Teraz sa môžete prihlásiť.' 
            : 'Potvrdenie emailu zlyhalo. Skúste to znovu alebo kontaktujte podporu.'
          }
        </p>
      </div>
    </div>
  );
};

/**
 * Banner pre zobrazenie informácie o zablokovanom účte
 */
interface LockoutBannerProps {
  remainingSeconds: number;
}

interface LockoutBannerPropsExtended extends LockoutBannerProps {
  onUnlocked?: () => void;
}

const LockoutBanner: React.FC<LockoutBannerPropsExtended> = ({ remainingSeconds, onUnlocked }) => {
  const { t } = useTranslation('auth');
  const [timeLeft, setTimeLeft] = useState(remainingSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onUnlocked?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onUnlocked?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onUnlocked]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return t('login.lockout.canRetry', 'Môžete skúsiť znova');
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes} min ${secs} sek`;
    }
    return `${secs} sek`;
  };

  // Don't render if unlocked
  if (timeLeft <= 0) return null;

  return (
    <div className="lockout-banner">
      <div className="lockout-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M12 1C8.676 1 6 3.676 6 7v2H4v14h16V9h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>
        </svg>
      </div>
      <div className="lockout-content">
        <h4>{t('login.lockout.title', 'Účet dočasne zablokovaný')}</h4>
        <p>
          {t('login.lockout.message', 'Váš účet bol zablokovaný kvôli príliš veľa neúspešným pokusom o prihlásenie.')}
        </p>
        <div className="lockout-timer">
          <span className="timer-label">{t('login.lockout.unlockIn', 'Odomknutie za:')}</span>
          <span className="timer-value">{formatTime(timeLeft)}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Sekcia pre opätovné odoslanie potvrdzovacieho emailu
 */
const ResendConfirmation: React.FC<ResendConfirmationProps> = ({
  onResend,
  isResending
}) => (
  <div className="resend-section">
    <div className="resend-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
        <path fill="none" d="M0 0h24v24H0z"/>
        <path d="M18.537 19.778L12 14.308l-6.537 5.47-.963-1.156L12 13l7.5 5.622-.963 1.156zM12 10.5L5.5 16.122l-.963-1.156L12 9.692l7.463 5.274-.963 1.156L12 10.5z" fill="currentColor"/>
      </svg>
    </div>
    <div className="resend-content">
      <p>Potrebujete nový potvrdzovací email?</p>
      <button 
        type="button" 
        onClick={onResend}
        disabled={isResending}
        className="resend-btn"
      >
        {isResending ? (
          <>
            <LoadingSpinner size="sm" />
            Odosielam...
          </>
        ) : (
          'Odoslať potvrdzovací email'
        )}
      </button>
    </div>
  </div>
);

// ===== HLAVNÝ KOMPONENT =====

/**
 * Login komponent s moderným dizajnom a optimalizovaným kódom
 * Poskytuje prihlasovacie rozhranie s podporou email konfirmácie
 */
const Login: React.FC<LoginProps> = ({ confirmationStatus = null }) => {
  const { t } = useTranslation('auth');
  const { login } = useAuth();
  const navigate = useNavigate();

  // Lokálny stav pre špecifické login funkcie
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{ remainingSeconds: number } | null>(null);

  // Restore lockout info from sessionStorage on mount (survives page refresh)
  useEffect(() => {
    const storedLockout = sessionStorage.getItem('loginLockout');
    if (storedLockout) {
      try {
        const { expiresAt } = JSON.parse(storedLockout);
        const remainingSeconds = Math.floor((expiresAt - Date.now()) / 1000);
        if (remainingSeconds > 0) {
          setLockoutInfo({ remainingSeconds });
        } else {
          // Lockout expired, remove from storage
          sessionStorage.removeItem('loginLockout');
        }
      } catch {
        sessionStorage.removeItem('loginLockout');
      }
    }
  }, []);

  // Callback when lockout expires
  const handleLockoutExpired = useCallback(() => {
    setLockoutInfo(null);
    sessionStorage.removeItem('loginLockout');
  }, []);

  // React Hook Form setup with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur', // Validate on blur for better UX
    defaultValues: {
      email: '',
      password: ''
    }
  });

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  /**
   * Spracovanie login požiadavky
   * Optimalizované s async/await a proper error handling
   */
  const handleLoginSubmit = useCallback(async (formData: LoginFormData) => {
    setGeneralError(null);
    setShowResendConfirmation(false);
    setLockoutInfo(null);

    try {
      const result: boolean | LoginErrorResponse = await login(formData.email, formData.password);

      if (result === true) {
        // Úspešné prihlásenie - presmerovanie na domovskú stránku
        navigate('/');
      } else if (typeof result === 'object' && 'type' in result) {
        if (result.type === 'account_locked' && result.remainingSeconds) {
          // Účet je zablokovaný - zobrazenie odpočtu
          setLockoutInfo({ remainingSeconds: result.remainingSeconds });
          setGeneralError(null); // Clear general error, lockout banner will show
          // Store lockout info in sessionStorage to survive page refresh
          sessionStorage.setItem('loginLockout', JSON.stringify({
            expiresAt: Date.now() + (result.remainingSeconds * 1000)
          }));
        } else if (result.type === 'email_not_confirmed') {
          // Email nie je potvrdený - zobrazenie možnosti opätovného odoslania
          setGeneralError(result.error);
          setShowResendConfirmation(true);
        } else {
          // Iné chyby prihlásenia
          setGeneralError(result.error || 'Neplatný email alebo heslo');
        }
      } else {
        // Iné chyby prihlásenia
        setGeneralError('Neplatný email alebo heslo');
      }
    } catch (error) {
      setGeneralError('Nastala chyba pri prihlasovaní. Skúste to znovu.');
      logError('Login error:', error);
    }
  }, [login, navigate]);

  /**
   * Spracovanie opätovného odoslania potvrdzovacieho emailu
   * Optimalizované pre lepší UX s loading stavmi
   */
  const handleResendConfirmation = useCallback(async () => {
    const email = getValues('email');
    if (!email) return;

    setIsResending(true);
    try {
      const result = await registrationService.resendConfirmation(email);

      if (result.success) {
        setGeneralError('Potvrdzovací email bol odoslaný! Skontrolujte svoj email a kliknite na potvrdzovací link.');
        setShowResendConfirmation(false);
      } else {
        setGeneralError(result.message);
      }
    } catch (error) {
      setGeneralError('Nepodarilo sa odoslať potvrdzovací email. Skúste to znovu.');
      logError('Resend confirmation error:', error);
    } finally {
      setIsResending(false);
    }
  }, [getValues]);

  return (
    <div className="login-page">
      <div className="login-main-container">
        {/* Cassandra sekcia */}
        <div className="login-mascot-section">
          <img 
            src="/cassandra/Register-Cass.png" 
            alt="Cassandra - váš sprievodca prihlásením"
            className="mascot-image-login"
            loading="eager"
            decoding="sync"
          />
        </div>

        {/* Formulár sekcia */}
        <div className="login-form-container">
          {/* Confirmation bannery */}
          {confirmationStatus && (
            <ConfirmationBanner status={confirmationStatus} />
          )}

          <div className="form-header">
            <h1 className="form-title">{t('login.title')}</h1>
          </div>

          {/* Lockout banner - zobrazí sa ak je účet zablokovaný */}
          {lockoutInfo && (
            <LockoutBanner
              remainingSeconds={lockoutInfo.remainingSeconds}
              onUnlocked={handleLockoutExpired}
            />
          )}

          {/* Chybové správy */}
          {generalError && !lockoutInfo && (
            <div className="form-error">
              <ErrorIcon />
              <span>{generalError}</span>
            </div>
          )}

          {/* Resend confirmation sekcia */}
          {showResendConfirmation && (
            <ResendConfirmation
              onResend={handleResendConfirmation}
              isResending={isResending}
            />
          )}
          
          {/* Login formulár */}
          <form className="login-form" onSubmit={handleSubmit(handleLoginSubmit)}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <EmailIcon size={18} />
                Emailová adresa
              </label>
              <input
                type="email"
                id="email"
                placeholder="Zadajte váš email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <span className="field-error">{errors.email.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <PasswordIcon size={18} />
                {t('login.password_label')}
              </label>
              <div className="input-with-toggle">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Zadajte vaše heslo"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? 'Skryť heslo' : 'Zobraziť heslo'}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="field-error">{errors.password.message}</span>
              )}
            </div>

            {/* Zabudnuté heslo link */}
            <div className="form-options">
              <Link to="/forgot-password" className="forgot-link">
                Zabudli ste heslo?
              </Link>
            </div>

            {/* Submit tlačidlo */}
            <button
              type="submit"
              className="form-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="btn-spinner"></div>
                  {t('login.loading')}
                </>
              ) : (
                <>
                  {t('login.submit_button')}
                  <svg className="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </button>
          </form>
          
          {/* Footer */}
          <div className="form-footer">
            <span className="footer-text">{t('login.no_account')}</span>
            <Link to="/register" className="footer-link">
              {t('login.register_link')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;