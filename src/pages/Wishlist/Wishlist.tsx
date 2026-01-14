import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';
import { hybridProductService } from '../../services/hybridProductService';
import { type Product } from '../../data/productData';
import { type WishlistItem } from '../../types/wishlist';
import ProductCard from '../../components/ProductCard/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import Breadcrumbs from '../../components/Breadcrumbs';
import { productGalleryService } from '../../services/productGalleryService';
import { useFormatters } from '../../hooks/useFormatters';
import './Wishlist.css';
import '../Products/Products.css';
import { logInfo, logWarn, logError } from '../../services/logger';

const Wishlist: React.FC = () => {
  const { t } = useTranslation('wishlist');
  const { formatShortDate } = useFormatters();
  const navigate = useNavigate();
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

  useEffect(() => {
    // Only redirect to login if auth is not loading and user is not authenticated
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/wishlist');
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Optimized parallel fetching of product data
  useEffect(() => {
    // Skip while auth is still loading to avoid race conditions
    if (authLoading) return;

    const fetchProductsData = async () => {
      if (items.length === 0) {
        setProductsData(new Map());
        return;
      }

      const newProductsData = new Map<number, Product>();

      try {
        // Parallel fetching instead of sequential - with database gallery
        const productPromises = items.map(async (item) => {
          try {
            const product = await hybridProductService.getProductById(item.productId);

            // Load gallery for this product from database (same as Products page)
            try {
              const galleryData = await productGalleryService.getProductImages(product.masterProductId.toString());

              // Sort: PRIMARY image first, HOVER image second, then by order (same logic as Products page)
              const sortedGallery = galleryData.sort((a, b) => {
                // Primary image always goes first
                if (a.isPrimary && !b.isPrimary) return -1;
                if (!a.isPrimary && b.isPrimary) return 1;
                // Hover image goes second (after primary)
                if (a.isHover && !b.isHover) return -1;
                if (!a.isHover && b.isHover) return 1;
                // Otherwise sort by order
                return (a.order || 0) - (b.order || 0);
              });

              // Fallback: if no hover image is set, ensure backwards compatibility
              // by placing the second non-primary image (by order) in position [1]
              const hasHoverImage = sortedGallery.some(img => img.isHover);
              if (!hasHoverImage && sortedGallery.length >= 2) {
                const nonPrimaryImages = galleryData
                  .filter(img => !img.isPrimary)
                  .sort((a, b) => (a.order || 0) - (b.order || 0));

                if (nonPrimaryImages.length >= 2) {
                  // Find the second non-primary image by order
                  const secondNonPrimary = nonPrimaryImages[1];
                  const currentIndex = sortedGallery.findIndex(img => img.id === secondNonPrimary.id);

                  // Move it to position 1 if not already there
                  if (currentIndex > 1) {
                    sortedGallery.splice(currentIndex, 1);
                    sortedGallery.splice(1, 0, secondNonPrimary);
                  }
                }
              }

              const galleryUrls = sortedGallery.map(img => img.cdnUrl || img.url).filter(Boolean);

              if (import.meta.env.DEV) {
                logInfo(`🏷️ Wishlist: Product ${product.masterProductId} (${product.name}) gallery loaded:`, {
                  galleryCount: galleryUrls.length,
                  mainImage: galleryUrls[0] || 'none',
                  orderInfo: sortedGallery.slice(0, 3).map(img => ({
                    fileName: img.fileName,
                    order: img.order,
                    isPrimary: img.isPrimary
                  }))
                });
              }

              // Update product with database gallery
              const productWithGallery = {
                ...product,
                gallery: galleryUrls // Replace hardcoded gallery with database gallery
              };

              return { productId: item.productId, product: productWithGallery };
            } catch (galleryError) {
              if (import.meta.env.DEV) {
                logInfo(`🏷️ Wishlist: No gallery found for product ${product.masterProductId}, using fallback`);
              }
              // Return product without database gallery (keeps hardcoded or empty gallery)
              return { productId: item.productId, product };
            }
          } catch (err) {
            if (import.meta.env.DEV) {
              logError(`Failed to fetch product data for ${item.productId}:`, err);
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
        if (import.meta.env.DEV) {
          logError('Failed to fetch products data:', err);
        }
      }
    };

    fetchProductsData();
  }, [items, authLoading]);



  const handleAddToCart = useCallback((item: WishlistItem) => {
    // Get full product data if available, otherwise use minimal product from wishlist item
    const fullProduct = productsData.get(item.productId);

    if (fullProduct) {
      // Use full product data from hybrid service
      addToCart(fullProduct);
    } else {
      // Fallback: create minimal product from wishlist item data
      // This shouldn't normally happen as we fetch full product data above
      logWarn('Adding to cart without full product data for', item.productId);
      // Skip add to cart if we don't have full product data
      // The user should wait for products to load
    }
  }, [addToCart, productsData]);


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
          <LoadingSpinner size="large" text="Loading..." />
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
          <LoadingSpinner size="large" text="Loading your wishlist..." />
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <Breadcrumbs />
      </div>
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
                alt={t('empty.mascotAlt', 'Cassandra - your wishlist guide')}
                className="mascot-image-wishlist"
                loading="eager"
                decoding="sync"
              />
            </div>
            <div className="empty-content">
              <h2>{t('empty.title', 'Your wishlist is empty')}</h2>
              <p>{t('empty.description', 'Discover amazing products and add them to your wishlist to keep track of your favorites')}</p>
              <Link to="/products" className="btn btn-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                {t('empty.browseProducts', 'Browse Products')}
              </Link>
            </div>
          </div>
        ) : (
          <>

            {/* Wishlist Items */}
            <div className={`wishlist-items wishlist-items--${viewMode}`}>
              {availableItems.map((item) => {
                const product = productsData.get(item.productId);
                if (!product) {
                  return null; // Skip if product data not loaded yet
                }
                return (
                  <ProductCard
                    key={item.id}
                    product={product}
                    onAddToCart={() => handleAddToCart(item)}
                    className="wishlist-product-card"
                  >
                    <div className="wishlist-item-meta">
                      <span className="wishlist-added-date">
                        {t('added_date', { date: formatShortDate(item.addedAt) })}
                      </span>
                    </div>
                  </ProductCard>
                );
              })}

              {/* Unavailable Items Section */}
              {unavailableItems.length > 0 && (
                <>
                  <div className="unavailable-section-header">
                    <h3>{t('unavailable_section.title')}</h3>
                    <p>These items are no longer available for purchase</p>
                  </div>

                  {unavailableItems.map((item) => {
                    const product = productsData.get(item.productId);
                    if (!product) {
                      return null; // Skip if product data not loaded yet
                    }
                    return (
                      <ProductCard
                        key={item.id}
                        product={product}
                        onAddToCart={() => handleAddToCart(item)}
                        isUnavailable={true}
                        className="wishlist-product-card wishlist-product-card--unavailable"
                      >
                        <div className="wishlist-item-meta">
                          <span className="wishlist-added-date">
                            {t('added_date', { date: formatShortDate(item.addedAt) })}
                          </span>
                        </div>
                      </ProductCard>
                    );
                  })}
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