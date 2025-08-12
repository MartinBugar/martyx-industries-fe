import React from 'react';
import './Pages.css';

const About: React.FC = () => {
  return (
    <div className="page-container about-page" role="main">
      {/* Hero Section */}
      <section className="about-hero" aria-labelledby="about-hero-heading">
        <div className="hero-background">
          <div className="tech-grid"></div>
        </div>
        <div className="hero-content">
          <span className="eyebrow">Innovation in Motion</span>
          <h1 id="about-hero-heading">
            <span className="gradient-text">Advanced 3D Printed</span>
            <br />
            RC Engineering Platform
          </h1>
          <p className="hero-description">
            We revolutionize RC modeling through precision 3D printing technology, 
            delivering high-performance, modular platforms engineered for enthusiasts 
            and professionals who demand excellence.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href="/products">
              <span>Explore Models</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a className="btn subtle" href="mailto:info@martyxindustries.com">
              <span>Contact Team</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="about-stats" aria-label="Performance metrics">
        <div className="stats-container">
          <div className="stat">
            <div className="stat-number" aria-label="Parts printed">2,500+</div>
            <div className="stat-label">Precision Parts</div>
            <div className="stat-description">Successfully printed and tested</div>
          </div>
          <div className="stat">
            <div className="stat-number" aria-label="Test hours">1,200+</div>
            <div className="stat-label">Test Hours</div>
            <div className="stat-description">Rigorous field validation</div>
          </div>
          <div className="stat">
            <div className="stat-number" aria-label="Average rating">4.9★</div>
            <div className="stat-label">Customer Rating</div>
            <div className="stat-description">Consistent excellence</div>
          </div>
          <div className="stat">
            <div className="stat-number" aria-label="Open source">Open</div>
            <div className="stat-label">Source Files</div>
            <div className="stat-description">Community-driven development</div>
          </div>
        </div>
      </section>

      {/* Core Technologies */}
      <section className="about-technologies" aria-label="Core technologies">
        <div className="section-header">
          <h2>Core Technologies</h2>
          <p>Cutting-edge engineering meets precision manufacturing</p>
        </div>
        <div className="tech-grid">
          <div className="tech-card">
            <div className="tech-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Advanced 3D Printing</h3>
            <p>Multi-material printing with precision tolerances, optimized infill patterns, and strength-tested profiles for real-world RC applications.</p>
            <div className="tech-features">
              <span>PLA+ / PETG / ABS</span>
              <span>0.1mm Precision</span>
              <span>Strength Optimized</span>
            </div>
          </div>
          <div className="tech-card">
            <div className="tech-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>RC-Optimized Design</h3>
            <p>Standard mounting systems, hardware compatibility, and electronics integration planned from initial concept to final assembly.</p>
            <div className="tech-features">
              <span>Standard Mounts</span>
              <span>Hardware Ready</span>
              <span>Electronics Fit</span>
            </div>
          </div>
          <div className="tech-card">
            <div className="tech-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Modular Architecture</h3>
            <p>Component-based design allowing easy repairs, upgrades, and customization. Replace only what breaks, upgrade incrementally.</p>
            <div className="tech-features">
              <span>Modular Design</span>
              <span>Easy Repair</span>
              <span>Upgrade Path</span>
            </div>
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="about-process" aria-label="Development process">
        <div className="section-header">
          <h2>Engineering Process</h2>
          <p>From concept to track-ready performance</p>
        </div>
        <div className="process-timeline">
          <div className="process-step">
            <div className="step-number">01</div>
            <div className="step-content">
              <h4>Design & Engineering</h4>
              <p>Parametric CAD with real-world tolerances, hardware specifications, and serviceability requirements.</p>
              <div className="step-tools">
                <span>Fusion 360</span>
                <span>SolidWorks</span>
                <span>FEA Analysis</span>
              </div>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">02</div>
            <div className="step-content">
              <h4>Precision Manufacturing</h4>
              <p>Material-specific profiles optimized for layer adhesion, dimensional accuracy, and structural integrity.</p>
              <div className="step-tools">
                <span>Cura Engine</span>
                <span>PrusaSlicer</span>
                <span>Quality Control</span>
              </div>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">03</div>
            <div className="step-content">
              <h4>Rigorous Testing</h4>
              <p>Assembly validation, stress testing, and field trials to identify and resolve performance bottlenecks.</p>
              <div className="step-tools">
                <span>Load Testing</span>
                <span>Impact Analysis</span>
                <span>Field Trials</span>
              </div>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">04</div>
            <div className="step-content">
              <h4>Documentation & Release</h4>
              <p>Comprehensive documentation including BOM, assembly guides, maintenance procedures, and slicer profiles.</p>
              <div className="step-tools">
                <span>Assembly Guides</span>
                <span>Slicer Profiles</span>
                <span>Video Tutorials</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Materials & Specifications */}
      <section className="about-materials" aria-label="Materials and specifications">
        <div className="materials-grid">
          <div className="material-card">
            <h3>Materials & Tuning</h3>
            <p>PLA+ for rapid prototyping, PETG/ABS for durability, and advanced composites for high-stress applications. We provide optimized slicer profiles and torque specifications.</p>
            <div className="material-specs">
              <div className="spec-item">
                <span className="spec-label">Layer Height</span>
                <span className="spec-value">0.1-0.2mm</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Infill Density</span>
                <span className="spec-value">20-60%</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Print Speed</span>
                <span className="spec-value">40-60mm/s</span>
              </div>
            </div>
          </div>
          <div className="material-card">
            <h3>Quality Assurance</h3>
            <p>Every design undergoes comprehensive testing including dimensional verification, stress analysis, and real-world performance validation before release.</p>
            <div className="quality-metrics">
              <div className="metric-item">
                <span className="metric-label">Dimensional Accuracy</span>
                <span className="metric-value">±0.1mm</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Strength Testing</span>
                <span className="metric-value">100+ Hours</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Success Rate</span>
                <span className="metric-value">99.8%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="about-cta">
        <div className="cta-background">
          <div className="cta-pattern"></div>
        </div>
        <div className="cta-content">
          <h2>Ready to Experience Advanced RC Engineering?</h2>
          <p>Join the community of enthusiasts and professionals who trust our precision-engineered 3D printed RC solutions.</p>
          <div className="cta-actions">
            <a className="btn primary" href="/products">
              <span>Explore Models</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a className="btn subtle" href="mailto:info@martyxindustries.com">
              <span>Contact Engineering Team</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;