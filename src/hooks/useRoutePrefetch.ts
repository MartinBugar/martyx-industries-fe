/**
 * Route-based Prefetching Hook
 * Intelligently prefetches routes and data based on user behavior
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { advancedCache } from '../utils/advancedCache';
import { logInfo, logWarn, logError } from '../services/logger';

interface PrefetchConfig {
  routes: string[];
  dataEndpoints: string[];
  priority: 'high' | 'medium' | 'low';
  delay?: number;
}

class RoutePrefetcher {
  private static instance: RoutePrefetcher;
  private prefetchedRoutes = new Set<string>();
  private prefetchedData = new Set<string>();
  private prefetchQueue: Array<{ url: string; priority: string; delay: number }> = [];
  private isProcessing = false;

  static getInstance(): RoutePrefetcher {
    if (!RoutePrefetcher.instance) {
      RoutePrefetcher.instance = new RoutePrefetcher();
    }
    return RoutePrefetcher.instance;
  }

  // Prefetch route chunks
  async prefetchRoute(route: string, _priority: 'high' | 'medium' | 'low' = 'low'): Promise<void> {
    if (this.prefetchedRoutes.has(route)) return;

    try {
      // For React Router, we need to prefetch the component
      // This is a simplified version - in real implementation, you'd need to map routes to chunks
      const routeMap: Record<string, () => Promise<any>> = {
        '/products': () => import('../pages/Products/Products'),
        '/product-detail': () => import('../pages/ProductDetail/ProductDetail'),
        '/checkout': () => import('../pages/Checkout/Checkout'),
        '/cart': () => import('../pages/CartPage/CartPage'),
        '/wishlist': () => import('../pages/Wishlist/Wishlist'),
        '/account': () => import('../pages/UserAccount/UserAccount'),
        '/admin': () => import('../pages/admin/AdminDashboard')
      };

      const importFn = routeMap[route];
      if (importFn) {
        await importFn();
        this.prefetchedRoutes.add(route);
        logInfo(`✅ Prefetched route: ${route}`);
      }
    } catch (error) {
      logWarn(`Failed to prefetch route ${route}:`, error);
    }
  }

  // Prefetch API data
  async prefetchData(endpoint: string, _priority: 'high' | 'medium' | 'low' = 'low'): Promise<void> {
    if (this.prefetchedData.has(endpoint)) return;

    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        // const etag = response.headers.get('etag');
        // const lastModified = response.headers.get('last-modified');
        
        advancedCache.set(endpoint, data, 'api-responses');
        this.prefetchedData.add(endpoint);
        logInfo(`✅ Prefetched data: ${endpoint}`);
      }
    } catch (error) {
      logWarn(`Failed to prefetch data ${endpoint}:`, error);
    }
  }

  // Queue prefetch requests with priority
  queuePrefetch(url: string, priority: 'high' | 'medium' | 'low' = 'low', delay: number = 0): void {
    this.prefetchQueue.push({ url, priority, delay });
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.prefetchQueue.length === 0) return;

    this.isProcessing = true;

    // Sort by priority
    this.prefetchQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
    });

    while (this.prefetchQueue.length > 0) {
      const { url, delay } = this.prefetchQueue.shift()!;
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Determine if it's a route or data endpoint
      if (url.startsWith('/api/')) {
        await this.prefetchData(url);
      } else {
        await this.prefetchRoute(url);
      }
    }

    this.isProcessing = false;
  }
}

export const routePrefetcher = RoutePrefetcher.getInstance();

// Hook for route-based prefetching
export const useRoutePrefetch = () => {
  const location = useLocation();
  const prefetchTimeoutRef = useRef<number | undefined>(undefined);

  // Prefetch based on current route
  useEffect(() => {
    const prefetchConfigs: Record<string, PrefetchConfig> = {
      '/': {
        routes: ['/products', '/about'],
        dataEndpoints: ['/api/products?limit=6'],
        priority: 'high',
        delay: 2000
      },
      '/products': {
        routes: ['/product-detail', '/cart'],
        dataEndpoints: ['/api/cart', '/api/wishlist'],
        priority: 'medium',
        delay: 1000
      },
      '/product-detail': {
        routes: ['/checkout', '/cart'],
        dataEndpoints: ['/api/cart', '/api/orders'],
        priority: 'high',
        delay: 500
      },
      '/cart': {
        routes: ['/checkout'],
        dataEndpoints: ['/api/orders', '/api/payment/methods'],
        priority: 'high',
        delay: 0
      }
    };

    const config = prefetchConfigs[location.pathname];
    if (config) {
      // Clear previous timeout
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }

      // Set new timeout for prefetching
      prefetchTimeoutRef.current = window.setTimeout(() => {
        // Prefetch routes
        config.routes.forEach(route => {
          routePrefetcher.queuePrefetch(route, config.priority, config.delay);
        });

        // Prefetch data
        config.dataEndpoints.forEach(endpoint => {
          routePrefetcher.queuePrefetch(endpoint, config.priority, config.delay);
        });
      }, config.delay || 0);
    }

    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, [location.pathname]);

  // Manual prefetch function
  const prefetch = useCallback((url: string, _priority: 'high' | 'medium' | 'low' = 'low') => {
    routePrefetcher.queuePrefetch(url, _priority);
  }, []);

  return { prefetch };
};

// Hook for link hover prefetching
export const useLinkPrefetch = () => {
  const prefetch = useCallback((url: string) => {
    routePrefetcher.queuePrefetch(url, 'medium', 100);
  }, []);

  return { prefetch };
};
