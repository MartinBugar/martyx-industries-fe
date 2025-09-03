import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './About.css';

const About: React.FC = () => {
  const { t } = useTranslation('about');

  return (
    <div className="home-root about-page" aria-label="About Page">
      {/* Hero Section */}
      <section className="about-hero" aria-label="About Hero">
        <div className="container">
          <div className="about-hero-content">
            <h1 className="about-hero-title">{t('title')}</h1>
            <p className="about-hero-subtitle">{t('lead')}</p>
            <div className="about-hero-actions">
              <Link to="/products" className="btn btn-accent">{t('cta.shop_products')}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="home-section" aria-label={t('features.title')}>
        <div className="container">
          <div className="section-header">
            <h2>{t('features.title')}</h2>
          </div>
          <div className="featured-grid">
            <article className="product-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <div className="product-info">
                <h3 className="product-title">{t('features.precision.title')}</h3>
                <p className="product-description">{t('features.precision.description')}</p>
              </div>
            </article>
            <article className="product-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="product-info">
                <h3 className="product-title">{t('features.quality.title')}</h3>
                <p className="product-description">{t('features.quality.description')}</p>
              </div>
            </article>
            <article className="product-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className="product-info">
                <h3 className="product-title">{t('features.support.title')}</h3>
                <p className="product-description">{t('features.support.description')}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="home-section" aria-label={t('story.title')}>
        <div className="container">
          <div className="section-header">
            <h2>{t('story.title')}</h2>
            <p className="section-subtitle">{t('story.description')}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;