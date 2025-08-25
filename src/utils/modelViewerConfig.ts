/**
 * Model Viewer configuration for production optimization
 * Disables development warnings and optimizes performance
 */

declare global {
  interface Window {
    LitDevMode?: boolean;
  }
}

/**
 * Initialize model-viewer configuration for production
 */
export const initializeModelViewerConfig = (): void => {
  // Disable Lit dev mode warnings in production
  if (import.meta.env.PROD) {
    window.LitDevMode = false;
  }
  
  // Additional performance optimizations for model-viewer
  if (typeof window !== 'undefined' && 'customElements' in window) {
    // Set model-viewer specific performance settings
    const style = document.createElement('style');
    style.textContent = `
      model-viewer {
        --poster-color: transparent;
        --progress-bar-color: #3b82f6;
        --progress-bar-height: 2px;
      }
      
      /* Optimize rendering performance */
      model-viewer[loading="lazy"] {
        contain: layout style paint;
      }
    `;
    document.head.appendChild(style);
  }
};

/**
 * Apply model-viewer optimizations for better performance
 */
export const optimizeModelViewer = (element: HTMLElement): void => {
  if (!element) return;
  
  // Set loading strategy
  element.setAttribute('loading', 'lazy');
  
  // Disable auto-rotate during user interaction for better performance
  if (element.hasAttribute('auto-rotate')) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          element.setAttribute('auto-rotate', '');
        } else {
          element.removeAttribute('auto-rotate');
        }
      });
    });
    
    observer.observe(element);
  }
};
