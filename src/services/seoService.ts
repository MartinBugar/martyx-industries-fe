import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import { logError, logInfo } from './logger';

/**
 * SEO & Meta Tags Service
 *
 * Fetches structured data from backend for:
 * - Open Graph meta tags
 * - Twitter Card meta tags
 * - JSON-LD Schema.org structured data
 *
 * Used by React components to inject SEO data into page <head>
 */

// ==================== TYPES ====================

export interface OpenGraphData {
  title: string;
  description: string;
  url: string;
  type: string;
  site_name: string;
  locale: string;
  'locale:alternate'?: string[];
  image?: string;
  'image:alt'?: string;
  'image:width'?: string;
  'image:height'?: string;
  'product:price:amount'?: string;
  'product:price:currency'?: string;
  'product:availability'?: string;
  'product:category'?: string;
  'product:brand'?: string;
}

export interface TwitterCardData {
  card: string;
  site: string;
  title: string;
  description: string;
  image?: string;
  'image:alt'?: string;
  label1?: string;
  data1?: string;
  label2?: string;
  data2?: string;
}

export interface AdditionalSeoData {
  priceMin?: string;
  priceMax?: string;
  currency?: string;
  difficultyLevel?: string;
  has3DViewer?: boolean;
  hasVideo?: boolean;
  videoUrl?: string;
}

export interface MetaTagsResponse {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  robots?: string;
  og?: OpenGraphData;
  twitter?: TwitterCardData;
  additional?: AdditionalSeoData;
}

// ==================== SERVICE ====================

export class SeoService {
  /**
   * Get meta tags for a product page
   * @param slug Product slug
   */
  async getProductMetaTags(slug: string): Promise<MetaTagsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meta/product/${slug}`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      return handleResponse(response);
    } catch (error) {
      logError('Error fetching product meta tags:', error);
      throw error;
    }
  }

  /**
   * Get meta tags for a category page
   * @param categorySlug Category slug
   */
  async getCategoryMetaTags(categorySlug: string): Promise<MetaTagsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meta/category/${categorySlug}`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      return handleResponse(response);
    } catch (error) {
      logError('Error fetching category meta tags:', error);
      throw error;
    }
  }

  /**
   * Get meta tags for the homepage
   */
  async getHomepageMetaTags(): Promise<MetaTagsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meta/homepage`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      return handleResponse(response);
    } catch (error) {
      logError('Error fetching homepage meta tags:', error);
      throw error;
    }
  }

  /**
   * Get JSON-LD Product schema
   * @param slug Product slug
   */
  async getProductSchema(slug: string): Promise<object> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schema/product/${slug}`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      return handleResponse(response);
    } catch (error) {
      logError('Error fetching product schema:', error);
      throw error;
    }
  }

  /**
   * Get JSON-LD Organization schema
   */
  async getOrganizationSchema(): Promise<object> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schema/organization`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      return handleResponse(response);
    } catch (error) {
      logError('Error fetching organization schema:', error);
      throw error;
    }
  }

  /**
   * Get JSON-LD Breadcrumb schema for a product
   * @param slug Product slug
   */
  async getProductBreadcrumbSchema(slug: string): Promise<object> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schema/breadcrumb/product/${slug}`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      return handleResponse(response);
    } catch (error) {
      logError('Error fetching breadcrumb schema:', error);
      throw error;
    }
  }

  /**
   * Get JSON-LD WebSite schema
   */
  async getWebsiteSchema(): Promise<object> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schema/website`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      return handleResponse(response);
    } catch (error) {
      logError('Error fetching website schema:', error);
      throw error;
    }
  }

  /**
   * Get meta tags for private/noindex pages (checkout, cart, account, etc.)
   * @param pageType Type of private page (checkout, cart, account, login, register, orders, order-confirmation)
   */
  async getPrivatePageMetaTags(pageType: string): Promise<MetaTagsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meta/private/${pageType}`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      return handleResponse(response);
    } catch (error) {
      logError('Error fetching private page meta tags:', error);
      throw error;
    }
  }
}

export const seoService = new SeoService();

// ==================== HELPER FUNCTIONS ====================

/**
 * Apply meta tags to document head
 * @param metaTags Meta tags response from API
 */
export function applyMetaTags(metaTags: MetaTagsResponse): void {
  // Title
  document.title = metaTags.title;

  // Basic meta tags
  setMetaTag('description', metaTags.description);
  if (metaTags.keywords) {
    setMetaTag('keywords', metaTags.keywords);
  }

  // Robots directive (for noindex pages)
  if (metaTags.robots) {
    setMetaTag('robots', metaTags.robots);
  } else {
    // Remove robots tag if not specified (allow indexing)
    removeMetaTag('robots');
  }

  // Canonical (optional for private pages)
  if (metaTags.canonical) {
    setLinkTag('canonical', metaTags.canonical);
  }

  // Open Graph tags
  if (metaTags.og) {
    Object.entries(metaTags.og).forEach(([key, value]) => {
      if (value) {
        // Handle locale:alternate as array (multiple meta tags needed)
        if (key === 'locale:alternate' && Array.isArray(value)) {
          // Remove existing locale:alternate tags first
          document.querySelectorAll('meta[property="og:locale:alternate"]').forEach(el => el.remove());
          // Add one meta tag for each alternate locale
          value.forEach((locale: string) => {
            const tag = document.createElement('meta');
            tag.setAttribute('property', 'og:locale:alternate');
            tag.content = locale;
            document.head.appendChild(tag);
          });
        } else {
          setMetaTag(`og:${key}`, value as string, 'property');
        }
      }
    });
  }

  // Twitter Card tags
  if (metaTags.twitter) {
    Object.entries(metaTags.twitter).forEach(([key, value]) => {
      if (value) {
        setMetaTag(`twitter:${key}`, value);
      }
    });
  }

  logInfo('Meta tags applied:', metaTags.title);
}

/**
 * Apply JSON-LD schema to document head
 * @param schema Schema object
 * @param id Optional ID for the script tag
 */
export function applyJsonLdSchema(schema: object, id: string = 'json-ld-schema'): void {
  // Remove existing schema with same ID
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }

  // Create new script tag
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);

  document.head.appendChild(script);

  logInfo('JSON-LD schema applied:', id);
}

/**
 * Remove all SEO tags from document head (for cleanup)
 */
export function cleanupSeoTags(): void {
  // Remove OG tags
  document.querySelectorAll('meta[property^="og:"]').forEach(el => el.remove());

  // Remove Twitter tags
  document.querySelectorAll('meta[name^="twitter:"]').forEach(el => el.remove());

  // Remove JSON-LD schemas
  document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());

  // Remove canonical
  document.querySelector('link[rel="canonical"]')?.remove();

  logInfo('SEO tags cleaned up');
}

// ==================== PRIVATE HELPERS ====================

function setMetaTag(name: string, content: string, attr: 'name' | 'property' = 'name'): void {
  let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }

  tag.content = content;
}

function removeMetaTag(name: string, attr: 'name' | 'property' = 'name'): void {
  const tag = document.querySelector(`meta[${attr}="${name}"]`);
  if (tag) {
    tag.remove();
  }
}

function setLinkTag(rel: string, href: string): void {
  let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

  if (!tag) {
    tag = document.createElement('link');
    tag.rel = rel;
    document.head.appendChild(tag);
  }

  tag.href = href;
}
