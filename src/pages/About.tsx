import React from 'react';
import './Pages.css';

const About: React.FC = () => {
  return (
    <main className="page-container about-page" role="main">
      <section className="about-container" aria-labelledby="about-title">
        <h1 id="about-title">About MartyX Industries</h1>
        <p className="about-lead">
          We engineer 3D‑printed RC platforms and parts that are easy to build, maintain, and upgrade. Designed,
          tested, and refined so you can spend more time driving and less time troubleshooting.
        </p>
        <ul className="about-highlights" aria-label="What to expect">
          <li>RC‑ready designs with standard hardware fitment</li>
          <li>Modular parts for quick repairs and upgrades</li>
          <li>Clear build docs, BOMs, and slicer presets</li>
        </ul>
        <div className="about-cta">
          <a className="btn primary" href="/products">Shop Products</a>
        </div>
      </section>
    </main>
  );
};

export default About;