import React from 'react';
import './Pages.css';

const About: React.FC = () => {
  return (
    <div className="page-container about-page" role="main">
      <section className="about-hero" aria-labelledby="about-hero-heading">
        <span className="eyebrow">About MartyX Industries</span>
        <h1 id="about-hero-heading">Engineered RC platforms. 3D‑printed. Track‑proven.</h1>
        <p>
          We design and 3D print modular, RC‑ready vehicles and parts — precision tuned, field‑tested,
          and upgrade‑friendly. From CAD to course, everything is built to run hard and be easy to maintain.
        </p>
        <div className="hero-actions">
          <a className="btn primary" href="/products">Explore Models</a>
          <a className="btn subtle" href="mailto:info@martyxindustries.com">Contact Us</a>
        </div>
      </section>

      <section className="about-stats" aria-label="By the numbers">
        <div className="stat">
          <div className="number" aria-label="Parts printed">1,000+</div>
          <div className="label">Parts printed</div>
        </div>
        <div className="stat">
          <div className="number" aria-label="Successful test hours">500+</div>
          <div className="label">Test hours</div>
        </div>
        <div className="stat">
          <div className="number" aria-label="Average rating">4.9★</div>
          <div className="label">Average rating</div>
        </div>
        <div className="stat">
          <div className="number" aria-label="Open presets">Open</div>
          <div className="label">Slicer presets</div>
        </div>
      </section>

      <section className="about-grid" aria-label="What makes us different">
        <div className="about-card">
          <div className="icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h3>Precision 3D Printing</h3>
          <p>Functional geometries, strong infill patterns, and tuned profiles for real RC abuse.</p>
        </div>
        <div className="about-card">
          <div className="icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2l3 7h7l-5.5 4 2.5 7-7-4.5L5 20l2.5-7L2 9h7l3-7z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </div>
          <h3>RC‑Ready by Design</h3>
          <p>Standard mounts, hardware compatibility, and electronics planned from day one.</p>
        </div>
        <div className="about-card">
          <div className="icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 8h12v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <h3>Modular & Repairable</h3>
          <p>Replace only what breaks. Upgrade in stages. Keep your model running.</p>
        </div>
      </section>

      <section className="about-details">
        <div className="detail">
          <h2>Materials & Tuning</h2>
          <p>
            PLA+ for prototyping, PETG/ABS for durability, and Nylon/CF for high‑stress parts. We publish
            recommended slicer presets and torque specs — so your print matches our test rigs.
          </p>
        </div>
        <div className="detail">
          <h2>From CAD to Track</h2>
          <p>
            Every release is printed, assembled, and track‑tested. Documentation includes BOM, assembly steps,
            and maintenance tips to keep you running longer.
          </p>
        </div>
      </section>

      <section className="about-timeline" aria-label="Our process">
        <ol className="timeline">
          <li className="step">
            <span className="step-index">01</span>
            <h4>Design</h4>
            <p>Parametric CAD with real‑world tolerances, hardware callouts, and serviceability in mind.</p>
          </li>
          <li className="step">
            <span className="step-index">02</span>
            <h4>Print</h4>
            <p>Material‑matched profiles, tuned for layer adhesion, dimensional accuracy, and strength.</p>
          </li>
          <li className="step">
            <span className="step-index">03</span>
            <h4>Test</h4>
            <p>Assemble, bash, measure. We iterate on weak points and publish fixes fast.</p>
          </li>
          <li className="step">
            <span className="step-index">04</span>
            <h4>Release</h4>
            <p>Ship with docs, presets, and spares so you can build with confidence.</p>
          </li>
        </ol>
      </section>

      <section className="about-cta">
        <div className="cta-inner">
          <h2>Ready to build?</h2>
          <p>Explore our RC models and parts — or contact us for custom work.</p>
          <div className="cta-actions">
            <a className="btn primary" href="/products">Explore Models</a>
            <a className="btn subtle" href="mailto:info@martyxindustries.com">Contact Us</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;