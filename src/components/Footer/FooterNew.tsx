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
    console.log('Newsletter subscription:', email);
    setEmail('');
    setIsValid(false);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex gap-1.5">
        <input
          type="email"
          value={email}
          onChange={handleChange}
          placeholder="Tvoj email"
          className="flex-1 px-3 py-2 text-sm bg-[#141414] text-white border border-[#1A1A1A] rounded focus:outline-none focus:ring-1 focus:ring-[#FFC400] focus:border-transparent transition-all"
          aria-label="Email adresa pre newsletter"
        />
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="px-4 py-2 text-sm bg-[#FFC400] text-[#0D0D0D] font-semibold rounded hover:bg-[#FFD633] disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-1 focus:ring-[#FFC400]"
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
    <div className="flex flex-wrap items-center gap-3 text-[#B3B3B3]">
      {/* Payment Methods */}
      <div className="flex items-center gap-1.5">
        <svg className="w-7 h-5 opacity-70" viewBox="0 0 48 32" fill="currentColor">
          <rect x="4" y="8" width="40" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="12" width="40" height="4" fill="currentColor" opacity="0.3"/>
        </svg>
        <span className="text-[10px]">Visa</span>
      </div>

      <div className="flex items-center gap-1.5">
        <svg className="w-7 h-5 opacity-70" viewBox="0 0 48 32" fill="currentColor">
          <circle cx="18" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
          <circle cx="30" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
        </svg>
        <span className="text-[10px]">Mastercard</span>
      </div>

      <div className="flex items-center gap-1.5">
        <svg className="w-7 h-5 opacity-70" viewBox="0 0 48 32" fill="currentColor">
          <path d="M20 12c0-2.2 1.8-4 4-4s4 1.8 4 4v8c0 2.2-1.8 4-4 4s-4-1.8-4-4v-8z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <span className="text-[10px]">PayPal</span>
      </div>

      {/* Trust Badges */}
      <div className="flex items-center gap-1 px-2 py-0.5 bg-[#141414] rounded border border-[#1A1A1A]">
        <Shield className="w-3 h-3 text-[#FFC400]" />
        <span className="text-[10px] font-medium">SSL</span>
      </div>

      <div className="flex items-center gap-1 px-2 py-0.5 bg-[#141414] rounded border border-[#1A1A1A]">
        <RotateCcw className="w-3 h-3 text-[#FFC400]" />
        <span className="text-[10px] font-medium">14 dní na vrátenie</span>
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
      <div className="border-b border-[#1A1A1A] last:border-b-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between py-2.5 text-left text-white font-semibold text-xs hover:text-[#FFC400] transition-colors focus:outline-none focus:ring-1 focus:ring-[#FFC400] rounded"
          aria-expanded={isOpen}
          aria-controls={`footer-${title.toLowerCase()}`}
        >
          {title}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <div
          id={`footer-${title.toLowerCase()}`}
          className={`overflow-hidden transition-all ${isOpen ? 'max-h-96 pb-2' : 'max-h-0'}`}
        >
          <ul className="space-y-1.5">
            {links.map((link, index) => (
              <li key={index}>
                <Link
                  to={link.href}
                  className="text-[#B3B3B3] text-xs hover:text-white hover:underline transition-colors focus:outline-none focus:ring-1 focus:ring-[#FFC400] rounded inline-block"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-white font-semibold text-xs mb-2 uppercase tracking-wider">
        {title}
      </h3>
      <ul className="space-y-1.5">
        {links.map((link, index) => (
          <li key={index}>
            <Link
              to={link.href}
              className="text-[#B3B3B3] text-xs hover:text-white hover:underline transition-colors focus:outline-none focus:ring-1 focus:ring-[#FFC400] rounded inline-block"
            >
              {link.label}
            </Link>
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
    <div className="flex gap-2">
      {socials.map((social, index) => {
        const Icon = social.icon;
        return (
          <a
            key={index}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-7 h-7 flex items-center justify-center bg-[#141414] border border-[#1A1A1A] rounded text-[#B3B3B3] hover:text-[#FFC400] hover:border-[#FFC400] transition-all focus:outline-none focus:ring-1 focus:ring-[#FFC400]"
            aria-label={social.label}
          >
            <Icon className="w-3.5 h-3.5" />
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
    <footer className="bg-[#0D0D0D] text-white border-t border-[#141414]" role="contentinfo">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Section - CTA */}
        <div className="py-6 border-b border-[#141414]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div>
              <h2 className="text-lg font-bold mb-1">Zostaň v obraze</h2>
              <p className="text-[#B3B3B3] text-xs mb-4 lg:mb-0">
                Nové modely, exkluzívne zľavy a návody priamo do tvojej schránky.
              </p>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-2">
              <NewsletterForm />
            </div>
          </div>
          <div className="mt-4">
            <TrustIcons />
          </div>
        </div>

        {/* Middle Section - Navigation (Mobile Accordion) */}
        <div className="py-4 border-b border-[#141414] lg:hidden">
          <FooterColumn title={footerColumns.shop.title} links={footerColumns.shop.links} isMobile />
          <FooterColumn title={footerColumns.support.title} links={footerColumns.support.links} isMobile />
          <FooterColumn title={footerColumns.company.title} links={footerColumns.company.links} isMobile />
          <FooterColumn title={footerColumns.legal.title} links={footerColumns.legal.links} isMobile />
        </div>

        {/* Middle Section - Navigation (Desktop Grid) */}
        <div className="hidden lg:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 py-6 border-b border-[#141414]">
          <FooterColumn title={footerColumns.shop.title} links={footerColumns.shop.links} />
          <FooterColumn title={footerColumns.support.title} links={footerColumns.support.links} />
          <FooterColumn title={footerColumns.company.title} links={footerColumns.company.links} />
          <FooterColumn title={footerColumns.legal.title} links={footerColumns.legal.links} />

          {/* Contact Column */}
          <div>
            <h3 className="text-white font-semibold text-xs mb-2 uppercase tracking-wider">
              Kontakt
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-1.5 text-[#B3B3B3] text-xs">
                <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:info@martyx-industries.com"
                  className="hover:text-white hover:underline transition-colors focus:outline-none focus:ring-1 focus:ring-[#FFC400] rounded"
                >
                  info@martyx-industries.com
                </a>
              </li>
              <li className="flex items-start gap-1.5 text-[#B3B3B3] text-xs">
                <Phone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+421xxxxxxxxx"
                  className="hover:text-white hover:underline transition-colors focus:outline-none focus:ring-1 focus:ring-[#FFC400] rounded"
                >
                  +421 XXX XXX XXX
                </a>
              </li>
              <li className="flex items-start gap-1.5 text-[#B3B3B3] text-xs">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Ulica 123<br />
                  Bratislava, 81101<br />
                  Slovensko
                </span>
              </li>
            </ul>
            <div className="mt-3">
              <SocialLinks />
            </div>
          </div>
        </div>

        {/* Mobile Contact Section */}
        <div className="py-4 border-b border-[#141414] lg:hidden">
          <h3 className="text-white font-semibold text-xs mb-2 uppercase tracking-wider">
            Kontakt
          </h3>
          <ul className="space-y-2 mb-3">
            <li className="flex items-start gap-1.5 text-[#B3B3B3] text-xs">
              <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <a
                href="mailto:info@martyx-industries.com"
                className="hover:text-white hover:underline transition-colors"
              >
                info@martyx-industries.com
              </a>
            </li>
            <li className="flex items-start gap-1.5 text-[#B3B3B3] text-xs">
              <Phone className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <a
                href="tel:+421xxxxxxxxx"
                className="hover:text-white hover:underline transition-colors"
              >
                +421 XXX XXX XXX
              </a>
            </li>
            <li className="flex items-start gap-1.5 text-[#B3B3B3] text-xs">
              <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Ulica 123, Bratislava, 81101, Slovensko
              </span>
            </li>
          </ul>
          <SocialLinks />
        </div>

        {/* Bottom Section - Copyright & Language */}
        <div className="py-3 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[#B3B3B3] text-[10px] text-center md:text-left">
            © {currentYear} Martyx Industries. Všetky práva vyhradené.
          </p>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5">
            <button
              className="px-2 py-1 text-[10px] font-medium bg-[#141414] border border-[#1A1A1A] rounded text-white hover:border-[#FFC400] transition-all focus:outline-none focus:ring-1 focus:ring-[#FFC400]"
              aria-label="Slovenčina"
            >
              SK
            </button>
            <span className="text-[#1A1A1A]">|</span>
            <button
              className="px-2 py-1 text-[10px] font-medium text-[#B3B3B3] hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-[#FFC400] rounded"
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
