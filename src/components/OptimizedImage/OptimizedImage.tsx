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
  style = {},
  ...imgProps
}) => {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return;

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
  }, [priority]);

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    setError(true);
    setLoaded(true);
  };

  // Kombinuj existujúce className s našimi optimalizačnými triedami
  const combinedClassName = `${className} optimized-image ${loaded ? 'loaded' : 'loading'}`.trim();

  // Kombinuj existujúce style s našimi optimalizačnými štýlmi
  const combinedStyle = {
    ...style,
    // Pridaj len minimálne potrebné štýly pre optimalizáciu
    transition: loaded ? 'opacity 0.3s ease' : 'none',
    opacity: loaded ? 1 : (priority ? 1 : 0.8)
  };

  return (
    <img
      ref={imgRef}
      src={inView ? (error ? placeholder : src) : placeholder}
      alt={alt}
      width={width}
      height={height}
      className={combinedClassName}
      style={combinedStyle}
      onLoad={handleLoad}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...imgProps} // Spread všetky ostatné props
    />
  );
};

export default OptimizedImage;