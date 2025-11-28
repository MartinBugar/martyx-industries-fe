/**
 * Registration komponent - Refactored with react-hook-form + zod
 * Používa zdieľané komponenty a utility funkcie pre lepšiu údržbu kódu
 */

import React, {useState, useCallback, useEffect, useRef} from 'react';
import {useNavigate, Link} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {registrationService} from '../../services/registrationService';
import { registrationSchema, type RegistrationFormData } from '../../schemas/formSchemas';
import { getReferralCodeFromCookie } from '../../hooks/useReferralTracking';
import { logInfo, logError } from '../../services/logger';
import './Registration.css';

// Zdieľané komponenty a utility
import {
    EmailIcon,
    PasswordIcon,
    ConfirmPasswordIcon,
    EyeIcon,
    EyeOffIcon,
    ErrorIcon,
} from '../shared/FormComponents';

// ===== INTERFACES =====
// (Interfaces sú definované v zdieľaných komponentoch)

// ===== HLAVNÝ KOMPONENT =====

/**
 * Registration komponent s moderným dizajnom a optimalizovaným kódom
 * Poskytuje registračné rozhranie s validáciou a email konfirmáciou
 */
const Registration: React.FC = () => {
    const { t } = useTranslation('auth');
    const navigate = useNavigate();

    // Lokálny stav pre špecifické registračné funkcie
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [generalError, setGeneralError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [referralCode, setReferralCode] = useState<string | null>(null);

    // Ref pre focus management po úspešnej registrácii
    const loginBtnRef = useRef<HTMLButtonElement | null>(null);

    // Get referral code from cookie on mount
    useEffect(() => {
        const code = getReferralCodeFromCookie();
        if (code) {
            setReferralCode(code);
            logInfo('[REGISTRATION] Using referral code from cookie:', code);
        }
    }, []);

    // React Hook Form setup with zod validation
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<RegistrationFormData>({
        resolver: zodResolver(registrationSchema),
        mode: 'onBlur',
        defaultValues: {
            email: '',
            password: '',
            confirmPassword: '',
            gdprConsent: false,
            marketingConsent: false
        }
    });

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
     * Toggle password visibility
     */
    const togglePasswordVisibility = useCallback(() => {
        setShowPassword(prev => !prev);
    }, []);

    /**
     * Toggle confirm password visibility
     */
    const toggleConfirmPasswordVisibility = useCallback(() => {
        setShowConfirmPassword(prev => !prev);
    }, []);

    /**
     * Spracovanie registračnej požiadavky
     * Optimalizované s async/await a proper error handling
     */
    const handleRegistrationSubmit = useCallback(async (formData: RegistrationFormData) => {
        setGeneralError(null);

        try {
            const success = await registrationService.register(
                formData.email,
                formData.password,
                formData.gdprConsent,
                formData.marketingConsent || false,
                referralCode || undefined
            );

            if (success) {
                // Úspešná registrácia - zobrazenie potvrdzovacej správy
                setSuccessMessage(
                    t('register.success') + ` ${formData.email}. ` +
                    t('register.check_email', 'Skontrolujte svoj email a kliknite na potvrdzovací link pre aktiváciu účtu.')
                );

                // Vyčistenie formulára po úspešnej registrácii
                reset();
            } else {
                setGeneralError(t('register.error', 'Registrácia zlyhala. Skúste to znovu.'));
            }
        } catch (error) {
            // Spracovanie rôznych typov chýb
            const err = error as Error & { code?: string };

            if (err.code === 'EMAIL_ALREADY_REGISTERED' || err.message === 'EMAIL_ALREADY_REGISTERED') {
                setGeneralError('Tento email sa už používa. Skúste iný email alebo sa prihláste.');
            } else if (err.code === 'GDPR_CONSENT_REQUIRED') {
                setGeneralError('Musíte súhlasiť s podmienkami ochrany osobných údajov.');
            } else if (err.message && err.message !== 'An error occurred') {
                // Show detailed validation error from backend
                setGeneralError(err.message);
            } else {
                setGeneralError('Nastala chyba pri registrácii. Skúste to znovu.');
            }
            logError('Registration error:', error);
        }
    }, [t, reset, referralCode]);

    /**
     * Navigácia na login stránku
     */
    const handleGoToLogin = useCallback(() => {
        navigate('/login');
    }, [navigate]);

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
                            <h1 className="form-title">{t('register.check_email_title', 'Skontrolujte svoj email')}</h1>
                            <p className="form-subtitle">{t('register.check_email_subtitle', 'Odoslali sme vám potvrdzovací link')}</p>
                        </div>

                        <div className="success-message">
                            <div className="success-content">
                                <h3>{t('register.success_title', 'Registrácia úspešná!')}</h3>
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
                        <h1 className="form-title">{t('register.title')}</h1>
                        <p className="form-subtitle">{t('register.subtitle', 'Pridajte sa k nám a začnite svoju cestu')}</p>
                    </div>

                    {/* Referral Benefit Banner */}
                    {referralCode && (
                        <div className="referral-benefit-banner" role="status" aria-live="polite">
                            <div className="referral-banner-icon">🎁</div>
                            <div className="referral-banner-content">
                                <h3 className="referral-banner-title">{t('register.referral_benefit_title', 'Špeciálna ponuka!')}</h3>
                                <p className="referral-banner-text">
                                    {t('register.referral_benefit_text', 'Registruj sa cez tento referral link a získaj €5 zľavový kód na prvý nákup (minimum €30)!')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Chybové správy */}
                    {generalError && (
                        <div className="form-error" id="registration-error" role="alert" aria-live="polite">
                            <ErrorIcon />
                            <span>{generalError}</span>
                        </div>
                    )}

                    {/* Nový registračný formulár */}
                    <form className="registration-form" onSubmit={handleSubmit(handleRegistrationSubmit)}>
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
                                {t('register.password_label')}
                            </label>
                            <div className="input-with-toggle">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    placeholder="Zadajte heslo (min. 8 znakov)"
                                    className={`form-input ${errors.password ? 'error' : ''}`}
                                    autoComplete="new-password"
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

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">
                                <ConfirmPasswordIcon size={18} />
                                {t('register.confirm_password_label')}
                            </label>
                            <div className="input-with-toggle">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    placeholder="Potvrďte vaše heslo"
                                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                                    autoComplete="new-password"
                                    {...register('confirmPassword')}
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
                            {errors.confirmPassword && (
                                <span className="field-error">{errors.confirmPassword.message}</span>
                            )}
                        </div>

                        {/* GDPR Consent Checkbox - POVINNÝ */}
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label" htmlFor="gdpr-consent">
                                <input
                                    type="checkbox"
                                    id="gdpr-consent"
                                    className="checkbox-input"
                                    {...register('gdprConsent')}
                                />
                                <span className="checkbox-text">
                                    Súhlasím so <Link to="/privacy-policy" target="_blank" className="link-inline" rel="noopener noreferrer">spracovaním osobných údajov</Link> a <Link to="/terms-of-service" target="_blank" className="link-inline" rel="noopener noreferrer">obchodnými podmienkami</Link> *
                                </span>
                            </label>
                            {errors.gdprConsent && (
                                <span className="field-error">{errors.gdprConsent.message}</span>
                            )}
                        </div>

                        {/* Marketing Consent Checkbox - VOLITEĽNÝ */}
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label" htmlFor="marketing-consent">
                                <input
                                    type="checkbox"
                                    id="marketing-consent"
                                    className="checkbox-input"
                                    {...register('marketingConsent')}
                                />
                                <span className="checkbox-text">
                                    Chcem dostávať novinky, špeciálne ponuky a marketingové materiály
                                </span>
                            </label>
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
                                    {t('register.loading')}
                                </>
                            ) : (
                                <>
                                    {t('register.submit_button')}
                                    <svg className="btn-arrow" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="form-footer">
                        <span className="footer-text">{t('register.have_account')}</span>
                        <Link to="/login" className="footer-link">
                            {t('register.login_link')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Registration;