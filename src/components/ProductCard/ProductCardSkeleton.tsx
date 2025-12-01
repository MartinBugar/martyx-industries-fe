import React from 'react';
import './ProductCardSkeleton.css';

interface ProductCardSkeletonProps {
  count?: number;
}

/**
 * Skeleton loading placeholder for ProductCard
 * Matches the exact dimensions and layout of ProductCard
 * for seamless loading experience
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <article className="product-card-skeleton" aria-hidden="true">
      {/* Image placeholder */}
      <div className="skeleton-image" />

      {/* Content area */}
      <div className="skeleton-content">
        {/* Title - 2 lines */}
        <div className="skeleton-title" />
        <div className="skeleton-title skeleton-title-short" />

        {/* Description - 3 lines */}
        <div className="skeleton-description" />
        <div className="skeleton-description" />
        <div className="skeleton-description skeleton-description-short" />
      </div>

      {/* Footer - Price + Button */}
      <div className="skeleton-footer">
        <div className="skeleton-price" />
        <div className="skeleton-button" />
      </div>
    </article>
  );
};

/**
 * Renders multiple skeleton cards for loading states
 */
export const ProductCardSkeletonGrid: React.FC<ProductCardSkeletonProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={`skeleton-${index}`} />
      ))}
    </>
  );
};

export default ProductCardSkeleton;
