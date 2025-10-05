/**
 * Performance Monitoring Utility
 * Tracks and reports performance metrics
 */

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  totalBlockingTime: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  init(): void {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();

    // Monitor custom metrics
    this.observeCustomMetrics();

    // Report metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => this.reportMetrics(), 2000);
    });
  }

  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.largestContentfulPaint = lastEntry.startTime;
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(observer);
  }

  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.push(observer);
  }

  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.cumulativeLayoutShift = clsValue;
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(observer);
  }

  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.firstContentfulPaint = entry.startTime;
        }
      });
    });

    observer.observe({ entryTypes: ['paint'] });
    this.observers.push(observer);
  }

  private observeTTFB(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          this.metrics.loadTime = entry.loadEventEnd - entry.fetchStart;
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  private observeCustomMetrics(): void {
    // Monitor bundle loading times
    const scriptTags = document.querySelectorAll('script[src]');
    scriptTags.forEach((script) => {
      const startTime = performance.now();
      script.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        console.log(`Script ${script.src} loaded in ${loadTime}ms`);
      });
    });

    // Monitor image loading
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      const startTime = performance.now();
      img.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        if (loadTime > 1000) {
          console.warn(`Slow image load: ${img.src} took ${loadTime}ms`);
        }
      });
    });
  }

  private reportMetrics(): void {
    const metrics = this.getMetrics();
    
    if (import.meta.env.DEV) {
      console.log('📊 Performance Metrics:', metrics);
    }

    // Send to analytics service
    this.sendToAnalytics(metrics);
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  private sendToAnalytics(metrics: Partial<PerformanceMetrics>): void {
    // Send to your analytics service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: 'Core Web Vitals',
        value: Math.round(metrics.largestContentfulPaint || 0),
        custom_map: {
          lcp: metrics.largestContentfulPaint,
          fid: metrics.firstInputDelay,
          cls: metrics.cumulativeLayoutShift,
          fcp: metrics.firstContentfulPaint,
          load_time: metrics.loadTime
        }
      });
    }
  }

  // Manual performance measurement
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`${name} took ${end - start}ms`);
    return result;
  }

  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    console.log(`${name} took ${end - start}ms`);
    return result;
  }

  // Cleanup
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// Hook for using performance monitor in components
export const usePerformanceMonitor = () => {
  return {
    measure: (name: string, fn: () => any) => performanceMonitor.measureFunction(name, fn),
    measureAsync: (name: string, fn: () => Promise<any>) => performanceMonitor.measureAsyncFunction(name, fn),
    getMetrics: () => performanceMonitor.getMetrics()
  };
};
