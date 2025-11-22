/**
 * ForgotPassword komponent - Refactored with react-hook-form + zod
 * Používa zdieľané komponenty a utility funkcie pre lepšiu údržbu kódu
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/useAuth';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../../schemas/formSchemas';
import './ForgotPassword.css';

// Zdieľané komponenty a utility
import {
import { logInfo, logWarn, logError } from '../../services/logger';
  AuthContainer,
  AuthHeader,
  ErrorMessage,
  SuccessMessage,
  SubmitButton,
  EmailIcon
} from '../shared/FormComponents';

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

  // React Hook Form setup with zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      email: ''
    }
  });

  /**
   * Spracovanie požiadavky na obnovenie hesla
   * Optimalizované s async/await a proper error handling
   */
  const handleForgotPasswordSubmit = useCallback(async (formData: ForgotPasswordFormData) => {
    setGeneralError(null);

    try {
      const result = await forgotPassword(formData.email);

      if (result.success) {
        // Úspešné odoslanie - zobrazenie potvrdzovacej správy
        setSuccessMessage(result.message ||
          'Email s pokynmi na obnovenie hesla bol odoslaný. Skontrolujte svoj email.'
        );

        // Vyčistenie formulára po úspešnom odoslaní
        reset();
      } else {
        setGeneralError(result.message || 'Nepodarilo sa odoslať email. Skúste to znovu.');
      }
    } catch (error) {
      setGeneralError('Nastala chyba. Skúste to znovu.');
      logError('Forgot password error:', error);
    }
  }, [forgotPassword, reset]);

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
      <form className="modern-forgot-form" onSubmit={handleSubmit(handleForgotPasswordSubmit)}>
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            <EmailIcon />
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

        {/* Submit tlačidlo */}
        <SubmitButton
          isLoading={isSubmitting}
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