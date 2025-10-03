'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';
import { getProducts, getProductGallery, type Product } from '@/lib/api';
import { useCart } from '@/context/useCart';
import WishlistButton from '@/components/WishlistButton';
import { getImageSrcSet, getBestImageUrl, getBaseNameFromPath, isCDNEnabled } from '@/utils/cdnImages';
import './Products.css';

interface ProductWithGallery extends Omit<Product, 'gallery'> {
  gallery: string[];
}

export default function ProductsPage() {
  const { addToCart } = useCart();
  const { t, i18n } = useTranslation('products');
  const [products, setProducts] = useState<ProductWithGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams?.get('search') || '');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('newest');

  type Popup = { visible: boolean; message: string; variant: 'success' | 'warning' };
  const [popups, setPopups] = useState<Record<string, Popup>>({});
  const timersRef = useRef<Record<string, number>>({});

  // Load products with database gallery
  useEffect(() => {
    const loadProductsWithGallery = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getProducts(0, 50);
        const productsList = Array.isArray(result?.products) ? result.products : [];

        // Load gallery for each product from database
        const productsWithGallery = await Promise.all(
          productsList.map(async (product) => {
            try {
              const galleryData = await getProductGallery(String(product.slug || product.id));

              // Sort by order and get URLs (prefer CDN URLs)
              const sortedGallery = galleryData.sort((a, b) => (a.order || 0) - (b.order || 0));
              const galleryUrls = sortedGallery.map(img => img.cdnUrl || img.url).filter(Boolean) as string[];

              if (process.env.NODE_ENV === 'development') {
                console.log(`🏷️ Product ${product.id} (${product.name}) gallery loaded:`, {
                  galleryCount: galleryUrls.length,
                  mainImage: galleryUrls[0] || 'none'
                });
              }

              return {
                ...product,
                gallery: galleryUrls
              };
            } catch (galleryError) {
              console.warn(`Failed to load gallery for product ${product.id}:`, galleryError);
              return {
                ...product,
                gallery: []
              };
            }
          })
        );

        setProducts(productsWithGallery);
      } catch (err) {
        console.error('Failed to load products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadProductsWithGallery();
  }, [i18n.language]);

  // Update search term when URL search param changes
  useEffect(() => {
    const urlSearchTerm = searchParams?.get('search') || '';
    setSearchTerm(urlSearchTerm);
  }, [searchParams]);

  useEffect(() => {
    return () => {
      // cleanup all timers on unmount
      Object.values(timersRef.current).forEach(id => window.clearTimeout(id));
      timersRef.current = {};
    };
  }, []);

  const handleAdd = (p: ProductWithGallery) => () => {
    const productForCart = {
      ...p,
      id: String(p.id),
      gallery: undefined // Cart doesn't need gallery
    };
    const status = addToCart(productForCart as any);
    const isLimit = status === 'limit';
    const message = isLimit ? t('cart.add_limit') : t('cart.add_success');
    const variant: Popup['variant'] = isLimit ? 'warning' : 'success';

    setPopups(prev => ({ ...prev, [String(p.id)]: { visible: true, message, variant } }));

    const existing = timersRef.current[String(p.id)];
    if (existing) window.clearTimeout(existing);

    timersRef.current[String(p.id)] = window.setTimeout(() => {
      setPopups(prev => ({
        ...prev,
        [String(p.id)]: { ...(prev[String(p.id)] || { message: '', variant: 'success' }), visible: false }
      }));
      delete timersRef.current[String(p.id)];
    }, 2000);
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'newest':
          return String(b.id).localeCompare(String(a.id));
        default:
          return 0;
      }
    });

  // Show loading state
  if (loading) {
    return (
      <div className="products-page">
        <div className="products-container">
          <div className="loading-message">{t('loading')}</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="products-page">
        <div className="products-container">
          <div className="error-message">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              {t('actions.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="products-container">
        {/* Toolbar */}
        <div className="products-toolbar">
          <div className="search-container">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => {
                const newSearchTerm = e.target.value;
                setSearchTerm(newSearchTerm);
              }}
              className="search-input"
            />
          </div>

          <div className="sort-container">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="sort-select"
            >
              <option value="newest">Newest</option>
              <option value="name">Name A-Z</option>
              <option value="price">Price Low-High</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="products-grid-container">
          {filteredProducts.length > 0 ? (
            <div className="products-grid">
              {filteredProducts.map((p) => {
                const mainImage = p.gallery && p.gallery.length > 0 ? p.gallery[0] : undefined;
                return (
                  <article key={String(p.id)} className="product-card">
                    <Link href={`/products/${p.slug || p.id}`} className="product-card-link">
                      <div className="product-card-image-container">
                        {mainImage ? (
                          <img
                            src={(() => {
                              const isCDNUrl = mainImage.includes('digitaloceanspaces.com') || mainImage.includes(process.env.NEXT_PUBLIC_CDN_BASE || '');
                              const finalSrc = isCDNUrl ? mainImage : (isCDNEnabled() ? getBestImageUrl(getBaseNameFromPath(mainImage), 800) : mainImage);
                              return finalSrc;
                            })()}
                            srcSet={(() => {
                              const isCDNUrl = mainImage.includes('digitaloceanspaces.com') || mainImage.includes(process.env.NEXT_PUBLIC_CDN_BASE || '');
                              return !isCDNUrl && isCDNEnabled() ? getImageSrcSet(getBaseNameFromPath(mainImage)) : undefined;
                            })()}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            alt={`${p.name} - main image`}
                            className="product-card-image"
                            loading="lazy"
                            onError={(e) => {
                              const fallbackSrc = `/productsGallery/${p.id}/1.png`;
                              if (e.currentTarget.src !== window.location.origin + fallbackSrc) {
                                e.currentTarget.src = fallbackSrc;
                              }
                            }}
                          />
                        ) : (
                          <div className="product-card-placeholder">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="1.5">
                              <path
                                d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                              <circle cx="12" cy="13" r="3"></circle>
                            </svg>
                          </div>
                        )}
                        {p.productType === 'DIGITAL' && (
                          <div className="product-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7,10 12,15 17,10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Digital
                          </div>
                        )}
                        <div className="product-card-wishlist">
                          <WishlistButton
                            productId={String(p.id)}
                            size="small"
                            variant="icon"
                          />
                        </div>
                      </div>

                      <div className="product-card-content">
                        <h3 className="product-card-title">{p.name}</h3>
                        <p className="product-card-description">{p.description}</p>
                        <div
                          className="product-card-price">{p.price.toFixed(2)} {p.currency === 'EUR' ? '€' : p.currency}</div>
                      </div>
                    </Link>

                    <div className="product-card-actions">
                      <button
                        className={`add-to-cart-btn${popups[String(p.id)]?.visible ? ` is-popup ${popups[String(p.id)].variant}` : ''}`}
                        onClick={handleAdd(p)}
                        disabled={!!popups[String(p.id)]?.visible}
                        aria-live="polite"
                      >
                        {popups[String(p.id)]?.visible ? (
                          <span className="popup-message">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="2">
                              {popups[String(p.id)].variant === 'success' ? (
                                <polyline points="20,6 9,17 4,12"></polyline>
                              ) : (
                                <circle cx="12" cy="12" r="10"></circle>
                              )}
                            </svg>
                            {popups[String(p.id)].message}
                          </span>
                        ) : (
                          <span className="add-to-cart-text">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                              strokeWidth="2">
                              <circle cx="8" cy="21" r="1"></circle>
                              <circle cx="19" cy="21" r="1"></circle>
                              <path
                                d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L20.6 7H6"></path>
                            </svg>
                            {t('cart.add_to_cart')}
                          </span>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="no-products">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <h3>No products found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Products Cassandra */}
      <div className="products-floating-mascot">
        <img
          src="/cassandra/Products-Cass.png"
          srcSet="/cassandra/Products-Cass.png 1x, /cassandra/Products-Cass.png 2x"
          sizes="(max-width: 360px) 160px, (max-width: 480px) 200px, (max-width: 768px) 260px, 320px"
          alt="Cassandra - váš sprievodca produktmi"
          className="floating-mascot-image-products"
          loading="eager"
        />
      </div>
    </div>
  );
}
