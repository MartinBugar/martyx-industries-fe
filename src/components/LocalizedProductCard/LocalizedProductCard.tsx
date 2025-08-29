import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { productService } from '../../services/productService';
import { translateApiError } from '../../utils/translateApiError';
import type { ProductDto } from '../../types/api';

interface LocalizedProductCardProps {
  productId: number;
  showFullDescription?: boolean;
}

/**
 * Component that demonstrates localized product loading from the new API
 * Shows how content changes based on selected language
 */
const LocalizedProductCard: React.FC<LocalizedProductCardProps> = ({
  productId,
  showFullDescription = false
}) => {
  const { t, i18n } = useTranslation('common');
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🌐 Loading product ${productId} in language: ${i18n.language}`);

        // The productService automatically sends Accept-Language headers
        const productData = await productService.getProduct(productId);
        setProduct(productData);

        console.log('✅ Loaded localized product:', productData);
      } catch (err) {
        console.error('❌ Failed to load product:', err);
        
        // Use unified error translation
        const errorMessage = translateApiError(err, t);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, i18n.language, t]); // Reload when language changes

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
        <img 
          src={product.imageUrl || '/placeholder-image.png'} 
          alt={product.name}
          loading="lazy"
        />
        {!product.active && (
          <div className="product-card__badge product-card__badge--inactive">
            {t('product.inactive')}
          </div>
        )}
      </div>
      
      <div className="product-card__content">
        <h3 className="product-card__title">
          {product.name}
        </h3>
        
        <p className="product-card__description">
          {showFullDescription 
            ? product.description 
            : product.description.length > 100 
              ? `${product.description.substring(0, 100)}...`
              : product.description
          }
        </p>
        
        <div className="product-card__details">
          <span className="product-card__category">
            {product.category}
          </span>
          <span className="product-card__type">
            {t(`product.type.${product.productType.toLowerCase()}`)}
          </span>
        </div>
        
        <div className="product-card__price">
          {t('product.price', { 
            amount: product.price, 
            currency: product.currency 
          })}
        </div>
        
        <div className="product-card__meta">
          <small className="product-card__sku">
            SKU: {product.sku}
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
