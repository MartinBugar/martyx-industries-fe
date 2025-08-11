import React from 'react';
import { Link } from 'react-router-dom';
import '../Pages.css';

const TermsOfService: React.FC = () => {
  const lastUpdated = '11 August 2025';

  return (
    <div className="page-container">
      <h1>Terms of Service</h1>
      <p style={{ color: '#666' }}>Last updated: {lastUpdated}</p>

      <section className="about-section">
        <p>
          Welcome to Martyx Industries. These Terms of Service ("Terms") govern your use of our website and services.
          By accessing or using our services, you agree to be bound by these Terms.
        </p>
      </section>

      <section className="about-section">
        <h2>Use of the service</h2>
        <ul>
          <li>You must be at least 18 years old or have parental consent to use our services.</li>
          <li>You agree not to misuse the services or violate applicable laws.</li>
          <li>We reserve the right to modify or discontinue features at any time.</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Purchases and payments</h2>
        <p>
          All purchases are subject to our pricing and availability. Payments are processed by third-party providers
          under their terms and security standards.
        </p>
      </section>

      <section className="about-section">
        <h2>Intellectual property</h2>
        <p>
          All content, designs, and materials provided are owned by or licensed to Martyx Industries and are protected
          by applicable intellectual property laws. You may not reproduce or distribute content without permission.
        </p>
      </section>

      <section className="about-section">
        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Martyx Industries will not be liable for any indirect, incidental, or
          consequential damages arising from the use of our services.
        </p>
      </section>

      <section className="about-section">
        <h2>Privacy</h2>
        <p>
          Your use of our services is also governed by our <Link to="/privacy-policy">Privacy Policy</Link> and
          our <Link to="/cookies-policy">Cookie Policy</Link>.
        </p>
      </section>

      <section className="about-section">
        <h2>Changes to these terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance
          of the new Terms.
        </p>
      </section>

      <section className="about-section">
        <h2>Contact</h2>
        <p>
          For questions about these Terms, contact us via the details on our <Link to="/about">About</Link> page.
        </p>
      </section>
    </div>
  );
};

export default TermsOfService;
