import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import './BuildDifficultyGuide.css';

interface DifficultyLevel {
  key: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  color: string;
  icon: string;
}

const BuildDifficultyGuide: React.FC = () => {
  const { t } = useTranslation('difficulty');

  const difficultyLevels: DifficultyLevel[] = [
    { key: 'beginner', color: '#4ade80', icon: '🌱' },
    { key: 'intermediate', color: '#60a5fa', icon: '⚙️' },
    { key: 'advanced', color: '#8b5cf6', icon: '🔧' },  // WCAG AA compliant (4.5:1 contrast)
    { key: 'expert', color: '#f87171', icon: '🏆' }
  ];

  return (
    <div className="difficulty-guide-page">
      {/* Introduction */}
      <section className="difficulty-intro">
        <div className="difficulty-intro-content">
          <h2>{t('intro.title', 'Understanding Difficulty Levels')}</h2>
          <p>{t('intro.description', 'We categorize our products into four difficulty levels to help you choose the right project. Each level indicates the required skills, time investment, and tools needed.')}</p>

          <div className="intro-highlights">
            <div className="intro-highlight-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              <span>{t('intro.highlight1', 'Realistic time estimates')}</span>
            </div>
            <div className="intro-highlight-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
              <span>{t('intro.highlight2', 'Clear tool requirements')}</span>
            </div>
            <div className="intro-highlight-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              <span>{t('intro.highlight3', 'Skill-based recommendations')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Difficulty Levels */}
      <section className="difficulty-levels">
        <div className="difficulty-levels-content">
          {difficultyLevels.map((level) => (
            <div key={level.key} className={`difficulty-level-card ${level.key}`}>
              <div className="difficulty-level-header" style={{ borderColor: level.color }}>
                <div className="difficulty-level-icon" style={{ backgroundColor: level.color }}>
                  <span>{level.icon}</span>
                </div>
                <div className="difficulty-level-title-group">
                  <h3 style={{ color: level.color }}>
                    {t(`levels.${level.key}.name`, level.key.toUpperCase())}
                  </h3>
                  <p className="difficulty-level-tagline">
                    {t(`levels.${level.key}.tagline`, '')}
                  </p>
                </div>
              </div>

              <div className="difficulty-level-body">
                <p className="difficulty-level-description">
                  {t(`levels.${level.key}.description`, '')}
                </p>

                <div className="difficulty-level-specs">
                  {/* Time Required */}
                  <div className="difficulty-spec">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12,6 12,12 16,14"></polyline>
                    </svg>
                    <div className="difficulty-spec-content">
                      <strong>{t('common.timeRequired', 'Time Required')}:</strong>
                      <span>{t(`levels.${level.key}.time`, '')}</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="difficulty-spec">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                    </svg>
                    <div className="difficulty-spec-content">
                      <strong>{t('common.skills', 'Skills')}:</strong>
                      <span>{t(`levels.${level.key}.skills`, '')}</span>
                    </div>
                  </div>

                  {/* Tools */}
                  <div className="difficulty-spec">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                    <div className="difficulty-spec-content">
                      <strong>{t('common.tools', 'Tools')}:</strong>
                      <span>{t(`levels.${level.key}.tools`, '')}</span>
                    </div>
                  </div>

                  {/* Best For */}
                  <div className="difficulty-spec">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <div className="difficulty-spec-content">
                      <strong>{t('common.bestFor', 'Best For')}:</strong>
                      <span>{t(`levels.${level.key}.bestFor`, '')}</span>
                    </div>
                  </div>
                </div>

                {/* Example Products */}
                <div className="difficulty-level-examples">
                  <p className="examples-label">
                    {t('common.exampleProducts', 'Example Products')}:
                  </p>
                  <p className="examples-text">
                    {t(`levels.${level.key}.examples`, 'Coming soon...')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* No Glue Philosophy */}
      <section className="difficulty-philosophy">
        <div className="difficulty-philosophy-content">
          <div className="philosophy-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <h2>{t('philosophy.title', 'Our "No Glue" Philosophy')}</h2>
          <p className="philosophy-intro">
            {t('philosophy.intro', 'Every Martyx Industries model is engineered without the need for glue.')}
          </p>

          <div className="philosophy-benefits">
            <div className="philosophy-benefit">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <div>
                <strong>{t('philosophy.benefit1Title', 'Easy Disassembly')}</strong>
                <p>{t('philosophy.benefit1Text', 'Take apart and reassemble anytime for maintenance or modifications.')}</p>
              </div>
            </div>

            <div className="philosophy-benefit">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <div>
                <strong>{t('philosophy.benefit2Title', 'Educational Value')}</strong>
                <p>{t('philosophy.benefit2Text', 'Learn how every component fits together and understand the mechanics.')}</p>
              </div>
            </div>

            <div className="philosophy-benefit">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <div>
                <strong>{t('philosophy.benefit3Title', 'Superior Strength')}</strong>
                <p>{t('philosophy.benefit3Text', 'Precision-engineered screw connections provide better structural integrity.')}</p>
              </div>
            </div>

            <div className="philosophy-benefit">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <div>
                <strong>{t('philosophy.benefit4Title', 'No Mess')}</strong>
                <p>{t('philosophy.benefit4Text', 'Clean building experience without sticky residue or drying times.')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="difficulty-cta">
        <div className="difficulty-cta-content">
          <h2>{t('cta.title', 'Ready to Start Building?')}</h2>
          <p>{t('cta.text', 'Browse our collection and find your next project.')}</p>
          <Link to="/products" className="difficulty-cta-button">
            {t('cta.button', 'Explore Products')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default BuildDifficultyGuide;
