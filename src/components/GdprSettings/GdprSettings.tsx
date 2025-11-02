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

            {/* Privacy & GDPR - Minimal Card */}
            <div className="gdpr-card-compact">
                {success && (
                    <div className="gdpr-message success">
                        <span>{success}</span>
                        <button onClick={() => setSuccess(null)} className="gdpr-message-close">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="gdpr-content-compact">
                    <div className="gdpr-header-compact">
                        <svg className="gdpr-icon-compact" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <div className="gdpr-header-text">
                            <h3 className="gdpr-title-compact">Súkromie & údaje</h3>
                            <p className="gdpr-subtitle-compact">Export, marketing súhlas</p>
                        </div>
                    </div>

                    <div className="gdpr-actions-compact">
                        <button
                            onClick={handleDownloadDataExport}
                            disabled={loading}
                            className="gdpr-action-button"
                            title="Stiahnuť všetky osobné údaje (JSON)"
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>{loading ? 'Exportujem...' : 'Export'}</span>
                        </button>

                        {consentStatus && (
                            <div className="gdpr-toggle-group">
                                <span className="gdpr-toggle-label">Marketing</span>
                                <label className="modern-toggle">
                                    <input
                                        type="checkbox"
                                        checked={consentStatus.marketing || false}
                                        onChange={(e) => {
                                            const isGranting = e.target.checked;
                                            if (window.confirm(
                                                isGranting
                                                    ? 'Chcete povoliť zasielanie marketingových emailov?'
                                                    : 'Naozaj chcete odvolať marketing consent?'
                                            )) {
                                                handleToggleMarketingConsent();
                                            } else {
                                                e.target.checked = !isGranting;
                                            }
                                        }}
                                        disabled={loading}
                                    />
                                    <span className="modern-toggle-slider"></span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Account Card - Minimal Design */}
            <div className="delete-account-card">
                {/* Warning Box */}
                <div className="delete-warning-box">
                    <div className="delete-warning-content">
                        <svg className="delete-warning-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="delete-warning-text">
                            <h4 className="delete-warning-title">Toto je nevratná akcia</h4>
                            <p className="delete-warning-description">
                                Po zmazaní účtu nebudete môcť obnoviť žiadne dáta. Všetky vaše predplatné, platby a osobné informácie budú natrvalo odstránené.
                            </p>
                            <ul className="delete-warning-list">
                                <li>30-dňová lehota na zrušenie žiadosti</li>
                                <li>Aktívne predplatné bude automaticky zrušené</li>
                                <li>Faktúry budú anonymizované (zachované pre účtovné účely)</li>
                                <li>Email s potvrdením bude odoslaný</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="delete-account-content">
                    <div className="delete-account-header">
                        <svg className="delete-account-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <div className="delete-account-text">
                            <h3 className="delete-account-title">Zmazanie účtu</h3>
                            <p className="delete-account-subtitle">
                                Trvalo vymazať váš účet a osobné údaje
                            </p>
                        </div>
                    </div>

                    <button
                        className="delete-account-button"
                        onClick={() => setShowDeleteModal(true)}
                        disabled={loading}
                    >
                        <span>Zmazať účet</span>
                    </button>
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
