import React from 'react';
import { type ProductVariant, type DifficultyLevel } from '../../data/productData';
import DifficultyBadge from '../DifficultyBadge/DifficultyBadge';
import { getVariantTypeShort, getAvailabilityText, formatPrice, isLowStock } from '../../utils/variantUtils';
import './VariantSelector.css';

interface SingleVariantDisplayProps {
  variant: ProductVariant;
  difficultyLevel?: DifficultyLevel;
}

/**
 * SingleVariantDisplay - Display component for products with only one variant
 * Shows variant information in a static (non-interactive) format with full accessibility
 *
 * @param variant - The single product variant to display
 * @param difficultyLevel - Optional difficulty level for the product
 */
const SingleVariantDisplay: React.FC<SingleVariantDisplayProps> = ({
  variant,
  difficultyLevel
}) => {
  return (
    <div
      className="variant-selector-compact"
      role="region"
      aria-label="Product configuration"
    >
      <div className="variant-label" role="text">
        Configuration:
      </div>

      <div
        className="variant-display-static"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Selected configuration: ${variant.variantName}, ${formatPrice(variant.priceWithVat, variant.currency)}`}
      >
        {variant.variantName} - {formatPrice(variant.priceWithVat, variant.currency)}
        {' '}({getVariantTypeShort(variant.variantType)})
      </div>

      <div className="variant-info">
        <span className="variant-type-badge">
          {getVariantTypeShort(variant.variantType)}
        </span>
        {difficultyLevel && (
          <DifficultyBadge level={difficultyLevel} showLink={true} size="small" />
        )}
        <span className={`variant-availability ${variant.availabilityStatus.toLowerCase()}`}>
          {getAvailabilityText(variant.availabilityStatus)}
        </span>
        {isLowStock(variant.stockQuantity) && (
          <span className="variant-stock-low">
            Only {variant.stockQuantity} left
          </span>
        )}
      </div>
    </div>
  );
};

export default SingleVariantDisplay;
