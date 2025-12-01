import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { hybridProductService } from '../../services/hybridProductService';
import ProductCard from '../ProductCard/ProductCard';
import { ProductCardSkeleton } from '../ui/Skeleton';
import type { Product } from '../../types/product';
import { logError } from '../../services/logger';
import './RecentlyViewed.css';

interface RecentlyViewedProps {
  /** Exclude this product ID (useful on product detail page) */
  excludeProductId?: number;
  /** Maximum number of products to show */
  maxItems?: number;
}

/**
 * Recently Viewed Products Component
 *
 * Displays products the user has recently viewed.
 * Data is stored in localStorage via useRecentlyViewed hook.
 */
const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
  excludeProductId,
  maxItems = 4
}) => {
  const { t } = useTranslation();
  const { productIds } = useRecentlyViewed();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter out excluded product and limit items
  const filteredIds = productIds
    .filter(id => id !== excludeProductId)
    .slice(0, maxItems);

  useEffect(() => {
    const fetchProducts = async () => {
      if (filteredIds.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch each product individually (they're cached)
        const fetchedProducts = await Promise.all(
          filteredIds.map(async (id) => {
            try {
              return await hybridProductService.getProductById(id);
            } catch {
              // Product may have been deleted or deactivated
              return null;
            }
          })
        );

        // Filter out nulls (failed fetches)
        const validProducts = fetchedProducts.filter(
          (p): p is Product => p !== null
        );

        setProducts(validProducts);
      } catch (error) {
        logError('[RecentlyViewed] Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [filteredIds.join(',')]); // Re-fetch when IDs change

  // Don't render if no items
  if (!isLoading && products.length === 0) {
    return null;
  }

  return (
    <section className="recently-viewed">
      <h2 className="recently-viewed-title">
        {t('recentlyViewed.title', 'Recently Viewed')}
      </h2>

      <div className="recently-viewed-grid">
        {isLoading ? (
          // Show skeletons while loading
          Array.from({ length: Math.min(filteredIds.length, maxItems) }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))
        ) : (
          products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </section>
  );
};

export default RecentlyViewed;
