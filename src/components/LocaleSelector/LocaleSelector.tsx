import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { metaService } from '../../services/metaService';
import { translateApiError } from '../../utils/translateApiError';
import type { SupportedLocales } from '../../types/api';

/**
 * Component that loads supported locales from backend and displays them
 * This demonstrates integration with the meta/locales endpoint
 */
const LocaleSelector: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [supportedLocales, setSupportedLocales] = useState<SupportedLocales>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSupportedLocales = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const locales = await metaService.getSupportedLocales();
        setSupportedLocales(locales);
        
        console.log('✅ Loaded supported locales from backend:', locales);
      } catch (err) {
        console.error('❌ Failed to load supported locales:', err);
        
        // Use the unified error translation
        const errorMessage = translateApiError(err, t);
        setError(errorMessage);
        
        // Fallback to hardcoded locales
        setSupportedLocales(['en', 'sk', 'de']);
      } finally {
        setLoading(false);
      }
    };

    loadSupportedLocales();
  }, [t]);

  const handleLanguageChange = async (locale: string) => {
    try {
      await i18n.changeLanguage(locale);
      console.log(`🌐 Language changed to: ${locale}`);
    } catch (err) {
      console.error('Failed to change language:', err);
      const errorMessage = translateApiError(err, t);
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="locale-selector locale-selector--loading">
        <span>{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="locale-selector locale-selector--error">
        <span className="error-message">{error}</span>
        <button onClick={() => window.location.reload()}>
          {t('actions.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="locale-selector">
      <label htmlFor="locale-select" className="locale-selector__label">
        {t('language')}:
      </label>
      <select
        id="locale-select"
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="locale-selector__select"
      >
        {supportedLocales.map((locale) => (
          <option key={locale} value={locale}>
            {locale.toUpperCase()}
          </option>
        ))}
      </select>
      
      <div className="locale-selector__info">
        <small>
          {t('language')}: <strong>{i18n.language}</strong>
        </small>
        <small>
          {supportedLocales.length} {t('languages_available', { count: supportedLocales.length })}
        </small>
      </div>
    </div>
  );
};

export default LocaleSelector;
