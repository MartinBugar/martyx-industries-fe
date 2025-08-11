import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './CookieConsent.css';
import { acceptAll, getConsent, hasConsent, rejectNonEssential, saveConsent } from '../../utils/cookieConsent';

const CookieConsent: React.FC = () => {
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
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent banner">
      <div className="cookie-content">
        <div className="cookie-text">
          <strong>We use cookies</strong>
          <p>
            We use necessary cookies to make our site work. We’d also like to set optional analytics and marketing cookies to help us improve the site and show relevant content. See our <Link to="/about">Cookie Policy</Link>.
          </p>
        </div>
        <div className="cookie-actions">
          <button className="cookie-btn outline" onClick={handleReject}>Only necessary</button>
          <button className="cookie-btn secondary" onClick={() => setShowPrefs((s) => !s)} aria-expanded={showPrefs} aria-controls="cookie-preferences">Preferences</button>
          <button className="cookie-btn primary" onClick={handleAcceptAll}>Accept all</button>
        </div>
      </div>

      {showPrefs && (
        <div id="cookie-preferences" className="cookie-preferences">
          <div className="pref-item">
            <div className="pref-text">
              <span className="pref-title">Analytics</span>
              <span className="pref-desc">Helps us understand how our site is used.</span>
            </div>
            <label className="switch">
              <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
          <div className="pref-item">
            <div className="pref-text">
              <span className="pref-title">Marketing</span>
              <span className="pref-desc">Allows personalized offers and ads.</span>
            </div>
            <label className="switch">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
          <div className="pref-actions">
            <button className="cookie-btn outline" onClick={handleReject}>Only necessary</button>
            <button className="cookie-btn primary" onClick={handleSave}>Save preferences</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CookieConsent;
