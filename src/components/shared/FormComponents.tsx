/**
 * Zdieľané komponenty pre formuláre
 * Obsahuje všetky opakujúce sa UI elementy pre login, registráciu a ďalšie formuláre
 */

import React from 'react';
import './FormComponents.css';

// ===== INTERFACES =====
interface IconProps {
  className?: string;
  size?: number;
}

interface FormFieldProps {
  label: string;
  id: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  inputMode?: 'email' | 'text' | 'tel' | 'url';
  icon: React.ReactNode;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

interface ErrorMessageProps {
  error: string;
  isActivationError?: boolean;
}

interface SuccessMessageProps {
  title: string;
  message: string;
  actionButton?: React.ReactNode;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

interface SubmitButtonProps {
  isLoading: boolean;
  loadingText: string;
  defaultText: string;
  disabled?: boolean;
  className?: string;
}

// ===== IKONY =====
/**
 * Ikona pre email pole
 */
export const EmailIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}>
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm17 4.238l-7.928 7.1L4 7.216V19h16V7.238zM4.511 5l7.55 6.662L19.502 5H4.511z" fill="currentColor"/>
  </svg>
);

/**
 * Ikona pre heslo pole
 */
export const PasswordIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}>
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M18 8h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2V7a6 6 0 1 1 12 0v1zm-2 0V7a4 4 0 1 0-8 0v1h8zm-5 6v4h2v-4h-2z" fill="currentColor"/>
  </svg>
);

/**
 * Ikona pre potvrdenie hesla
 */
export const ConfirmPasswordIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}>
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M12 1l9.5 5.5v11L12 23l-9.5-6V6.5L12 1zm0 2.311L4.5 7.65v8.7l7.5 4.65 7.5-4.65V7.65L12 3.311zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="currentColor"/>
  </svg>
);

/**
 * Ikona pre zobrazenie hesla
 */
export const EyeIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}>
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M12 3c5.392 0 9.878 3.88 10.819 9-.94 5.12-5.427 9-10.819 9S2.122 17.12 1.181 12C2.122 6.88 6.608 3 12 3zm0 16a9.005 9.005 0 0 0 8.777-7A9.005 9.005 0 0 0 12 5a9.005 9.005 0 0 0-8.777 7A9.005 9.005 0 0 0 12 19zm0-2.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="currentColor"/>
  </svg>
);

/**
 * Ikona pre skrytie hesla
 */
export const EyeOffIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}>
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M17.882 19.297A10.949 10.949 0 0 1 12 21C5.373 21 0 15.627 0 9s5.373-12 12-12c1.904 0 3.704.45 5.297 1.248l-2.335 2.335A6.978 6.978 0 0 0 12 3a6 6 0 1 0 0 12c1.027 0 2-.224 2.882-.618l2.335 2.335zM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="currentColor"/>
  </svg>
);

/**
 * Ikona pre chyby
 */
export const ErrorIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}>
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" fill="currentColor"/>
  </svg>
);

/**
 * Ikona pre úspech
 */
export const SuccessIcon: React.FC<IconProps> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}>
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-.997-6l7.07-7.071L16.659 7.515l-5.656 5.657-2.829-2.829L6.76 11.757l4.243 4.243z" fill="currentColor"/>
  </svg>
);

// ===== KOMPONENTY =====

/**
 * Loading spinner komponent pre všetky loading stavy
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => (
  <span className={`loading-spinner loading-spinner--${size}`} aria-label="Loading" />
);

/**
 * Univerzálne pole pre formuláre s podporou ikon a password toggle
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete,
  minLength,
  inputMode,
  icon,
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword
}) => {
  return (
    <div className="form-field">
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="input-wrapper">
        <div className="input-icon">
          {icon}
        </div>
        <input
          type={showPasswordToggle ? (showPassword ? 'text' : 'password') : type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`field-input ${showPasswordToggle ? 'field-input--with-toggle' : ''}`}
          inputMode={inputMode}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
        />
        {showPasswordToggle && onTogglePassword && (
          <button
            type="button"
            className="password-toggle"
            onClick={onTogglePassword}
            aria-label={showPassword ? 'Skryť heslo' : 'Zobraziť heslo'}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Komponent pre zobrazenie chybových správ
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, isActivationError = false }) => (
  <div className={`modern-error ${isActivationError ? 'activation-error' : ''}`}>
    <div className="error-icon">
      <ErrorIcon />
    </div>
    <div className="error-content">
      {isActivationError ? (
        <>
          <h4>Účet nie je aktivovaný</h4>
          <p>Skontrolujte svoj email a potvrďte registráciu pre pokračovanie.</p>
        </>
      ) : (
        <p>{error}</p>
      )}
    </div>
  </div>
);

/**
 * Komponent pre zobrazenie úspešných správ
 */
export const SuccessMessage: React.FC<SuccessMessageProps> = ({ title, message, actionButton }) => (
  <div className="modern-success">
    <div className="success-icon">
      <SuccessIcon />
    </div>
    <div className="success-content">
      <h4>{title}</h4>
      <p>{message}</p>
      {actionButton}
    </div>
  </div>
);

/**
 * Univerzálne submit tlačidlo s loading stavom
 */
export const SubmitButton: React.FC<SubmitButtonProps> = ({
  isLoading,
  loadingText,
  defaultText,
  disabled = false,
  className = 'submit-btn'
}) => (
  <button 
    type="submit" 
    className={className}
    disabled={isLoading || disabled}
  >
    {isLoading ? (
      <>
        <LoadingSpinner size="sm" />
        {loadingText}
      </>
    ) : (
      defaultText
    )}
  </button>
);

/**
 * Animované pozadie s glow efektmi
 */
export const AnimatedBackground: React.FC<{ variant?: 'login' | 'registration' | 'forgot' }> = ({ 
  variant = 'login' 
}) => (
  <div className={`animated-background animated-background--${variant}`}>
    <div className="glow glow-1"></div>
    <div className="glow glow-2"></div>
  </div>
);

/**
 * Kontajner pre Auth stránky (login, registrácia, forgot password)
 */
export const AuthContainer: React.FC<{ 
  children: React.ReactNode;
  variant?: 'login' | 'registration' | 'forgot';
}> = ({ children, variant = 'login' }) => (
  <div className={`auth-container auth-container--${variant}`}>
    <AnimatedBackground variant={variant} />
    <div className="auth-card">
      {children}
    </div>
  </div>
);

/**
 * Header pre Auth stránky
 */
export const AuthHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}> = ({ icon, title, subtitle }) => (
  <div className="auth-header">
    <div className="auth-logo">
      <div className="logo-icon">
        {icon}
      </div>
    </div>
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </div>
);

/**
 * Footer pre Auth stránky s dividerom a linkom
 * POZNÁMKA: Tento komponent nie je už používaný - používame priamo Link komponenty v súboroch
 */
