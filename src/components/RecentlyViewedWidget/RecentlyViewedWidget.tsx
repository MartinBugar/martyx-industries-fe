import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { hybridProductService } from '../../services/hybridProductService';
import { type Product } from '../../data/productData';
import { logInfo, logError } from '../../services/logger';
import './RecentlyViewedWidget.css';

interface RecentlyViewedWidgetProps {
  /** Current product ID to exclude from the list */
  excludeProductId?: number;
  /** Maximum number of products to show (default: 4) */
  maxItems?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * Displays recently viewed products
 * Uses localStorage to persist across sessions
 */
const RecentlyViewedWidget: React.FC<RecentlyViewedWidgetProps> = ({
  excludeProductId,
  maxItems = 4,
  className = ''
}) => {
  const { t } = useTranslation('common');
  const { productIds } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter out current product and limit items
  const filteredProductIds = useMemo(() => {
    let ids = productIds;

    // Exclude current product
    if (excludeProductId) {
      ids = ids.filter(id => id !== excludeProductId);
    }

    // Limit to maxItems
    return ids.slice(0, maxItems);
  }, [productIds, excludeProductId, maxItems]);

  // Fetch product data for recently viewed IDs
  useEffect(() => {
    const fetchProducts = async () => {
      if (filteredProductIds.length === 0) {
        setProducts([]);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch products in parallel
        const productPromises = filteredProductIds.map(async (id) => {
          try {
            return await hybridProductService.getProductById(id);
          } catch (err) {
            logError(`[RecentlyViewed] Failed to fetch product ${id}:`, err);
            return null;
          }
        });

        const results = await Promise.all(productPromises);
        const validProducts = results.filter((p): p is Product => p !== null);

        setProducts(validProducts);
        logInfo(`[RecentlyViewed] Loaded ${validProducts.length} products`);
      } catch (err) {
        logError('[RecentlyViewed] Failed to fetch products:', err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filteredProductIds]);

  // Don't render if no products to show
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section
      className={`recently-viewed-widget ${className}`}
      aria-labelledby="recently-viewed-title"
    >
      <div className="recently-viewed-header">
        <h2 id="recently-viewed-title" className="recently-viewed-title">
          {t('recentlyViewed.title', 'Recently Viewed')}
        </h2>
      </div>

      {isLoading ? (
        <div className="recently-viewed-loading">
          <div className="recently-viewed-skeleton">
            {Array.from({ length: maxItems }).map((_, i) => (
              <div key={i} className="product-skeleton" />
            ))}
          </div>
        </div>
      ) : (
        <div className="recently-viewed-grid">
          {products.map((product) => (
            <Link
              key={product.variantId}
              to={`/products/${product.masterProductId}`}
              className="recently-viewed-item"
            >
              <div className="recently-viewed-image">
                {product.gallery && product.gallery[0] ? (
                  <img
                    src={product.gallery[0]}
                    alt={product.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="no-image-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="recently-viewed-info">
                <h3 className="recently-viewed-name">{product.name}</h3>
                <p className="recently-viewed-price">
                  €{product.priceWithVat.toFixed(2)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecentlyViewedWidget;
