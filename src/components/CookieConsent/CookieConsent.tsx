import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import './CookieConsent.css';
import { acceptAll, getConsent, hasConsent, rejectNonEssential, saveConsent } from '../../utils/cookieConsent';

const CookieConsent: React.FC = () => {
  const { t } = useTranslation('common');
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    // Show banner only if consent not stored
    if (!hasConsent()) {
      setVisible(true);
    } else {
      const c = getConsent();
      setAnalytics(!!c?.categories.analytics);
      setMarketing(!!c?.categories.marketing);
    }
  }, []);

  if (!visible) return null;

  const handleAcceptAll = () => {
    acceptAll();
    setVisible(false);
  };

  const handleReject = () => {
    rejectNonEssential();
    setVisible(false);
  };

  const handleSave = () => {
    saveConsent({ analytics, marketing });
    setVisible(false);
  };

  return (
    <div className="cookie-banner" role="dialog" aria-modal="true" aria-labelledby="cookie-banner-title" aria-describedby="cookie-banner-description">
      <div className="cookie-content">
        <div className="cookie-text">
          <strong id="cookie-banner-title">{t('cookies.title', 'We use cookies')}</strong>
          <p id="cookie-banner-description">
            {t('cookies.description', "We use necessary cookies to make our site work. We'd also like to set optional analytics and marketing cookies to help us improve the site and show relevant content.")}{' '}
            <Link to="/cookies-policy">{t('cookies.policyLink', 'Cookie Policy')}</Link>.
          </p>
        </div>
        <div className="cookie-actions">
          <button className="cookie-btn outline" onClick={handleReject}>{t('cookies.onlyNecessary', 'Only necessary')}</button>
          <button className="cookie-btn secondary" onClick={() => setShowPrefs((s) => !s)} aria-expanded={showPrefs} aria-controls="cookie-preferences">{t('cookies.preferences', 'Preferences')}</button>
          <button className="cookie-btn primary" onClick={handleAcceptAll}>{t('cookies.acceptAll', 'Accept all')}</button>
        </div>
      </div>

      {showPrefs && (
        <div id="cookie-preferences" className="cookie-preferences">
          {/* Necessary - always enabled */}
          <div className="pref-item necessary">
            <div className="pref-text">
              <span className="pref-title">{t('cookies.necessary', 'Necessary')}</span>
              <span className="pref-desc">{t('cookies.necessaryDesc', 'Essential for the website to function. Cannot be disabled.')}</span>
            </div>
            <div className="always-on">
              <Check size={16} aria-hidden="true" />
              <span>{t('cookies.alwaysOn', 'Always on')}</span>
            </div>
          </div>
          {/* Analytics */}
          <div className="pref-item">
            <div className="pref-text">
              <span className="pref-title">{t('cookies.analytics', 'Analytics')}</span>
              <span className="pref-desc">{t('cookies.analyticsDesc', 'Helps us understand how our site is used.')}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                aria-label={t('cookies.enableAnalytics', 'Enable analytics cookies')}
              />
              <span className="slider" aria-hidden="true" />
            </label>
          </div>
          {/* Marketing */}
          <div className="pref-item">
            <div className="pref-text">
              <span className="pref-title">{t('cookies.marketing', 'Marketing')}</span>
              <span className="pref-desc">{t('cookies.marketingDesc', 'Allows personalized offers and ads.')}</span>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                aria-label={t('cookies.enableMarketing', 'Enable marketing cookies')}
              />
              <span className="slider" aria-hidden="true" />
            </label>
          </div>
          <div className="pref-actions">
            <button className="cookie-btn outline" onClick={handleReject}>{t('cookies.onlyNecessary', 'Only necessary')}</button>
            <button className="cookie-btn primary" onClick={handleSave}>{t('cookies.savePreferences', 'Save preferences')}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookieConsent;
