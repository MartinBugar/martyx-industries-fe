/**
 * Registration komponent - Optimalizovaná verzia
 * Používa zdieľané komponenty a utility funkcie pre lepšiu údržbu kódu
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registrationService } from '../../services/registrationService';
import './Registration.css';

// Zdieľané komponenty a utility
import {
  AuthContainer,
  AuthHeader,
  FormField,
  ErrorMessage,
  SuccessMessage,
  SubmitButton,
  EmailIcon,
  PasswordIcon,
  ConfirmPasswordIcon
} from '../shared/FormComponents';
import { useAuthForm } from '../../hooks/useAuthForm';

// ===== INTERFACES =====
// (Interfaces sú definované v zdieľaných komponentoch)

// ===== HLAVNÝ KOMPONENT =====

/**
 * Registration komponent s moderným dizajnom a optimalizovaným kódom
 * Poskytuje registračné rozhranie s validáciou a email konfirmáciou
 */
const Registration: React.FC = () => {
  const navigate = useNavigate();
  
  // Lokálny stav pre špecifické registračné funkcie
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  // Ref pre focus management po úspešnej registrácii
  const loginBtnRef = useRef<HTMLButtonElement | null>(null);

  /**
   * Focus management - presun fokusu na login tlačidlo po úspešnej registrácii
   * Zabezpečuje lepšiu accessibility
   */
  useEffect(() => {
    if (successMessage && loginBtnRef.current) {
      loginBtnRef.current.focus();
    }
  }, [successMessage]);

  /**
   * Spracovanie registračnej požiadavky
   * Optimalizované s async/await a proper error handling
   */
  const handleRegistrationSubmit = useCallback(async (formData: { email: string; password: string; confirmPassword?: string }) => {
    setGeneralError(null);
    
    try {
      const success = await registrationService.register(formData.email, formData.password);
      
      if (success) {
        // Úspešná registrácia - zobrazenie potvrdzovacej správy
        setSuccessMessage(
          `Registrácia úspešná! Odoslali sme potvrdzovací email na ${formData.email}. ` +
          'Skontrolujte svoj email a kliknite na potvrdzovací link pre aktiváciu účtu.'
        );
        
        // Vyčistenie formulára po úspešnej registrácii
        resetForm();
      } else {
        setGeneralError('Registrácia zlyhala. Skúste to znovu.');
      }
    } catch (error) {
      // Spracovanie rôznych typov chýb
      const err = error as Error & { code?: string };
      
      if (err.code === 'EMAIL_ALREADY_REGISTERED' || err.message === 'EMAIL_ALREADY_REGISTERED') {
        setGeneralError('Tento email sa už používa. Skúste iný email alebo sa prihláste.');
      } else {
        setGeneralError('Nastala chyba pri registrácii. Skúste to znovu.');
      }
      console.error('Registration error:', error);
    }
  }, []);

  /**
   * Navigácia na login stránku
   */
  const handleGoToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  // Používanie custom hook pre správu formulára
  const {
    data,
    handleInputChange,
    handleSubmit,
    showPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    isProcessing,
    resetForm
  } = useAuthForm({
    formType: 'registration',
    onSubmit: handleRegistrationSubmit,
    enableRealTimeValidation: true
  });

  /**
   * Ikona pre registráciu (user plus)
   */
  const RegistrationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="none" d="M0 0h24v24H0z"/>
      <path d="M14 14.252v2.09A6 6 0 0 0 6 22l-2-.001a8 8 0 0 1 10-7.748zM12 13c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm6 6v-3.5l5 4.5-5 4.5V19h-3v-2h3z" fill="currentColor"/>
    </svg>
  );

  /**
   * Podmienečné renderovanie na základe stavu registrácie
   */
  if (successMessage) {
    return (
      <AuthContainer variant="registration">
        <AuthHeader
          icon={<RegistrationIcon />}
          title="Skontrolujte svoj email"
          subtitle="Odoslali sme vám potvrdzovací link"
        />

        <SuccessMessage
          title="Registrácia úspešná!"
          message={successMessage}
          actionButton={
            <button 
              ref={loginBtnRef}
              className="go-to-login-btn" 
              onClick={handleGoToLogin}
              type="button"
            >
              Prejsť na prihlásenie
            </button>
          }
        />
      </AuthContainer>
    );
  }

  return (
    <AuthContainer variant="registration">
      {/* Header sekcia */}
      <AuthHeader
        icon={<RegistrationIcon />}
        title="Vytvoriť účet"
        subtitle="Pridajte sa k nám a začnite svoju cestu"
      />

      {/* Chybové správy */}
      {generalError && (
        <ErrorMessage error={generalError} />
      )}
      
      {/* Registračný formulár */}
      <form className="modern-registration-form" onSubmit={handleSubmit}>
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
          icon={<EmailIcon />}
        />
        
        <FormField
          label="Heslo"
          id="password"
          name="password"
          value={data.password}
          onChange={handleInputChange}
          placeholder="Zadajte heslo (min. 6 znakov)"
          required
          minLength={6}
          autoComplete="new-password"
          icon={<PasswordIcon />}
          showPasswordToggle
          showPassword={showPassword}
          onTogglePassword={togglePasswordVisibility}
        />
        
        <FormField
          label="Potvrdiť heslo"
          id="confirmPassword"
          name="confirmPassword"
          value={data.confirmPassword || ''}
          onChange={handleInputChange}
          placeholder="Potvrďte vaše heslo"
          required
          autoComplete="new-password"
          icon={<ConfirmPasswordIcon />}
          showPasswordToggle
          showPassword={showConfirmPassword}
          onTogglePassword={toggleConfirmPasswordVisibility}
        />
        
        {/* Submit tlačidlo */}
        <SubmitButton
          isLoading={isProcessing}
          loadingText="Vytváram účet..."
          defaultText="Vytvoriť účet"
          className="registration-submit-btn"
        />
      </form>
      
      {/* Footer */}
      <div className="auth-footer">
        <div className="divider">
          <span>Máte už účet?</span>
        </div>
        <Link to="/login" className="auth-link">
          Prihlásiť sa
        </Link>
      </div>
    </AuthContainer>
  );
};

export default Registration;