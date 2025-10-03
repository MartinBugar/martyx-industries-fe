'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/useAuth';
import { useCart } from '@/context/useCart';
import WishlistButton from '@/components/WishlistButton/WishlistButton';
import type { Product } from '@/lib/types/product';
import styles from './Wishlist.module.css';

interface ApiProduct {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  gallery?: Array<{
    id: string;
    url: string;
    alt?: string;
    order?: number;
  }>;
  featured?: boolean;
}

interface WishlistItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  imageUrl?: string;
}

export default function Wishlist() {
  const { t } = useTranslation('wishlist');
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    items,
    error,
    clearError
  } = useWishlist();
  
  // Mock additional properties that aren't in the current context
  const stats = null;
  const isLoading = false;
  const totalCount = items.length;
  const lastUpdated = new Date().toISOString();
  const refreshWishlist = () => {};
  const { addToCart } = useCart();

  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [showStats, setShowStats] = useState(false);
  const [productsData, setProductsData] = useState<Map<string, ApiProduct>>(new Map());
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    // Only redirect to login if auth is not loading and user is not authenticated
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/wishlist');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Mock product fetching - replace with actual API calls
  useEffect(() => {
    const fetchProductsData = async () => {
      if (items.length === 0) {
        setProductsData(new Map());
        return;
      }

      setLoadingProducts(true);
      const newProductsData = new Map<string, ApiProduct>();

      try {
        // Mock product data - replace with actual API calls
        for (const item of items) {
          const mockProduct: ApiProduct = {
            id: item.productId,
            slug: `product-${item.productId}`,
            title: `Product ${item.productId}`,
            shortDescription: 'Mock product description',
            price: 29.99,
            currency: 'EUR',
            gallery: [
              {
                id: '1',
                url: '/assets/kit-01.png',
                alt: `Product ${item.productId}`,
                order: 0
              }
            ]
          };
          newProductsData.set(item.productId, mockProduct);
        }

        setProductsData(newProductsData);
      } catch (error) {
        console.error('Failed to fetch products data:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProductsData();
  }, [items]);

  const handleAddToCart = useCallback((apiProduct: ApiProduct) => {
    // Convert ApiProduct to Product for cart
    const product: Product = {
      id: apiProduct.id,
      name: apiProduct.title,
      price: apiProduct.price,
      currency: apiProduct.currency,
      description: apiProduct.description || apiProduct.shortDescription || '',
      features: [],
      modelPath: '',
      gallery: apiProduct.gallery?.map(g => g.url) || [],
      interactionInstructions: [],
      productType: 'PHYSICAL'
    };
    addToCart(product);
  }, [addToCart]);

  const handleRefresh = useCallback(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  // Show loading state during auth check
  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className={styles.wishlistContainer}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.wishlistHeader}>
          <div className={styles.headerContent}>
            <h1>{t('wishlist.title', 'My Wishlist')}</h1>
            <div className={styles.headerStats}>
              <span className={styles.itemCount}>
                {totalCount} {totalCount === 1 ? t('wishlist.item', 'item') : t('wishlist.items', 'items')}
              </span>
              {lastUpdated && (
                <span className={styles.lastUpdated}>
                  {t('wishlist.last_updated', 'Last updated')}: {new Date(lastUpdated).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={() => setShowStats(!showStats)}
              className={styles.statsToggle}
              aria-label={showStats ? t('wishlist.hide_stats', 'Hide stats') : t('wishlist.show_stats', 'Show stats')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"/>
                <path d="M19 4H15a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
              </svg>
            </button>
            <button
              onClick={handleRefresh}
              className={styles.refreshBtn}
              disabled={isLoading}
              aria-label={t('wishlist.refresh', 'Refresh wishlist')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23,4 23,10 17,10"/>
                <polyline points="1,20 1,14 7,14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && (
          <div className={styles.statsPanel}>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>{t('wishlist.stats.total_items', 'Total Items')}</span>
                <span className={styles.statValue}>{totalCount}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>{t('wishlist.stats.total_value', 'Total Value')}</span>
                <span className={styles.statValue}>€0.00</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>{t('wishlist.stats.avg_price', 'Avg Price')}</span>
                <span className={styles.statValue}>€0.00</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>{t('wishlist.stats.categories', 'Categories')}</span>
                <span className={styles.statValue}>0</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            <p>{error}</p>
            <button onClick={clearError} className={styles.dismissBtn}>
              {t('common.dismiss', 'Dismiss')}
            </button>
          </div>
        )}

        {/* Loading State */}
        {(isLoading || loadingProducts) && (
          <div className={styles.loadingState}>
            <div className={styles.spinner}>Loading...</div>
            <p>{t('wishlist.loading', 'Loading your wishlist...')}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !loadingProducts && items.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <h3>{t('wishlist.empty.title', 'Your wishlist is empty')}</h3>
            <p>{t('wishlist.empty.subtitle', 'Save your favorite RC models and STL files here')}</p>
            <Link href="/products" className={styles.browseBtn}>
              {t('wishlist.empty.browse_products', 'Browse Products')}
            </Link>
          </div>
        )}

        {/* Wishlist Items */}
        {!isLoading && !loadingProducts && items.length > 0 && (
          <div className={styles.wishlistGrid}>
            {items.map((item) => {
              const product = productsData.get(item.productId);
              if (!product) return null;

              return (
                <article key={item.id} className={styles.wishlistItem}>
                  <div className={styles.itemImageContainer}>
                    <Link href={`/products/${product.slug || product.id}`} className={styles.itemLink}>
                      <img
                        src={product.gallery?.[0]?.url || '/assets/kit-01.png'}
                        alt={product.title}
                        className={styles.itemImage}
                        loading="lazy"
                      />
                    </Link>
                    <div className={styles.itemWishlistBtn}>
                      <WishlistButton
                        productId={product.id}
                        size="small"
                        variant="icon"
                      />
                    </div>
                  </div>

                  <div className={styles.itemContent}>
                    <Link href={`/products/${product.slug || product.id}`} className={styles.itemLink}>
                      <h3 className={styles.itemTitle}>{product.title}</h3>
                      <div className={styles.itemPrice}>
                        {product.currency} {product.price.toFixed(2)}
                      </div>
                      {product.shortDescription && (
                        <p className={styles.itemDescription}>{product.shortDescription}</p>
                      )}
                    </Link>

                    <div className={styles.itemActions}>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={styles.addToCartBtn}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="9" cy="21" r="1"/>
                          <circle cx="20" cy="21" r="1"/>
                          <path d="m1 1 4 4 2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                        </svg>
                        {t('wishlist.add_to_cart', 'Add to Cart')}
                      </button>
                    </div>

                    <div className={styles.itemMeta}>
                      <span className={styles.addedDate}>
                        {t('wishlist.added', 'Added')}: {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
