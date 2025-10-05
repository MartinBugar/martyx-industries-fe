// Enhanced Image preloading utility with priority and intersection observer
export class ImagePreloader {
  private static cache = new Set<string>();
  private static preloadQueue: Array<{ url: string; priority: number; timestamp: number }> = [];
  private static isProcessing = false;
  private static observer: IntersectionObserver | null = null;
  private static observedElements = new Map<Element, string>();

  // Preload kritických obrázkov (hero images, first product images)
  static preloadCritical(urls: string[]) {
    urls.forEach(url => {
      if (!this.cache.has(url)) {
        this.preloadQueue.unshift({ url, priority: 3, timestamp: Date.now() }); // High priority
      }
    });
    this.processQueue();
  }

  // Preload obrázkov v pozadí
  static preloadBackground(urls: string[]) {
    urls.forEach(url => {
      if (!this.cache.has(url)) {
        this.preloadQueue.push({ url, priority: 1, timestamp: Date.now() }); // Low priority
      }
    });
    this.processQueue();
  }

  // Preload obrázkov s medium priority
  static preloadMedium(urls: string[]) {
    urls.forEach(url => {
      if (!this.cache.has(url)) {
        this.preloadQueue.push({ url, priority: 2, timestamp: Date.now() }); // Medium priority
      }
    });
    this.processQueue();
  }

  // Observe element for intersection-based preloading
  static observeElement(element: Element, imageUrl: string) {
    if (!this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const url = this.observedElements.get(entry.target);
              if (url) {
                this.preloadMedium([url]);
                this.observer?.unobserve(entry.target);
                this.observedElements.delete(entry.target);
              }
            }
          });
        },
        { rootMargin: '100px' }
      );
    }

    this.observedElements.set(element, imageUrl);
    this.observer.observe(element);
  }

  private static async processQueue() {
    if (this.isProcessing || this.preloadQueue.length === 0) return;
    
    this.isProcessing = true;

    // Sort by priority (high to low) and then by timestamp
    this.preloadQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp - b.timestamp; // Older requests first
    });

    // Process 3 images at a time to not overwhelm network
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, 3);
      await Promise.allSettled(
        batch.map(item => this.preloadImage(item.url))
      );
    }

    this.isProcessing = false;
  }

  private static preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.cache.has(url)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.cache.add(url);
        resolve();
      };
      img.onerror = () => {
        console.warn(`Failed to preload image: ${url}`);
        reject();
      };
      img.src = url;
    });
  }

  // Check if image is already cached
  static isCached(url: string): boolean {
    return this.cache.has(url);
  }

  // Clear cache (for memory management)
  static clearCache() {
    this.cache.clear();
  }
}

// Hook for using preloader in components
import { useEffect } from 'react';

export const useImagePreloader = (
  urls: string[], 
  priority: 'critical' | 'background' = 'background'
) => {
  useEffect(() => {
    if (urls.length === 0) return;

    if (priority === 'critical') {
      ImagePreloader.preloadCritical(urls);
    } else {
      ImagePreloader.preloadBackground(urls);
    }
  }, [urls, priority]);
};
