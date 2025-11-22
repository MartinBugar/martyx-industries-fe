import React, { useState, useRef, useEffect } from 'react';
import './OptimizedImage.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  priority?: boolean;
  eager?: boolean; // Nová prop pre immediate loading bez intersection observer
  style?: React.CSSProperties;
  // Všetky ostatné img props
  [key: string]: any;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = '/images/product-placeholder.svg',
  priority = false,
  eager = false,
  style = {},
  ...imgProps
}) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority || eager); // Eager loading alebo priority
  const [error, setError] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority || eager) return; // Skip intersection observer pre priority/eager obrázky

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, eager]);

  const handleLoad = () => {
    setLoaded(true);
    setError(false);
  };

  const handleError = () => {
    if (import.meta.env.DEV) {
      console.warn('❌ Image failed to load:', src);
    }

    // If the main image failed and we haven't tried fallback yet, try placeholder
    if (!useFallback && !error) {
      setUseFallback(true);
      setError(true);
    } else {
      setError(true);
      setLoaded(true); // Stop trying
    }
  };

  // Kombinuj existujúce className s našimi optimalizačnými triedami
  const combinedClassName = `${className} optimized-image ${loaded ? 'loaded' : 'loading'}`.trim();

  // Kombinuj existujúce style - NEPOUŽÍVAME inline opacity/transition
  // Nechávame CSS triedy kontrolovať opacity (napr. ProductCard hover effects)
  const combinedStyle = {
    ...style
    // Odstránené inline opacity a transition - CSS má plnú kontrolu
  };

  // Determine which source to use
  const imageSrc = React.useMemo(() => {
    if (!inView) return placeholder;
    if (useFallback) return placeholder;
    return src;
  }, [inView, useFallback, src, placeholder]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={combinedClassName}
      style={combinedStyle}
      onLoad={handleLoad}
      onError={handleError}
      loading={(priority || eager) ? 'eager' : 'lazy'}
      decoding="async"
      {...imgProps} // Spread všetky ostatné props
    />
  );
};

export default OptimizedImage;