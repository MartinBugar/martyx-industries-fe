import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { gdprService } from '../../services/gdprService';
import './GdprSettings.css';

/**
 * GDPR Settings Component for User Account Settings Tab
 * Card-based layout for GDPR compliance actions
 */
const GdprSettings: React.FC = () => {
    const { logout } = useAuth();
    const [consentStatus, setConsentStatus] = useState<{
        gdpr: boolean;
        marketing: boolean;
        confirmed: boolean;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmationEmail, setConfirmationEmail] = useState('');

    // Load consent status on component mount
    useEffect(() => {
        loadConsentStatus();
    }, []);

    const loadConsentStatus = async () => {
        try {
            const status = await gdprService.getConsentStatus();
            setConsentStatus(status);
        } catch (err) {
            console.error('Failed to load consent status:', err);
        }
    };

    const handleToggleMarketingConsent = async () => {
        const isGranting = !consentStatus?.marketing;

        if (!window.confirm(
            isGranting
                ? 'Chcete povoliť zasielanie marketingových emailov? Budeme vám zasielať novinky, akcie a špeciálne ponuky.'
                : 'Naozaj chcete odvolať marketing consent? Už vám nebudeme zasielať marketingové emaily.'
        )) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = isGranting
                ? await gdprService.grantMarketingConsent()
                : await gdprService.withdrawMarketingConsent();

            setSuccess(result.message);
            loadConsentStatus();
        } catch (err: any) {
            setError(err.message || 'Nepodarilo sa zmeniť marketing consent');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadDataExport = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await gdprService.downloadDataExport();
            setSuccess('Export dát bol úspešne stiahnutý!');
        } catch (err: any) {
            setError(err.message || 'Nepodarilo sa stiahnuť export dát');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirmationEmail) {
            setError('Prosím zadajte váš email pre potvrdenie');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await gdprService.deleteAccount(confirmationEmail);
            setSuccess(result.message + ' Budete automaticky odhlásený...');
            setShowDeleteModal(false);

            // Log out user after account deletion
            setTimeout(() => {
                logout();
                window.location.href = '/';
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Nepodarilo sa zmazať účet');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gdpr-settings">
            <div className="settings-header">
                <h2>GDPR a ochrana osobných údajov</h2>
                <p>Spravujte vaše súhlasy a osobné údaje podľa GDPR legislatívy</p>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="alert alert-error" role="alert">
                    <span className="alert-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="alert alert-success" role="alert">
                    <span className="alert-icon">✅</span>
                    <span>{success}</span>
                </div>
            )}

            {/* Marketing Consent Card */}
            <div className="gdpr-card">
                <div className="card-header">
                    <div className="card-icon">📧</div>
                    <div>
                        <h3 className="card-title">Marketing súhlas</h3>
                        <p className="card-description">
                            Zasielanie marketingových emailov a noviniek
                        </p>
                    </div>
                </div>

                <div className="card-body">
                    {consentStatus ? (
                        <>
                            <div className="consent-status">
                                <div className={`status-badge ${consentStatus.marketing ? 'active' : 'inactive'}`}>
                                    {consentStatus.marketing ? '✅ Aktívny' : '❌ Neaktívny'}
                                </div>
                                <p className="status-text">
                                    {consentStatus.marketing
                                        ? 'Súhlasíte so zasielaním marketingových materiálov'
                                        : 'Neprijímate marketingové emaily'}
                                </p>
                            </div>

                            <button
                                className={`btn ${consentStatus.marketing ? 'btn-warning' : 'btn-success'}`}
                                onClick={handleToggleMarketingConsent}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span>Ukladám...</span>
                                ) : consentStatus.marketing ? (
                                    <span>Odvolať súhlas</span>
                                ) : (
                                    <span>Povoliť súhlas</span>
                                )}
                            </button>
                        </>
                    ) : (
                        <div className="loading-text">Načítavam...</div>
                    )}
                </div>

                <div className="card-footer">
                    <small>GDPR Článok 7(3) - Súhlas môžete kedykoľvek odvolať</small>
                </div>
            </div>

            {/* Export Personal Data Card */}
            <div className="gdpr-card">
                <div className="card-header">
                    <div className="card-icon">📊</div>
                    <div>
                        <h3 className="card-title">Export osobných údajov</h3>
                        <p className="card-description">
                            Stiahnite si všetky vaše osobné údaje vo formáte JSON
                        </p>
                    </div>
                </div>

                <div className="card-body">
                    <p className="info-text">
                        Máte právo získať kópiu všetkých vašich osobných údajov, ktoré o vás uchovávame.
                        Export obsahuje vaše osobné údaje, históriu objednávok, súhlasy a ďalšie informácie.
                    </p>

                    <button
                        className="btn btn-primary"
                        onClick={handleDownloadDataExport}
                        disabled={loading}
                    >
                        📥 Stiahnuť moje dáta
                    </button>
                </div>

                <div className="card-footer">
                    <small>GDPR Článok 15 - Právo na prístup k osobným údajom</small>
                </div>
            </div>

            {/* Delete Account Card */}
            <div className="gdpr-card danger-card">
                <div className="card-header">
                    <div className="card-icon danger-icon">🗑️</div>
                    <div>
                        <h3 className="card-title">Zmazanie účtu</h3>
                        <p className="card-description">
                            Trvalo vymazať váš účet a osobné údaje
                        </p>
                    </div>
                </div>

                <div className="card-body">
                    <div className="danger-box">
                        <div className="danger-icon-wrapper">
                            <svg className="danger-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="danger-title">Toto je nevratná akcia</p>
                            <p className="danger-text">
                                Všetky vaše osobné údaje budú trvalo vymazané. História objednávok bude zachovaná
                                po dobu 10 rokov (zákonná povinnosť pre účtovné účely podľa Zákona č. 431/2002 Z. z.).
                            </p>
                        </div>
                    </div>

                    <button
                        className="btn btn-danger"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        Zmazať môj účet
                    </button>
                </div>

                <div className="card-footer">
                    <small>GDPR Článok 17 - Právo na výmaz ("Právo byť zabudnutý")</small>
                </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => !loading && setShowDeleteModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">Potvrdenie zmazania účtu</h3>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="modal-close"
                                disabled={loading}
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="modal-warning">
                                <svg className="modal-warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p>Pre potvrdenie zadajte váš email:</p>
                            </div>

                            <input
                                type="email"
                                className="form-input"
                                placeholder="váš@email.com"
                                value={confirmationEmail}
                                onChange={(e) => setConfirmationEmail(e.target.value)}
                                disabled={loading}
                            />

                            {error && (
                                <div className="modal-error">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setConfirmationEmail('');
                                    setError(null);
                                }}
                                disabled={loading}
                            >
                                Zrušiť
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteAccount}
                                disabled={loading || !confirmationEmail}
                            >
                                {loading ? 'Mažem účet...' : 'Áno, zmazať môj účet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GdprSettings;
