import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './About.css';

const About: React.FC = () => {
  const { t } = useTranslation('about');

  return (
    <div className="about-page" aria-label="About Page">
      {/* Main Hero Container */}
      <div className="main-hero-wrapper">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-background"></div>
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-text">🚀 {t('badge', { defaultValue: 'Prémiové STL modely' })}</span>
            </div>
            <h1 className="hero-title">{t('title')}</h1>
            <p className="hero-subtitle">{t('lead')}</p>
            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-icon">✓</span>
                <span>{t('features.tested', { defaultValue: 'Testované modely' })}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span>{t('features.instant', { defaultValue: 'Okamžité stiahnutie' })}</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>{t('features.quality', { defaultValue: 'Vysoká kvalita' })}</span>
              </div>
            </div>
            <div className="hero-cta">
              <Link to="/products" className="hero-button">
                {t('cta.button', { defaultValue: 'Prezrieť katalóg' })}
              </Link>
              <div className="hero-stats">
                <span className="stat">500+ modelov</span>
                <span className="stat-separator">•</span>
                <span className="stat">10k+ zákazníkov</span>
              </div>
            </div>
          </div>
        </section>

        {/* Mascot Section */}
        <div className="mascot-section">
          <div className="mascot-container">
            <img
              src="/cassandra/1.png"
              alt="Martyx Industries Mascot"
              className="mascot-image"
            />
            <div className="mascot-decoration">
              <div className="decoration-circle circle-1"></div>
              <div className="decoration-circle circle-2"></div>
              <div className="decoration-circle circle-3"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="stats-container">
        <div className="stat-card">
          <div className="stat-number">500+</div>
          <div className="stat-label">{t('stats.models', { defaultValue: 'Unikátnych modelov' })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">10k+</div>
          <div className="stat-label">{t('stats.customers', { defaultValue: 'Spokojných zákazníkov' })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">50+</div>
          <div className="stat-label">{t('stats.monthly', { defaultValue: 'Nových modelov mesačne' })}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">24/7</div>
          <div className="stat-label">{t('stats.download', { defaultValue: 'Okamžité stiahnutie' })}</div>
        </div>
      </section>

      {/* About Content */}
      <section className="about-content">
        <div className="content-grid">
          <div className="content-text">
            <h2 className="content-title">{t('mission.title', { defaultValue: 'Naša misia' })}</h2>
            <p className="content-description">
              {t('mission.description', { 
                defaultValue: 'Spájame vášeň pre RC modelárstvo s najmodernejšou technológiou 3D tlače. Naše STL súbory sú navrhnuté s maximálnou pozornosťou k detailom, optimalizované pre jednoduchú tlač a perfektný výsledok.' 
              })}
            </p>
            <ul className="feature-list">
              <li className="feature-item">
                <span className="feature-icon"></span>
                <span>{t('features.professional', { defaultValue: 'Profesionálne navrhnuté modely' })}</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon"></span>
                <span>{t('features.optimized', { defaultValue: 'Optimalizované pre všetky typy tlačiarní' })}</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon"></span>
                <span>{t('features.guides', { defaultValue: 'Detailné návody a podpory' })}</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon"></span>
                <span>{t('features.community', { defaultValue: 'Komunita nadšencov' })}</span>
              </li>
            </ul>
          </div>
          <div className="model-showcase">
            <div className="model-preview">
              <div className="model-icon">🚁</div>
              <div className="model-grid">
                <div className="model-thumb">✈️</div>
                <div className="model-thumb">🚗</div>
                <div className="model-thumb">🚤</div>
                <div className="model-thumb">🏎️</div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-grid content-grid-reverse">
          <div className="model-showcase">
            <div className="model-preview">
              <div className="model-icon">⚙️</div>
              <div className="model-grid">
                <div className="model-thumb">🔧</div>
                <div className="model-thumb">🔩</div>
                <div className="model-thumb">⚡</div>
                <div className="model-thumb">🎯</div>
              </div>
            </div>
          </div>
          <div className="content-text">
            <h2 className="content-title">{t('why.title', { defaultValue: 'Prečo si vybrať nás?' })}</h2>
            <p className="content-description">
              {t('why.description', { 
                defaultValue: 'S viac ako 5 rokmi skúseností v oblasti 3D modelovania a RC modelárstva vám prinášame overené riešenia, ktoré fungujú. Každý model testujeme na rôznych typoch tlačiarní a materiálov.' 
              })}
            </p>
            <ul className="feature-list">
              <li className="feature-item">
                <span className="feature-icon"></span>
                <span>{t('features.tested', { defaultValue: 'Testované na reálnych projektoch' })}</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon"></span>
                <span>{t('features.updates', { defaultValue: 'Pravidelné aktualizácie modelov' })}</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon"></span>
                <span>{t('features.support_sk', { defaultValue: 'Zákaznícka podpora v slovenčine' })}</span>
              </li>
              <li className="feature-item">
                <span className="feature-icon"></span>
                <span>{t('features.guarantee', { defaultValue: 'Garancia kompatibility' })}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="team-section">
        <h2 className="team-title">{t('creator.title', { defaultValue: 'O tvorcovi' })}</h2>
        <div className="creator-container">
          <div className="team-card creator-card">
            <div className="team-avatar">🚁</div>
            <h3 className="team-name">{t('creator.role', { defaultValue: 'Nezávislý dizajnér & modelár' })}</h3>
            <p className="team-role">{t('creator.subtitle', { defaultValue: '3D Designer, RC nadšenec, Zakladateľ' })}</p>
            <p className="team-bio">
              {t('creator.bio', { 
                defaultValue: 'Som vášnivý modelár s dlhoročnými skúsenosťami v navrhovaní a 3D tlači RC modelov. Každý model navrhujem s láskou k detailom a testovaním na vlastných projektoch. Mojím cieľom je sprístupniť kvalitné 3D modely všetkým RC nadšencom a neustále prinášať nové, inovatívne dizajny.' 
              })}
            </p>
            <div className="creator-badges">
              <span className="badge">
                ✅ {t('creator.experience', { defaultValue: '5+ rokov skúseností' })}
              </span>
              <span className="badge">
                🎯 {t('creator.models', { defaultValue: '500+ modelov' })}
              </span>
              <span className="badge">
                💬 {t('creator.personal', { defaultValue: 'Osobná podpora' })}
              </span>
            </div>
          </div>
          <p className="creator-quote">
            "{t('creator.quote', { 
              defaultValue: 'Verím, že kvalita a detail robia rozdiel. Každý model je vytvorený s vášňou pre RC modelárstvo a testovaný na reálnych projektoch.' 
            })}"
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2 className="cta-title">{t('cta.title', { defaultValue: 'Pripravení začať váš projekt?' })}</h2>
        <p className="cta-description">
          {t('cta.description', { 
            defaultValue: 'Preskúmajte našu kolekciu prémiových STL modelov a začnite tvoriť úžasné RC modely už dnes!' 
          })}
        </p>
        <Link to="/products" className="cta-button">
          {t('cta.button', { defaultValue: 'Prezrieť katalóg' })}
        </Link>
      </section>
    </div>
  );
};

export default About;