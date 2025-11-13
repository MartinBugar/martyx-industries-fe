/**
 * Cookie Consent Manager
 * GDPR/ePrivacy compliant consent management for analytics tracking
 *
 * IMPORTANT: Analytics events should only be tracked if user has given consent
 */

import { logInfo, logError } from './logger';

const CONSENT_KEY = 'martyx_analytics_consent';
const CONSENT_VERSION = '1.0'; // Increment when privacy policy changes

interface ConsentData {
  version: string;
  analytics: boolean;
  timestamp: number;
}

/**
 * Check if user has given consent for analytics tracking
 */
export const hasAnalyticsConsent = (): boolean => {
  try {
    const consentData = localStorage.getItem(CONSENT_KEY);
    if (!consentData) {
      return false;
    }

    const consent: ConsentData = JSON.parse(consentData);

    // Check if consent is for current version
    if (consent.version !== CONSENT_VERSION) {
      return false;
    }

    return consent.analytics === true;
  } catch (error) {
    logError('[Cookie Consent] Error reading consent:', error);
    return false;
  }
};

/**
 * Set user consent for analytics tracking
 */
export const setAnalyticsConsent = (granted: boolean): void => {
  try {
    const consentData: ConsentData = {
      version: CONSENT_VERSION,
      analytics: granted,
      timestamp: Date.now(),
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    logInfo('[Cookie Consent] Analytics consent set:', granted);
  } catch (error) {
    logError('[Cookie Consent] Error saving consent:', error);
  }
};

/**
 * Clear all consent data (used when user revokes consent)
 */
export const clearConsent = (): void => {
  try {
    localStorage.removeItem(CONSENT_KEY);
    logInfo('[Cookie Consent] Consent data cleared');
  } catch (error) {
    logError('[Cookie Consent] Error clearing consent:', error);
  }
};

/**
 * Get full consent data (for debugging/admin purposes)
 */
export const getConsentData = (): ConsentData | null => {
  try {
    const consentData = localStorage.getItem(CONSENT_KEY);
    if (!consentData) {
      return null;
    }
    return JSON.parse(consentData);
  } catch (error) {
    logError('[Cookie Consent] Error reading consent data:', error);
    return null;
  }
};

export default {
  hasAnalyticsConsent,
  setAnalyticsConsent,
  clearConsent,
  getConsentData,
};
