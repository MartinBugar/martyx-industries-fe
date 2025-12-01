import React from 'react';
import './Skeleton.css';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      variant = 'text',
      width,
      height,
      animation = 'pulse',
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const classes = [
      'skeleton',
      `skeleton-${variant}`,
      animation !== 'none' ? `skeleton-${animation}` : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const combinedStyle: React.CSSProperties = {
      width,
      height,
      ...style,
    };

    return <div ref={ref} className={classes} style={combinedStyle} {...props} />;
  }
);

Skeleton.displayName = 'Skeleton';

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} variant="rectangular" height={16} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="rectangular" height={14} />
          ))}
        </div>
      ))}
    </div>
  );
};

export interface SkeletonCardProps {
  hasImage?: boolean;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ hasImage = false, lines = 3 }) => {
  return (
    <div className="skeleton-card">
      {hasImage && <Skeleton variant="rectangular" height={200} className="skeleton-card-image" />}
      <div className="skeleton-card-content">
        <Skeleton variant="text" height={20} width="60%" className="skeleton-card-title" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={`line-${i}`}
            variant="text"
            height={14}
            width={i === lines - 1 ? '80%' : '100%'}
          />
        ))}
      </div>
    </div>
  );
};

// Product Card Skeleton - matches ProductCard layout
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="skeleton-product-card" aria-hidden="true">
      {/* Image placeholder */}
      <Skeleton
        variant="rectangular"
        height={200}
        className="skeleton-product-image"
        animation="wave"
      />
      {/* Content area */}
      <div className="skeleton-product-content">
        {/* Title */}
        <Skeleton variant="text" height={24} width="85%" animation="wave" />
        {/* Description lines */}
        <Skeleton variant="text" height={14} width="100%" animation="wave" />
        <Skeleton variant="text" height={14} width="90%" animation="wave" />
        <Skeleton variant="text" height={14} width="70%" animation="wave" />
      </div>
      {/* Footer - price and button */}
      <div className="skeleton-product-footer">
        <Skeleton variant="text" height={28} width={80} animation="wave" />
        <Skeleton variant="rectangular" height={44} width={120} animation="wave" />
      </div>
    </div>
  );
};

// Product Grid Skeleton - shows multiple product skeletons
export interface ProductGridSkeletonProps {
  count?: number;
}

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="skeleton-products-grid" role="status" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={`skeleton-${i}`} />
      ))}
    </div>
  );
};

// Order Item Skeleton - for order history
export const OrderItemSkeleton: React.FC = () => {
  return (
    <div className="skeleton-order-item" aria-hidden="true">
      <div className="skeleton-order-header">
        <Skeleton variant="text" height={20} width={150} animation="wave" />
        <Skeleton variant="text" height={16} width={100} animation="wave" />
      </div>
      <div className="skeleton-order-details">
        <Skeleton variant="text" height={14} width="60%" animation="wave" />
        <Skeleton variant="text" height={14} width="40%" animation="wave" />
      </div>
      <div className="skeleton-order-footer">
        <Skeleton variant="rectangular" height={32} width={120} animation="wave" />
      </div>
    </div>
  );
};

// Checkout Summary Skeleton
export const CheckoutSummarySkeleton: React.FC = () => {
  return (
    <div className="skeleton-checkout-summary" aria-hidden="true">
      <Skeleton variant="text" height={24} width="50%" animation="wave" />
      <div className="skeleton-summary-items">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`item-${i}`} className="skeleton-summary-row">
            <Skeleton variant="text" height={16} width="70%" animation="wave" />
            <Skeleton variant="text" height={16} width={60} animation="wave" />
          </div>
        ))}
      </div>
      <div className="skeleton-summary-divider" />
      <div className="skeleton-summary-row skeleton-total">
        <Skeleton variant="text" height={20} width={80} animation="wave" />
        <Skeleton variant="text" height={24} width={100} animation="wave" />
      </div>
    </div>
  );
};

// Product Detail Page Skeleton - matches ProductDetail layout
export const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="skeleton-product-detail" role="status" aria-label="Loading product details">
      <div className="skeleton-product-detail-grid">
        {/* Left: Image gallery skeleton */}
        <div className="skeleton-product-gallery">
          <Skeleton
            variant="rectangular"
            className="skeleton-main-image"
            animation="wave"
          />
          <div className="skeleton-thumbnail-row">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={`thumb-${i}`}
                variant="rectangular"
                className="skeleton-thumbnail"
                animation="wave"
              />
            ))}
          </div>
        </div>

        {/* Right: Product info skeleton */}
        <div className="skeleton-product-info">
          {/* Title */}
          <Skeleton variant="text" height={36} width="80%" animation="wave" />
          {/* Subtitle/category */}
          <Skeleton variant="text" height={20} width="40%" animation="wave" />

          {/* Price */}
          <div className="skeleton-price-section">
            <Skeleton variant="text" height={40} width={120} animation="wave" />
          </div>

          {/* Description lines */}
          <div className="skeleton-description">
            <Skeleton variant="text" height={16} width="100%" animation="wave" />
            <Skeleton variant="text" height={16} width="95%" animation="wave" />
            <Skeleton variant="text" height={16} width="85%" animation="wave" />
            <Skeleton variant="text" height={16} width="90%" animation="wave" />
          </div>

          {/* Variant selector */}
          <div className="skeleton-variant-selector">
            <Skeleton variant="text" height={20} width={100} animation="wave" />
            <div className="skeleton-variant-options">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={`variant-${i}`}
                  variant="rectangular"
                  height={44}
                  width={100}
                  animation="wave"
                />
              ))}
            </div>
          </div>

          {/* Add to cart button */}
          <Skeleton
            variant="rectangular"
            height={52}
            className="skeleton-add-to-cart"
            animation="wave"
          />

          {/* Wishlist button */}
          <Skeleton variant="rectangular" height={44} width={150} animation="wave" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="skeleton-tabs-section">
        <div className="skeleton-tab-headers">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={`tab-${i}`}
              variant="rectangular"
              height={40}
              width={100}
              animation="wave"
            />
          ))}
        </div>
        <div className="skeleton-tab-content">
          <Skeleton variant="text" height={18} width="100%" animation="wave" />
          <Skeleton variant="text" height={18} width="90%" animation="wave" />
          <Skeleton variant="text" height={18} width="95%" animation="wave" />
          <Skeleton variant="text" height={18} width="80%" animation="wave" />
        </div>
      </div>
    </div>
  );
};
