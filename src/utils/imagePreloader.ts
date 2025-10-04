// Image preloading utility
export class ImagePreloader {
  private static cache = new Set<string>();
  private static preloadQueue: string[] = [];
  private static isProcessing = false;

  // Preload kritických obrázkov (hero images, first product images)
  static preloadCritical(urls: string[]) {
    urls.forEach(url => {
      if (!this.cache.has(url)) {
        this.preloadQueue.unshift(url); // Priority na začiatok
      }
    });
    this.processQueue();
  }

  // Preload obrázkov v pozadí
  static preloadBackground(urls: string[]) {
    urls.forEach(url => {
      if (!this.cache.has(url)) {
        this.preloadQueue.push(url); // Na koniec queue
      }
    });
    this.processQueue();
  }

  private static async processQueue() {
    if (this.isProcessing || this.preloadQueue.length === 0) return;
    
    this.isProcessing = true;

    // Process 3 images at a time to not overwhelm network
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, 3);
      await Promise.allSettled(
        batch.map(url => this.preloadImage(url))
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
