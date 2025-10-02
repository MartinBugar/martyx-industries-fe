import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type Product } from '../../data/productData';
import { hybridProductService } from '../../services/hybridProductService';
import WishlistButton from '../../components/WishlistButton';
import { getImageSrcSet, getBestImageUrl, getBaseNameFromPath, isCDNEnabled } from '../../utils/cdnImages';
import { productGalleryService } from '../../services/productGalleryService';
import './Home.css';

const Home: React.FC = () => {
  const { t, i18n } = useTranslation('home');
  const [products, setProducts] = useState<Product[]>([]);
  const featured = useMemo(() => products.slice(0, 6), [products]);

  const [subscribed, setSubscribed] = useState(false);

  // Try to import hero image via bundler; fallback to CSS placeholder if not present
  const heroAlt = t('hero.image_alt');
  const heroMap = import.meta.glob('../../assets/home/tank.png', { eager: true, as: 'url' });
  const heroSrc = (heroMap['../../assets/home/tank.png'] as string) || '/assets/hero-tank.png';

  // Load products with database gallery from hybrid service
  useEffect(() => {
    const loadProductsWithGallery = async () => {
      try {
        const productsList = await hybridProductService.getProducts();
        
        // Load gallery for each product from database
        const productsWithGallery = await Promise.all(
          productsList.map(async (product) => {
            try {
              const galleryData = await productGalleryService.getProductImages(product.id.toString());
              
              // Sort by order and get URLs (prefer CDN URLs)
              const sortedGallery = galleryData.sort((a, b) => (a.order || 0) - (b.order || 0));
              const galleryUrls = sortedGallery.map(img => img.cdnUrl || img.url).filter(Boolean);
              
              if (import.meta.env.DEV) {
                console.log(`🏠 Product ${product.id} gallery loaded:`, {
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
              console.warn(`Failed to load gallery for product ${product.id}:`, galleryError);
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
      <section className="hero-section" aria-label="Hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <div className="hero-content-wrapper">
                <div className="hero-mascot-container">
                  <img
                    src="/cassandra/Home-Cass.png"
                    alt="Cassandra - Váš 3D sprievodca"
                    className="mascot-image-home"
                    loading="eager"
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
                <img
                  src={heroSrc}
                  alt={heroAlt}
                  width={1800}
                  height={1000}
                  loading="eager"
                  decoding="sync"
                />
              ) : (
                <div className="hero-image" role="img" aria-label={heroAlt} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2) How it works */}
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

      {/* 3) Featured */}
      <section className="home-section featured-section" aria-label={t('featured.title')}>
        <div className="container">
          <div className="section-header">
            <h2>{t('featured.title')}</h2>
            <div className="view-all-container">
              <Link className="btn primary" to="/products">{t('featured.view_all')}</Link>
            </div>
          </div>
          <div className="featured-grid">
            {featured.map((p) => (
              <article key={p.id} className="product-card">
                <div className="product-card-image-container">
                  <Link to={`/products/${p.id}`} className="product-card-link">
                    <img
                      src={(() => {
                        if (!p.gallery?.[0]) return '/assets/kit-01.png';
                        const mainImage = p.gallery[0];
                        // If the image URL is already a CDN URL, use it directly
                        const isCDNUrl = mainImage.includes('digitaloceanspaces.com') || mainImage.includes(import.meta.env.VITE_CDN_BASE || '');
                        const finalSrc = isCDNUrl ? mainImage : (isCDNEnabled() ? getBestImageUrl(getBaseNameFromPath(mainImage), 800) : mainImage);
                        if (import.meta.env.DEV && p.id === "1") {
                          console.log(`🏠 Homepage card for ${p.name} - Original:`, mainImage, '→ Final:', finalSrc, '(CDN URL detected:', isCDNUrl, ')');
                        }
                        return finalSrc;
                      })()}
                      srcSet={(() => {
                        if (!p.gallery?.[0]) return undefined;
                        const mainImage = p.gallery[0];
                        const isCDNUrl = mainImage.includes('digitaloceanspaces.com') || mainImage.includes(import.meta.env.VITE_CDN_BASE || '');
                        return !isCDNUrl && isCDNEnabled() ? getImageSrcSet(getBaseNameFromPath(mainImage)) : undefined;
                      })()}
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      alt={p.name}
                      className="product-image"
                      loading="lazy"
                      onLoad={() => {
                        if (import.meta.env.DEV && p.id === "1") {
                          console.log(`✅ Homepage card image for ${p.name} loaded successfully`);
                        }
                      }}
                      onError={(e) => {
                        if (import.meta.env.DEV) {
                          console.error(`❌ Homepage card image for ${p.name} failed to load:`, e.currentTarget.src);
                        }
                        // Fallback to local image if CDN fails
                        const fallbackSrc = `/productsGallery/${p.id}/1.png`;
                        if (e.currentTarget.src !== window.location.origin + fallbackSrc) {
                          e.currentTarget.src = fallbackSrc;
                        }
                      }}
                    />
                  </Link>
                  <div className="product-card-wishlist">
                    <WishlistButton
                      productId={p.id}
                      size="small"
                      variant="icon"
                    />
                  </div>
                </div>
                <Link to={`/products/${p.id}`} className="product-card-link">
                  <div className="product-info">
                    <h3 className="product-title">{p.name}</h3>
                    <div className="product-price">{p.currency} {p.price.toFixed(2)}</div>
                    <p className="product-description">{p.description}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6) Testimonials */}
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

      {/* 7) Newsletter */}
      <section className="home-section newsletter" aria-label={t('newsletter.title')}>
        <div className="container">
          <div className="newsletter-container">
            <div className="newsletter-content">
              <div className="newsletter-header">
                <div className="newsletter-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="newsletter-title">{t('newsletter.title')}</h2>
                <p className="newsletter-description">
                  {t('newsletter.description')}
                </p>
              </div>
              
              <div className="newsletter-benefits">
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>{t('newsletter.benefits.early_access')}</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>{t('newsletter.benefits.exclusive_guides')}</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>{t('newsletter.benefits.member_discounts')}</span>
                </div>
              </div>
            </div>
            
            <div className="newsletter-form-container">
              <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); setSubscribed(true); console.log('newsletter_subscribed'); }}>
                <div className="form-group">
                  <label htmlFor="newsletter-email" className="form-label">{t('newsletter.email_label')}</label>
                  <div className="input-wrapper">
                    <input 
                      id="newsletter-email" 
                      name="email" 
                      type="email" 
                      required 
                      placeholder={t('newsletter.email_placeholder')} 
                      className="newsletter-input"
                      aria-label={t('newsletter.subscribe_button')}
                    />
                    <button type="submit" className="newsletter-submit" aria-label={t('newsletter.subscribe_button')}>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="form-note">
                  {t('newsletter.privacy_note')}
                </p>
              </form>
              
              {subscribed && (
                <div className="newsletter-success" role="status" aria-live="polite">
                  <div className="success-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="success-content">
                    <h3>{t('newsletter.success_title')}</h3>
                    <p>{t('newsletter.success_message')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;