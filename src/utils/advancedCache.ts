/**
 * Advanced Caching System
 * Intelligent caching with multiple strategies for different content types
 */

interface CacheConfig {
  maxAge: number;
  maxEntries: number;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

interface CacheEntry {
  data: any;
  timestamp: number;
  etag?: string;
  lastModified?: string;
}

class AdvancedCache {
  private static instance: AdvancedCache;
  private cache = new Map<string, CacheEntry>();
  private configs = new Map<string, CacheConfig>();

  static getInstance(): AdvancedCache {
    if (!AdvancedCache.instance) {
      AdvancedCache.instance = new AdvancedCache();
    }
    return AdvancedCache.instance;
  }

  constructor() {
    // Configure different cache strategies for different content types
    this.configs.set('products', {
      maxAge: 10 * 60 * 1000, // 10 minutes
      maxEntries: 100,
      strategy: 'stale-while-revalidate'
    });

    this.configs.set('user-data', {
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxEntries: 50,
      strategy: 'network-first'
    });

    this.configs.set('static-assets', {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      maxEntries: 200,
      strategy: 'cache-first'
    });

    this.configs.set('api-responses', {
      maxAge: 2 * 60 * 1000, // 2 minutes
      maxEntries: 1000,
      strategy: 'stale-while-revalidate'
    });

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set(key: string, data: any, type: string = 'api-responses', etag?: string, lastModified?: string): void {
    const config = this.configs.get(type) || this.configs.get('api-responses')!;
    
    // Check if we need to evict entries
    if (this.cache.size >= config.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      etag,
      lastModified
    });
  }

  get(key: string, type: string = 'api-responses'): any | null {
    const config = this.configs.get(type) || this.configs.get('api-responses')!;
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > config.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  getWithMetadata(key: string, type: string = 'api-responses'): { data: any; etag?: string; lastModified?: string } | null {
    const config = this.configs.get(type) || this.configs.get('api-responses')!;
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() - entry.timestamp > config.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return {
      data: entry.data,
      etag: entry.etag,
      lastModified: entry.lastModified
    };
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      // Remove entries older than 1 hour regardless of type
      if (now - entry.timestamp > 60 * 60 * 1000) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Preload critical data
  async preloadCriticalData(): Promise<void> {
    const criticalEndpoints = [
      '/api/products',
      '/api/user/profile',
      '/api/cart'
    ];

    for (const endpoint of criticalEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          const etag = response.headers.get('etag');
          const lastModified = response.headers.get('last-modified');
          
          this.set(endpoint, data, 'api-responses', etag || undefined, lastModified || undefined);
        }
      } catch (error) {
        console.warn(`Failed to preload ${endpoint}:`, error);
      }
    }
  }
}

export const advancedCache = AdvancedCache.getInstance();

// Hook for using advanced cache in components
export const useAdvancedCache = () => {
  return {
    get: (key: string, type?: string) => advancedCache.get(key, type),
    set: (key: string, data: any, type?: string, etag?: string, lastModified?: string) => 
      advancedCache.set(key, data, type, etag, lastModified),
    getWithMetadata: (key: string, type?: string) => advancedCache.getWithMetadata(key, type),
    preloadCriticalData: () => advancedCache.preloadCriticalData()
  };
};
