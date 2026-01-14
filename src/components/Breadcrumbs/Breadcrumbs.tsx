import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import './Breadcrumbs.css';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  /** If true, this is the current page (no link) */
  current?: boolean;
}

interface BreadcrumbsProps {
  /** Custom breadcrumb items - if not provided, auto-generates from URL */
  items?: BreadcrumbItem[];
  /** Product name for product detail pages */
  productName?: string;
  /** Category name for category pages */
  categoryName?: string;
  /** Show home icon instead of "Home" text */
  showHomeIcon?: boolean;
  /** Additional CSS class */
  className?: string;
}

/**
 * Breadcrumbs component with Schema.org SEO markup
 *
 * Usage:
 * - Auto mode: <Breadcrumbs /> - generates from current URL
 * - Custom mode: <Breadcrumbs items={[...]} />
 * - Product page: <Breadcrumbs productName="ENDEAVOUR Robot" />
 */
const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  productName,
  categoryName,
  showHomeIcon = true,
  className = ''
}) => {
  const location = useLocation();
  const { t } = useTranslation('common');

  // Route label mapping for auto-generation
  const routeLabels: Record<string, string> = {
    '': t('breadcrumbs.home', 'Home'),
    'products': t('breadcrumbs.products', 'Products'),
    'about': t('breadcrumbs.about', 'About'),
    'contact': t('breadcrumbs.contact', 'Contact'),
    'cart': t('breadcrumbs.cart', 'Cart'),
    'checkout': t('breadcrumbs.checkout', 'Checkout'),
    'wishlist': t('breadcrumbs.wishlist', 'Wishlist'),
    'account': t('breadcrumbs.account', 'My Account'),
    'gallery': t('breadcrumbs.gallery', 'Gallery'),
    'login': t('breadcrumbs.login', 'Login'),
    'register': t('breadcrumbs.register', 'Register'),
    'privacy-policy': t('breadcrumbs.privacy_policy', 'Privacy Policy'),
    'terms-of-service': t('breadcrumbs.terms_of_service', 'Terms of Service'),
    'cookies-policy': t('breadcrumbs.cookies_policy', 'Cookies Policy'),
    'build-difficulty-guide': t('breadcrumbs.build_difficulty_guide', 'Build Difficulty Guide'),
  };

  // Generate breadcrumbs from URL if no custom items provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: t('breadcrumbs.home', 'Home'), path: '/' }
    ];

    let currentPath = '';

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      const isLast = i === pathSegments.length - 1;

      // Skip numeric IDs, use productName/categoryName instead
      if (/^\d+$/.test(segment)) {
        if (productName && isLast) {
          breadcrumbs.push({
            label: productName,
            current: true
          });
        }
        continue;
      }

      // Get label from mapping or capitalize segment
      let label = routeLabels[segment];
      if (!label) {
        // Handle category slugs
        if (categoryName && pathSegments[i - 1] === 'category') {
          label = categoryName;
        } else {
          // Capitalize and replace hyphens with spaces
          label = segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
      }

      breadcrumbs.push({
        label,
        path: isLast ? undefined : currentPath,
        current: isLast
      });
    }

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  // Don't render if only home
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  // Generate Schema.org JSON-LD
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.path ? `${window.location.origin}${item.path}` : undefined
    }))
  };

  return (
    <>
      {/* Schema.org JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <nav
        className={`breadcrumbs ${className}`}
        aria-label={t('breadcrumbs.aria_label', 'Breadcrumb navigation')}
      >
        <ol className="breadcrumbs-list">
          {breadcrumbItems.map((item, index) => {
            const isFirst = index === 0;
            const isLast = index === breadcrumbItems.length - 1;

            return (
              <li
                key={item.path || item.label}
                className={`breadcrumbs-item ${isLast ? 'breadcrumbs-item--current' : ''}`}
              >
                {/* Separator (not for first item) */}
                {!isFirst && (
                  <ChevronRight
                    className="breadcrumbs-separator"
                    size={14}
                    aria-hidden="true"
                  />
                )}

                {/* Link or current page text */}
                {item.path && !item.current ? (
                  <Link
                    to={item.path}
                    className="breadcrumbs-link"
                  >
                    {isFirst && showHomeIcon ? (
                      <>
                        <Home size={14} className="breadcrumbs-home-icon" aria-hidden="true" />
                        <span className="breadcrumbs-home-text">{item.label}</span>
                      </>
                    ) : (
                      item.label
                    )}
                  </Link>
                ) : (
                  <span
                    className="breadcrumbs-current"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
};

export default Breadcrumbs;
