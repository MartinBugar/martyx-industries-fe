import { useEffect } from 'react';

// Hook pre preload kritických obrázkov do HTML head
export const useImagePreload = (imageUrls: string[], priority: 'high' | 'low' = 'low') => {
  useEffect(() => {
    if (!imageUrls.length) return;

    const preloadLinks: HTMLLinkElement[] = [];

    // Vytvor preload link tags pre každý obrázok
    imageUrls.forEach((url, index) => {
      // Preload len prvých 6 obrázkov, aby sme nezahlcovali sieť
      if (index >= 6) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      
      // Nastavenie priority
      if (priority === 'high' || index < 3) {
        link.setAttribute('fetchpriority', 'high');
      }

      document.head.appendChild(link);
      preloadLinks.push(link);
    });

    // Cleanup - odstráň preload links po unmount
    return () => {
      preloadLinks.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [imageUrls, priority]);
};

// Hook pre batch preload obrázkov pomocou Image() objektov
export const useBatchImagePreload = (imageUrls: string[], delay: number = 100) => {
  useEffect(() => {
    if (!imageUrls.length) return;

    let cancelled = false;

    const preloadBatch = async () => {
      for (let i = 0; i < imageUrls.length; i++) {
        if (cancelled) break;

        const img = new Image();
        img.src = imageUrls[i];
        
        // Malé oneskorenie medzi preloadmi
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    // Začni preload po krátkom oneskorení
    const timeoutId = setTimeout(preloadBatch, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [imageUrls, delay]);
};
