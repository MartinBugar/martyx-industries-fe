import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import OptimizedImage from '../../components/OptimizedImage/OptimizedImage';
import './About.css';

const About: React.FC = () => {
  const { t } = useTranslation('about');

  return (
    <div className="about-page" aria-label="About Page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">{t('title')}</h1>
            <p className="hero-lead">{t('lead')}</p>
            <p className="hero-subtitle">{t('hero.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* Origin Story Section - NEW */}
      <section className="about-origin">
        <div className="container">
          <div className="origin-content">
            <div className="section-header">
              <h2>{t('origin.title')}</h2>
            </div>
            <div className="origin-story">
              <p className="origin-paragraph">{t('origin.paragraph_1')}</p>
              <p className="origin-paragraph">{t('origin.paragraph_2')}</p>
              <p className="origin-paragraph">{t('origin.paragraph_3')}</p>
              <p className="origin-paragraph highlight">{t('origin.paragraph_4')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section - NEW */}
      <section className="about-philosophy">
        <div className="container">
          <div className="section-header">
            <h2>{t('philosophy.title')}</h2>
          </div>
          <div className="philosophy-grid">
            {/* No Glue */}
            <article className="philosophy-card">
              <div className="philosophy-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
              <h3 className="philosophy-title">{t('philosophy.no_glue.title')}</h3>
              <p className="philosophy-description">{t('philosophy.no_glue.description')}</p>
              <p className="philosophy-benefit">{t('philosophy.no_glue.benefit')}</p>
            </article>

            {/* Modular Design */}
            <article className="philosophy-card">
              <div className="philosophy-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </div>
              <h3 className="philosophy-title">{t('philosophy.modular.title')}</h3>
              <p className="philosophy-description">{t('philosophy.modular.description')}</p>
              <p className="philosophy-benefit">{t('philosophy.modular.benefit')}</p>
            </article>

            {/* Field Tested */}
            <article className="philosophy-card">
              <div className="philosophy-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="philosophy-title">{t('philosophy.tested.title')}</h3>
              <p className="philosophy-description">{t('philosophy.tested.description')}</p>
              <p className="philosophy-benefit">{t('philosophy.tested.benefit')}</p>
            </article>
          </div>
        </div>
      </section>

      {/* Values Section (What Drives Us) */}
      <section className="about-values">
        <div className="container">
          <div className="section-header">
            <h2>{t('values.title')}</h2>
          </div>
          <div className="values-grid">
            <article className="value-card">
              <div className="value-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 className="value-title">{t('values.precision.title')}</h3>
              <p className="value-description">{t('values.precision.description')}</p>
            </article>

            <article className="value-card">
              <div className="value-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="value-title">{t('values.community.title')}</h3>
              <p className="value-description">{t('values.community.description')}</p>
            </article>

            <article className="value-card">
              <div className="value-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <h3 className="value-title">{t('values.quality.title')}</h3>
              <p className="value-description">{t('values.quality.description')}</p>
            </article>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">{t('stats.parts')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">40+</div>
              <div className="stat-label">{t('stats.build_time')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">{t('stats.no_screws')}</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2000+</div>
              <div className="stat-label">{t('stats.community')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section - NEW */}
      <section className="about-team">
        <div className="container">
          <div className="team-content">
            <div className="section-header">
              <h2>{t('team.title')}</h2>
            </div>
            <p className="team-description">{t('team.description')}</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">{t('cta.title')}</h2>
            <p className="cta-description">{t('cta.description')}</p>
            <div className="cta-actions">
              <Link to="/products" className="btn-cta primary">
                {t('cta.button')}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link to="/contact" className="btn-cta secondary">
                {t('cta.contact')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Cassandra Mascot */}
      <div className="about-floating-mascot">
        <OptimizedImage
          src="/cassandra/About-Cass.png"
          alt="Cassandra - Martyx Industries mascot"
          className="floating-mascot-image-about"
          priority={false}
        />
      </div>
    </div>
  );
};

export default About;
