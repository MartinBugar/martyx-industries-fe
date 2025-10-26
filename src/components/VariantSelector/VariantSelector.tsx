import React from 'react';
import { type ProductVariant } from '../../data/productData';
import './VariantSelector.css';

interface VariantSelectorProps {
  variants: ProductVariant[];
  currentVariantId: number;
  onVariantChange: (variantId: number) => void;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  currentVariantId,
  onVariantChange
}) => {
  // Don't render if there's only one variant or no variants
  if (!variants || variants.length <= 1) {
    return null;
  }

  const currentVariant = variants.find(v => v.variantId === currentVariantId);

  const getVariantTypeShort = (type: ProductVariant['variantType']) => {
    const badges: Record<typeof type, string> = {
      'DIGITAL_ONLY': 'Digital',
      'PHYSICAL_ONLY': 'Physical',
      'HYBRID': 'Hybrid'
    };
    return badges[type];
  };

  const getAvailabilityText = (status: ProductVariant['availabilityStatus']) => {
    const texts: Record<typeof status, string> = {
      'IN_STOCK': '✓ In Stock',
      'OUT_OF_STOCK': '✗ Out of Stock',
      'PRE_ORDER': '⏰ Pre-Order',
      'DISCONTINUED': '✗ Discontinued',
      'BACKORDERED': '⏰ Backordered'
    };
    return texts[status];
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const variantId = parseInt(e.target.value);
    if (!isNaN(variantId) && variantId !== currentVariantId) {
      onVariantChange(variantId);
    }
  };

  return (
    <div className="variant-selector-compact">
      <label htmlFor="variant-select" className="variant-label">
        Configuration:
      </label>
      <div className="variant-select-wrapper">
        <select
          id="variant-select"
          className="variant-select"
          value={currentVariantId}
          onChange={handleChange}
          aria-label="Select product variant"
        >
          {variants.map((variant) => {
            const isOutOfStock = variant.availabilityStatus === 'OUT_OF_STOCK' ||
                                 variant.availabilityStatus === 'DISCONTINUED';

            return (
              <option
                key={variant.variantId}
                value={variant.variantId}
                disabled={isOutOfStock}
              >
                {variant.variantName} - {variant.priceWithVat.toFixed(2)} {variant.currency === 'EUR' ? '€' : variant.currency}
                {' '}({getVariantTypeShort(variant.variantType)})
                {isOutOfStock ? ' - Out of Stock' : ''}
              </option>
            );
          })}
        </select>
        <svg className="variant-select-arrow" width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {currentVariant && (
        <div className="variant-info">
          <span className="variant-type-badge">
            {getVariantTypeShort(currentVariant.variantType)}
          </span>
          <span className={`variant-availability ${currentVariant.availabilityStatus.toLowerCase()}`}>
            {getAvailabilityText(currentVariant.availabilityStatus)}
          </span>
          {currentVariant.stockQuantity > 0 && currentVariant.stockQuantity <= 10 && (
            <span className="variant-stock-low">
              Only {currentVariant.stockQuantity} left
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default VariantSelector;
