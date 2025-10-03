'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import './About.css';

export default function AboutPage() {
  const { t } = useTranslation('about');

  return (
    <div className="about-page" aria-label="About Page">
      {/* Modern Hero Section with Integrated Mascot */}
      <section className="modern-hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="title-line-1">{t('title', { defaultValue: 'O Martyx Industries' })}</span>
              <span className="title-highlight">Inovatívne 3D riešenia</span>
            </h1>
            <p className="hero-subtitle">{t('lead', { defaultValue: 'Spájame vášeň pre RC modelárstvo s najmodernejšou technológiou 3D tlače' })}</p>

            <div className="hero-features-grid">
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">✓</span>
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">Testované modely</h3>
                  <p className="feature-desc">Každý model je dôkladne testovaný</p>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">⚡</span>
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">Okamžité stiahnutie</h3>
                  <p className="feature-desc">Dostupné hneď po nákupe</p>
                </div>
              </div>
              <div className="feature-card">
                <div className="feature-icon-wrapper">
                  <span className="feature-icon">🎯</span>
                </div>
                <div className="feature-content">
                  <h3 className="feature-title">Vysoká kvalita</h3>
                  <p className="feature-desc">Prémiové 3D modely</p>
                </div>
              </div>
            </div>

            <div className="hero-cta">
              <div className="hero-button-container">
                <Link href="/products" className="hero-button modern">
                  <span className="button-content">
                    <span className="button-icon">🚀</span>
                    <span className="button-text">{t('cta.button', { defaultValue: 'Prezrieť katalóg' })}</span>
                    <span className="button-arrow">→</span>
                  </span>
                  <div className="button-shine"></div>
                </Link>
              </div>
            </div>
          </div>

          {/* Enhanced Mascot Integration */}
          <div className="mascot-showcase">
            <div className="mascot-background">
              <div className="bg-circle circle-1"></div>
              <div className="bg-circle circle-2"></div>
              <div className="bg-circle circle-3"></div>
              <div className="bg-particles">
                <div className="particle particle-1"></div>
                <div className="particle particle-2"></div>
                <div className="particle particle-3"></div>
                <div className="particle particle-4"></div>
                <div className="particle particle-5"></div>
              </div>
            </div>
            <div className="mascot-container">
              <div className="mascot-frame">
                <img
                  src="/cassandra/About-Cass.png"
                  alt="Cassandra - Martyx Industries Mascot"
                  className="mascot-image"
                  loading="eager"
                />
                <div className="mascot-footer">
                  <div className="mascot-info-card">
                    <h3 className="mascot-name">Cassandra</h3>
                    <p className="mascot-role">Váš 3D sprievodca</p>
                  </div>
                </div>
                <div className="mascot-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="modern-stats-section">
        <div className="stats-container">
          <div className="stats-header">
            <h2 className="stats-title">Naše úspechy v číslach</h2>
            <p className="stats-subtitle">Dôvera tisícov spokojných zákazníkov</p>
          </div>
          <div className="stats-grid">
            <div className="stat-card modern">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-number">500+</div>
                <div className="stat-label">{t('stats.models', { defaultValue: 'Unikátnych modelov' })}</div>
                <div className="stat-description">Každý mesiac pridávame nové</div>
              </div>
            </div>
            <div className="stat-card modern">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-number">10k+</div>
                <div className="stat-label">{t('stats.customers', { defaultValue: 'Spokojných zákazníkov' })}</div>
                <div className="stat-description">Z celého sveta</div>
              </div>
            </div>
            <div className="stat-card modern">
              <div className="stat-icon">🚀</div>
              <div className="stat-content">
                <div className="stat-number">50+</div>
                <div className="stat-label">{t('stats.monthly', { defaultValue: 'Nových modelov mesačne' })}</div>
                <div className="stat-description">Neustále inovácie</div>
              </div>
            </div>
            <div className="stat-card modern">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <div className="stat-number">24/7</div>
                <div className="stat-label">{t('stats.download', { defaultValue: 'Okamžité stiahnutie' })}</div>
                <div className="stat-description">Kedykoľvek dostupné</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern About Content */}
      <section className="modern-about-content">
        <div className="content-wrapper">
          {/* Mission Section */}
          <div className="content-section mission-section">
            <div className="section-content">
              <div className="section-header">
                <span className="section-badge">🎯 Misia</span>
                <h2 className="section-title">{t('mission.title', { defaultValue: 'Naša misia' })}</h2>
              </div>
              <p className="section-description">
                {t('mission.description', {
                  defaultValue: 'Spájame vášeň pre RC modelárstvo s najmodernejšou technológiou 3D tlače. Naše STL súbory sú navrhnuté s maximálnou pozornosťou k detailom, optimalizované pre jednoduchú tlač a perfektný výsledok.'
                })}
              </p>
              <div className="features-grid">
                <div className="feature-item modern">
                  <div className="feature-icon-modern">🏆</div>
                  <div className="feature-text">
                    <h4>Profesionálne navrhnuté modely</h4>
                    <p>Každý detail premyslený</p>
                  </div>
                </div>
                <div className="feature-item modern">
                  <div className="feature-icon-modern">🔧</div>
                  <div className="feature-text">
                    <h4>Optimalizované pre všetky tlačiarne</h4>
                    <p>Funguje na každom zariadení</p>
                  </div>
                </div>
                <div className="feature-item modern">
                  <div className="feature-icon-modern">📚</div>
                  <div className="feature-text">
                    <h4>Detailné návody a podpory</h4>
                    <p>Krok za krokom k úspechu</p>
                  </div>
                </div>
                <div className="feature-item modern">
                  <div className="feature-icon-modern">🤝</div>
                  <div className="feature-text">
                    <h4>Komunita nadšencov</h4>
                    <p>Spolu sme silnejší</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="section-visual">
              <div className="visual-showcase mission-visual">
                <div className="showcase-item">
                  <div className="showcase-icon">🚁</div>
                  <span>Drony</span>
                </div>
                <div className="showcase-item">
                  <div className="showcase-icon">🚗</div>
                  <span>RC autá</span>
                </div>
                <div className="showcase-item">
                  <div className="showcase-icon">🚤</div>
                  <span>Lode</span>
                </div>
                <div className="showcase-item">
                  <div className="showcase-icon">🏎️</div>
                  <span>Formuly</span>
                </div>
              </div>
            </div>
          </div>

          {/* Why Choose Us Section */}
          <div className="content-section why-section">
            <div className="section-visual">
              <div className="visual-showcase why-visual">
                <div className="experience-badge">
                  <span className="badge-number">5+</span>
                  <span className="badge-text">rokov skúseností</span>
                </div>
                <div className="quality-indicators">
                  <div className="indicator">
                    <div className="indicator-icon">✅</div>
                    <span>Testované</span>
                  </div>
                  <div className="indicator">
                    <div className="indicator-icon">🔄</div>
                    <span>Aktualizované</span>
                  </div>
                  <div className="indicator">
                    <div className="indicator-icon">🛡️</div>
                    <span>Garantované</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="section-content">
              <div className="section-header">
                <span className="section-badge">⭐ Kvalita</span>
                <h2 className="section-title">{t('why.title', { defaultValue: 'Prečo si vybrať nás?' })}</h2>
              </div>
              <p className="section-description">
                {t('why.description', {
                  defaultValue: 'S viac ako 5 rokmi skúseností v oblasti 3D modelovania a RC modelárstva vám prinášame overené riešenia, ktoré fungujú. Každý model testujeme na rôznych typoch tlačiarní a materiálov.'
                })}
              </p>
              <div className="features-grid">
                <div className="feature-item modern">
                  <div className="feature-icon-modern">🧪</div>
                  <div className="feature-text">
                    <h4>Testované na reálnych projektoch</h4>
                    <p>Overené v praxi</p>
                  </div>
                </div>
                <div className="feature-item modern">
                  <div className="feature-icon-modern">🔄</div>
                  <div className="feature-text">
                    <h4>Pravidelné aktualizácie modelov</h4>
                    <p>Stále sa zlepšujeme</p>
                  </div>
                </div>
                <div className="feature-item modern">
                  <div className="feature-icon-modern">💬</div>
                  <div className="feature-text">
                    <h4>Zákaznícka podpora v slovenčine</h4>
                    <p>Pomôžeme vám kedykoľvek</p>
                  </div>
                </div>
                <div className="feature-item modern">
                  <div className="feature-icon-modern">🛡️</div>
                  <div className="feature-text">
                    <h4>Garancia kompatibility</h4>
                    <p>Funguje alebo vrátime peniaze</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Creator Section */}
      <section className="modern-creator-section">
        <div className="creator-wrapper">
          <div className="creator-header">
            <span className="section-badge">👨‍💻 Tím</span>
            <h2 className="creator-title">{t('creator.title', { defaultValue: 'O tvorcovi' })}</h2>
            <p className="creator-subtitle">Vášeň pre detail a kvalitu</p>
          </div>

          <div className="creator-content">
            <div className="creator-profile">
              <div className="profile-image-container">
                <div className="profile-avatar">
                  <div className="avatar-icon">🚁</div>
                  <div className="avatar-glow"></div>
                </div>
                <div className="profile-decoration">
                  <div className="decoration-ring ring-1"></div>
                  <div className="decoration-ring ring-2"></div>
                </div>
              </div>

              <div className="profile-info">
                <h3 className="profile-name">{t('creator.role', { defaultValue: 'Nezávislý dizajnér & modelár' })}</h3>
                <p className="profile-role">{t('creator.subtitle', { defaultValue: '3D Designer, RC nadšenec, Zakladateľ' })}</p>

                <div className="profile-badges">
                  <div className="profile-badge">
                    <span className="badge-icon">✅</span>
                    <span className="badge-text">{t('creator.experience', { defaultValue: '5+ rokov skúseností' })}</span>
                  </div>
                  <div className="profile-badge">
                    <span className="badge-icon">🎯</span>
                    <span className="badge-text">{t('creator.models', { defaultValue: '500+ modelov' })}</span>
                  </div>
                  <div className="profile-badge">
                    <span className="badge-icon">💬</span>
                    <span className="badge-text">{t('creator.personal', { defaultValue: 'Osobná podpora' })}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="creator-story">
              <div className="story-content">
                <p className="story-text">
                  {t('creator.bio', {
                    defaultValue: 'Som vášnivý modelár s dlhoročnými skúsenosťami v navrhovaní a 3D tlači RC modelov. Každý model navrhujem s láskou k detailom a testovaním na vlastných projektoch. Mojím cieľom je sprístupniť kvalitné 3D modely všetkým RC nadšencom a neustále prinášať nové, inovatívne dizajny.'
                  })}
                </p>

                <div className="story-quote">
                  <div className="quote-mark">"</div>
                  <p className="quote-text">
                    {t('creator.quote', {
                      defaultValue: 'Verím, že kvalita a detail robia rozdiel. Každý model je vytvorený s vášňou pre RC modelárstvo a testovaný na reálnych projektoch.'
                    })}
                  </p>
                </div>
              </div>

              <div className="story-visual">
                <div className="visual-elements">
                  <div className="element-item">
                    <div className="element-icon">🎨</div>
                    <span>Dizajn</span>
                  </div>
                  <div className="element-item">
                    <div className="element-icon">🔬</div>
                    <span>Testovanie</span>
                  </div>
                  <div className="element-item">
                    <div className="element-icon">🚀</div>
                    <span>Inovácie</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="modern-cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <div className="cta-header">
              <h2 className="cta-title">{t('cta.title', { defaultValue: 'Pripravení začať váš projekt?' })}</h2>
              <p className="cta-description">
                {t('cta.description', {
                  defaultValue: 'Preskúmajte našu kolekciu prémiových STL modelov a začnite tvoriť úžasné RC modely už dnes!'
                })}
              </p>
            </div>

            <div className="cta-actions">
              <Link href="/products" className="cta-button primary">
                <span className="button-content">
                  <span className="button-text">{t('cta.button', { defaultValue: 'Prezrieť katalóg' })}</span>
                  <span className="button-icon">🚀</span>
                </span>
                <div className="button-glow"></div>
              </Link>

              <div className="cta-features">
                <div className="cta-feature">
                  <span className="feature-icon">⚡</span>
                  <span>Okamžité stiahnutie</span>
                </div>
                <div className="cta-feature">
                  <span className="feature-icon">🛡️</span>
                  <span>Garancia kvality</span>
                </div>
                <div className="cta-feature">
                  <span className="feature-icon">💬</span>
                  <span>Podpora 24/7</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cta-background">
            <div className="bg-gradient"></div>
            <div className="bg-pattern">
              <div className="pattern-dot"></div>
              <div className="pattern-dot"></div>
              <div className="pattern-dot"></div>
              <div className="pattern-dot"></div>
              <div className="pattern-dot"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
