import React, { useState, useEffect } from 'react';
import './PwaInstall.css';

/**
 * PWA Installation Component
 * Allows users to install Martyx Industries as a standalone application
 */
const PwaInstall: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isPWACapable, setIsPWACapable] = useState(false);
    const [installingPWA, setInstallingPWA] = useState(false);

    // PWA Installation detection
    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            setIsPWACapable(true);
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsPWACapable(true);
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallPWA = async () => {
        if (!deferredPrompt) return;

        setInstallingPWA(true);
        try {
            // Show the install prompt
            await (deferredPrompt as any).prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await (deferredPrompt as any).userChoice;

            if (outcome === 'accepted') {
                console.log('User accepted the PWA installation');
            } else {
                console.log('User dismissed the PWA installation');
            }

            // Clear the deferred prompt
            setDeferredPrompt(null);
        } catch (error) {
            console.error('Error installing PWA:', error);
        } finally {
            setInstallingPWA(false);
        }
    };

    return (
        <div className="pwa-install-container">
            {/* Header */}
            <div className="pwa-header">
                <h2 className="pwa-header-title">Inštalácia aplikácie</h2>
                <p className="pwa-header-description">
                    Nainštalujte si Martyx Industries ako samostatnú aplikáciu pre rýchlejší prístup a lepší zážitok
                </p>
            </div>

            {/* Main Content */}
            {isPWACapable ? (
                <div className="pwa-card">
                    {isInstalled ? (
                        <div className="pwa-status pwa-installed">
                            <div className="pwa-status-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="pwa-status-content">
                                <h3 className="pwa-status-title">Aplikácia je nainštalovaná</h3>
                                <p className="pwa-status-description">
                                    Martyx Industries je nainštalovaná ako samostatná aplikácia. Môžete ju otvoriť priamo z ponuky vašich aplikácií.
                                </p>
                                <div className="pwa-benefits-list">
                                    <div className="pwa-benefit">
                                        <svg className="pwa-benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Rýchlejší prístup</span>
                                    </div>
                                    <div className="pwa-benefit">
                                        <svg className="pwa-benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Offline režim</span>
                                    </div>
                                    <div className="pwa-benefit">
                                        <svg className="pwa-benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Notifikácie</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : deferredPrompt ? (
                        <div className="pwa-status pwa-available">
                            <div className="pwa-status-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </div>
                            <div className="pwa-status-content">
                                <h3 className="pwa-status-title">Dostupné na inštaláciu</h3>
                                <p className="pwa-status-description">
                                    Nainštalujte si Martyx Industries ako samostatnú aplikáciu pre lepší zážitok a rýchlejší prístup.
                                </p>
                                <div className="pwa-benefits-list">
                                    <div className="pwa-benefit">
                                        <svg className="pwa-benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span>Rýchlejší prístup</span>
                                    </div>
                                    <div className="pwa-benefit">
                                        <svg className="pwa-benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                                        </svg>
                                        <span>Funguje offline</span>
                                    </div>
                                    <div className="pwa-benefit">
                                        <svg className="pwa-benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        <span>Push notifikácie</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleInstallPWA}
                                    disabled={installingPWA}
                                    className="pwa-install-button"
                                >
                                    {installingPWA ? (
                                        <>
                                            <svg className="pwa-button-spinner" viewBox="0 0 24 24" width="20" height="20">
                                                <circle className="spinner-circle" cx="12" cy="12" r="10" fill="none" strokeWidth="3" />
                                            </svg>
                                            <span>Inštalujem...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            <span>Nainštalovať aplikáciu</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="pwa-status pwa-not-available">
                            <div className="pwa-status-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="pwa-status-content">
                                <h3 className="pwa-status-title">PWA nie je k dispozícii</h3>
                                <p className="pwa-status-description">
                                    Inštalácia aplikácie nie je momentálne dostupná vo vašom prehliadači alebo zariadení.
                                </p>
                                <div className="pwa-help-text">
                                    <p><strong>Možné príčiny:</strong></p>
                                    <ul>
                                        <li>Používate prehliadač, ktorý nepodporuje PWA</li>
                                        <li>Aplikácia je už nainštalovaná v inom prehliadači</li>
                                        <li>Zariadenie nepodporuje inštaláciu webových aplikácií</li>
                                    </ul>
                                    <p><strong>Odporúčané prehliadače:</strong> Chrome, Edge, Safari (iOS)</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="pwa-card">
                    <div className="pwa-status pwa-not-available">
                        <div className="pwa-status-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="pwa-status-content">
                            <h3 className="pwa-status-title">PWA nie je k dispozícii</h3>
                            <p className="pwa-status-description">
                                Inštalácia aplikácie nie je momentálne dostupná vo vašom prehliadači.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Section */}
            <div className="pwa-info-section">
                <h3 className="pwa-info-title">Čo je Progressive Web App?</h3>
                <p className="pwa-info-description">
                    Progressive Web App (PWA) umožňuje používať naše webové rozh spôsobom podobným natívnej aplikácii.
                    Po inštalácii získate ikonu na domovskej obrazovke, rýchlejší prístup a možnosť používať aplikáciu aj bez pripojenia k internetu.
                </p>
            </div>
        </div>
    );
};

export default PwaInstall;
