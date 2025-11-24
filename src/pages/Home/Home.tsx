import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type Product, type ProductVariant } from '../../data/productData';
import { hybridProductService } from '../../services/hybridProductService';
import { useCart } from '../../context/useCart';
import ProductCard from '../../components/ProductCard/ProductCard';
import OptimizedImage from '../../components/OptimizedImage/OptimizedImage';
import { productGalleryService } from '../../services/productGalleryService';
import { homePageSettingsService, type VisibilityMap } from '../../services/homePageSettingsService';
import { testimonialService, type Testimonial } from '../../services/testimonialService';
import VariantSelectorModal from '../../components/VariantSelectorModal/VariantSelectorModal';
import './Home.css';
import { logInfo, logWarn, logError } from '../../services/logger';

const Home: React.FC = () => {
  logInfo('🏠 [HOME] Component is rendering!');
  const { addToCart } = useCart();
  const { t, i18n } = useTranslation('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [visibilityMap, setVisibilityMap] = useState<VisibilityMap>({});
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  logInfo('🏠 [HOME] Testimonials state:', testimonials);
  const featured = useMemo(() => products.slice(0, 6), [products]);

  type Popup = { visible: boolean; message: string; variant: 'success' | 'warning' };
  const [popups, setPopups] = useState<Record<string, Popup>>({});
  const timersRef = useRef<Record<string, number>>({});

  // Variant Selector Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Try to import hero image via bundler; fallback to CSS placeholder if not present
  const heroAlt = t('hero.image_alt');
  const heroMap = import.meta.glob('../../assets/home/hero.png', { eager: true, as: 'url' });
  const heroSrc = (heroMap['../../assets/home/hero.png'] as string) || '/assets/hero.png';

  // Load visibility settings for homepage sections
  useEffect(() => {
    const loadVisibilitySettings = async () => {
      try {
        const visibility = await homePageSettingsService.getVisibilityMap();
        setVisibilityMap(visibility);
      } catch (error) {
        logWarn('Failed to load home page visibility settings, showing all sections:', error);
        // Default to showing all sections if settings can't be loaded
        setVisibilityMap({
          hero: true,
          how_it_works: true,
          featured_products: true,
          testimonials: true
        });
      }
    };

    loadVisibilitySettings();
  }, []);

  // Load testimonials from API
  useEffect(() => {
    const loadTestimonials = async () => {
      logInfo('🔍 [HOME] Starting to load testimonials...');
      try {
        const data = await testimonialService.getFeaturedTestimonials();
        logInfo('✅ [HOME] Loaded testimonials:', data);
        setTestimonials(data);
      } catch (error) {
        logError('❌ [HOME] Failed to load testimonials:', error);
        // Continue with empty array - don't break homepage
      }
    };

    loadTestimonials();
  }, []);

  // Load products with database gallery from hybrid service
  useEffect(() => {
    const loadProductsWithGallery = async () => {
      try {
        const productsList = await hybridProductService.getProducts();
        
        // Load gallery for each product from database
        const productsWithGallery = await Promise.all(
          productsList.map(async (product) => {
            try {
              const galleryData = await productGalleryService.getProductImages(product.masterProductId.toString());

              // Sort: PRIMARY image first, HOVER image second, then by order
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
                logInfo(`🏠 Product ${product.masterProductId} gallery loaded:`, {
                  productName: product.name,
                  galleryCount: galleryUrls.length,
                  mainImage: galleryUrls[0] || 'none',
                  hoverImage: galleryUrls[1] || '❌ NO HOVER IMAGE',
                  first3Images: galleryUrls.slice(0, 3),
                  orderInfo: sortedGallery.slice(0, 3).map(img => ({
                    fileName: img.fileName,
                    order: img.order,
                    isPrimary: img.isPrimary,
                    isHover: img.isHover
                  }))
                });
              }

              return {
                ...product,
                gallery: galleryUrls // Replace empty gallery with database gallery
              };
            } catch (galleryError) {
              logWarn(`Failed to load gallery for product ${product.masterProductId}:`, galleryError);
              return {
                ...product,
                gallery: [] // Keep empty gallery if loading fails
              };
            }
          })
        );
        
        setProducts(productsWithGallery);
      } catch (error) {
        logError('Failed to load products for home page:', error);
        // Continue with empty array - don't show error on home page
      }
    };

    loadProductsWithGallery();
  }, [i18n.language]); // Reload products when language changes

  // Preload hero image for better LCP when available
  useEffect(() => {
    if (!heroSrc) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = heroSrc;
    document.head.appendChild(link);
    return () => { if (link.parentNode) document.head.removeChild(link); };
  }, [heroSrc]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      // cleanup all timers on unmount
      Object.values(timersRef.current).forEach(id => window.clearTimeout(id));
      timersRef.current = {};
    };
  }, []);

  // Helper function to render star rating (memoized)
  const renderStars = useCallback((rating: number) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} viewBox="0 0 24 24" fill={star <= rating ? "currentColor" : "none"}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              stroke="currentColor" strokeWidth="1" />
          </svg>
        ))}
      </div>
    );
  }, []);

  // Helper function to format relative date (memoized)
  const formatRelativeDate = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    }
  }, []);

  // Handle add to cart with popup feedback (memoized)
  const handleAdd = useCallback((p: Product) => () => {
    const hasMultipleVariants = p.availableVariants && p.availableVariants.length > 1;

    if (hasMultipleVariants) {
      // Open modal for variant selection
      setSelectedProduct(p);
      setIsModalOpen(true);
    } else {
      // Direct add to cart for single variant products
      const status = addToCart(p);
      showPopup(p.variantId.toString(), status);
    }
  }, [addToCart]);

  // Handle add to cart from modal (with selected variant and quantity)
  const handleAddFromModal = useCallback((selectedVariant: ProductVariant, quantity: number) => {
    if (!selectedProduct) return;

    // Create a temporary product object with the selected variant data
    const productWithVariant: Product = {
      ...selectedProduct,
      variantId: selectedVariant.variantId,
      variantName: selectedVariant.variantName,
      sku: selectedVariant.sku,
      priceWithVat: selectedVariant.priceWithVat,
      priceWithoutVat: selectedVariant.priceWithoutVat,
      currency: selectedVariant.currency,
      variantType: selectedVariant.variantType,
      stockQuantity: selectedVariant.stockQuantity,
      availabilityStatus: selectedVariant.availabilityStatus
    };

    // Add to cart multiple times for quantity
    let overallStatus: 'added' | 'limit' | 'out_of_stock' | 'discontinued' | 'pre_order' = 'added';
    for (let i = 0; i < quantity; i++) {
      const status = addToCart(productWithVariant);
      if (status !== 'added') {
        overallStatus = status;
        break;
      }
    }

    showPopup(selectedVariant.variantId.toString(), overallStatus);
  }, [addToCart, selectedProduct]);

  // Show popup notification
  const showPopup = useCallback((key: string, status: 'added' | 'limit' | 'out_of_stock' | 'discontinued' | 'pre_order') => {
    const isLimit = status === 'limit';
    const message = isLimit ? t('cart.add_limit', { ns: 'products' }) : t('cart.add_success', { ns: 'products' });
    const variant: Popup['variant'] = isLimit ? 'warning' : 'success';

    setPopups(prev => ({ ...prev, [key]: { visible: true, message, variant } }));

    const existing = timersRef.current[key];
    if (existing) window.clearTimeout(existing);

    timersRef.current[key] = window.setTimeout(() => {
      setPopups(prev => ({
        ...prev,
        [key]: { ...(prev[key] || { message: '', variant: 'success' }), visible: false }
      }));
      delete timersRef.current[key];
    }, 2000);
  }, [t]);

  logInfo('🎨 [HOME] About to render. visibilityMap:', visibilityMap);
  logInfo('🎨 [HOME] testimonials.length:', testimonials.length);
  logInfo('🎨 [HOME] Will show testimonials?', visibilityMap.testimonials !== false && testimonials.length > 0);

  return (
    <>
      {/* Hero Section - Above home-root */}
      {visibilityMap.hero !== false && (
        <section className="hero-section">
          {heroSrc && (
            <OptimizedImage
              src={heroSrc}
              alt={heroAlt}
              priority={true}
              className="hero-tank-image"
            />
          )}
          <div className="hero-dark-overlay" />

          <div className="hero-content">
            <h1 className="hero-title">{t('hero.title')}</h1>
            <p className="hero-subtitle">{t('hero.subtitle')}</p>

            <div className="hero-buttons">
              <Link to="/products" className="hero-btn hero-btn-primary">
                {t('hero.shop_kits')}
              </Link>
              <Link to="/gallery" className="hero-btn hero-btn-secondary">
                {t('hero.download_stl')}
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="home-root" aria-label="Home Page">
        {/* 2) Engineering Journey */}
      {visibilityMap.how_it_works !== false && (
      <section className="engineering-journey" aria-label={t('how_it_works.title')}>
        <div className="container">
          <div className="section-header-modern">
            <h2>{t('how_it_works.title')}</h2>
            <p className="section-subtitle-modern">{t('how_it_works.subtitle')}</p>
          </div>
          <div className="journey-grid">
            <article className="journey-phase">
              <div className="phase-number">{t('how_it_works.phase_1')}</div>
              <div className="phase-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v20M2 12h20"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </div>
              <h3 className="phase-title">{t('how_it_works.phase_1_title')}</h3>
              <p className="phase-description">{t('how_it_works.phase_1_description')}</p>
            </article>

            <article className="journey-phase">
              <div className="phase-number">{t('how_it_works.phase_2')}</div>
              <div className="phase-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              </div>
              <h3 className="phase-title">{t('how_it_works.phase_2_title')}</h3>
              <p className="phase-description">{t('how_it_works.phase_2_description')}</p>
            </article>

            <article className="journey-phase">
              <div className="phase-number">{t('how_it_works.phase_3')}</div>
              <div className="phase-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              </div>
              <h3 className="phase-title">{t('how_it_works.phase_3_title')}</h3>
              <p className="phase-description">{t('how_it_works.phase_3_description')}</p>
            </article>

            <article className="journey-phase">
              <div className="phase-number">{t('how_it_works.phase_4')}</div>
              <div className="phase-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <h3 className="phase-title">{t('how_it_works.phase_4_title')}</h3>
              <p className="phase-description">{t('how_it_works.phase_4_description')}</p>
            </article>
          </div>
        </div>
      </section>
      )}

      {/* 3) Featured Products */}
      {visibilityMap.featured_products !== false && (
      <section className="featured-products-modern" aria-label={t('featured.title')}>
        <div className="container">
          <div className="section-header-modern">
            <h2>{t('featured.title')}</h2>
            <Link className="btn-view-all" to="/products">
              {t('featured.view_all')}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
          <div className="featured-grid">
            {featured.map((p, index) => {
              const popupKey = p.variantId.toString();
              return (
                <ProductCard
                  key={p.variantId}
                  product={p}
                  onAddToCart={handleAdd(p)}
                  popupState={popups[popupKey]}
                  priority={index < 3}
                />
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* 4) Testimonials */}
      {testimonials.length > 0 && (
      <section className="testimonials-modern" aria-label={t('testimonials.title')}>
        <div className="container">
          <div className="section-header-modern">
            <h2>{t('testimonials.title')}</h2>
            <p className="section-subtitle-modern">{t('testimonials.subtitle')}</p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial) => (
              <article key={testimonial.id} className="testimonial-card-compact">
                <div className="testimonial-top">
                  {renderStars(testimonial.rating)}
                  <span className="review-date">{formatRelativeDate(testimonial.createdAt)}</span>
                </div>
                <p className="testimonial-text">
                  "{testimonial.comment}"
                </p>
                <div className="testimonial-author">
                  <span className="author-name">{testimonial.userName}</span>
                  {testimonial.productName && (
                    <span className="product-tag">{testimonial.productName}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}
      </div>

      {/* Variant Selector Modal */}
      {selectedProduct && (
        <VariantSelectorModal
          product={selectedProduct}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddToCart={handleAddFromModal}
        />
      )}
    </>
  );
};

export default Home;