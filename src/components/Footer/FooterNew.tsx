import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  Shield,
  RotateCcw,
  Facebook,
  Instagram,
  Youtube
} from 'lucide-react';
import './FooterNew.css';
import { logInfo } from '../../services/logger';

// Newsletter Form Component
const NewsletterForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setIsValid(validateEmail(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    logInfo('Newsletter subscription:', email);
    setEmail('');
    setIsValid(false);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="footer-new-form">
      <div className="footer-new-form-inner">
        <input
          type="email"
          value={email}
          onChange={handleChange}
          placeholder="Tvoj email"
          className="footer-new-input"
          aria-label="Email adresa pre newsletter"
        />
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="footer-new-button"
          aria-label="Prihlásiť sa na newsletter"
        >
          {isSubmitting ? 'Odosiela...' : 'Prihlásiť'}
        </button>
      </div>
    </form>
  );
};

// Trust Icons Component
const TrustIcons: React.FC = () => {
  return (
    <div className="footer-new-trust">
      {/* Payment Methods */}
      <div className="footer-new-payment">
        <svg viewBox="0 0 48 32" fill="currentColor">
          <rect x="4" y="8" width="40" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="12" width="40" height="4" fill="currentColor" opacity="0.3"/>
        </svg>
        <span>Visa</span>
      </div>

      <div className="footer-new-payment">
        <svg viewBox="0 0 48 32" fill="currentColor">
          <circle cx="18" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
          <circle cx="30" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
        </svg>
        <span>Mastercard</span>
      </div>

      <div className="footer-new-payment">
        <svg viewBox="0 0 48 32" fill="currentColor">
          <path d="M20 12c0-2.2 1.8-4 4-4s4 1.8 4 4v8c0 2.2-1.8 4-4 4s-4-1.8-4-4v-8z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <span>PayPal</span>
      </div>

      {/* Trust Badges */}
      <div className="footer-new-badge">
        <Shield />
        <span>SSL</span>
      </div>

      <div className="footer-new-badge">
        <RotateCcw />
        <span>14 dní na vrátenie</span>
      </div>
    </div>
  );
};

// Footer Column Component
interface FooterColumnProps {
  title: string;
  links: { label: string; href: string }[];
  isMobile?: boolean;
}

