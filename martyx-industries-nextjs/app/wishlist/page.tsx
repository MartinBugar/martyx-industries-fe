'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/useAuth';
import { useCart } from '@/context/useCart';
import { hybridProductService } from '@/lib/services/hybridProductService';
import { type Product } from '@/data/productData';
import { type WishlistItem } from '@/types/wishlist';
import WishlistButton from '@/components/WishlistButton';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import WishlistProductImage from '@/components/WishlistProductImage';
import { productGalleryService } from '@/lib/services/productGalleryService';
import './Wishlist.css';
import '../products/Products.css'; // Import product card styles

const Wishlist: React.FC = () => {
  const { t } = useTranslation('wishlist');
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    items,
    stats,
    isLoading,
    error,
    totalCount,
    lastUpdated,
    clearError,
    refreshWishlist
  } = useWishlist();
  const { addToCart } = useCart();

  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [showStats, setShowStats] = useState(false);
  const [productsData, setProductsData] = useState<Map<number, Product>>(new Map());
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

  // Optimized parallel fetching of product data
  useEffect(() => {
    const fetchProductsData = async () => {
      if (items.length === 0) {
        setProductsData(new Map());
        return;
      }

      setLoadingProducts(true);
      const newProductsData = new Map<number, Product>();

      try {
        // Parallel fetching instead of sequential - with database gallery
        const productPromises = items.map(async (item) => {
          try {
            const product = await hybridProductService.getProductById(item.productId);

            // Load gallery for this product from database (same as Products page)
            try {
              const galleryData = await productGalleryService.getProductImages(product.id.toString());

              // Sort by order and get URLs (prefer CDN URLs) - image with order 0 will be first
              const sortedGallery = galleryData.sort((a, b) => (a.order || 0) - (b.order || 0));
              const galleryUrls = sortedGallery.map(img => img.cdnUrl || img.url).filter(Boolean);

              if (process.env.NODE_ENV === 'development') {
                console.log(`🏷️ Wishlist: Product ${product.id} (${product.name}) gallery loaded:`, {
                  galleryCount: galleryUrls.length,
                  mainImage: galleryUrls[0] || 'none'
                });
              }

              // Update product with database gallery
              const productWithGallery = {
                ...product,
                gallery: galleryUrls // Replace hardcoded gallery with database gallery
              };

              return { productId: item.productId, product: productWithGallery };
            } catch (galleryError) {
              if (process.env.NODE_ENV === 'development') {
                console.log(`🏷️ Wishlist: No gallery found for product ${product.id}, using fallback`);
              }
              // Return product without database gallery (keeps hardcoded or empty gallery)
              return { productId: item.productId, product };
            }
          } catch (err) {
            if (process.env.NODE_ENV === 'development') {
              console.error(`Failed to fetch product data for ${item.productId}:`, err);
            }
            return null;
          }
        });

        const results = await Promise.all(productPromises);

        results.forEach(result => {
          if (result) {
            newProductsData.set(result.productId, result.product);
          }
        });

        setProductsData(newProductsData);
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch products data:', err);
        }
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProductsData();
  }, [items]);



  const handleAddToCart = useCallback((item: WishlistItem) => {
    const product = {
      id: String(item.productId),
      name: item.productName,
      price: item.productPrice,
      currency: item.productCurrency,
      description: item.productDescription,
      features: [],
      modelPath: '',
      gallery: item.productImageUrl ? [item.productImageUrl] : [],
      interactionInstructions: [],
      productType: item.productType as 'DIGITAL' | 'PHYSICAL'
    };
    addToCart(product);
  }, [addToCart]);


  // Memoize filtered items to prevent unnecessary recalculations
  const { availableItems, unavailableItems } = useMemo(() => ({
    availableItems: items.filter(item => item.isAvailable),
    unavailableItems: items.filter(item => !item.isAvailable)
  }), [items]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-container">
          <LoadingSpinner size="large" message="Loading..." />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (isLoading) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-container">
          <LoadingSpinner size="large" message="Loading your wishlist..." />
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      {/* Floating Cassandra - visible when wishlist has items */}
      {items.length > 0 && (
        <div className="wishlist-floating-mascot">
          <img
            src="/cassandra/Wishlist-Cass.png"
            alt="Cassandra - váš sprievodca wishlistom"
            className="floating-mascot-image"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      <div className="wishlist-container">
        {/* Header */}
        <div className="wishlist-header">
          <div className="wishlist-title-section">
            <h1 className="wishlist-title">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {t('title', 'Wishlist')} {totalCount > 0 && `(${totalCount})`}
            </h1>
            <p className="wishlist-subtitle">
              {t('subtitle', 'Keep track of products you love')}
              {lastUpdated && (
                <span className="last-updated">
                  {' • Last updated: '}{new Date(lastUpdated).toLocaleString()}
                </span>
              )}
            </p>
          </div>

          <div className="wishlist-header-actions">
            <button
              className="btn btn-outline"
              onClick={() => refreshWishlist()}
              disabled={isLoading}
              aria-label="Refresh wishlist"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLoading ? 'rotate' : ''}>
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4a9 9 0 0 1-14.85 4.36L23 14"/>
              </svg>
              Refresh
            </button>

            {stats && (
              <button
                className="wishlist-stats-toggle"
                onClick={() => setShowStats(!showStats)}
                aria-expanded={showStats}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
                {showStats ? 'Hide Stats' : 'Stats'}
              </button>
            )}
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <div className="wishlist-stats">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.totalItems}</div>
                <div className="stat-label">{t('stats.total_items', 'Total Items')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.availableItems}</div>
                <div className="stat-label">{t('stats.available', 'Available')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {stats.totalValue.toFixed(2)} {stats.currency}
                </div>
                <div className="stat-label">{t('stats.total_value', 'Total Value')}</div>
              </div>
              {stats.unavailableItems > 0 && (
                <div className="stat-card stat-card--warning">
                  <div className="stat-number">{stats.unavailableItems}</div>
                  <div className="stat-label">{t('stats.unavailable', 'Unavailable')}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="wishlist-error" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{error}</span>
            <button onClick={clearError} className="error-close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="wishlist-empty">
            <div className="wishlist-mascot">
              <img
                src="/cassandra/Empty-Cass.png"
                alt="Cassandra - váš sprievodca prázdnym wishlistom"
                className="mascot-image-wishlist"
                loading="eager"
                decoding="sync"
              />
            </div>
            <div className="empty-content">
              <h2>Váš wishlist je prázdny</h2>
              <p>Objavte úžasné produkty a pridajte si ich do wishlistu, aby ste mali prehľad o svojich obľúbených</p>
              <Link href="/products" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                Prehliadať produkty
              </Link>
            </div>
          </div>
        ) : (
          <>

            {/* Wishlist Items */}
            <div className={`wishlist-items wishlist-items--${viewMode}`}>
              {availableItems.map((item) => {
                // Debug: Log item data
                if (process.env.NODE_ENV === 'development') {
                  console.log('🔍 Wishlist item:', {
                    id: item.id,
                    productId: item.productId,
                    productName: item.productName,
                    productImageUrl: item.productImageUrl,
                    productPrice: item.productPrice,
                    productDescription: item.productDescription,
                    isAvailable: item.isAvailable
                  });
                  console.log('🔍 Product data:', productsData.get(item.productId));
                }

                return (
                  <article key={item.id} className="product-card wishlist-product-card">

                    <Link href={`/products/${item.productId}`} className="product-card-link">
                      <div className="product-card-image-container">
                        <WishlistProductImage
                          item={item}
                          product={productsData.get(item.productId)}
                          loading={loadingProducts}
                        />

                        <div className="product-card-wishlist">
                          <WishlistButton
                            productId={item.productId}
                            variant="icon"
                            size="small"
                          />
                        </div>

                        {item.productType === 'digital' && (
                          <div className="product-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Digital
                          </div>
                        )}
                      </div>

                      <div className="product-card-content">
                        <h3 className="product-card-title">{item.productName || 'No Title'}</h3>
                        <p className="product-card-description">{item.productDescription || 'No Description'}</p>
                        <div className="product-card-price">
                          {(item.productPrice ?? 0).toFixed(2)} {item.productCurrency === 'EUR' ? '€' : item.productCurrency}
                        </div>
                      </div>
                    </Link>

                    <div className="product-card-actions">
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(item)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="8" cy="21" r="1"/>
                          <circle cx="19" cy="21" r="1"/>
                          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L20.6 7H6"/>
                        </svg>
                        Add to Cart
                      </button>
                    </div>

                    <div className="wishlist-item-meta">
                      <span className="wishlist-added-date">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </article>
                );
              })}

              {/* Unavailable Items Section */}
              {unavailableItems.length > 0 && (
                <>
                  <div className="unavailable-section-header">
                    <h3>Unavailable Items</h3>
                    <p>These items are no longer available for purchase</p>
                  </div>

                  {unavailableItems.map((item) => (
                    <article key={item.id} className="product-card wishlist-product-card wishlist-product-card--unavailable">

                      <Link href={`/products/${item.productId}`} className="product-card-link">
                        <div className="product-card-image-container">
                          <WishlistProductImage
                            item={item}
                            product={productsData.get(item.productId)}
                            loading={loadingProducts}
                          />

                          <div className="unavailable-overlay">
                            <span>Unavailable</span>
                          </div>

                          <div className="product-card-wishlist">
                            <WishlistButton
                              productId={item.productId}
                              variant="icon"
                              size="small"
                            />
                          </div>

                          {item.productType === 'digital' && (
                            <div className="product-badge">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                              Digital
                            </div>
                          )}
                        </div>

                        <div className="product-card-content">
                          <h3 className="product-card-title">{item.productName}</h3>
                          <p className="product-card-description">{item.productDescription}</p>
                          <div className="product-card-price">
                            {(item.productPrice ?? 0).toFixed(2)} {item.productCurrency === 'EUR' ? '€' : item.productCurrency}
                          </div>
                        </div>
                      </Link>

                      <div className="product-card-actions">
                        <button className="add-to-cart-btn" disabled>
                          Unavailable
                        </button>
                      </div>

                      <div className="wishlist-item-meta">
                        <span className="wishlist-added-date">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </article>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
