/**
 * CDN Image Utilities
 * Handles image URL generation from DigitalOcean Spaces CDN with fallback to local assets
 */

import { logInfo } from '../services/logger';

// Environment variables
const CDN_BASE = import.meta.env.VITE_CDN_BASE || '';
const CDN_FOLDER = import.meta.env.VITE_CDN_FOLDER || '1';
const USE_CDN_IMAGES = import.meta.env.VITE_USE_CDN_IMAGES === 'true';

// Image size variants
export type ImageSize = 'thumb' | '400' | '800' | '1600' | 'original';

export interface ImageVariants {
  thumb?: string;
  small?: string;  // 400px
  medium?: string; // 800px
  large?: string;  // 1600px
  original?: string;
}

/**
 * Generate CDN URL for a given image
 */
export function getCDNImageUrl(baseName: string, size?: ImageSize, format?: 'webp' | 'avif' | 'jpg' | 'png', customFolder?: string): string {
  if (!USE_CDN_IMAGES || !CDN_BASE) {
    // Fallback to local assets
    if (import.meta.env.DEV) {
      logInfo('🚫 CDN disabled or no base URL:', { USE_CDN_IMAGES, CDN_BASE });
    }
    return getLocalImageUrl(baseName, size, format);
  }

  // Use custom folder if provided, otherwise use default CDN_FOLDER
  const folder = customFolder || CDN_FOLDER;
  const baseUrl = `${CDN_BASE}/${folder}`;

  if (!size || size === 'original') {
    // Return original file with optional format
    const extension = format || 'png';
    const finalUrl = `${baseUrl}/${baseName}.${extension}`;
    if (import.meta.env.DEV) {
      logInfo('🌐 CDN URL generated:', finalUrl, 'for folder:', folder);
    }
    return finalUrl;
  }

  // Return sized variant
  const sizeMap = {
    thumb: 'thumb',
    '400': '400',
    '800': '800',
    '1600': '1600'
  };

  const extension = format || 'webp';
  const sizeSuffix = sizeMap[size];

  return `${baseUrl}/${baseName}-${sizeSuffix}.${extension}`;
}

/**
 * Generate multiple image variants for responsive images
 */
export function getImageVariants(baseName: string): ImageVariants {
  if (!USE_CDN_IMAGES || !CDN_BASE) {
    return getLocalImageVariants(baseName);
  }

  return {
    thumb: getCDNImageUrl(baseName, 'thumb', 'avif'),
    small: getCDNImageUrl(baseName, '400', 'webp'),
    medium: getCDNImageUrl(baseName, '800', 'webp'),
    large: getCDNImageUrl(baseName, '1600', 'webp'),
    original: getCDNImageUrl(baseName, 'original', 'png')
  };
}

/**
 * Generate srcset string for responsive images
 */
export function getImageSrcSet(baseName: string): string {
  if (!USE_CDN_IMAGES || !CDN_BASE) {
    return getLocalImageSrcSet(baseName);
  }

  const variants = [
    `${getCDNImageUrl(baseName, '400', 'webp')} 400w`,
    `${getCDNImageUrl(baseName, '800', 'webp')} 800w`,
    `${getCDNImageUrl(baseName, '1600', 'webp')} 1600w`
  ];

  return variants.join(', ');
}

/**
 * Get the best image URL for a given width
 */
export function getBestImageUrl(baseName: string, targetWidth: number): string {
  if (!USE_CDN_IMAGES || !CDN_BASE) {
    return getLocalImageUrl(baseName);
  }

  if (targetWidth <= 400) {
    return getCDNImageUrl(baseName, '400', 'webp');
  } else if (targetWidth <= 800) {
    return getCDNImageUrl(baseName, '800', 'webp');
  } else if (targetWidth <= 1600) {
    return getCDNImageUrl(baseName, '1600', 'webp');
  } else {
    return getCDNImageUrl(baseName, 'original', 'png');
  }
}

