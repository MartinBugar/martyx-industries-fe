import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-top">
          <div className="brand-area">
            <div className="brand-name" aria-label="Martyx Industries">Martyx Industries</div>
            <p className="brand-tagline">Advanced 3D solutions for modern creators.</p>
            <div className="social-links" aria-label="Social media">
              <a href="#" aria-label="Twitter" className="social-link" title="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M4 4L20 20M20 4L4 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" aria-label="LinkedIn" className="social-link" title="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                  <circle cx="8" cy="10" r="1" fill="currentColor" />
                  <path d="M7 16V12M11 16V13.5C11 12.1193 12.1193 11 13.5 11C14.8807 11 16 12.1193 16 13.5V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#" aria-label="GitHub" className="social-link" title="GitHub">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.009-.866-.014-1.699-2.782.604-3.369-1.341-3.369-1.341-.454-1.154-1.109-1.463-1.109-1.463-.907-.62.069-.607.069-.607 1.003.07 1.53 1.03 1.53 1.03.892 1.528 2.341 1.087 2.91.832.091-.646.35-1.087.636-1.337-2.221-.253-4.555-1.11-4.555-4.942 0-1.09.39-1.983 1.029-2.682-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.379.202 2.398.099 2.65.64.699 1.028 1.592 1.028 2.682 0 3.842-2.337 4.687-4.565 4.936.359.309.679.919.679 1.852 0 1.336-.012 2.415-.012 2.741 0 .268.18.579.688.48A10.003 10.003 0 0 0 22 12c0-5.523-4.477-10-10-10Z" fill="currentColor" />
                </svg>
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>

          <div className="links-section">
            <div className="links-column">
              <span className="section-title">Company</span>
              <ul className="footer-links">
                <li><Link to="/about">About</Link></li>
                <li><Link to="/about">Careers</Link></li>
              </ul>
            </div>

            <div className="links-column">
              <span className="section-title">Support</span>
              <ul className="footer-links">
                <li><Link to="/about">Contact</Link></li>
                <li><Link to="/about">FAQ</Link></li>
                <li><Link to="/products">Shipping & Returns</Link></li>
              </ul>
            </div>

            <div className="links-column">
              <span className="section-title">Legal</span>
              <ul className="footer-links">
                <li><Link to="/about">Terms of Service</Link></li>
                <li><Link to="/about">Privacy Policy</Link></li>
                <li><Link to="/cookies-policy">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">&copy; {currentYear} Martyx Industries. All rights reserved.</p>
          <nav className="bottom-nav" aria-label="Legal links">
            <Link to="/about">Privacy</Link>
            <Link to="/about">Terms</Link>
            <Link to="/cookies-policy">Cookies</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;