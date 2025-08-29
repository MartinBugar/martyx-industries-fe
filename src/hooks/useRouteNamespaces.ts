import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { loadNamespace, type Namespace } from '../i18n';

/**
 * Route-based namespace mapping
 * Maps route patterns to required namespaces for better performance
 */
const ROUTE_NAMESPACE_MAP: Record<string, Namespace[]> = {
  // Home page
  '/': ['common', 'nav'],
  
  // Product pages
  '/products': ['common', 'nav'],
  '/products/': ['common', 'nav'],
  
  // Checkout and cart
  '/cart': ['common', 'nav', 'checkout'],
  '/checkout': ['common', 'nav', 'checkout'],
  '/order-confirmation': ['common', 'nav', 'checkout'],
  
  // Auth pages
  '/login': ['common', 'nav'],
  '/register': ['common', 'nav'],
  '/forgot-password': ['common', 'nav'],
  '/reset-password': ['common', 'nav'],
  
  // Account pages
  '/account': ['common', 'nav'],
  '/profile': ['common', 'nav'],
  '/orders': ['common', 'nav'],
  
  // Static pages
  '/about': ['common', 'nav'],
  '/contact': ['common', 'nav'],
  '/privacy': ['common', 'nav'],
  '/terms': ['common', 'nav'],
  
  // Admin pages
  '/admin': ['common', 'nav'],
  '/admin/': ['common', 'nav'],
};

/**
 * Gets required namespaces for a given route path
 * @param pathname - The current route pathname
 * @returns Array of required namespaces
 */
const getNamespacesForRoute = (pathname: string): Namespace[] => {
  // Try exact match first
  if (ROUTE_NAMESPACE_MAP[pathname]) {
    return ROUTE_NAMESPACE_MAP[pathname];
  }
  
  // Try pattern matching for dynamic routes
  for (const [pattern, namespaces] of Object.entries(ROUTE_NAMESPACE_MAP)) {
    if (pattern.includes(':') || pattern.includes('*')) {
      // Convert pattern to regex for dynamic matching
      const regexPattern = pattern
        .replace(/:[^/]+/g, '[^/]+') // Replace :param with regex
        .replace(/\*/g, '.*'); // Replace * with regex
      
      const regex = new RegExp(`^${regexPattern}$`);
      if (regex.test(pathname)) {
        return namespaces;
      }
    }
  }
  
  // Check for partial matches (useful for nested routes)
  for (const [pattern, namespaces] of Object.entries(ROUTE_NAMESPACE_MAP)) {
    if (pathname.startsWith(pattern) && pattern !== '/') {
      return namespaces;
    }
  }
  
  // Default fallback - load common namespaces
  return ['common', 'nav'];
};

/**
 * Custom hook that loads required namespaces based on the current route
 * This optimizes the application by only loading translation namespaces needed for the current page
 * 
 * @param options - Configuration options
 * @param options.preloadAll - If true, preloads all namespaces on first visit (default: false)
 * @param options.enableDebug - If true, logs namespace loading events (default: development mode)
 */
export const useRouteNamespaces = (options: {
  preloadAll?: boolean;
  enableDebug?: boolean;
} = {}) => {
  const location = useLocation();
  const { 
    preloadAll = false, 
    enableDebug = import.meta.env.MODE === 'development' 
  } = options;

  useEffect(() => {
    const loadNamespacesForRoute = async () => {
      const currentPath = location.pathname;
      
      if (preloadAll) {
        // Load all namespaces if preloadAll is enabled
        const allNamespaces: Namespace[] = ['common', 'nav', 'checkout'];
        
        if (enableDebug) {
          console.info('🌐 Preloading all namespaces:', allNamespaces);
        }
        
        try {
          await loadNamespace(allNamespaces);
          if (enableDebug) {
            console.info('✅ All namespaces loaded successfully');
          }
        } catch (error) {
          console.warn('⚠️ Failed to preload some namespaces:', error);
        }
        return;
      }

      // Load only required namespaces for current route
      const requiredNamespaces = getNamespacesForRoute(currentPath);
      
      if (enableDebug) {
        console.info(`🌐 Loading namespaces for route "${currentPath}":`, requiredNamespaces);
      }
      
      try {
        await loadNamespace(requiredNamespaces);
        if (enableDebug) {
          console.info('✅ Route namespaces loaded successfully:', requiredNamespaces);
        }
      } catch (error) {
        console.warn('⚠️ Failed to load route namespaces:', error);
      }
    };

    loadNamespacesForRoute();
  }, [location.pathname, preloadAll, enableDebug]);

  // Return utility functions for manual namespace management
  return {
    /**
     * Manually load additional namespaces
     */
    loadNamespace: async (namespaces: Namespace | Namespace[]) => {
      const nsArray = Array.isArray(namespaces) ? namespaces : [namespaces];
      if (enableDebug) {
        console.info('🌐 Manually loading namespaces:', nsArray);
      }
      return loadNamespace(nsArray);
    },
    
    /**
     * Get the namespaces required for current route
     */
    getCurrentRouteNamespaces: () => getNamespacesForRoute(location.pathname),
    
    /**
     * Get the namespaces required for a specific route
     */
    getNamespacesForRoute
  };
};

export default useRouteNamespaces;
