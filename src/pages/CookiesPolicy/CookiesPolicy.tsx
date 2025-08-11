import React from 'react';
import { Link } from 'react-router-dom';
import '../Pages.css';

const CookiesPolicy: React.FC = () => {
  const lastUpdated = '11 August 2025';
  return (
    <div className="page-container">
      <h1>Cookie Policy</h1>
      <p style={{ color: '#666' }}>Last updated: {lastUpdated}</p>

      <section className="about-section">
        <p>
          This Cookie Policy explains how Martyx Industries ("we", "us", or "our") uses cookies and similar
          technologies on our website. It should be read together with our <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
      </section>

      <section className="about-section">
        <h2>What are cookies?</h2>
        <p>
          Cookies are small text files that are stored on your device when you visit a website. They help the site
          remember your actions and preferences (such as login, language, and other settings) over a period of time,
          so you don’t have to re-enter them whenever you come back to the site or browse from one page to another.
        </p>
      </section>

      <section className="about-section">
        <h2>How we use cookies</h2>
        <p>
          We use cookies for the following purposes:
        </p>
        <ul>
          <li><strong>Strictly necessary cookies</strong> – Required for core site functionality, such as security, network
            management, and accessibility. These cannot be disabled.</li>
          <li><strong>Analytics cookies</strong> – Help us understand how visitors interact with our site so we can improve
            performance and user experience.</li>
          <li><strong>Marketing cookies</strong> – Used to deliver relevant content and offers based on your interests.</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Cookies we use</h2>
        <p>Below is an overview of the types of cookies you may encounter on our site:</p>
        <ul>
          <li>
            <strong>Session cookies</strong> – Temporary cookies that stay on your device until you close your browser.
          </li>
          <li>
            <strong>Persistent cookies</strong> – Remain on your device for a set period or until deleted.
          </li>
          <li>
            <strong>First-party cookies</strong> – Set by our website directly.
          </li>
          <li>
            <strong>Third-party cookies</strong> – Set by third parties (e.g., analytics or payment providers) when
            interacting with our site.
          </li>
        </ul>
      </section>

      <section className="about-section">
        <h2>Managing your cookie preferences</h2>
        <p>
          You can manage your preferences at any time using the cookie banner on our site. To update your choices, open
          the banner via the "Preferences" option when it appears, or clear your cookies to have the banner re-appear.
        </p>
        <p>
          You can also block or delete cookies through your browser settings. Please note that blocking some types of
          cookies may impact your experience on the site and the services we are able to offer.
        </p>
      </section>

      <section className="about-section">
        <h2>Changes to this policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes to our cookies or for operational,
          legal, or regulatory reasons. Please revisit this page regularly to stay informed about our use of cookies.
        </p>
      </section>

      <section className="about-section">
        <h2>Contact us</h2>
        <p>
          If you have any questions about our use of cookies, please contact us via the details provided on our
          <Link to="/about">About</Link> page.
        </p>
      </section>
    </div>
  );
};

export default CookiesPolicy;
