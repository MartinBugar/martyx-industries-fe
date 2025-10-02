/**
 * Registration komponent - Optimalizovaná verzia
 * Používa zdieľané komponenty a utility funkcie pre lepšiu údržbu kódu
 */

import React, {useState, useCallback, useEffect, useRef} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import {registrationService} from '../../services/registrationService';
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
    ConfirmPasswordIcon,
    EyeIcon,
    EyeOffIcon,
    ErrorIcon,
} from '../shared/FormComponents';
import {useAuthForm} from '../../hooks/useAuthForm';

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
    const handleRegistrationSubmit = useCallback(async (formData: {
        email: string;
        password: string;
        confirmPassword?: string
    }) => {
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
            <path
                d="M14 14.252v2.09A6 6 0 0 0 6 22l-2-.001a8 8 0 0 1 10-7.748zM12 13c-3.315 0-6-2.685-6-6s2.685-6 6-6 6 2.685 6 6-2.685 6-6 6zm0-2c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm6 6v-3.5l5 4.5-5 4.5V19h-3v-2h3z"
                fill="currentColor"/>
        </svg>
    );

    /**
     * Podmienečné renderovanie na základe stavu registrácie
     */
    if (successMessage) {
        return (
            <div className="registration-page">
                <div className="registration-main-container">
                    {/* Cassandra sekcia */}
                    <div className="registration-mascot-section">
                        <img 
                            src="/cassandra/Register-Cass.png" 
                            alt="Cassandra - váš sprievodca registráciou"
                            className="mascot-image-register"
                            loading="eager"
                            decoding="sync"
                        />
                    </div>

                    {/* Success sekcia */}
                    <div className="registration-form-container">
                        <div className="form-header">
                            <div className="form-icon success">
                                <RegistrationIcon />
                            </div>
                            <h1 className="form-title">Skontrolujte svoj email</h1>
                            <p className="form-subtitle">Odoslali sme vám potvrdzovací link</p>
                        </div>

                        <div className="success-message">
                            <div className="success-content">
                                <h3>Registrácia úspešná!</h3>
                                <p>{successMessage}</p>
                            </div>
                            <button
                                ref={loginBtnRef}
                                className="form-submit-btn success"
                                onClick={handleGoToLogin}
                                type="button"
                            >
                                Prejsť na prihlásenie
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

    return (
        <div className="registration-page">
            <div className="registration-main-container">
                {/* Cassandra sekcia */}
                <div className="registration-mascot-section">
                    <img 
                        src="/cassandra/Register-Cass.png" 
                        alt="Cassandra - váš sprievodca registráciou"
                        className="mascot-image-register"
                        loading="eager"
                        decoding="sync"
                    />
                </div>

                {/* Nový formulár sekcia */}
                <div className="registration-form-container">
                    <div className="form-header">
                        <div className="form-icon">
                            <RegistrationIcon />
                        </div>
                        <h1 className="form-title">Vytvoriť účet</h1>
                        <p className="form-subtitle">Pridajte sa k nám a začnite svoju cestu</p>
                    </div>

                    {/* Chybové správy */}
                    {generalError && (
                        <div className="form-error">
                            <ErrorIcon />
                            <span>{generalError}</span>
                        </div>
                    )}

                    {/* Nový registračný formulár */}
                    <form className="registration-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                <EmailIcon size={18} />
                                Emailová adresa
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={data.email}
                                onChange={handleInputChange}
                                placeholder="Zadajte váš email"
                                className="form-input"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">
                                <PasswordIcon size={18} />
                                Heslo
                            </label>
                            <div className="input-with-toggle">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={data.password}
                                    onChange={handleInputChange}
                                    placeholder="Zadajte heslo (min. 6 znakov)"
                                    className="form-input"
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
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
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                <ConfirmPasswordIcon size={18} />
                                Potvrdiť heslo
                            </label>
                            <div className="input-with-toggle">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={data.confirmPassword || ''}
                                    onChange={handleInputChange}
                                    placeholder="Potvrďte vaše heslo"
                                    className="form-input"
                                    required
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={toggleConfirmPasswordVisibility}
                                    aria-label={showConfirmPassword ? 'Skryť heslo' : 'Zobraziť heslo'}
                                >
                                    {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit tlačidlo */}
                        <button 
                            type="submit" 
                            className="form-submit-btn"
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Vytváram účet...
                                </>
                            ) : (
                                <>
                                    Vytvoriť účet
                                    <svg className="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="form-footer">
                        <span className="footer-text">Máte už účet?</span>
                        <Link to="/login" className="footer-link">
                            Prihlásiť sa
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Registration;