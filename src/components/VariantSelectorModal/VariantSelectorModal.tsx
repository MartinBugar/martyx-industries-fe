import React, { useState, useEffect } from 'react';
import type { Product, ProductVariant } from '../../data/productData';
import './VariantSelectorModal.css';

interface VariantSelectorModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (selectedVariant: ProductVariant, quantity: number) => void;
}

const VariantSelectorModal: React.FC<VariantSelectorModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Initialize with the first available variant or current variant
  useEffect(() => {
    if (isOpen && product.availableVariants && product.availableVariants.length > 0) {
      // Default to current variant if available, otherwise first variant
      const defaultVariant = product.availableVariants.find(v => v.variantId === product.variantId)
        || product.availableVariants[0];
      setSelectedVariantId(defaultVariant.variantId);
      setQuantity(1);
    }
  }, [isOpen, product]);

  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !product.availableVariants || product.availableVariants.length === 0) {
    return null;
  }

  const selectedVariant = product.availableVariants.find(v => v.variantId === selectedVariantId);
  const maxQuantity = selectedVariant?.variantType === 'DIGITAL_ONLY' ? 1 : (selectedVariant?.stockQuantity || 1);

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => {
      const newQty = prev + delta;
      return Math.max(1, Math.min(newQty, maxQuantity));
    });
  };

  const handleAddToCart = () => {
    if (selectedVariant) {
      onAddToCart(selectedVariant, quantity);
      onClose();
    }
  };

  const isOutOfStock = selectedVariant?.availabilityStatus === 'OUT_OF_STOCK' ||
                       selectedVariant?.availabilityStatus === 'DISCONTINUED' ||
                       (selectedVariant?.stockQuantity || 0) <= 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="variant-modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="variant-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="variant-modal-title"
      >
        {/* Header */}
        <div className="variant-modal-header">
          <h2 id="variant-modal-title" className="variant-modal-title">
            Select Options
          </h2>
          <button
            className="variant-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Product Info */}
        <div className="variant-modal-product-info">
          {product.gallery && product.gallery[0] && (
            <img
              src={product.gallery[0]}
              alt={product.name}
              className="variant-modal-product-image"
            />
          )}
          <div className="variant-modal-product-details">
            <h3 className="variant-modal-product-name">{product.name}</h3>
            <p className="variant-modal-product-description">{product.description}</p>
          </div>
        </div>

        {/* Variant Selector */}
        <div className="variant-modal-section">
          <label className="variant-modal-label">
            Select Variant *
          </label>
          <div className="variant-options-grid">
            {product.availableVariants.map((variant) => {
              const isSelected = variant.variantId === selectedVariantId;
              const isDisabled = variant.availabilityStatus === 'OUT_OF_STOCK' ||
                               variant.availabilityStatus === 'DISCONTINUED' ||
                               variant.stockQuantity <= 0;

              return (
                <button
                  key={variant.variantId}
                  className={`variant-option ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && setSelectedVariantId(variant.variantId)}
                  disabled={isDisabled}
                >
                  <div className="variant-option-header">
                    <span className="variant-option-name">{variant.variantName}</span>
                    <span className="variant-option-price">
                      {variant.priceWithVat.toFixed(2)} {variant.currency === 'EUR' ? '€' : variant.currency}
                    </span>
                  </div>
                  <div className="variant-option-meta">
                    <span className="variant-option-sku">SKU: {variant.sku}</span>
                    {isDisabled ? (
                      <span className="variant-option-stock out-of-stock">Out of Stock</span>
                    ) : variant.stockQuantity <= 10 && variant.variantType !== 'DIGITAL_ONLY' ? (
                      <span className="variant-option-stock low-stock">
                        Only {variant.stockQuantity} left
                      </span>
                    ) : variant.variantType === 'DIGITAL_ONLY' ? (
                      <span className="variant-option-stock digital">Digital</span>
                    ) : (
                      <span className="variant-option-stock in-stock">In Stock</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity Selector */}
        {selectedVariant && selectedVariant.variantType !== 'DIGITAL_ONLY' && (
          <div className="variant-modal-section">
            <label className="variant-modal-label">
              Quantity
            </label>
            <div className="quantity-selector">
              <button
                className="quantity-btn"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                className="quantity-input"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) {
                    setQuantity(Math.max(1, Math.min(val, maxQuantity)));
                  }
                }}
                min={1}
                max={maxQuantity}
                aria-label="Quantity"
              />
              <button
                className="quantity-btn"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= maxQuantity}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            {maxQuantity <= 10 && (
              <p className="quantity-hint">Maximum available: {maxQuantity}</p>
            )}
          </div>
        )}

        {/* Price Summary */}
        {selectedVariant && (
          <div className="variant-modal-summary">
            <div className="summary-row">
              <span>Price per item:</span>
              <span className="summary-value">
                {selectedVariant.priceWithVat.toFixed(2)} {selectedVariant.currency === 'EUR' ? '€' : selectedVariant.currency}
              </span>
            </div>
            {selectedVariant.variantType !== 'DIGITAL_ONLY' && quantity > 1 && (
              <div className="summary-row">
                <span>Quantity:</span>
                <span className="summary-value">× {quantity}</span>
              </div>
            )}
            <div className="summary-row summary-total">
              <span>Total:</span>
              <span className="summary-value">
                {(selectedVariant.priceWithVat * quantity).toFixed(2)} {selectedVariant.currency === 'EUR' ? '€' : selectedVariant.currency}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="variant-modal-actions">
          <button
            className="variant-modal-btn variant-modal-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="variant-modal-btn variant-modal-btn-primary"
            onClick={handleAddToCart}
            disabled={!selectedVariant || isOutOfStock}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="21" r="1"></circle>
              <circle cx="19" cy="21" r="1"></circle>
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L20.6 7H6"></path>
            </svg>
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </>
  );
};

export default VariantSelectorModal;
