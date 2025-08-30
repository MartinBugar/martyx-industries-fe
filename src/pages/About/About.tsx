import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './About.css';

const About: React.FC = () => {
  const { t } = useTranslation('about');

  return (
    <main className="page-container about-page" role="main">
      <section className="about-container" aria-labelledby="about-title">
        <h1 id="about-title">{t('title')}</h1>
        <p className="about-lead">
          {t('lead')}
        </p>
        <ul className="about-highlights" aria-label={t('highlights.title')}>
          <li>{t('highlights.rc_ready')}</li>
          <li>{t('highlights.modular')}</li>
          <li>{t('highlights.documentation')}</li>
        </ul>
        <div className="about-cta">
          <Link to="/products" className="btn primary">{t('cta.shop_products')}</Link>
        </div>
      </section>
    </main>
  );
};

export default About;