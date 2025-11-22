import i18n from '../i18n';
import type { SupportedLanguage } from '../i18n';
import { logInfo, logWarn, logError } from '../services/logger';

/**
 * Utility functions for language management and persistence
 */

/**
 * Get the saved language from localStorage or return default
 */
export const getSavedLanguage = (): SupportedLanguage => {
  try {
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && ['en', 'sk', 'de'].includes(savedLanguage)) {
      return savedLanguage as SupportedLanguage;
    }
  } catch (error) {
    logWarn('Failed to read language from localStorage:', error);
  }
  
  // Fallback to browser language or default
  const browserLanguage = navigator.language.split('-')[0];
  if (['en', 'sk', 'de'].includes(browserLanguage)) {
    return browserLanguage as SupportedLanguage;
  }
  
  return 'en'; // Default fallback
};

/**
 * Save language to localStorage
 */
export const saveLanguage = (language: SupportedLanguage): void => {
  try {
    localStorage.setItem('i18nextLng', language);
  } catch (error) {
    logWarn('Failed to save language to localStorage:', error);
  }
};

/**
 * Initialize language from localStorage on app start
 */
export const initializeLanguage = async (): Promise<void> => {
  try {
    const savedLanguage = getSavedLanguage();
    
    // Only change language if it's different from current
    if (i18n.language !== savedLanguage) {
      await i18n.changeLanguage(savedLanguage);
    }
    
    // Ensure it's saved in localStorage (in case it was detected from browser)
    saveLanguage(savedLanguage);
    
    logInfo(`🌐 Language initialized: ${savedLanguage}`);
  } catch (error) {
    logError('Failed to initialize language:', error);
  }
};

/**
 * Change language and persist it
 */
export const changeLanguageWithPersistence = async (language: SupportedLanguage): Promise<void> => {
  try {
    await i18n.changeLanguage(language);
    saveLanguage(language);
    logInfo(`🌐 Language changed to: ${language}`);
  } catch (error) {
    logError('Failed to change language:', error);
    throw error;
  }
};
