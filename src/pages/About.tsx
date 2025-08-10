import React from 'react';
import './Pages.css';

const About: React.FC = () => {
  return (
    <div className="page-container about-page">
      <section className="about-hero">
        <h1>3D‑Printed RC Models, Engineered to Perform</h1>
        <p>
          We design and 3D print modular, RC‑ready vehicles and parts — precision tuned, field tested,
          and upgrade friendly.
        </p>
      </section>

      <section className="about-grid" aria-label="What makes us different">
        <div className="about-card">
          <h3>Precision 3D Printing</h3>
          <p>Functional geometries, strong infill patterns, and material profiles dialed for real RC use.</p>
        </div>
        <div className="about-card">
          <h3>RC‑Ready by Design</h3>
          <p>Standardized mounting points, hardware compatibility, and electronics space planned from day one.</p>
        </div>
        <div className="about-card">
          <h3>Modular & Repairable</h3>
          <p>Replace only what breaks. Upgrade in stages. Keep your model running without the hassle.</p>
        </div>
      </section>

      <section className="about-details">
        <div className="detail">
          <h2>Materials & Tuning</h2>
          <p>
            PLA+ for prototyping, PETG/ABS for durability, and Nylon/CF for high‑stress parts. We publish
            recommended slicer presets and torque specs.
          </p>
        </div>
        <div className="detail">
          <h2>From CAD to Track</h2>
          <p>
            Every release is printed, assembled, and track‑tested. Documentation includes BOM, assembly steps,
            and maintenance tips.
          </p>
        </div>
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