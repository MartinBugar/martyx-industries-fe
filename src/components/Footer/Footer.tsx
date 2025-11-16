import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import logoImg from '../../assets/logo/logo.png';
import stripeImg from '../../assets/logo/stripe.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        {/* Top Section */}
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link to="/" className={styles.logo} aria-label="Martyx Industries">
              <img src={logoImg} alt="Martyx Industries" />
            </Link>
            <p className={styles.tagline}>
              Špecialisti na RC modely a 3D tlač. Kvalitné STL súbory a kity pre RC nadšencov.
            </p>

            {/* Social Links */}
            <div className={styles.social} aria-label="Social media">
              <a href="#" aria-label="YouTube" className={styles.socialLink} title="YouTube - RC modely">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M23 6.5s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C17.3 3.5 12 3.5 12 3.5s-5.3 0-8.2.1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S.8 8.1.8 9.7v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.9 1.6.1 8 .1 8 .1s5.3 0 8.2-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2V9.7c0-1.6-.2-3.2-.2-3.2zM9.5 15.5v-7l6.8 3.5-6.8 3.5z" fill="currentColor"/>
                </svg>
                <span className={styles.srOnly}>YouTube</span>
              </a>
              <a href="#" aria-label="Instagram" className={styles.socialLink} title="Instagram - RC galéria">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="currentColor" strokeWidth="2"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className={styles.srOnly}>Instagram</span>
              </a>
              <a href="#" aria-label="Facebook" className={styles.socialLink} title="Facebook - RC komunita">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className={styles.srOnly}>Facebook</span>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className={styles.linksGrid}>
            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Spoločnosť</h3>
              <ul className={styles.linkList}>
                <li><Link to="/about">O nás</Link></li>
                <li><Link to="/contact">Kontakt</Link></li>
                <li><Link to="/products">Katalóg</Link></li>
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Produkty</h3>
              <ul className={styles.linkList}>
                <li><Link to="/products">RC Tank Kity</Link></li>
                <li><Link to="/products">STL Súbory</Link></li>
                <li><Link to="/products">Komponenty</Link></li>
              </ul>
            </div>

            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Podpora</h3>
              <ul className={styles.linkList}>
                <li><Link to="/contact">Kontakt & FAQ</Link></li>
                <li><Link to="/build-difficulty-guide">Sprievodca Náročnosťou</Link></li>
                <li><Link to="/terms-of-service">Obchodné podmienky</Link></li>
                <li><Link to="/privacy-policy">Ochrana súkromia</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; {currentYear} Martyx Industries. Všetky práva vyhradené.
          </p>

          {/* Payment Methods */}
          <div className={styles.payment} aria-label="Accepted payment methods">
            <span className={styles.paymentLabel}>Akceptujeme:</span>
            <div className={styles.paymentLogos}>
              <div className={styles.paymentLogo} title="Stripe">
                <img src={stripeImg} alt="Stripe" />
              </div>
            </div>
          </div>

          {/* Bottom Links */}
          <nav className={styles.bottomLinks} aria-label="Legal links">
            <Link to="/privacy-policy">Súkromie</Link>
            <Link to="/terms-of-service">Podmienky</Link>
            <Link to="/cookies-policy">Cookies</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;