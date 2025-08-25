/**
 * ForgotPassword komponent - Optimalizovaná verzia
 * Používa zdieľané komponenty a utility funkcie pre lepšiu údržbu kódu
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import './ForgotPassword.css';

// Zdieľané komponenty a utility
import {
  AuthContainer,
  AuthHeader,
  FormField,
  ErrorMessage,
  SuccessMessage,
  SubmitButton,
  EmailIcon
} from '../shared/FormComponents';
import { useAuthForm } from '../../hooks/useAuthForm';

// ===== HLAVNÝ KOMPONENT =====

/**
 * ForgotPassword komponent s moderným dizajnom a optimalizovaným kódom
 * Poskytuje rozhranie pre obnovenie hesla cez email
 */
const ForgotPassword: React.FC = () => {
  const { forgotPassword } = useAuth();
  
  // Lokálny stav pre špecifické forgot password funkcie
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  /**
   * Spracovanie požiadavky na obnovenie hesla
   * Optimalizované s async/await a proper error handling
   */
  const handleForgotPasswordSubmit = useCallback(async (formData: { email: string }) => {
    setGeneralError(null);
    
    try {
      const result = await forgotPassword(formData.email);
      
      if (result.success) {
        // Úspešné odoslanie - zobrazenie potvrdzovacej správy
        setSuccessMessage(result.message || 
          'Email s pokynmi na obnovenie hesla bol odoslaný. Skontrolujte svoj email.'
        );
        
        // Vyčistenie formulára po úspešnom odoslaní
        resetForm();
      } else {
        setGeneralError(result.message || 'Nepodarilo sa odoslať email. Skúste to znovu.');
      }
    } catch (error) {
      setGeneralError('Nastala chyba. Skúste to znovu.');
      console.error('Forgot password error:', error);
    }
  }, [forgotPassword]);

  // Používanie custom hook pre správu formulára
  const {
    data,
    handleInputChange,
    handleSubmit,
    isProcessing,
    resetForm
  } = useAuthForm({
    formType: 'forgot-password',
    onSubmit: handleForgotPasswordSubmit,
    enableRealTimeValidation: true
  });

  /**
   * Ikona pre reset hesla (zámok)
   */
  const ResetPasswordIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="none" d="M0 0h24v24H0z"/>
      <path d="M18 8h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2V7a6 6 0 1 1 12 0v1zm-2 0V7a4 4 0 1 0-8 0v1h8zm-5 6v4h2v-4h-2z" fill="currentColor"/>
    </svg>
  );

  /**
   * Podmienečné renderovanie na základe stavu požiadavky
   */
  if (successMessage) {
    return (
      <AuthContainer variant="forgot">
        <AuthHeader
          icon={<ResetPasswordIcon />}
          title="Email odoslaný!"
          subtitle="Skontrolujte svoju emailovú schránku"
        />

        <SuccessMessage
          title="Pokyny odoslané"
          message={successMessage}
          actionButton={
            <Link to="/login" className="go-to-login-btn">
              Späť na prihlásenie
            </Link>
          }
        />
      </AuthContainer>
    );
  }

  return (
    <AuthContainer variant="forgot">
      {/* Header sekcia */}
      <AuthHeader
        icon={<ResetPasswordIcon />}
        title="Obnoviť heslo"
        subtitle="Zadajte váš email a pošleme vám pokyny na obnovenie hesla"
      />

      {/* Chybové správy */}
      {generalError && (
        <ErrorMessage error={generalError} />
      )}
      
      {/* Forgot password formulár */}
      <form className="modern-forgot-form" onSubmit={handleSubmit}>
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
        
        {/* Submit tlačidlo */}
        <SubmitButton
          isLoading={isProcessing}
          loadingText="Odosielam..."
          defaultText="Odoslať pokyny"
          className="forgot-submit-btn"
        />
      </form>
      
      {/* Footer */}
      <div className="auth-footer">
        <div className="divider">
          <span>Spomenuli ste si na heslo?</span>
        </div>
        <Link to="/login" className="auth-link">
          Späť na prihlásenie
        </Link>
      </div>
    </AuthContainer>
  );
};

export default ForgotPassword;