import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { SupportedLanguage } from '../i18n';
import './LanguageSwitcher.css';

interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode: SupportedLanguage) => {
    try {
      await i18n.changeLanguage(languageCode);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div className="language-switcher" ref={dropdownRef}>
      <button
        type="button"
        className="language-switcher__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('language')}
        title={`${t('language')}: ${currentLanguage.nativeName}`}
      >
        <span className="language-switcher__code">
          {currentLanguage.code.toUpperCase()}
        </span>
        <svg
          className={`language-switcher__arrow ${isOpen ? 'language-switcher__arrow--open' : ''}`}
          width="12"
          height="8"
          viewBox="0 0 12 8"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1 1.5L6 6.5L11 1.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="language-switcher__dropdown" role="listbox">
          {languages.map((language) => (
            <button
              key={language.code}
              type="button"
              className={`language-switcher__option ${
                language.code === currentLanguage.code ? 'language-switcher__option--active' : ''
              }`}
              onClick={() => handleLanguageChange(language.code)}
              role="option"
              aria-selected={language.code === currentLanguage.code}
            >
              <span className="language-switcher__option-flag" aria-hidden="true">
                {language.flag}
              </span>
              <div className="language-switcher__option-text">
                <span className="language-switcher__option-native">
                  {language.nativeName}
                </span>
                <span className="language-switcher__option-english">
                  {language.name}
                </span>
              </div>
              {language.code === currentLanguage.code && (
                <svg
                  className="language-switcher__check"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M13.5 4.5L6 12L2.5 8.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}


    </div>
  );
};

export default LanguageSwitcher;
