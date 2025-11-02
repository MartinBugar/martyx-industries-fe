import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { gdprService } from '../../services/gdprService';
import './GdprManagement.css';

/**
 * GDPR Management Component
 * Allows users to manage their GDPR rights:
 * - View consent status
 * - Withdraw marketing consent (GDPR Article 7(3))
 * - Export personal data (GDPR Article 15)
 * - Delete account (GDPR Article 17)
 */
const GdprManagement: React.FC = () => {
    const [consentStatus, setConsentStatus] = useState<{
        gdpr: boolean;
        marketing: boolean;
        confirmed: boolean;
    } | null>(null);
    const [consentHistory, setConsentHistory] = useState<any[]>([]);
    const [exportHistory, setExportHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [confirmationEmail, setConfirmationEmail] = useState('');

    // Load data on component mount
    useEffect(() => {
        loadConsentStatus();
        loadConsentHistory();
        loadExportHistory();
    }, []);

    const loadConsentStatus = async () => {
        try {
            const status = await gdprService.getConsentStatus();
            setConsentStatus(status);
        } catch (err) {
            console.error('Failed to load consent status:', err);
        }
    };

    const loadConsentHistory = async () => {
        try {
            const history = await gdprService.getConsentHistory();
            setConsentHistory(history);
        } catch (err) {
            console.error('Failed to load consent history:', err);
        }
    };

    const loadExportHistory = async () => {
        try {
            const history = await gdprService.getDataExportHistory();
            setExportHistory(history);
        } catch (err) {
            console.error('Failed to load export history:', err);
        }
    };

    const handleWithdrawMarketingConsent = async () => {
        if (!window.confirm('Naozaj chcete odvolať marketing consent? Už vám nebudeme zasielať marketingové emaily.')) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await gdprService.withdrawMarketingConsent();
            setSuccess(result.message);
            loadConsentStatus();
            loadConsentHistory();
        } catch (err: any) {
            setError(err.message || 'Nepodarilo sa odvolať marketing consent');
        } finally {
            setLoading(false);
        }
    };

    const handleGrantMarketingConsent = async () => {
        if (!window.confirm('Chcete povoliť zasielanie marketingových emailov? Budeme vám zasielať novinky, akcie a špeciálne ponuky.')) {
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await gdprService.grantMarketingConsent();
            setSuccess(result.message);
            loadConsentStatus();
            loadConsentHistory();
        } catch (err: any) {
            setError(err.message || 'Nepodarilo sa povoliť marketing consent');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestDataExport = async () => {
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await gdprService.requestDataExport();
            setSuccess(result.message);
            loadExportHistory();
        } catch (err: any) {
            setError(err.message || 'Nepodarilo sa požiadať o export dát');
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
            setSuccess(result.message);
            setShowDeleteConfirmation(false);

            // Log out user after account deletion
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Nepodarilo sa zmazať účet');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="gdpr-management">
            <div className="gdpr-header">
                <h1>Správa GDPR a osobných údajov</h1>
                <p>Spravujte svoje súhlasy, exportujte vaše dáta alebo vymažte váš účet</p>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="gdpr-alert gdpr-alert-error" role="alert">
                    <span className="alert-icon">⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="gdpr-alert gdpr-alert-success" role="alert">
                    <span className="alert-icon">✅</span>
                    <span>{success}</span>
                </div>
            )}

            {/* Data Retention Information Section */}
            <div className="gdpr-section info-section">
                <h2>📅 Politika uchovávania údajov (Data Retention Policy)</h2>
                <p>V súlade s GDPR Článkom 5(e) a slovenskou legislatívou uchovávame vaše osobné údaje iba po nevyhnutnú dobu:</p>

                <div className="retention-info-grid">
                    <div className="retention-item">
                        <div className="retention-icon">👤</div>
                        <div className="retention-content">
                            <h3>Účet a osobné údaje</h3>
                            <p className="retention-period">Do zmazania + 30 dní</p>
                            <p className="retention-description">Email, meno, telefónne číslo</p>
                        </div>
                    </div>

                    <div className="retention-item">
                        <div className="retention-icon">🛒</div>
                        <div className="retention-content">
                            <h3>Objednávky a faktúry</h3>
                            <p className="retention-period">10 rokov</p>
                            <p className="retention-description">Zákonná povinnosť (Zákon č. 431/2002 Z. z.)</p>
                        </div>
                    </div>

                    <div className="retention-item">
                        <div className="retention-icon">✅</div>
                        <div className="retention-content">
                            <h3>História súhlasov</h3>
                            <p className="retention-period">Natrvalo</p>
                            <p className="retention-description">Dôkaz o udelení súhlasu (GDPR Článok 7(1))</p>
                        </div>
                    </div>

                    <div className="retention-item">
                        <div className="retention-icon">🔒</div>
                        <div className="retention-content">
                            <h3>IP adresy</h3>
                            <p className="retention-period">90 dní → pseudonymizácia</p>
                            <p className="retention-description">SHA-256 hash po 90 dňoch (ochrana súkromia)</p>
                        </div>
                    </div>

                    <div className="retention-item">
                        <div className="retention-icon">📊</div>
                        <div className="retention-content">
                            <h3>Exporty dát</h3>
                            <p className="retention-period">30 dní</p>
                            <p className="retention-description">Potom automaticky vymazané</p>
                        </div>
                    </div>

                    <div className="retention-item">
                        <div className="retention-icon">🗑️</div>
                        <div className="retention-content">
                            <h3>Zmazané účty</h3>
                            <p className="retention-period">10 rokov (anonymizované)</p>
                            <p className="retention-description">Potom definitívne vymazané</p>
                        </div>
                    </div>
                </div>

                <div className="retention-note">
                    <strong>📖 Automatické čistenie:</strong> Náš systém automaticky vymazáva alebo pseudonymizuje údaje podľa vyššie uvedených lehôt.
                    Viac informácií nájdete v našej <Link to="/privacy-policy" target="_blank" className="link-inline">politike ochrany osobných údajov</Link>.
                </div>
            </div>

            {/* Consent Status Section */}
            <div className="gdpr-section">
                <h2>📋 Aktuálny stav súhlasov</h2>
                {consentStatus ? (
                    <div className="consent-status-grid">
                        <div className="consent-status-item">
                            <div className="status-label">GDPR Súhlas</div>
                            <div className={`status-value ${consentStatus.gdpr ? 'active' : 'inactive'}`}>
                                {consentStatus.gdpr ? '✅ Aktívny' : '❌ Neaktívny'}
                            </div>
                            <div className="status-description">
                                Súhlas so spracovaním osobných údajov (povinný)
                            </div>
                        </div>

                        <div className="consent-status-item">
                            <div className="status-label">Marketing Súhlas</div>
                            <div className={`status-value ${consentStatus.marketing ? 'active' : 'inactive'}`}>
                                {consentStatus.marketing ? '✅ Aktívny' : '❌ Neaktívny'}
                            </div>
                            <div className="status-description">
                                Súhlas so zasielaním marketingových materiálov
                            </div>
                            {consentStatus.marketing ? (
                                <button
                                    className="btn-withdraw"
                                    onClick={handleWithdrawMarketingConsent}
                                    disabled={loading}
                                >
                                    Odvolať marketing súhlas
                                </button>
                            ) : (
                                <button
                                    className="btn-grant"
                                    onClick={handleGrantMarketingConsent}
                                    disabled={loading}
                                >
                                    Povoliť marketing súhlas
                                </button>
                            )}
                        </div>

                        <div className="consent-status-item">
                            <div className="status-label">Stav účtu</div>
                            <div className={`status-value ${consentStatus.confirmed ? 'active' : 'inactive'}`}>
                                {consentStatus.confirmed ? '✅ Potvrdený' : '⏳ Nepotvrdený'}
                            </div>
                            <div className="status-description">
                                Váš email bol {consentStatus.confirmed ? 'potvrdený' : 'nebol potvrdený'}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="loading">Načítavam...</div>
                )}
            </div>

            {/* Data Export Section */}
            <div className="gdpr-section">
                <h2>📊 Export osobných údajov (GDPR Článok 15)</h2>
                <p>Máte právo získať kópiu všetkých vašich osobných údajov, ktoré o vás uchov\u00e1vame.</p>

                <div className="export-actions">
                    <button
                        className="btn-primary"
                        onClick={handleDownloadDataExport}
                        disabled={loading}
                    >
                        📥 Stiahnuť moje dáta (ihneď)
                    </button>

                    <button
                        className="btn-secondary"
                        onClick={handleRequestDataExport}
                        disabled={loading}
                    >
                        📧 Požiadať o export (email)
                    </button>
                </div>

                {exportHistory.length > 0 && (
                    <div className="export-history">
                        <h3>História exportov</h3>
                        <div className="history-list">
                            {exportHistory.map((req: any, index: number) => (
                                <div key={index} className="history-item">
                                    <div className="history-date">
                                        {new Date(req.requestDate).toLocaleDateString('sk-SK')}
                                    </div>
                                    <div className="history-status">
                                        Status: <span className={`status-badge status-${req.status.toLowerCase()}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Consent History Section */}
            {consentHistory.length > 0 && (
                <div className="gdpr-section">
                    <h2>📜 História súhlasov</h2>
                    <div className="consent-history-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Typ</th>
                                    <th>Hodnota</th>
                                    <th>Akcia</th>
                                    <th>Dátum</th>
                                    <th>IP Adresa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consentHistory.map((consent: any, index: number) => (
                                    <tr key={index}>
                                        <td>{consent.consentType}</td>
                                        <td>
                                            <span className={consent.consentValue ? 'consent-granted' : 'consent-withdrawn'}>
                                                {consent.consentValue ? '✅ Granted' : '❌ Withdrawn'}
                                            </span>
                                        </td>
                                        <td>{consent.actionType}</td>
                                        <td>{new Date(consent.consentDate).toLocaleString('sk-SK')}</td>
                                        <td>{consent.ipAddress || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Account Deletion Section */}
            <div className="gdpr-section danger-section">
                <h2>🗑️ Zmazanie účtu (GDPR Článok 17)</h2>
                <p>Máte právo na výmaz vašich osobných údajov ("Právo byť zabudnutý").</p>

                <div className="danger-warning">
                    <span className="warning-icon">⚠️</span>
                    <div>
                        <strong>Upozornenie:</strong> Táto akcia je <strong>NEVRATNÁ</strong>.
                        Všetky vaše osobné údaje budú trvalo vymazané. História objednávok bude zachovaná
                        po dobu 10 rokov (zákonná povinnosť pre účtovné účely).
                    </div>
                </div>

                {!showDeleteConfirmation ? (
                    <button
                        className="btn-danger"
                        onClick={() => setShowDeleteConfirmation(true)}
                    >
                        Zmazať môj účet
                    </button>
                ) : (
                    <div className="delete-confirmation">
                        <h3>Potvrdenie zmazania účtu</h3>
                        <p>Pre potvrdenie zadajte váš email:</p>

                        <input
                            type="email"
                            className="form-input"
                            placeholder="váš@email.com"
                            value={confirmationEmail}
                            onChange={(e) => setConfirmationEmail(e.target.value)}
                        />

                        <div className="confirmation-actions">
                            <button
                                className="btn-danger"
                                onClick={handleDeleteAccount}
                                disabled={loading || !confirmationEmail}
                            >
                                {loading ? 'Mažem účet...' : 'Áno, zmazať môj účet'}
                            </button>

                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    setShowDeleteConfirmation(false);
                                    setConfirmationEmail('');
                                }}
                                disabled={loading}
                            >
                                Zrušiť
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GdprManagement;
