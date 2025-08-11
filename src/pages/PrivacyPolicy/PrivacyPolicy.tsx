import React from 'react';
import { Link } from 'react-router-dom';
import '../Pages.css';

const PrivacyPolicy: React.FC = () => {
  const lastUpdated = '11 August 2025';

  return (
    <div className="page-container">
      <h1>Privacy Policy</h1>
      <p style={{ color: '#666' }}>Last updated: {lastUpdated}</p>

      <section className="about-section">
        <p>
          This Privacy Policy explains how Martyx Industries ("we", "us", or "our") collects, uses, and safeguards
          your information when you visit our website and use our services. By using our site, you agree to the
          collection and use of information in accordance with this policy.
        </p>
      </section>

      <section className="about-section">
        <h2>Information we collect</h2>
        <ul>
          <li>Account information such as name, email address, and password.</li>
          <li>Order and payment details processed securely via trusted payment providers.</li>
          <li>Usage data and analytics to improve performance and user experience.</li>
          <li>Cookies and similar technologies. See our <Link to="/cookies-policy">Cookie Policy</Link> for details.</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>How we use your information</h2>
        <ul>
          <li>To provide, maintain, and improve our services.</li>
          <li>To process transactions and fulfill orders.</li>
          <li>To communicate with you regarding your account, orders, and updates.</li>
          <li>To enhance security, prevent fraud, and comply with legal obligations.</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Data retention</h2>
        <p>
          We retain personal data only for as long as necessary to provide our services and comply with legal
          requirements. When data is no longer needed, we securely delete or anonymize it.
        </p>
      </section>

      <section className="about-section">
        <h2>Sharing your information</h2>
        <p>
          We do not sell your personal information. We may share information with service providers (e.g., payment
          processors) strictly for operational purposes and only under appropriate safeguards.
        </p>
      </section>

      <section className="about-section">
        <h2>Your rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, or delete your personal data, and to
          object to or restrict certain processing. To exercise these rights, contact us via the details on our
          <Link to="/about">About</Link> page.
        </p>
      </section>

      <section className="about-section">
        <h2>Changes to this policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post any changes on this page and update the
          "Last updated" date above.
        </p>
      </section>

      <section className="about-section">
        <h2>Contact us</h2>
        <p>
          If you have questions about this Privacy Policy, please reach out via the contact details on our
          <Link to="/about">About</Link> page.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
