import React from 'react';
import { Check } from 'lucide-react';

export type SupportedLocale = 'en' | 'sk' | 'de';

export interface LanguageTabsProps {
    activeLanguage: SupportedLocale;
    onLanguageChange: (lang: SupportedLocale) => void;
    completedLanguages: SupportedLocale[];
    className?: string;
}

const LANGUAGES: { code: SupportedLocale; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
];

/**
 * Language tabs component for multi-language content editing.
 * Shows which languages are completed and allows switching between them.
 */
export const LanguageTabs: React.FC<LanguageTabsProps> = ({
    activeLanguage,
    onLanguageChange,
    completedLanguages,
    className = ''
}) => {
    return (
        <>
            <style>{`
                .language-tab-inactive:hover {
                    border-color: #d1d5db !important;
                    background: #f9fafb !important;
                }
            `}</style>
            <div className={`language-tabs ${className}`} style={styles.container}>
            <div style={styles.tabList}>
                {LANGUAGES.map((lang) => {
                    const isActive = activeLanguage === lang.code;
                    const isCompleted = completedLanguages.includes(lang.code);

                    return (
                        <button
                            key={lang.code}
                            type="button"
                            onClick={() => onLanguageChange(lang.code)}
                            className={`language-tab ${isActive ? 'language-tab-active' : 'language-tab-inactive'}`}
                            style={{
                                ...styles.tab,
                                ...(isActive ? styles.tabActive : styles.tabInactive),
                            }}
                        >
                            <span style={styles.flag}>{lang.flag}</span>
                            <span style={styles.label}>{lang.label}</span>
                            {isCompleted && (
                                <Check size={16} style={styles.checkIcon} />
                            )}
                        </button>
                    );
                })}
            </div>
            <div style={styles.hint}>
                <span style={styles.hintIcon}>💡</span>
                <span style={styles.hintText}>
                    Fill out content for all languages. Users will see content based on their selected language.
                </span>
            </div>
        </div>
        </>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        marginBottom: 24,
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 20,
    },
    tabList: {
        display: 'flex',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    tab: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 20px',
        border: '2px solid',
        borderRadius: 8,
        background: 'transparent',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 600,
        transition: 'all 0.2s',
        position: 'relative',
    },
    tabActive: {
        borderColor: '#3b82f6',
        background: '#eff6ff',
        color: '#1e40af',
    },
    tabInactive: {
        borderColor: '#e5e7eb',
        color: '#6b7280',
    },
    flag: {
        fontSize: 20,
        lineHeight: 1,
    },
    label: {
        // fontSize inherited from tab
    },
    checkIcon: {
        color: '#10b981',
        marginLeft: 4,
    },
    hint: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        background: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: 8,
    },
    hintIcon: {
        fontSize: 16,
        flexShrink: 0,
    },
    hintText: {
        fontSize: 13,
        color: '#0c4a6e',
        lineHeight: 1.5,
    },
};

export default LanguageTabs;
