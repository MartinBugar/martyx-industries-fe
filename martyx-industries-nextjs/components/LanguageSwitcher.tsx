'use client';

import { useState } from 'react';

export default function LanguageSwitcher() {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'sk' : 'en'));
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="mi-iconbtn mi-desktop"
      aria-label={`Switch to ${language === 'en' ? 'Slovak' : 'English'}`}
      title={`Switch to ${language === 'en' ? 'Slovak' : 'English'}`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
      <span style={{ marginLeft: '4px', fontSize: '12px', fontWeight: '500' }}>
        {language.toUpperCase()}
      </span>
    </button>
  );
}
