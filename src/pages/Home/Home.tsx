import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type Product } from '../../data/productData';
import { hybridProductService } from '../../services/hybridProductService';
import WishlistButton from '../../components/WishlistButton';
import OptimizedImage from '../../components/OptimizedImage/OptimizedImage';
import { getBestImageUrl, getBaseNameFromPath, isCDNEnabled } from '../../utils/cdnImages';
import { productGalleryService } from '../../services/productGalleryService';
import { homePageSettingsService, type VisibilityMap } from '../../services/homePageSettingsService';
import './Home.css';

// Helper function to get price display with "Od" prefix if multiple variants
const getPriceDisplay = (product: Product): { prefix: string; price: number } => {
  const hasMultipleVariants = product.availableVariants && product.availableVariants.length > 1;

  if (hasMultipleVariants) {
    // Find lowest price from all variants
    const lowestPrice = Math.min(...product.availableVariants!.map(v => v.priceWithVat));
    return { prefix: 'Od ', price: lowestPrice };
  }

  // Single variant or no variants - show current price without prefix
  return { prefix: '', price: product.priceWithVat };
};

const Home: React.FC = () => {
  const { t, i18n } = useTranslation('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [visibilityMap, setVisibilityMap] = useState<VisibilityMap>({});
  const featured = useMemo(() => products.slice(0, 6), [products]);

  // Try to import hero image via bundler; fallback to CSS placeholder if not present
  const heroAlt = t('hero.image_alt');
  const heroMap = import.meta.glob('../../assets/home/tank.png', { eager: true, as: 'url' });
  const heroSrc = (heroMap['../../assets/home/tank.png'] as string) || '/assets/hero-tank.png';

  // Load visibility settings for homepage sections
  useEffect(() => {
    const loadVisibilitySettings = async () => {
      try {
        const visibility = await homePageSettingsService.getVisibilityMap();
        setVisibilityMap(visibility);
      } catch (error) {
        console.warn('Failed to load home page visibility settings, showing all sections:', error);
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

              // Sort by order and get URLs (prefer CDN URLs)
              const sortedGallery = galleryData.sort((a, b) => (a.order || 0) - (b.order || 0));
              const galleryUrls = sortedGallery.map(img => img.cdnUrl || img.url).filter(Boolean);

              if (import.meta.env.DEV) {
                console.log(`🏠 Product ${product.masterProductId} gallery loaded:`, {
                  productName: product.name,
                  galleryCount: galleryUrls.length,
                  mainImage: galleryUrls[0] || 'none',
                  orderInfo: sortedGallery.slice(0, 3).map(img => ({
                    fileName: img.fileName,
                    order: img.order
                  }))
                });
              }

              return {
                ...product,
                gallery: galleryUrls // Replace empty gallery with database gallery
              };
            } catch (galleryError) {
              console.warn(`Failed to load gallery for product ${product.masterProductId}:`, galleryError);
              return {
                ...product,
                gallery: [] // Keep empty gallery if loading fails
              };
            }
          })
        );
        
        setProducts(productsWithGallery);
      } catch (error) {
        console.error('Failed to load products for home page:', error);
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

  return (
    <div className="home-root" aria-label="Home Page">
      {/* 1) Hero */}
      {visibilityMap.hero !== false && (
      <section className="hero-section" aria-label="Hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-content-wrapper">
                <div className="hero-mascot-container">
                  <OptimizedImage
                    src="/cassandra/Home-Cass.png"
                    alt="Cassandra - Váš 3D sprievodca"
                    className="mascot-image-home"
                    priority={true} // Hero mascot má najvyššiu prioritu
                  />
                </div>
                <div className="hero-text-content">
                  <h1 className="hero-title">{t('hero.title')}</h1>
                  <p className="hero-sub">{t('hero.subtitle')}</p>
                  <div className="hero-ctas">
                    <Link to="/products" className="btn btn-accent" onClick={() => console.log('hero_shop_kits_click')}>{t('hero.shop_kits')}</Link>
                    <Link to="/products" className="btn btn-outline" onClick={() => console.log('hero_download_stl_click')}>{t('hero.download_stl')}</Link>
                  </div>
                  <ul className="hero-kpis" aria-label={t('hero.facts.assembly_time')}>
                    <li>{t('hero.facts.assembly_time')}</li>
                    <li>{t('hero.facts.layer_optimization')}</li>
                    <li>{t('hero.facts.electronics_ready')}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              {heroSrc ? (
                <OptimizedImage
                  src={heroSrc}
                  alt={heroAlt}
                  priority={true} // Hero obrázok má najvyššiu prioritu
                  className="hero-image hero-image-full-width"
                />
              ) : (
                <div className="hero-image" role="img" aria-label={heroAlt} />
              )}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* 2) How it works */}
      {visibilityMap.how_it_works !== false && (
      <section className="how-section" aria-label={t('how_it_works.title')}>
        <div className="container">
          <div className="section-header"><h2>{t('how_it_works.title')}</h2></div>
          <div className="how-grid">
            <article className="how-card">
              <span className="how-step">{t('how_it_works.step_1')}</span>
              <h3>{t('how_it_works.step_1_title')}</h3>
              <p>{t('how_it_works.step_1_description')}</p>
            </article>
            <article className="how-card">
              <span className="how-step">{t('how_it_works.step_2')}</span>
              <h3>{t('how_it_works.step_2_title')}</h3>
              <p>{t('how_it_works.step_2_description')}</p>
            </article>
            <article className="how-card">
              <span className="how-step">{t('how_it_works.step_3')}</span>
              <h3>{t('how_it_works.step_3_title')}</h3>
              <p>{t('how_it_works.step_3_description')}</p>
            </article>
          </div>
        </div>
      </section>
      )}

      {/* 3) Featured */}
      {visibilityMap.featured_products !== false && (
      <section className="home-section featured-section" aria-label={t('featured.title')}>
        <div className="container">
          <div className="section-header">
            <h2>{t('featured.title')}</h2>
            <div className="button-wrapper-centered">
              <Link className="btn primary" to="/products">{t('featured.view_all')}</Link>
            </div>
          </div>
          <div className="featured-grid">
            {featured.map((p, index) => (
              <article key={p.variantId} className="product-card">
                <div className="product-card-image-container">
                  <Link to={`/products/${p.masterProductId}`} className="product-card-link">
                    <OptimizedImage
                      src={(() => {
                        if (!p.gallery?.[0]) return '/assets/kit-01.png';
                        const mainImage = p.gallery[0];
                        // If the image URL is already a CDN URL, use it directly
                        const isCDNUrl = mainImage.includes('digitaloceanspaces.com') || mainImage.includes(import.meta.env.VITE_CDN_BASE || '');
                        const finalSrc = isCDNUrl ? mainImage : (isCDNEnabled() ? getBestImageUrl(getBaseNameFromPath(mainImage), 800) : mainImage);
                        if (import.meta.env.DEV && p.masterProductId === 1) {
                          console.log(`🏠 Homepage card for ${p.name} - Original:`, mainImage, '→ Final:', finalSrc, '(CDN URL detected:', isCDNUrl, ')');
                        }
                        return finalSrc;
                      })()}
                      alt={p.name}
                      className="product-image"
                      priority={index < 3} // Prvé 3 featured produkty majú prioritu
                      placeholder="/images/product-placeholder.svg"
                    />
                  </Link>
                  <div className="product-card-wishlist">
                    <WishlistButton
                      productId={p.masterProductId}
                      size="small"
                      variant="icon"
                    />
                  </div>
                </div>
                <Link to={`/products/${p.masterProductId}`} className="product-card-link">
                  <div className="product-info">
                    <h3 className="product-title">{p.name}</h3>
                    <div className="product-price">
                      {(() => {
                        const { prefix, price } = getPriceDisplay(p);
                        return `${prefix}${price.toFixed(2)} ${p.currency === 'EUR' ? '€' : p.currency}`;
                      })()}
                    </div>
                    <p className="product-description">{p.description}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* 6) Testimonials */}
      {visibilityMap.testimonials !== false && (
      <section className="home-section testimonials" aria-label={t('testimonials.title')}>
        <div className="container">
          <div className="section-header">
            <h2>{t('testimonials.title')}</h2>
            <p className="section-subtitle">{t('testimonials.subtitle')}</p>
          </div>
          <div className="testimonials-grid">
            <article className="testimonial-card">
              <div className="testimonial-header">
                <div className="customer-info">
                  <div className="customer-avatar">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="customer-details">
                    <h4 className="customer-name">J. Park</h4>
                    <div className="star-rating">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="review-date">2 weeks ago</div>
              </div>
              <blockquote className="testimonial-content">
                <p>"Printed over a weekend, runs like a charm. The STL files are perfectly optimized and the assembly guide is crystal clear. My kids love driving it around!"</p>
              </blockquote>
              <div className="testimonial-footer">
                <span className="product-tag">Tiger I Kit</span>
              </div>
            </article>

            <article className="testimonial-card">
              <div className="testimonial-header">
                <div className="customer-info">
                  <div className="customer-avatar">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="customer-details">
                    <h4 className="customer-name">A. Novak</h4>
                    <div className="star-rating">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="review-date">1 month ago</div>
              </div>
              <blockquote className="testimonial-content">
                <p>"Clean STLs, no supports needed on my setup. The modular design makes it easy to customize and the electronics integration is seamless. Highly recommended!"</p>
              </blockquote>
              <div className="testimonial-footer">
                <span className="product-tag">Sherman STL Bundle</span>
              </div>
            </article>

            <article className="testimonial-card">
              <div className="testimonial-header">
                <div className="customer-info">
                  <div className="customer-avatar">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="customer-details">
                    <h4 className="customer-name">M. Chen</h4>
                    <div className="star-rating">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="review-date">3 weeks ago</div>
              </div>
              <blockquote className="testimonial-content">
                <p>"Amazing quality! The tracks work perfectly and the suspension system is incredibly realistic. Assembly took exactly as advertised - under 4 hours."</p>
              </blockquote>
              <div className="testimonial-footer">
                <span className="product-tag">T-34 Kit</span>
              </div>
            </article>

            <article className="testimonial-card">
              <div className="testimonial-header">
                <div className="customer-info">
                  <div className="customer-avatar">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="customer-details">
                    <h4 className="customer-name">R. Schmidt</h4>
                    <div className="star-rating">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="review-date">1 week ago</div>
              </div>
              <blockquote className="testimonial-content">
                <p>"The attention to detail is incredible. Every bolt and rivet is perfectly modeled. The controller range is impressive and the sound effects are spot on!"</p>
              </blockquote>
              <div className="testimonial-footer">
                <span className="product-tag">Panther STL Bundle</span>
              </div>
            </article>
          </div>
        </div>
      </section>
      )}
    </div>
  );
};

export default Home;