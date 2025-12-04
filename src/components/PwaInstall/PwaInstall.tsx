import React, { useState, useEffect, useCallback } from 'react';
import './PwaInstall.css';
import { logInfo, logError } from '../../services/logger';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Declare global window property for storing the deferred prompt
declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

/**
 * PWA Installation Component
 * Allows users to install Martyx Industries as a standalone application
 *
 * States:
 * 1. isInstalled = true -> App is already installed
 * 2. deferredPrompt exists -> Can trigger install programmatically
 * 3. isPWACapable = true, no prompt -> Show manual instructions
 * 4. isPWACapable = false -> Browser doesn't support PWA (rare)
 */
const PwaInstall: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isPWACapable, setIsPWACapable] = useState(true); // Default to true - most modern browsers support PWA
    const [installingPWA, setInstallingPWA] = useState(false);
    const [browserInfo, setBrowserInfo] = useState<{ name: string; isIOS: boolean; isSafari: boolean }>({
        name: 'browser',
        isIOS: false,
        isSafari: false
    });

    // Detect browser type for specific instructions
    useEffect(() => {
        const ua = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
        const isChrome = /Chrome/.test(ua) && !/Edg/.test(ua);
        const isEdge = /Edg/.test(ua);
        const isFirefox = /Firefox/.test(ua);

        let name = 'browser';
        if (isIOS) name = 'Safari (iOS)';
        else if (isSafari) name = 'Safari';
        else if (isEdge) name = 'Edge';
        else if (isChrome) name = 'Chrome';
        else if (isFirefox) name = 'Firefox';

        setBrowserInfo({ name, isIOS, isSafari });
        logInfo(`[PWA] Browser detected: ${name}, iOS: ${isIOS}, Safari: ${isSafari}`);
    }, []);

    // Check installation status
    useEffect(() => {
        // Check if app is already installed (running in standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true; // iOS Safari

        if (isStandalone) {
            logInfo('[PWA] App is running in standalone mode (installed)');
            setIsInstalled(true);
            return;
        }

        // Check PWA capability
        const checkPWACapability = () => {
            const supportsServiceWorker = 'serviceWorker' in navigator;
            const manifestLink = document.querySelector('link[rel="manifest"]');
            const hasManifest = !!manifestLink;

            logInfo(`[PWA] Capability check - SW support: ${supportsServiceWorker}, Manifest: ${hasManifest}`);

            // Most browsers support PWA, only mark as incapable if both are missing
            if (!supportsServiceWorker) {
                logInfo('[PWA] Service Worker not supported');
                setIsPWACapable(false);
                return;
            }

            setIsPWACapable(true);
        };

        checkPWACapability();

        // Listen for beforeinstallprompt event
        // This event fires when the browser determines the app is installable
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            logInfo('[PWA] beforeinstallprompt event fired - install prompt available');
            e.preventDefault(); // Prevent automatic prompt
            setDeferredPrompt(e);
            setIsPWACapable(true);
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            logInfo('[PWA] App was installed successfully');
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Check if there's a stored prompt (some browsers fire the event before component mounts)
        if ((window as any).__pwaInstallPrompt) {
            logInfo('[PWA] Found stored install prompt from window');
            setDeferredPrompt((window as any).__pwaInstallPrompt);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallPWA = useCallback(async () => {
        if (!deferredPrompt) {
            logError('[PWA] No deferred prompt available');
            return;
        }

        setInstallingPWA(true);
        try {
            logInfo('[PWA] Triggering install prompt');
            await deferredPrompt.prompt();

            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                logInfo('[PWA] User accepted the installation');
            } else {
                logInfo('[PWA] User dismissed the installation');
            }

            setDeferredPrompt(null);
        } catch (error) {
            logError('[PWA] Error during installation:', error);
        } finally {
            setInstallingPWA(false);
        }
    }, [deferredPrompt]);

    // Render installed state
    const renderInstalledState = () => (
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
    );

    // Render available for install state (with button)
    const renderAvailableState = () => (
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
    );

    // Render manual install instructions (when no deferred prompt but PWA is capable)
    const renderManualInstructions = () => (
        <div className="pwa-status pwa-manual-install">
            <div className="pwa-status-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
            </div>
            <div className="pwa-status-content">
                <h3 className="pwa-status-title">Nainštalujte si aplikáciu</h3>
                <p className="pwa-status-description">
                    Aplikáciu môžete nainštalovať z ponuky prehliadača. Postupujte podľa nižšie uvedených inštrukcií.
                </p>
                <div className="pwa-help-text">
                    <p><strong>Ako nainštalovať ({browserInfo.name}):</strong></p>
                    {browserInfo.isIOS ? (
                        <ul>
                            <li>1. Kliknite na ikonu <strong>Zdieľať</strong> (štvorec so šípkou hore) v spodnej lište</li>
                            <li>2. Posúňte sa nadol a kliknite na <strong>"Pridať na plochu"</strong></li>
                            <li>3. Potvrďte kliknutím na <strong>"Pridať"</strong></li>
                        </ul>
                    ) : browserInfo.isSafari ? (
                        <ul>
                            <li>1. V hornej lište kliknite na <strong>File</strong> (Súbor)</li>
                            <li>2. Vyberte <strong>"Add to Dock"</strong> alebo <strong>"Pridať do Docku"</strong></li>
                        </ul>
                    ) : (
                        <ul>
                            <li>1. Kliknite na ikonu <strong>inštalácie</strong> v adresnom riadku (zvyčajne ikona monitora s šípkou alebo ⊕)</li>
                            <li>2. Alebo otvorte <strong>menu prehliadača</strong> (⋮) a vyberte <strong>"Nainštalovať aplikáciu"</strong> / <strong>"Install app"</strong></li>
                        </ul>
                    )}
                </div>
                <div className="pwa-benefits-list" style={{ marginTop: '1rem' }}>
                    <div className="pwa-benefit">
                        <svg className="pwa-benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Rýchlejší prístup</span>
                    </div>
                    <div className="pwa-benefit">
                        <svg className="pwa-benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0" />
                        </svg>
                        <span>Funguje offline</span>
                    </div>
                    <div className="pwa-benefit">
                        <svg className="pwa-benefit-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                        </svg>
                        <span>Push notifikácie</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render not supported state (very rare - only for very old browsers)
    const renderNotSupportedState = () => (
        <div className="pwa-status pwa-not-available">
            <div className="pwa-status-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="48" height="48">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div className="pwa-status-content">
                <h3 className="pwa-status-title">Prehliadač nepodporuje PWA</h3>
                <p className="pwa-status-description">
                    Váš prehliadač nepodporuje inštaláciu Progressive Web Apps.
                    Pre lepší zážitok odporúčame použiť moderný prehliadač ako Chrome, Edge, Firefox alebo Safari.
                </p>
            </div>
        </div>
    );

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
            <div className="pwa-card">
                {isInstalled ? (
                    renderInstalledState()
                ) : deferredPrompt ? (
                    renderAvailableState()
                ) : isPWACapable ? (
                    renderManualInstructions()
                ) : (
                    renderNotSupportedState()
                )}
            </div>

            {/* Info Section */}
            <div className="pwa-info-section">
                <h3 className="pwa-info-title">Čo je Progressive Web App?</h3>
                <p className="pwa-info-description">
                    Progressive Web App (PWA) umožňuje používať naše webové rozhranie spôsobom podobným natívnej aplikácii.
                    Po inštalácii získate ikonu na domovskej obrazovke, rýchlejší prístup a možnosť používať aplikáciu aj bez pripojenia k internetu.
                </p>
            </div>
        </div>
    );
};

export default PwaInstall;
