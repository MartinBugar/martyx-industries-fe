import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';

i18n
  // Load translations using http backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // ICU support for pluralization, number/date formatting
  .use(ICU)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language if detection fails
    fallbackLng: 'en',
    
    // Supported languages
    supportedLngs: ['en', 'sk', 'de'],
    
    // Debug mode - enable in development
    debug: import.meta.env.MODE === 'development',
    
    // Language detection options
    detection: {
      // Order and methods to detect language
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Cache user language preference
      caches: ['localStorage'],
      // Local storage key
      lookupLocalStorage: 'i18nextLng'
    },
    
    // Backend options for loading translation files
    backend: {
      // Path where resources are stored
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Add version or cache busting parameter
      queryStringParams: { v: import.meta.env.VITE_APP_VERSION || '1.0.0' }
    },
    
    // Default namespace
    defaultNS: 'common',
    
    // Namespaces to load by default
    ns: ['common', 'nav', 'checkout'],
    
    // ICU options
    i18nFormat: {
      // ICU will use built-in locale data
      memoize: false,
    },
    
    // React i18next options
    react: {
      // Use Suspense for loading translations
      useSuspense: true,
      // Trigger re-render when language changes
      bindI18n: 'languageChanged',
      // Trigger re-render when resources change
      bindI18nStore: 'added',
      // Escape values to prevent XSS
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em']
    },
    
    // Interpolation options
    interpolation: {
      // Values are already escaped by React
      escapeValue: false,
      // Format function for ICU
      format: (value, format, lng) => {
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: 'EUR'
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }
        return value;
      }
    },
    
    // Load missing keys handler (development only)
    saveMissing: import.meta.env.MODE === 'development',
    missingKeyHandler: import.meta.env.MODE === 'development' 
      ? (lng, ns, key, fallbackValue) => {
          const fullKey = `${ns}:${key}`;
          console.warn(`🔍 Missing translation key: ${fullKey} for language: ${lng}`, {
            language: lng,
            namespace: ns,
            key: key,
            fallbackValue: fallbackValue,
            timestamp: new Date().toISOString()
          });
          
          // Store missing keys for debugging
          if (typeof window !== 'undefined') {
            if (!window.__I18N_MISSING_KEYS) {
              window.__I18N_MISSING_KEYS = new Set();
            }
            window.__I18N_MISSING_KEYS.add(fullKey);
            
            // Also dispatch a custom event for potential dev tools
            window.dispatchEvent(new CustomEvent('i18n:missingKey', {
              detail: { language: lng, namespace: ns, key, fullKey, fallbackValue }
            }));
          }
        }
      : undefined,
    
    // Fallback keys
    fallbackNS: 'common'
  });

// Update HTML lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  // Set direction for RTL languages (if needed in future)
  const isRTL = ['ar', 'he', 'fa'].includes(lng);
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
});

// Load additional namespaces dynamically
export const loadNamespace = (ns: string | string[]) => {
  return i18n.loadNamespaces(ns);
};

// Helper to check if a namespace is loaded
export const hasNamespace = (ns: string) => {
  return i18n.hasResourceBundle(i18n.language, ns);
};

// Development helper to list all missing translation keys
export const getMissingKeys = (): string[] => {
  if (import.meta.env.MODE !== 'development' || typeof window === 'undefined') {
    return [];
  }
  return Array.from(window.__I18N_MISSING_KEYS || []);
};

// Development helper to clear missing keys list
export const clearMissingKeys = (): void => {
  if (import.meta.env.MODE !== 'development' || typeof window === 'undefined') {
    return;
  }
  if (window.__I18N_MISSING_KEYS) {
    window.__I18N_MISSING_KEYS.clear();
  }
};

// Console helper for developers (only in development)
if (import.meta.env.MODE === 'development' && typeof window !== 'undefined') {
  (window as any).__i18nDebug = {
    getMissingKeys,
    clearMissingKeys,
    changeLanguage: (lang: SupportedLanguage) => i18n.changeLanguage(lang),
    currentLanguage: () => i18n.language,
    supportedLanguages: () => i18n.options.supportedLngs,
    loadedNamespaces: () => i18n.options.ns
  };
  
  console.info('🌐 i18n Debug tools available via window.__i18nDebug');
}

// Export types for better TypeScript support
export type SupportedLanguage = 'en' | 'sk' | 'de';
export type Namespace = 'common' | 'nav' | 'checkout';

export default i18n;
