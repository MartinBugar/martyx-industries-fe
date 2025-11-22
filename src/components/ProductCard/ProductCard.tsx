import React from 'react';
import { Link } from 'react-router-dom';
import { type Product } from '../../data/productData';
import WishlistButton from '../WishlistButton';
import OptimizedImage from '../OptimizedImage/OptimizedImage';
import { getBestImageUrl, getBaseNameFromPath, isCDNEnabled } from '../../utils/cdnImages';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  showWishlistButton?: boolean;
  showAddToCart?: boolean;
  addedDate?: Date;
  isUnavailable?: boolean;
  priority?: boolean;
  popupState?: {
    visible: boolean;
    message: string;
    variant: 'success' | 'warning';
  };
  className?: string;
  children?: React.ReactNode; // For additional content like wishlist meta
  disableLink?: boolean; // For admin preview where link shouldn't be clickable
}

// Helper function to get price display with "Od" prefix if multiple variants
const getPriceDisplay = (product: Product): { prefix: string; price: number } => {
  const hasMultipleVariants = product.availableVariants && product.availableVariants.length > 1;

  if (hasMultipleVariants) {
    // Find lowest price from all variants
    const lowestPrice = Math.min(...product.availableVariants!.map(v => v.priceWithVat));
    return { prefix: 'Od ', price: lowestPrice };
  }

  // Single variant or no variants - show current price without prefix
  return { prefix: '', price: product.priceWithVat };
};

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  showWishlistButton = true,
  showAddToCart = true,
  isUnavailable = false,
  priority = false,
  popupState,
  className = '',
  children,
  disableLink = false
}) => {
  const mainImage = product.gallery && product.gallery.length > 0 ? product.gallery[0] : undefined;
  const hoverImage = product.gallery && product.gallery.length > 1 ? product.gallery[1] : undefined;
  const { prefix, price } = getPriceDisplay(product);
  const hasMultipleVariants = product.availableVariants && product.availableVariants.length > 1;

  const getImageUrl = (imageUrl: string) => {
    const isCDNUrl = imageUrl.includes('digitaloceanspaces.com') || imageUrl.includes(import.meta.env.VITE_CDN_BASE || '');
    return isCDNUrl ? imageUrl : (isCDNEnabled() ? getBestImageUrl(getBaseNameFromPath(imageUrl), 800) : imageUrl);
  };

  // Shared image container content - ensures hover image works everywhere
  const imageContainerContent = (
    <div className="product-card-image-container">
      {mainImage ? (
        <>
          <OptimizedImage
            src={getImageUrl(mainImage)}
            alt={`${product.name} - main image`}
            className="product-card-image product-card-image-main"
            priority={priority}
            placeholder="/images/product-placeholder.svg"
          />
          {hoverImage && (
            <OptimizedImage
              src={getImageUrl(hoverImage)}
              alt={`${product.name} - hover image`}
              className="product-card-image product-card-image-hover"
              placeholder="/images/product-placeholder.svg"
            />
          )}
        </>
      ) : (
        <div className="product-card-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
            <circle cx="12" cy="13" r="3"></circle>
          </svg>
        </div>
      )}

      {showWishlistButton && (
        <div className="product-card-wishlist">
          <WishlistButton
            productId={product.masterProductId}
            size="small"
            variant="icon"
          />
        </div>
      )}

      {isUnavailable && (
        <div className="unavailable-overlay">
          <span>Unavailable</span>
        </div>
      )}
    </div>
  );

  // Shared content section
  const contentSection = (
    <div className="product-card-content">
      <h3 className="product-card-title">{product.name}</h3>
      <p className="product-card-description">{product.description}</p>
    </div>
  );

  return (
    <article className={`product-card ${isUnavailable ? 'product-card--unavailable' : ''} ${className}`}>
      {disableLink ? (
        <div
          className="product-card-link"
          onClick={(e) => e.preventDefault()}
          role="presentation"
        >
          {imageContainerContent}
          {contentSection}
        </div>
      ) : (
        <Link to={`/products/${product.masterProductId}`} className="product-card-link">
          {imageContainerContent}
          {contentSection}
        </Link>
      )}

      <div className="product-card-footer">
        <div className="product-card-price">
          {prefix}{price.toFixed(2)}<span>€</span>
        </div>

        {showAddToCart && onAddToCart && (
          <div className="product-card-actions">
            <button
              className={`add-to-cart-btn${popupState?.visible ? ` is-popup ${popupState.variant}` : ''}`}
              onClick={() => onAddToCart(product)}
              disabled={isUnavailable || !!popupState?.visible}
              aria-live="polite"
            >
              {popupState?.visible ? (
                <span className="popup-message">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {popupState.variant === 'success' ? (
                      <polyline points="20,6 9,17 4,12"></polyline>
                    ) : (
                      <circle cx="12" cy="12" r="10"></circle>
                    )}
                  </svg>
                  {popupState.message}
                </span>
              ) : (
                <span className="add-to-cart-text">
                  {hasMultipleVariants ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      Select Options
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="8" cy="21" r="1"></circle>
                        <circle cx="19" cy="21" r="1"></circle>
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L20.6 7H6"></path>
                      </svg>
                      {isUnavailable ? 'Unavailable' : 'Add to Cart'}
                    </>
                  )}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Additional content like wishlist meta */}
      {children}
    </article>
  );
};

export default ProductCard;
