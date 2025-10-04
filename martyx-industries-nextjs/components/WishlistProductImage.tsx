import React, { memo } from 'react';
import { type Product } from '@/data/productData';
import { type WishlistItem } from '@/types/wishlist';
import { getBestImageUrl, getBaseNameFromPath, isCDNEnabled } from '@/utils/cdnImages';

interface WishlistProductImageProps {
  item: WishlistItem;
  product?: Product;
  loading?: boolean;
}

/**
 * Optimized product image component for wishlist with CDN support
 * Memoized to prevent unnecessary re-renders
 */
const WishlistProductImage: React.FC<WishlistProductImageProps> = memo(({
  item,
  product,
  loading = false
}) => {
  // Determine the best image source with CDN optimization
  const getOptimizedImageSrc = (): string | null => {
    // First priority: product gallery from database
    if (product?.gallery && product.gallery.length > 0) {
      const galleryImage = product.gallery[0];

      // If it's already a CDN URL, use it directly
      if (galleryImage.includes('digitaloceanspaces.com') || galleryImage.includes(process.env.NEXT_PUBLIC_CDN_BASE || '')) {
        return galleryImage;
      }

      // Apply CDN optimization if available
      if (isCDNEnabled()) {
        return getBestImageUrl(getBaseNameFromPath(galleryImage), 800);
      }

      return galleryImage;
    }

    // Second priority: wishlist item image URL
    if (item.productImageUrl) {
      // Apply CDN optimization if it's not already a CDN URL
      if (item.productImageUrl.includes('digitaloceanspaces.com') || item.productImageUrl.includes(process.env.NEXT_PUBLIC_CDN_BASE || '')) {
        return item.productImageUrl;
      }

      if (isCDNEnabled()) {
        return getBestImageUrl(getBaseNameFromPath(item.productImageUrl), 800);
      }

      return item.productImageUrl;
    }

    return null;
  };

  const imageSrc = getOptimizedImageSrc();

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🖼️ WishlistProductImage:', {
      itemName: item.productName,
      itemImageUrl: item.productImageUrl,
      productGallery: product?.gallery,
      finalImageSrc: imageSrc,
      loading
    });
  }

  if (loading) {
    return (
      <div className="product-card-placeholder loading-shimmer">
        <div className="shimmer-animation" />
      </div>
    );
  }

  if (imageSrc) {
    return (
      <img
        src={imageSrc}
        alt={`${item.productName} - main image`}
        className="product-card-image"
        loading="lazy"
        decoding="async"
        onError={(e) => {
          // Fallback to original URL if optimized version fails
          if (item.productImageUrl && e.currentTarget.src !== item.productImageUrl) {
            e.currentTarget.src = item.productImageUrl;
          }
        }}
      />
    );
  }

  // Fallback placeholder
  return (
    <div className="product-card-placeholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
        <circle cx="12" cy="13" r="3"/>
      </svg>
    </div>
  );
});

WishlistProductImage.displayName = 'WishlistProductImage';

export default WishlistProductImage;
