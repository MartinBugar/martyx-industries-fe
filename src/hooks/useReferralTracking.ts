/**
 * Referral Tracking Hook
 *
 * Automatically tracks referral clicks from URL parameters and sets cookies
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { referralService } from '../services/referralService';
import { logInfo, logWarn, logError } from '../services/logger';

// Cookie name and expiry (90 days)
const REFERRAL_COOKIE_NAME = 'referral_code';
const COOKIE_EXPIRY_DAYS = 90;

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Set cookie with expiry
 */
function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  // HttpOnly=false to allow JavaScript access
  // SameSite=Lax for cross-site compatibility
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
}

/**
 * Hook to track referral codes from URL parameters
 */
export function useReferralTracking() {
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const referralCode = searchParams.get('ref');

    if (referralCode) {
      // Check if cookie already exists
      const existingCode = getCookie(REFERRAL_COOKIE_NAME);

      // Only track if no existing cookie or different code
      if (!existingCode || existingCode !== referralCode) {
        // Track click on backend
        const source = searchParams.get('source') || 'direct_link';

        referralService
          .trackClick(referralCode, source)
          .then(() => {
            // Set cookie on successful tracking
            setCookie(REFERRAL_COOKIE_NAME, referralCode, COOKIE_EXPIRY_DAYS);
            logInfo(`[REFERRAL] Tracked referral code: ${referralCode}`);
          })
          .catch((error) => {
            logError('[REFERRAL] Failed to track referral:', error);
          });
      }
    }
  }, [location.search]);
}

/**
 * Get current referral code from cookie (for registration)
 */
export function getReferralCodeFromCookie(): string | null {
  return getCookie(REFERRAL_COOKIE_NAME);
}
