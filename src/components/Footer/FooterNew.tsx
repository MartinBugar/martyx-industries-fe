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
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={handleChange}
          placeholder="Tvoj email"
          className="flex-1 px-4 py-3 bg-[#141414] text-white border border-[#1A1A1A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC400] focus:border-transparent transition-all"
          aria-label="Email adresa pre newsletter"
        />
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="px-6 py-3 bg-[#FFC400] text-[#0D0D0D] font-semibold rounded-lg hover:bg-[#FFD633] disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-[#FFC400] focus:ring-offset-2 focus:ring-offset-[#0D0D0D]"
          aria-label="Prihlásiť sa na newsletter"
        >
          {isSubmitting ? 'Odosiela sa...' : 'Prihlásiť sa'}
        </button>
      </div>
    </form>
  );
};

// Trust Icons Component
const TrustIcons: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center gap-6 text-[#B3B3B3]">
      {/* Payment Methods */}
      <div className="flex items-center gap-3">
        <svg className="w-10 h-6 opacity-70" viewBox="0 0 48 32" fill="currentColor">
          <rect x="4" y="8" width="40" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="4" y="12" width="40" height="4" fill="currentColor" opacity="0.3"/>
        </svg>
        <span className="text-xs">Visa</span>
      </div>

      <div className="flex items-center gap-3">
        <svg className="w-10 h-6 opacity-70" viewBox="0 0 48 32" fill="currentColor">
          <circle cx="18" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
          <circle cx="30" cy="16" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/>
        </svg>
        <span className="text-xs">Mastercard</span>
      </div>

      <div className="flex items-center gap-3">
        <svg className="w-10 h-6 opacity-70" viewBox="0 0 48 32" fill="currentColor">
          <path d="M20 12c0-2.2 1.8-4 4-4s4 1.8 4 4v8c0 2.2-1.8 4-4 4s-4-1.8-4-4v-8z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
        <span className="text-xs">PayPal</span>
      </div>

      {/* Trust Badges */}
      <div className="flex items-center gap-2 px-3 py-1 bg-[#141414] rounded-md border border-[#1A1A1A]">
        <Shield className="w-4 h-4 text-[#FFC400]" />
        <span className="text-xs font-medium">SSL</span>
      </div>

      <div className="flex items-center gap-2 px-3 py-1 bg-[#141414] rounded-md border border-[#1A1A1A]">
        <RotateCcw className="w-4 h-4 text-[#FFC400]" />
        <span className="text-xs font-medium">14 dní na vrátenie</span>
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
          className="w-full flex items-center justify-between py-4 text-left text-white font-semibold text-sm hover:text-[#FFC400] transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC400] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] rounded"
          aria-expanded={isOpen}
          aria-controls={`footer-${title.toLowerCase()}`}
        >
          {title}
          <ChevronDown
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <div
          id={`footer-${title.toLowerCase()}`}
          className={`overflow-hidden transition-all ${isOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}
        >
          <ul className="space-y-2">
            {links.map((link, index) => (
              <li key={index}>
                <Link
                  to={link.href}
                  className="text-[#B3B3B3] text-sm hover:text-white hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC400] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] rounded inline-block"
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
      <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
        {title}
      </h3>
      <ul className="space-y-2.5">
        {links.map((link, index) => (
          <li key={index}>
            <Link
              to={link.href}
              className="text-[#B3B3B3] text-sm hover:text-white hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC400] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] rounded inline-block"
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
    <div className="flex gap-3">
      {socials.map((social, index) => {
        const Icon = social.icon;
        return (
          <a
            key={index}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 flex items-center justify-center bg-[#141414] border border-[#1A1A1A] rounded-lg text-[#B3B3B3] hover:text-[#FFC400] hover:border-[#FFC400] transition-all focus:outline-none focus:ring-2 focus:ring-[#FFC400] focus:ring-offset-2 focus:ring-offset-[#0D0D0D]"
            aria-label={social.label}
          >
            <Icon className="w-5 h-5" />
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
        <div className="py-12 border-b border-[#141414]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">Zostaň v obraze</h2>
              <p className="text-[#B3B3B3] text-sm mb-6 lg:mb-0">
                Nové modely, exkluzívne zľavy a návody priamo do tvojej schránky.
              </p>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-4">
              <NewsletterForm />
            </div>
          </div>
          <div className="mt-8">
            <TrustIcons />
          </div>
        </div>

        {/* Middle Section - Navigation (Mobile Accordion) */}
        <div className="py-8 border-b border-[#141414] lg:hidden">
          <FooterColumn title={footerColumns.shop.title} links={footerColumns.shop.links} isMobile />
          <FooterColumn title={footerColumns.support.title} links={footerColumns.support.links} isMobile />
          <FooterColumn title={footerColumns.company.title} links={footerColumns.company.links} isMobile />
          <FooterColumn title={footerColumns.legal.title} links={footerColumns.legal.links} isMobile />
        </div>

        {/* Middle Section - Navigation (Desktop Grid) */}
        <div className="hidden lg:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 py-12 border-b border-[#141414]">
          <FooterColumn title={footerColumns.shop.title} links={footerColumns.shop.links} />
          <FooterColumn title={footerColumns.support.title} links={footerColumns.support.links} />
          <FooterColumn title={footerColumns.company.title} links={footerColumns.company.links} />
          <FooterColumn title={footerColumns.legal.title} links={footerColumns.legal.links} />

          {/* Contact Column */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              Kontakt
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-[#B3B3B3] text-sm">
                <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:info@martyx-industries.com"
                  className="hover:text-white hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC400] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] rounded"
                >
                  info@martyx-industries.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-[#B3B3B3] text-sm">
                <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+421xxxxxxxxx"
                  className="hover:text-white hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC400] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] rounded"
                >
                  +421 XXX XXX XXX
                </a>
              </li>
              <li className="flex items-start gap-2 text-[#B3B3B3] text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Ulica 123<br />
                  Bratislava, 81101<br />
                  Slovensko
                </span>
              </li>
            </ul>
            <div className="mt-6">
              <SocialLinks />
            </div>
          </div>
        </div>

        {/* Mobile Contact Section */}
        <div className="py-8 border-b border-[#141414] lg:hidden">
          <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
            Kontakt
          </h3>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2 text-[#B3B3B3] text-sm">
              <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <a
                href="mailto:info@martyx-industries.com"
                className="hover:text-white hover:underline transition-colors"
              >
                info@martyx-industries.com
              </a>
            </li>
            <li className="flex items-start gap-2 text-[#B3B3B3] text-sm">
              <Phone className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <a
                href="tel:+421xxxxxxxxx"
                className="hover:text-white hover:underline transition-colors"
              >
                +421 XXX XXX XXX
              </a>
            </li>
            <li className="flex items-start gap-2 text-[#B3B3B3] text-sm">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Ulica 123, Bratislava, 81101, Slovensko
              </span>
            </li>
          </ul>
          <SocialLinks />
        </div>

        {/* Bottom Section - Copyright & Language */}
        <div className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#B3B3B3] text-xs text-center md:text-left">
            © {currentYear} Martyx Industries. Všetky práva vyhradené.
          </p>

          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium bg-[#141414] border border-[#1A1A1A] rounded-md text-white hover:border-[#FFC400] transition-all focus:outline-none focus:ring-2 focus:ring-[#FFC400] focus:ring-offset-2 focus:ring-offset-[#0D0D0D]"
              aria-label="Slovenčina"
            >
              SK
            </button>
            <span className="text-[#1A1A1A]">|</span>
            <button
              className="px-3 py-1.5 text-xs font-medium text-[#B3B3B3] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC400] focus:ring-offset-2 focus:ring-offset-[#0D0D0D] rounded"
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