/**
 * Get LCP (Largest Contentful Paint) optimized image URL
 * Returns the largest available variant for immediate loading
 */
export function getLCPImageUrl(baseName: string): string {
  if (!USE_CDN_IMAGES || !CDN_BASE) {
    return getLocalImageUrl(baseName);
  }

  // For LCP, prefer largest WebP variant
  return getCDNImageUrl(baseName, '1600', 'webp');
}

/**
 * Generate preload link attributes for LCP images
 */
export function getLCPPreloadAttributes(baseName: string) {
  const url = getLCPImageUrl(baseName);
  const srcset = getImageSrcSet(baseName);

  return {
    rel: 'preload',
    as: 'image',
    href: url,
    imageSrcset: srcset,
    imageSizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  };
}

// Fallback functions for local assets
function getLocalImageUrl(baseName: string, size?: ImageSize, format?: string): string {
  // Try to construct local asset path
  const extension = format || 'jpg';
  const sizePrefix = size && size !== 'original' ? `-${size}` : '';

  // Check common local asset paths
  const possiblePaths = [
    `/src/assets/products/${baseName}${sizePrefix}.${extension}`,
    `/src/assets/images/${baseName}${sizePrefix}.${extension}`,
    `/public/images/products/${baseName}${sizePrefix}.${extension}`,
    `/images/products/${baseName}.${extension}`, // fallback to original
    `/api/placeholder/800/600` // ultimate fallback
  ];

  // For now, return the first path - in a real implementation,
  // we might want to check which files actually exist
  return possiblePaths[0];
}

function getLocalImageVariants(baseName: string): ImageVariants {
  return {
    thumb: getLocalImageUrl(baseName, 'thumb'),
    small: getLocalImageUrl(baseName, '400'),
    medium: getLocalImageUrl(baseName, '800'),
    large: getLocalImageUrl(baseName, '1600'),
    original: getLocalImageUrl(baseName, 'original')
  };
}

function getLocalImageSrcSet(baseName: string): string {
  return [
    `${getLocalImageUrl(baseName, '400')} 400w`,
    `${getLocalImageUrl(baseName, '800')} 800w`,
    `${getLocalImageUrl(baseName, '1600')} 1600w`
  ].join(', ');
}

/**
 * Check if CDN is enabled
 */
export function isCDNEnabled(): boolean {
  return USE_CDN_IMAGES && !!CDN_BASE;
}

/**
 * Get CDN configuration info (for debugging)
 */
export function getCDNConfig() {
  return {
    enabled: USE_CDN_IMAGES,
    base: CDN_BASE,
    folder: CDN_FOLDER,
    fullBaseUrl: USE_CDN_IMAGES ? `${CDN_BASE}/${CDN_FOLDER}` : null
  };
}

/**
 * Generate CDN URL for a product image
 */
export function getProductImageUrl(productId: string, imageNumber: number, format?: 'webp' | 'avif' | 'jpg' | 'png'): string {
  // Map product IDs to folder names
  const productFolderMap: Record<string, string> = {
    '1': 'ENDEAVOUR',
    'endeavour': 'ENDEAVOUR',
    '2': 'RAKETA',
    'raketa': 'RAKETA',
    // Add more products as needed
  };

  const folder = productFolderMap[productId.toLowerCase()] || productId.toUpperCase();
  const baseName = imageNumber.toString();

  return getCDNImageUrl(baseName, 'original', format || 'png', folder);
}

/**
 * Convert legacy image path to CDN base name
 * Useful for migrating existing image references
 */
export function getBaseNameFromPath(imagePath: string): string {
  // Extract base name from various path formats
  const filename = imagePath.split('/').pop() || '';
  const baseName = filename.replace(/\.(jpg|jpeg|png|webp|avif)$/i, '');

  // Remove size suffixes
  return baseName.replace(/-(thumb|400|800|1600)$/i, '');
}