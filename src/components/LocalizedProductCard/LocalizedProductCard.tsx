import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { productService } from '../../services/productService';
import { translateApiError } from '../../utils/translateApiError';
import type { ProductVariantDto } from '../../types/api';
import { logInfo, logWarn, logError } from '../../services/logger';

interface LocalizedProductCardProps {
  variantId: number;
}

/**
 * Component that demonstrates localized product variant loading from the new API
 * Shows how content changes based on selected language
 */
const LocalizedProductCard: React.FC<LocalizedProductCardProps> = ({
  variantId
}) => {
  const { t, i18n } = useTranslation('products');
  const [product, setProduct] = useState<ProductVariantDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // The productService automatically sends Accept-Language headers
        const productData = await productService.getVariant(variantId);
        setProduct(productData);


      } catch (err) {
        logError('❌ Failed to load product:', err);
        
        // Use unified error translation
        const errorMessage = translateApiError(err, t);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [variantId, i18n.language, t]); // Reload when language changes

  if (loading) {
    return (
      <div className="product-card product-card--loading">
        <div className="product-card__skeleton">
          <div className="skeleton skeleton--image"></div>
          <div className="skeleton skeleton--text"></div>
          <div className="skeleton skeleton--text skeleton--short"></div>
        </div>
        <span className="sr-only">{t('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-card product-card--error">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn--secondary"
          >
            {t('actions.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-card product-card--not-found">
        <span>{t('errors.not_found')}</span>
      </div>
    );
  }

  return (
    <div className="product-card">
      <div className="product-card__image">
        <div className="placeholder-icon" style={{ padding: '2rem', background: '#f0f0f0', textAlign: 'center' }}>
          📦
        </div>
        {product.availabilityStatus !== 'IN_STOCK' && (
          <div className="product-card__badge product-card__badge--inactive">
            {t(product.availabilityStatus.toLowerCase())}
          </div>
        )}
      </div>

      <div className="product-card__content">
        <h3 className="product-card__title">
          {product.variantName}
        </h3>

        <div className="product-card__details">
          <span className="product-card__category">
            {product.variantType}
          </span>
          <span className="product-card__type">
            {t(`type.${product.variantType.toLowerCase()}`)}
          </span>
        </div>

        <div className="product-card__price">
          {t('price', {
            amount: product.priceWithVat,
            currency: product.currency
          })}
        </div>

        <div className="product-card__meta">
          <small className="product-card__sku">
            {t('sku')}: {product.sku}
          </small>
          <small className="product-card__language">
            🌐 {i18n.language.toUpperCase()}
          </small>
        </div>
      </div>
    </div>
  );
};

export default LocalizedProductCard;