const FooterColumn: React.FC<FooterColumnProps> = ({ title, links, isMobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isMobile) {
    return (
      <div className="footer-new-accordion-item">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="footer-new-accordion-button"
          aria-expanded={isOpen}
          aria-controls={`footer-${title.toLowerCase()}`}
        >
          {title}
          <ChevronDown className={`footer-new-accordion-icon ${isOpen ? 'open' : ''}`} />
        </button>
        <div
          id={`footer-${title.toLowerCase()}`}
          className={`footer-new-accordion-content ${isOpen ? 'open' : ''}`}
        >
          <ul className="footer-new-links">
            {links.map((link, index) => (
              <li key={index}>
                <Link to={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="footer-new-column">
      <h3>{title}</h3>
      <ul className="footer-new-links">
        {links.map((link, index) => (
          <li key={index}>
            <Link to={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Social Links Component
const SocialLinks: React.FC = () => {
  const socials = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  return (
    <div className="footer-new-socials">
      {socials.map((social, index) => {
        const Icon = social.icon;
        return (
          <a
            key={index}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-new-social-link"
            aria-label={social.label}
          >
            <Icon />
          </a>
        );
      })}
    </div>
  );
};

// Main Footer Component
const FooterNew: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerColumns = {
    shop: {
      title: 'Shop',
      links: [
        { label: 'Novinky', href: '/products?filter=new' },
        { label: 'Najpredávanejšie', href: '/products?filter=bestsellers' },
        { label: 'STL súbory', href: '/products?category=stl' },
        { label: 'Mechanické sety', href: '/products?category=mechanical' },
        { label: 'Full kity', href: '/products?category=kits' },
        { label: 'Príslušenstvo', href: '/products?category=accessories' },
      ],
    },
    support: {
      title: 'Podpora',
      links: [
        { label: 'Kontakt', href: '/contact' },
        { label: 'Doručenie', href: '/shipping' },
        { label: 'Vrátenie tovaru', href: '/returns' },
        { label: 'Reklamácie', href: '/claims' },
        { label: 'FAQ', href: '/faq' },
      ],
    },
    company: {
      title: 'Spoločnosť',
      links: [
        { label: 'O nás', href: '/about' },
        { label: 'Blog/Novinky', href: '/blog' },
        { label: 'Kariéra', href: '/careers' },
        { label: 'Partnerstvá', href: '/partnerships' },
      ],
    },
    legal: {
      title: 'Právne',
      links: [
        { label: 'Obchodné podmienky', href: '/terms-of-service' },
        { label: 'Ochrana súkromia (GDPR)', href: '/privacy-policy' },
        { label: 'Cookies', href: '/cookies-policy' },
      ],
    },
  };

  return (
    <footer className="footer-new" role="contentinfo">
      {/* JSON-LD Organization Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Martyx Industries",
          "url": "https://martyx-industries.com",
          "logo": "https://martyx-industries.com/logo.png",
          "sameAs": [
            "https://facebook.com/martyxindustries",
            "https://instagram.com/martyxindustries",
            "https://youtube.com/martyxindustries"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "email": "info@martyx-industries.com",
            "telephone": "+421-xxx-xxx-xxx",
            "contactType": "Customer Service"
          }
        })}
      </script>

      <div className="footer-new-content">
        {/* Top Section - CTA */}
        <div className="footer-new-top">
          <div className="footer-new-top-grid">
            <div className="footer-new-cta">
              <h2>Zostaň v obraze</h2>
              <p>Nové modely, exkluzívne zľavy a návody priamo do tvojej schránky.</p>
            </div>
            <div className="footer-new-newsletter">
              <NewsletterForm />
            </div>
          </div>
          <TrustIcons />
        </div>

        {/* Middle Section - Navigation (Mobile Accordion) */}
        <div className="footer-new-accordion">
          <div className="footer-new-middle">
            <FooterColumn title={footerColumns.shop.title} links={footerColumns.shop.links} isMobile />
            <FooterColumn title={footerColumns.support.title} links={footerColumns.support.links} isMobile />
            <FooterColumn title={footerColumns.company.title} links={footerColumns.company.links} isMobile />
            <FooterColumn title={footerColumns.legal.title} links={footerColumns.legal.links} isMobile />
          </div>
        </div>

        {/* Middle Section - Navigation (Desktop Grid) */}
        <div className="footer-new-middle">
          <div className="footer-new-grid">
            <FooterColumn title={footerColumns.shop.title} links={footerColumns.shop.links} />
            <FooterColumn title={footerColumns.support.title} links={footerColumns.support.links} />
            <FooterColumn title={footerColumns.company.title} links={footerColumns.company.links} />
            <FooterColumn title={footerColumns.legal.title} links={footerColumns.legal.links} />

            {/* Contact Column */}
            <div className="footer-new-column">
              <h3>Kontakt</h3>
              <ul className="footer-new-links footer-new-contact">
                <li>
                  <Mail />
                  <a href="mailto:info@martyx-industries.com">
                    info@martyx-industries.com
                  </a>
                </li>
                <li>
                  <Phone />
                  <a href="tel:+421xxxxxxxxx">
                    +421 XXX XXX XXX
                  </a>
                </li>
                <li>
                  <MapPin />
                  <span>
                    Ulica 123<br />
                    Bratislava, 81101<br />
                    Slovensko
                  </span>
                </li>
              </ul>
              <SocialLinks />
            </div>
          </div>
        </div>

        {/* Mobile Contact Section */}
        <div className="footer-new-contact-mobile">
          <h3>Kontakt</h3>
          <ul className="footer-new-links footer-new-contact">
            <li>
              <Mail />
              <a href="mailto:info@martyx-industries.com">
                info@martyx-industries.com
              </a>
            </li>
            <li>
              <Phone />
              <a href="tel:+421xxxxxxxxx">
                +421 XXX XXX XXX
              </a>
            </li>
            <li>
              <MapPin />
              <span>
                Ulica 123, Bratislava, 81101, Slovensko
              </span>
            </li>
          </ul>
          <SocialLinks />
        </div>

        {/* Bottom Section - Copyright & Language */}
        <div className="footer-new-bottom">
          <p className="footer-new-copyright">
            © {currentYear} Martyx Industries. Všetky práva vyhradené.
          </p>

          {/* Language Selector */}
          <div className="footer-new-lang">
            <button
              className="footer-new-lang-button"
              aria-label="Slovenčina"
            >
              SK
            </button>
            <span className="footer-new-lang-separator">|</span>
            <button
              className="footer-new-lang-button inactive"
              aria-label="English"
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterNew;
