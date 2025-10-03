'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { getNextImageProps, getBestImageUrl, getBaseNameFromPath, isCDNEnabled, getImageSrcSet } from '@/utils/cdnImages';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  onLoad?: () => void;
  onError?: (error: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  // Legacy props for 1:1 compatibility with Vite version
  srcSet?: string;
  style?: React.CSSProperties;
}

/**
 * Optimized Image component that provides 1:1 visual parity with Vite version
 * Automatically handles CDN optimization, fallbacks, and responsive images
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 800,
  height = 600,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  loading,
  decoding = 'async',
  onLoad,
  onError,
  srcSet: legacySrcSet,
  style,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Check if this is a CDN image or external URL
  const isCDNUrl = src.includes('digitaloceanspaces.com') || src.includes(process.env.NEXT_PUBLIC_CDN_BASE || '');
  const isLocalImage = src.startsWith('/') && !isCDNUrl;
  
  // For CDN images, use our optimization logic
  if (isCDNUrl && isCDNEnabled()) {
    const baseName = getBaseNameFromPath(src);
    const optimizedSrc = getBestImageUrl(baseName, width);
    
    return (
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        loading={loading || (priority ? 'eager' : 'lazy')}
        sizes={sizes}
        quality={quality}
        style={style}
        onLoad={() => {
          setImageLoaded(true);
          onLoad?.();
        }}
        onError={(e) => {
          setImageError(true);
          onError?.(e);
        }}
        {...props}
      />
    );
  }

  // For external URLs or when CDN is disabled, use Next/Image directly
  if (isCDNUrl || src.startsWith('http')) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        loading={loading || (priority ? 'eager' : 'lazy')}
        sizes={sizes}
        quality={quality}
        style={style}
        onLoad={() => {
          setImageLoaded(true);
          onLoad?.();
        }}
        onError={(e) => {
          setImageError(true);
          onError?.(e);
        }}
        {...props}
      />
    );
  }

  // For local images, use regular img tag to maintain 1:1 compatibility
  // This ensures exact same behavior as Vite version for local assets
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading || (priority ? 'eager' : 'lazy')}
      decoding={decoding}
      srcSet={legacySrcSet}
      sizes={sizes}
      style={style}
      onLoad={() => {
        setImageLoaded(true);
        onLoad?.();
      }}
      onError={(e) => {
        setImageError(true);
        onError?.(e);
      }}
      {...props}
    />
  );
};

export default OptimizedImage;
