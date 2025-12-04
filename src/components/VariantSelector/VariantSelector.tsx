import React from 'react';
import { useTranslation } from 'react-i18next';
import { type ProductVariant, type DifficultyLevel } from '../../data/productData';
import DifficultyBadge from '../DifficultyBadge/DifficultyBadge';
import { getVariantTypeShort, getAvailabilityText, formatPrice, isOutOfStock } from '../../utils/variantUtils';
import './VariantSelector.css';

interface VariantSelectorProps {
  variants: ProductVariant[];
  currentVariantId: number;
  onVariantChange: (variantId: number) => void;
  difficultyLevel?: DifficultyLevel;
}

const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  currentVariantId,
  onVariantChange,
  difficultyLevel
}) => {
  const { t } = useTranslation('products');

  // Don't render if there's only one variant or no variants
  if (!variants || variants.length <= 1) {
    return null;
  }

  const currentVariant = variants.find(v => v.variantId === currentVariantId);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const variantId = parseInt(e.target.value);
    if (!isNaN(variantId) && variantId !== currentVariantId) {
      onVariantChange(variantId);
    }
  };

  return (
    <div className="variant-selector-compact">
      <label htmlFor="variant-select" className="variant-label">
        {t('variant.configuration_label', 'Configuration')}:
      </label>
      <div className="variant-select-wrapper">
        <select
          id="variant-select"
          className="variant-select"
          value={currentVariantId}
          onChange={handleChange}
          aria-label={t('variant.select_variant_aria', 'Select product variant')}
        >
          {variants.map((variant) => {
            const variantOutOfStock = isOutOfStock(variant.availabilityStatus);

            return (
              <option
                key={variant.variantId}
                value={variant.variantId}
                disabled={variantOutOfStock}
              >
                {variant.variantName} - {formatPrice(variant.priceWithVat, variant.currency)}
                {' '}({getVariantTypeShort(variant.variantType)})
                {variantOutOfStock ? ` - ${t('variant.out_of_stock', 'Out of Stock')}` : ''}
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
          {difficultyLevel && (
            <DifficultyBadge level={difficultyLevel} showLink={true} size="small" />
          )}
          <span className={`variant-availability ${currentVariant.availabilityStatus?.toLowerCase() || 'unknown'}`}>
            {getAvailabilityText(currentVariant.availabilityStatus)}
          </span>
        </div>
      )}
    </div>
  );
};

export default VariantSelector;
