import { useEffect, useState, useCallback, useRef } from 'react';
import {
  seoService,
  applyMetaTags,
  applyJsonLdSchema,
  cleanupSeoTags
} from '../services/seoService';
import type { MetaTagsResponse } from '../services/seoService';
import { logError, logInfo } from '../services/logger';

// Debounce delay to prevent race conditions during rapid navigation
const SEO_DEBOUNCE_MS = 150;

/**
 * Hook for managing SEO meta tags and JSON-LD schemas
 *
 * Usage:
 * ```tsx
 * // For product pages
 * const { loading, error } = useSeo({ type: 'product', slug: 'endeavour-robot' });
 *
 * // For category pages
 * const { loading, error } = useSeo({ type: 'category', slug: '3d-printed-models' });
 *
 * // For homepage
 * const { loading, error } = useSeo({ type: 'homepage' });
 *
 * // For private pages (noindex) - checkout, cart, account, login, etc.
 * const { loading, error } = useSeo({ type: 'private', slug: 'checkout' });
 * ```
 */

interface UseSeoOptions {
  type: 'product' | 'category' | 'homepage' | 'private';
  slug?: string;
  /** Skip SEO fetch (useful for loading states) */
  skip?: boolean;
  /** Include JSON-LD schema */
  includeSchema?: boolean;
}

interface UseSeoResult {
  loading: boolean;
  error: Error | null;
  metaTags: MetaTagsResponse | null;
  refetch: () => Promise<void>;
}

export function useSeo(options: UseSeoOptions): UseSeoResult {
  const { type, slug, skip = false, includeSchema = true } = options;

  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<Error | null>(null);
  const [metaTags, setMetaTags] = useState<MetaTagsResponse | null>(null);

  // Refs for debouncing and request tracking
  const debounceTimerRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  // Core fetch function (not debounced)
  const executeFetch = useCallback(async (currentRequestId: number) => {
    if (skip) return;

    // For product, category and private pages, slug is required
    if ((type === 'product' || type === 'category' || type === 'private') && !slug) {
      logError('useSeo: slug is required for product/category/private type');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let fetchedMetaTags: MetaTagsResponse;

      // Fetch meta tags based on type
      switch (type) {
        case 'product':
          fetchedMetaTags = await seoService.getProductMetaTags(slug!);
          break;
        case 'category':
          fetchedMetaTags = await seoService.getCategoryMetaTags(slug!);
          break;
        case 'homepage':
          fetchedMetaTags = await seoService.getHomepageMetaTags();
          break;
        case 'private':
          fetchedMetaTags = await seoService.getPrivatePageMetaTags(slug!);
          break;
        default:
          throw new Error(`Unknown SEO type: ${type}`);
      }

      // Check if this request is still valid (not superseded by newer request)
      if (currentRequestId !== requestIdRef.current || !isMountedRef.current) {
        return; // Stale request, ignore results
      }

      // Apply meta tags to document
      applyMetaTags(fetchedMetaTags);
      setMetaTags(fetchedMetaTags);

      // Fetch and apply JSON-LD schemas if requested
      if (includeSchema) {
        if (type === 'product' && slug) {
          // Fetch product schema and breadcrumb schema
          const [productSchema, breadcrumbSchema] = await Promise.all([
            seoService.getProductSchema(slug).catch(() => null),
            seoService.getProductBreadcrumbSchema(slug).catch(() => null)
          ]);

          // Check again after async operations
          if (currentRequestId !== requestIdRef.current || !isMountedRef.current) {
            return;
          }

          if (productSchema) {
            applyJsonLdSchema(productSchema, 'product-schema');
          }
          if (breadcrumbSchema) {
            applyJsonLdSchema(breadcrumbSchema, 'breadcrumb-schema');
          }
        } else if (type === 'homepage') {
          // Fetch website and organization schema
          const [websiteSchema, orgSchema] = await Promise.all([
            seoService.getWebsiteSchema().catch(() => null),
            seoService.getOrganizationSchema().catch(() => null)
          ]);

          // Check again after async operations
          if (currentRequestId !== requestIdRef.current || !isMountedRef.current) {
            return;
          }

          if (websiteSchema) {
            applyJsonLdSchema(websiteSchema, 'website-schema');
          }
          if (orgSchema) {
            applyJsonLdSchema(orgSchema, 'organization-schema');
          }
        }
      }

      logInfo(`SEO data applied for ${type}${slug ? `: ${slug}` : ''}`);
    } catch (err) {
      // Check if component is still mounted and request is still valid
      if (currentRequestId !== requestIdRef.current || !isMountedRef.current) {
        return;
      }

      const error = err instanceof Error ? err : new Error('Unknown SEO error');
      logError('useSeo error:', error);
      setError(error);

      // Apply fallback meta tags
      applyFallbackMeta(type, slug);
    } finally {
      // Only update loading state if this is still the current request
      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [type, slug, skip, includeSchema]);

  // Debounced fetch function for external use
  const fetchSeoData = useCallback(async () => {
    // Cancel any pending debounced request
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // Increment request ID to invalidate any in-flight requests
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    // Execute immediately for refetch calls
    await executeFetch(currentRequestId);
  }, [executeFetch]);

  // Fetch SEO data on mount and when dependencies change (with debounce)
  useEffect(() => {
    isMountedRef.current = true;

    // Cancel any pending debounced request
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // Increment request ID to invalidate any in-flight requests
    requestIdRef.current += 1;
    const currentRequestId = requestIdRef.current;

    // Debounce the fetch to prevent race conditions during rapid navigation
    debounceTimerRef.current = window.setTimeout(() => {
      executeFetch(currentRequestId);
    }, SEO_DEBOUNCE_MS);

    // Cleanup on unmount or dependency change
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      cleanupSeoTags();
    };
  }, [executeFetch]);

  return {
    loading,
    error,
    metaTags,
    refetch: fetchSeoData
  };
}

/**
 * Apply fallback meta tags when API fails
 */
function applyFallbackMeta(type: string, slug?: string): void {
  const siteName = 'Martyx Industries';

  switch (type) {
    case 'product':
      document.title = `${formatSlugToTitle(slug)} | ${siteName}`;
      break;
    case 'category':
      document.title = `${formatSlugToTitle(slug)} | ${siteName}`;
      break;
    case 'homepage':
      document.title = `${siteName} | Premium 3D Printed Model Kits`;
      break;
    default:
      document.title = siteName;
  }
}

/**
 * Format slug to readable title
 */
function formatSlugToTitle(slug?: string): string {
  if (!slug) return 'Products';

  return slug
    .split('-')
    .map(word => {
      if (word === '3d') return '3D';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Hook for simple title-only updates (for pages that don't need full SEO)
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/**
 * Hook for manually applying JSON-LD schema
 */
export function useJsonLdSchema(schema: object | null, id: string = 'json-ld-schema'): void {
  useEffect(() => {
    if (!schema) return;

    applyJsonLdSchema(schema, id);

    return () => {
      const existing = document.getElementById(id);
      if (existing) {
        existing.remove();
      }
    };
  }, [schema, id]);
}

export default useSeo;
