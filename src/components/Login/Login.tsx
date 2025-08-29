/**
 * Login komponent - Optimalizovaná verzia
 * Používa zdieľané komponenty a utility funkcie pre lepšiu údržbu kódu
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { registrationService } from '../../services/registrationService';
import type { LoginErrorResponse } from '../../context/authTypes';
import './Login.css';

// Zdieľané komponenty a utility
import {
  AuthContainer,
  AuthHeader,
  FormField,
  ErrorMessage,
  SubmitButton,
  LoadingSpinner
} from '../shared/FormComponents';
import { useAuthForm } from '../../hooks/useAuthForm';

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
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Lokálny stav pre špecifické login funkcie
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  /**
   * Spracovanie login požiadavky
   * Optimalizované s async/await a proper error handling
   */
  const handleLoginSubmit = useCallback(async (formData: { email: string; password: string }) => {
    setGeneralError(null);
    setShowResendConfirmation(false);
    
    try {
      const result: boolean | LoginErrorResponse = await login(formData.email, formData.password);
      
      if (result === true) {
        // Úspešné prihlásenie - presmerovanie na domovskú stránku
        navigate('/');
      } else if (typeof result === 'object' && 'type' in result && result.type === 'email_not_confirmed') {
        // Email nie je potvrdený - zobrazenie možnosti opätovného odoslania
        setGeneralError(result.error);
        setShowResendConfirmation(true);
      } else {
        // Iné chyby prihlásenia
        setGeneralError('Neplatný email alebo heslo');
      }
    } catch (error) {
      setGeneralError('Nastala chyba pri prihlasovaní. Skúste to znovu.');
      console.error('Login error:', error);
    }
  }, [login, navigate]);

  // Používanie custom hook pre správu formulára
  const {
    data,
    handleInputChange,
    handleSubmit,
    showPassword,
    togglePasswordVisibility,
    isProcessing
  } = useAuthForm({
    formType: 'login',
    onSubmit: handleLoginSubmit,
    enableRealTimeValidation: true
  });

  /**
   * Spracovanie opätovného odoslania potvrdzovacieho emailu
   * Optimalizované pre lepší UX s loading stavmi
   */
  const handleResendConfirmation = useCallback(async () => {
    if (!data.email) return;
    
    setIsResending(true);
    try {
      const result = await registrationService.resendConfirmation(data.email);
      
      if (result.success) {
        setGeneralError('Potvrdzovací email bol odoslaný! Skontrolujte svoj email a kliknite na potvrdzovací link.');
        setShowResendConfirmation(false);
      } else {
        setGeneralError(result.message);
      }
    } catch (error) {
      setGeneralError('Nepodarilo sa odoslať potvrdzovací email. Skúste to znovu.');
      console.error('Resend confirmation error:', error);
    } finally {
      setIsResending(false);
    }
  }, [data.email]);

  /**
   * Ikona pre login (user avatar)
   */
  const LoginIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="none" d="M0 0h24v24H0z"/>
      <path d="M4 22a8 8 0 1 1 16 0v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1zm8-9c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6z" fill="currentColor"/>
    </svg>
  );

  return (
    <AuthContainer variant="login">
      {/* Confirmation bannery */}
      {confirmationStatus && (
        <ConfirmationBanner status={confirmationStatus} />
      )}

      {/* Header sekcia */}
      <AuthHeader
        icon={<LoginIcon />}
        title="Vitajte späť"
        subtitle="Prihláste sa do svojho účtu"
      />

      {/* Chybové správy */}
      {generalError && (
        <ErrorMessage 
          error={generalError}
          isActivationError={generalError.includes('Account not activated')}
        />
      )}
      
      {/* Resend confirmation sekcia */}
      {showResendConfirmation && (
        <ResendConfirmation
          onResend={handleResendConfirmation}
          isResending={isResending}
        />
      )}
      
      {/* Login formulár */}
      <form className="modern-login-form" onSubmit={handleSubmit}>
        <FormField
          label="Emailová adresa"
          id="email"
          name="email"
          type="email"
          value={data.email}
          onChange={handleInputChange}
          placeholder="Zadajte váš email"
          required
          autoComplete="email"
          inputMode="email"
          icon=""
        />
        
        <FormField
          label="Heslo"
          id="password"
          name="password"
          value={data.password}
          onChange={handleInputChange}
          placeholder="Zadajte vaše heslo"
          required
          autoComplete="current-password"
          icon=""
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={togglePasswordVisibility}
        />

        {/* Zabudnuté heslo link */}
        <div className="form-options">
          <Link to="/forgot-password" className="forgot-link">
            Zabudli ste heslo?
          </Link>
        </div>
        
        {/* Submit tlačidlo */}
        <SubmitButton
          isLoading={isProcessing}
          loadingText="Prihlasovanie..."
          defaultText="Prihlásiť sa"
          className="login-submit-btn"
        />
      </form>
      
      {/* Footer */}
      <div className="auth-footer">
        <div className="divider">
          <span>Nemáte účet?</span>
        </div>
        <Link to="/register" className="auth-link">
          Vytvoriť účet
        </Link>
      </div>
    </AuthContainer>
  );
};

export default Login;