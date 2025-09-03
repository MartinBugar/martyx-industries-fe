import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import logoImg from '../../assets/logo/logo.png';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-top">
          <div className="brand-area">
            <Link to="/" className="brand-logo" aria-label="Martyx Industries">
              <img src={logoImg} alt="Martyx Industries" className="brand-logo-img" />
            </Link>
            <p className="brand-tagline">Špecialisti na RC modely a 3D tlač. Kvalitné STL súbory a kity pre RC nadšencov.</p>
            
            <div className="company-highlights">
              <div className="highlight-item">
                <div className="highlight-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <span>500+ modelov</span>
              </div>
              <div className="highlight-item">
                <div className="highlight-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <span>10k+ spokojných zákazníkov</span>
              </div>
              <div className="highlight-item">
                <div className="highlight-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <span>Okamžité stiahnutie</span>
              </div>
            </div>
            
            <div className="social-links" aria-label="Social media">
              <a href="#" aria-label="YouTube" className="social-link" title="YouTube - RC modely a návody">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M23 6.5s-.2-1.4-.8-2c-.8-.8-1.6-.8-2-.9C17.3 3.5 12 3.5 12 3.5s-5.3 0-8.2.1c-.4.1-1.2.1-2 .9-.6.6-.8 2-.8 2S.8 8.1.8 9.7v1.5c0 1.6.2 3.2.2 3.2s.2 1.4.8 2c.8.8 1.8.8 2.2.9 1.6.1 8 .1 8 .1s5.3 0 8.2-.1c.4-.1 1.2-.1 2-.9.6-.6.8-2 .8-2s.2-1.6.2-3.2V9.7c0-1.6-.2-3.2-.2-3.2zM9.5 15.5v-7l6.8 3.5-6.8 3.5z" fill="currentColor"/>
                </svg>
                <span className="sr-only">YouTube</span>
              </a>
              <a href="#" aria-label="Instagram" className="social-link" title="Instagram - RC galéria">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="currentColor" strokeWidth="2"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span className="sr-only">Instagram</span>
              </a>
              <a href="#" aria-label="Facebook" className="social-link" title="Facebook - RC komunita">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="sr-only">Facebook</span>
              </a>
            </div>
          </div>

          <div className="links-section">
            <div className="links-column">
              <span className="section-title">Spoločnosť</span>
              <ul className="footer-links">
                <li><Link to="/about">O nás</Link></li>
                <li><Link to="/contact">Kontakt</Link></li>
                <li><Link to="/products">Katalóg</Link></li>
              </ul>
            </div>

            <div className="links-column">
              <span className="section-title">Produkty</span>
              <ul className="footer-links">
                <li><Link to="/products">RC Tank Kity</Link></li>
                <li><Link to="/products">STL Súbory</Link></li>
                <li><Link to="/products">Komponenty</Link></li>
              </ul>
            </div>

            <div className="links-column">
              <span className="section-title">Podpora</span>
              <ul className="footer-links">
                <li><Link to="/contact">Kontakt & FAQ</Link></li>
                <li><Link to="/terms-of-service">Obchodné podmienky</Link></li>
                <li><Link to="/privacy-policy">Ochrana súkromia</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">&copy; {currentYear} Martyx Industries. Všetky práva vyhradené. RC modely a 3D tlač.</p>
          
          <div className="payment-methods" aria-label="Accepted payment methods">
            <span className="payment-label">Akceptujeme:</span>
            <div className="payment-logos">
              <div className="payment-logo" title="Visa">
                <svg viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.5 2.5h-7.5l-1.5 11h7.5l1.5-11z" fill="#1A1F71"/>
                  <path d="M15.5 8c0-2.5 1.5-4.5 3.5-4.5s3.5 2 3.5 4.5-1.5 4.5-3.5 4.5-3.5-2-3.5-4.5z" fill="#1A1F71"/>
                  <path d="M25.5 2.5h-2.5l-1.5 11h2.5l1.5-11z" fill="#1A1F71"/>
                  <path d="M30.5 2.5h-2.5l-1.5 11h2.5l1.5-11z" fill="#1A1F71"/>
                  <path d="M35.5 2.5h-2.5l-1.5 11h2.5l1.5-11z" fill="#1A1F71"/>
                  <path d="M40.5 2.5h-2.5l-1.5 11h2.5l1.5-11z" fill="#1A1F71"/>
                  <path d="M45.5 2.5h-2.5l-1.5 11h2.5l1.5-11z" fill="#1A1F71"/>
                </svg>
              </div>
              <div className="payment-logo" title="Mastercard">
                <svg viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="6" fill="#EB001B"/>
                  <circle cx="16" cy="8" r="6" fill="#F79E1B"/>
                  <path d="M14 5.5c1.5 1.5 1.5 3.5 0 5" stroke="#FF5F00" strokeWidth="2" fill="none"/>
                </svg>
              </div>
              <div className="payment-logo" title="PayPal">
                <svg viewBox="0 0 48 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 4.5c0-1.5 1-2.5 2.5-2.5h4c2 0 3.5 1.5 3.5 3.5v1c0 2-1.5 3.5-3.5 3.5h-2l-1 4h-2l1-4h-2.5c-1 0-2-1-2-2v-1z" fill="#003087"/>
                  <path d="M20 4.5c0-1.5 1-2.5 2.5-2.5h2c1.5 0 2.5 1 2.5 2.5v1c0 1.5-1 2.5-2.5 2.5h-2l-1 4h-2l1-4h-1.5c-1 0-2-1-2-2v-1z" fill="#009CDE"/>
                </svg>
              </div>
            </div>
          </div>
          
          <nav className="bottom-nav" aria-label="Legal links">
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