import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { type Product, type ProductVariant } from '../../data/productData';
import OptimizedImage from '../OptimizedImage/OptimizedImage';
import WishlistButton from '../WishlistButton';
import { getBestImageUrl, getBaseNameFromPath, isCDNEnabled } from '../../utils/cdnImages';
import './QuickViewModal.css';

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, variantId?: number) => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const { t, i18n } = useTranslation(['products', 'common']);
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.availableVariants?.[0] || null
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const hasMultipleVariants = product.availableVariants && product.availableVariants.length > 1;
  const gallery = product.gallery || [];

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleAddToCart = useCallback(() => {
    onAddToCart(product, selectedVariant?.variantId);
    onClose();
  }, [product, selectedVariant, onAddToCart, onClose]);

  const getImageUrl = (imageUrl: string) => {
    const isCDNUrl = imageUrl.includes('digitaloceanspaces.com') || imageUrl.includes(import.meta.env.VITE_CDN_BASE || '');
    return isCDNUrl ? imageUrl : (isCDNEnabled() ? getBestImageUrl(getBaseNameFromPath(imageUrl), 600) : imageUrl);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: selectedVariant?.currency || product.currency || 'EUR',
    }).format(price);
  };

  const currentPrice = selectedVariant?.priceWithVat ?? product.priceWithVat;
  const currentImage = gallery[currentImageIndex] || product.imageUrl;

  if (!isOpen) return null;

  return (
    <div
      className="quick-view-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={t('products:quickView.title', 'Quick View')}
    >
      <div
        ref={modalRef}
        className="quick-view-modal"
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          className="quick-view-close"
          onClick={onClose}
          aria-label={t('common:close', 'Close')}
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="quick-view-content">
          {/* Image Section */}
          <div className="quick-view-image-section">
            <div className="quick-view-main-image">
              {currentImage ? (
                <OptimizedImage
                  src={getImageUrl(currentImage)}
                  alt={product.name}
                  className="quick-view-image"
                  priority={true}
                  placeholder="/images/product-placeholder.svg"
                />
              ) : (
                <div className="quick-view-placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnail gallery */}
            {gallery.length > 1 && (
              <div className="quick-view-thumbnails">
                {gallery.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    className={`quick-view-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <OptimizedImage
                      src={getImageUrl(img)}
                      alt=""
                      className="quick-view-thumbnail-img"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="quick-view-details">
            <h2 className="quick-view-title">{product.name}</h2>

            <p className="quick-view-description">{product.description}</p>

            {/* Price */}
            <div className="quick-view-price">
              {formatPrice(currentPrice)}
            </div>

            {/* Variant selector */}
            {hasMultipleVariants && (
              <div className="quick-view-variants">
                <label className="quick-view-variant-label">
                  {t('products:selectVariant', 'Select Option')}
                </label>
                <div className="quick-view-variant-options">
                  {product.availableVariants!.map((variant) => (
                    <button
                      key={variant.variantId}
                      className={`quick-view-variant-btn ${selectedVariant?.variantId === variant.variantId ? 'selected' : ''}`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <span className="variant-name">{variant.variantName}</span>
                      <span className="variant-price">{formatPrice(variant.priceWithVat)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="quick-view-actions">
              <button
                className="quick-view-add-to-cart"
                onClick={handleAddToCart}
                disabled={product.availabilityStatus === 'OUT_OF_STOCK'}
              >
                <ShoppingCart size={20} />
                {product.availabilityStatus === 'OUT_OF_STOCK'
                  ? t('products:outOfStock', 'Out of Stock')
                  : t('products:addToCart', 'Add to Cart')}
              </button>

              <WishlistButton
                productId={product.masterProductId}
                size="medium"
                variant="icon"
              />
            </div>

            {/* View full details link */}
            <Link
              to={`/products/${product.masterProductId}`}
              className="quick-view-full-link"
              onClick={onClose}
            >
              {t('products:quickView.viewDetails', 'View Full Details')}
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
