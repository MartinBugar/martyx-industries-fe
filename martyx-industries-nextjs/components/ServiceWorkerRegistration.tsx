'use client';

import { useEffect } from 'react';

/**
 * Service Worker Registration Component
 * Provides 1:1 functionality parity with Vite version
 */
const ServiceWorkerRegistration = () => {
  useEffect(() => {
    // Only register in production and if service worker is supported
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      const register = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          if (process.env.NODE_ENV === 'development') {
            console.log('SW registered: ', registration);
          }
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available, notify user
                  if (process.env.NODE_ENV === 'development') {
                    console.log('New content is available; please refresh.');
                  }
                }
              });
            }
          });
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.log('SW registration failed: ', error);
          }
        }
      };

      if (document.readyState === 'complete') {
        register();
      } else {
        window.addEventListener('load', register);
        return () => window.removeEventListener('load', register);
      }
    } else if (process.env.NODE_ENV !== 'production' && 'serviceWorker' in navigator) {
      // In development, proactively unregister any existing service workers to prevent caching conflicts
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {
            // Silent fail - this is cleanup
          });
        }
      }).catch(() => {
        // Silent fail - this is cleanup
      });
    }
  }, []);

  return null; // This component doesn't render anything
};

export default ServiceWorkerRegistration;
