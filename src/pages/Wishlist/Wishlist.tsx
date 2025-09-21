import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/useAuth';
import { useCart } from '../../context/useCart';
import { hybridProductService } from '../../services/hybridProductService';
import { type Product } from '../../data/productData';
import { type WishlistItem } from '../../types/wishlist';
import WishlistButton from '../../components/WishlistButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import './Wishlist.css';
import '../Products/Products.css';

const Wishlist: React.FC = () => {
  const { t } = useTranslation('wishlist');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    items,
    stats,
    isLoading,
    error,
    totalCount,
    lastUpdated,
    cleanupWishlist,
    removeMultiple,
    clearError,
    refreshWishlist
  } = useWishlist();
  const { addToCart } = useCart();

  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [productsData, setProductsData] = useState<Map<number, Product>>(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/wishlist');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Fetch full product data for each wishlist item to get gallery images
  useEffect(() => {
    const fetchProductsData = async () => {
      const newProductsData = new Map<number, Product>();

      for (const item of items) {
        try {
          const product = await hybridProductService.getProductById(item.productId);
          newProductsData.set(item.productId, product);
        } catch (err) {
          console.error(`Failed to fetch product data for ${item.productId}:`, err);
        }
      }

      setProductsData(newProductsData);
    };

    if (items.length > 0) {
      fetchProductsData();
    }
  }, [items]);

  const handleSelectItem = (productId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.productId)));
    }
  };

  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) return;

    try {
      await removeMultiple(Array.from(selectedItems));
      setSelectedItems(new Set());
    } catch (err) {
      console.error('Failed to remove selected items:', err);
    }
  };

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      const removedCount = await cleanupWishlist();
      if (removedCount > 0) {
        // Show success message or toast
        console.log(`Removed ${removedCount} unavailable items`);
      }
    } catch (err) {
      console.error('Failed to cleanup wishlist:', err);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    const product = {
      id: String(item.productId),
      name: item.productName,
      price: item.productPrice,
      currency: item.productCurrency,
      description: item.productDescription,
      features: [], // Default empty features
      modelPath: '', // Default empty model path
      gallery: item.productImageUrl ? [item.productImageUrl] : [],
      interactionInstructions: [], // Default empty instructions
      productType: item.productType as 'DIGITAL' | 'PHYSICAL'
    };
    addToCart(product);
  };


  const availableItems = items.filter(item => item.isAvailable);
  const unavailableItems = items.filter(item => !item.isAvailable);

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
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <h2>Your wishlist is empty</h2>
            <p>Discover amazing products and add them to your wishlist to keep track of your favorites</p>
            <Link to="/products" className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="wishlist-toolbar">
              <div className="toolbar-left">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === items.length && items.length > 0}
                    onChange={handleSelectAll}
                    disabled={items.length === 0}
                  />
                  <span className="checkmark"></span>
                  Select All ({items.length})
                </label>

                {selectedItems.size > 0 && (
                  <button
                    className="btn btn-danger"
                    onClick={handleRemoveSelected}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6"/>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                    </svg>
                    Remove Selected ({selectedItems.size})
                  </button>
                )}
              </div>

              <div className="toolbar-right">
                {unavailableItems.length > 0 && (
                  <button
                    className="btn btn-outline"
                    onClick={handleCleanup}
                    disabled={isCleaningUp}
                  >
                    {isCleaningUp ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18l-2 13H5L3 6z"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    )}
                    Clean up
                  </button>
                )}

                <div className="view-mode-toggle">
                  <button
                    className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Grid view"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </button>
                  <button
                    className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    aria-label="List view"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6"/>
                      <line x1="8" y1="12" x2="21" y2="12"/>
                      <line x1="8" y1="18" x2="21" y2="18"/>
                      <line x1="3" y1="6" x2="3.01" y2="6"/>
                      <line x1="3" y1="12" x2="3.01" y2="12"/>
                      <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Wishlist Items */}
            <div className={`wishlist-items wishlist-items--${viewMode}`}>
              {availableItems.map((item) => (
                <article key={item.id} className="product-card wishlist-product-card">
                  <div className="product-card-checkbox">
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.productId)}
                        onChange={() => handleSelectItem(item.productId)}
                      />
                      <span className="checkmark"></span>
                    </label>
                  </div>

                  <Link to={`/products/${item.productId}`} className="product-card-link">
                    <div className="product-card-image-container">
                      {(() => {
                        const product = productsData.get(item.productId);
                        const mainImage = product?.gallery && product.gallery.length > 0 ? product.gallery[0] : item.productImageUrl;
                        return mainImage ? (
                          <img
                            src={mainImage}
                            alt={`${item.productName} - main image`}
                            className="product-card-image"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="product-card-placeholder">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                              <circle cx="12" cy="13" r="3"/>
                            </svg>
                          </div>
                        );
                      })()}

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
                        {item.productPrice.toFixed(2)} {item.productCurrency === 'EUR' ? '€' : item.productCurrency}
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
              ))}

              {/* Unavailable Items Section */}
              {unavailableItems.length > 0 && (
                <>
                  <div className="unavailable-section-header">
                    <h3>Unavailable Items</h3>
                    <p>These items are no longer available for purchase</p>
                  </div>

                  {unavailableItems.map((item) => (
                    <article key={item.id} className="product-card wishlist-product-card wishlist-product-card--unavailable">
                      <div className="product-card-checkbox">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.productId)}
                            onChange={() => handleSelectItem(item.productId)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </div>

                      <Link to={`/products/${item.productId}`} className="product-card-link">
                        <div className="product-card-image-container">
                          {(() => {
                            const product = productsData.get(item.productId);
                            const mainImage = product?.gallery && product.gallery.length > 0 ? product.gallery[0] : item.productImageUrl;
                            return mainImage ? (
                              <img
                                src={mainImage}
                                alt={`${item.productName} - main image`}
                                className="product-card-image"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="product-card-placeholder">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                                  <circle cx="12" cy="13" r="3"/>
                                </svg>
                              </div>
                            );
                          })()}

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
                            {item.productPrice.toFixed(2)} {item.productCurrency === 'EUR' ? '€' : item.productCurrency}
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