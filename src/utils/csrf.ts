/**
 * CSRF Token Management
 * Poskytuje ochranu proti Cross-Site Request Forgery útokom
 *
 * Backend (Spring Security) generuje CSRF token a ukladá ho do cookie XSRF-TOKEN.
 * Frontend číta tento token z cookie a posiela ho v X-XSRF-TOKEN headeri.
 *
 * Security: Cookie je httpOnly=false (čitateľná JavaScriptom), ale používa SameSite=Lax
 * pre ochranu pred CSRF. Token samotný validuje backend pri každom POST/PUT/PATCH/DELETE requeste.
 */

import React from 'react';
import { logError, logWarn } from '../services/logger';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

/**
 * Získa hodnotu cookie podľa mena
 */
const getCookie = (name: string): string | null => {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.split('=').map(c => c.trim());
      if (cookieName === name) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  } catch (error) {
    logError('Failed to read cookie:', error);
    return null;
  }
};

/**
 * Získa CSRF token z cookie (generovaný backendom)
 * Backend automaticky nastaví XSRF-TOKEN cookie pri prvom requeste.
 */
export const getCSRFToken = (): string | null => {
  return getCookie(CSRF_COOKIE_NAME);
};

/**
 * Pridá CSRF token do HTTP headers ak existuje
 * Token sa číta z cookie XSRF-TOKEN ktorú nastavil backend.
 */
export const addCSRFTokenToHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
  const token = getCSRFToken();

  if (token) {
    headers[CSRF_HEADER_NAME] = token;
  } else {
    // Token môže chýbať pri prvom requeste - backend ho vygeneruje
    logWarn('CSRF token not found in cookie. Backend will generate it on first request.');
  }

  return headers;
};

/**
 * CSRF Token Hook pre React komponenty
 * Monitoruje dostupnosť CSRF tokenu z cookie.
 */
export const useCSRFToken = () => {
  const [token, setToken] = React.useState<string | null>(() => getCSRFToken());

  React.useEffect(() => {
    // Periodicky kontroluj či backend nastavil token
    const interval = setInterval(() => {
      const currentToken = getCSRFToken();
      if (currentToken && currentToken !== token) {
        setToken(currentToken);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token]);

  return {
    token,
    addToHeaders: addCSRFTokenToHeaders
  };
};

// Backward compatibility exports (deprecated, ale ponechané pre existujúci kód)
export const generateCSRFToken = (): string => {
  logWarn('generateCSRFToken() is deprecated. Backend generates CSRF tokens.');
  return '';
};

export const setCSRFToken = (_token: string): void => {
  logWarn('setCSRFToken() is deprecated. Backend manages CSRF tokens via cookies.');
};

export const clearCSRFToken = (): void => {
  // Cookie sa maže backendom, frontend ju iba číta
  logWarn('clearCSRFToken() is deprecated. Backend manages CSRF token lifecycle.');
};

export const initializeCSRFToken = (): string => {
  logWarn('initializeCSRFToken() is deprecated. Backend initializes CSRF tokens.');
  return getCSRFToken() || '';
};

export const validateCSRFToken = (_token: string): boolean => {
  logWarn('validateCSRFToken() is deprecated. Backend validates CSRF tokens.');
  return true;
};
