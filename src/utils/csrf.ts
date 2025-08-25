/**
 * CSRF Token Management
 * Poskytuje ochranu proti Cross-Site Request Forgery útokom
 */

import React from 'react';

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generuje nový CSRF token
 */
export const generateCSRFToken = (): string => {
  // Použitie crypto API pre bezpečné generovanie tokenu
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Uloží CSRF token do session storage
 */
export const setCSRFToken = (token: string): void => {
  try {
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to store CSRF token:', error);
  }
};

/**
 * Získa CSRF token zo session storage
 */
export const getCSRFToken = (): string | null => {
  try {
    return sessionStorage.getItem(CSRF_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to retrieve CSRF token:', error);
    return null;
  }
};

/**
 * Vymaže CSRF token
 */
export const clearCSRFToken = (): void => {
  try {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear CSRF token:', error);
  }
};

/**
 * Inicializuje CSRF token ak neexistuje
 */
export const initializeCSRFToken = (): string => {
  let token = getCSRFToken();
  
  if (!token) {
    token = generateCSRFToken();
    setCSRFToken(token);
  }
  
  return token;
};

/**
 * Pridá CSRF token do HTTP headers
 */
export const addCSRFTokenToHeaders = (headers: Record<string, string> = {}): Record<string, string> => {
  const token = getCSRFToken();
  
  if (token) {
    headers[CSRF_HEADER_NAME] = token;
  }
  
  return headers;
};

/**
 * Validuje CSRF token
 */
export const validateCSRFToken = (token: string): boolean => {
  const storedToken = getCSRFToken();
  return storedToken !== null && token === storedToken;
};

/**
 * CSRF Token Hook pre React komponenty
 */
export const useCSRFToken = () => {
  const [token, setToken] = React.useState<string | null>(() => getCSRFToken());
  
  React.useEffect(() => {
    // Inicializuj token ak neexistuje
    if (!token) {
      const newToken = initializeCSRFToken();
      setToken(newToken);
    }
  }, [token]);
  
  const refreshToken = React.useCallback(() => {
    const newToken = generateCSRFToken();
    setCSRFToken(newToken);
    setToken(newToken);
    return newToken;
  }, []);
  
  return {
    token,
    refreshToken,
    addToHeaders: addCSRFTokenToHeaders
  };
};
