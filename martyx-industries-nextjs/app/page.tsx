'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import WishlistButton from '@/components/WishlistButton/WishlistButton';
import { getFeaturedProducts } from '@/lib/api';
import { getImageSrcSet, getBestImageUrl, getBaseNameFromPath, isCDNEnabled } from '../utils/cdnImages';
import styles from './home.module.css';

// Loading component for SSR
function LoadingHome() {
  return (
    <div className={styles.homeRoot} aria-label="Home Page">
      <section className={styles.heroSection} aria-label="Hero">
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.heroContentWrapper}>
                <div className={styles.heroMascotContainer}>
                  <img
                    src="/cassandra/Home-Cass.png"
                    alt="Cassandra"
                    className={styles.mascotImageHome}
                    loading="eager"
                  />
                </div>
                <div className={styles.heroTextContent}>
                  <h1 className={styles.heroTitle}>RC Tank Kits & STL Files</h1>
                  <p className={styles.heroSub}>Build. Print. Command.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface Product {
  id: string | number;
  slug?: string;
  name: string;
  title?: string; // For backward compatibility
  shortDescription?: string;
  description?: string;
  price: number;
  currency: string;
  category?: string | null;
  gallery?: Array<{
    id: string;
    url: string;
    alt?: string;
    order?: number;
  }>;
  featured?: boolean;
}

export default function Home() {
  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONAL RETURNS
  const { t, i18n, ready } = useTranslation('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [subscribed, setSubscribed] = useState(false);
  const featured = useMemo(() => Array.isArray(products) ? products.slice(0, 6) : [], [products]);

  // Load products with gallery from API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsList = await getFeaturedProducts();
        setProducts(productsList);
      } catch (error) {
        console.error('Failed to load products for home page:', error);
        // Continue with empty array - don't show error on home page
      }
    };

    loadProducts();
  }, [i18n.language]); // Reload products when language changes

  // Show loading component until translations are ready
  if (!ready) {
    return <LoadingHome />;
  }

  // Try to import hero image via bundler; fallback to CSS placeholder if not present
  const heroAlt = t('hero.image_alt');
  const heroSrc = '/assets/home/tank.png';

  return (
    <div className={styles.homeRoot} aria-label="Home Page">
      {/* 1) Hero */}
      <section className={styles.heroSection} aria-label="Hero">
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.heroContentWrapper}>
                <div className={styles.heroMascotContainer}>
                  <img
                    src="/cassandra/Home-Cass.png"
                    alt="Cassandra - Váš 3D sprievodca"
                    className={styles.mascotImageHome}
                    loading="eager"
                  />
                </div>
                <div className={styles.heroTextContent}>
                  <h1 className={styles.heroTitle}>{t('hero.title')}</h1>
                  <p className={styles.heroSub}>{t('hero.subtitle')}</p>
                  <div className={styles.heroCtas}>
                    <Link href="/products" className={`${styles.btn} ${styles.btnAccent}`}>
                      {t('hero.shop_kits')}
                    </Link>
                    <Link href="/products" className={`${styles.btn} ${styles.btnOutline}`}>
                      {t('hero.download_stl')}
                    </Link>
                  </div>
                  <ul className={styles.heroKpis} aria-label={t('hero.facts.assembly_time')}>
                    <li>{t('hero.facts.assembly_time')}</li>
                    <li>{t('hero.facts.layer_optimization')}</li>
                    <li>{t('hero.facts.electronics_ready')}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className={styles.heroVisual}>
              {heroSrc ? (
                <img
                  src={heroSrc}
                  alt={heroAlt}
                  width={1800}
                  height={1000}
                  loading="eager"
                />
              ) : (
                <div className={styles.heroImage} role="img" aria-label={heroAlt} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2) How it works */}
      <section className={styles.howSection} aria-label={t('how_it_works.title')}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}><h2>{t('how_it_works.title')}</h2></div>
          <div className={styles.howGrid}>
            <article className={styles.howCard}>
              <span className={styles.howStep}>{t('how_it_works.step_1')}</span>
              <h3>{t('how_it_works.step_1_title')}</h3>
              <p>{t('how_it_works.step_1_description')}</p>
            </article>
            <article className={styles.howCard}>
              <span className={styles.howStep}>{t('how_it_works.step_2')}</span>
              <h3>{t('how_it_works.step_2_title')}</h3>
              <p>{t('how_it_works.step_2_description')}</p>
            </article>
            <article className={styles.howCard}>
              <span className={styles.howStep}>{t('how_it_works.step_3')}</span>
              <h3>{t('how_it_works.step_3_title')}</h3>
              <p>{t('how_it_works.step_3_description')}</p>
            </article>
          </div>
        </div>
      </section>

      {/* 3) Featured */}
      <section className={`${styles.homeSection} ${styles.featuredSection}`} aria-label={t('featured.title')}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>{t('featured.title')}</h2>
            <div className={styles.viewAllContainer}>
              <Link className={`${styles.btn} ${styles.primary}`} href="/products">{t('featured.view_all')}</Link>
            </div>
          </div>
          <div className={styles.featuredGrid}>
            {featured.map((p) => (
              <article key={p.id} className={styles.productCard}>
                <div className={styles.productCardImageContainer}>
                  <Link href={`/products/${p.slug || p.id}`} className={styles.productCardLink}>
                    <img
                      src={(() => {
                        if (!p.gallery?.[0]?.url) return '/assets/kit-01.png';
                        const mainImage = p.gallery[0].url;
                        // If the image URL is already a CDN URL, use it directly
                        const isCDNUrl = mainImage.includes('digitaloceanspaces.com') || mainImage.includes(process.env.NEXT_PUBLIC_CDN_BASE || '');
                        const finalSrc = isCDNUrl ? mainImage : (isCDNEnabled() ? getBestImageUrl(getBaseNameFromPath(mainImage), 800) : mainImage);
                        if (process.env.NODE_ENV === 'development' && p.id === "1") {
                          console.log(`🏠 Homepage card for ${p.title} - Original:`, mainImage, '→ Final:', finalSrc, '(CDN URL detected:', isCDNUrl, ')');
                        }
                        return finalSrc;
                      })()}
                      srcSet={(() => {
                        if (!p.gallery?.[0]?.url) return undefined;
                        const mainImage = p.gallery[0].url;
                        const isCDNUrl = mainImage.includes('digitaloceanspaces.com') || mainImage.includes(process.env.NEXT_PUBLIC_CDN_BASE || '');
                        return !isCDNUrl && isCDNEnabled() ? getImageSrcSet(getBaseNameFromPath(mainImage)) : undefined;
                      })()}
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      alt={p.name || p.title}
                      className={styles.productImage}
                      loading="lazy"
                      onLoad={() => {
                        if (process.env.NODE_ENV === 'development' && p.id === "1") {
                          console.log(`✅ Homepage card image for ${p.name || p.title} loaded successfully`);
                        }
                      }}
                      onError={(e) => {
                        if (process.env.NODE_ENV === 'development') {
                          console.error(`❌ Homepage card image for ${p.name || p.title} failed to load:`, e.currentTarget.src);
                        }
                        // Fallback to local image if CDN fails
                        const fallbackSrc = `/productsGallery/${p.id}/1.png`;
                        if (e.currentTarget.src !== window.location.origin + fallbackSrc) {
                          e.currentTarget.src = fallbackSrc;
                        }
                      }}
                    />
                  </Link>
                  <div className={styles.productCardWishlist}>
                    <WishlistButton
                      productId={p.id}
                      size="small"
                      variant="icon"
                    />
                  </div>
                </div>
                <Link href={`/products/${p.slug || p.id}`} className={styles.productCardLink}>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productTitle}>{p.name || p.title}</h3>
                    <div className={styles.productPrice}>{p.currency} {p.price.toFixed(2)}</div>
                    <p className={styles.productDescription}>{p.shortDescription || p.description}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 6) Testimonials */}
      <section className={`${styles.homeSection} ${styles.testimonials}`} aria-label={t('testimonials.title')}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>{t('testimonials.title')}</h2>
            <p className={styles.sectionSubtitle}>{t('testimonials.subtitle')}</p>
          </div>
          <div className={styles.testimonialsGrid}>
            <article className={styles.testimonialCard}>
              <div className={styles.testimonialHeader}>
                <div className={styles.customerInfo}>
                  <div className={styles.customerAvatar}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className={styles.customerDetails}>
                    <h4 className={styles.customerName}>J. Park</h4>
                    <div className={styles.starRating}>
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
                <div className={styles.reviewDate}>2 weeks ago</div>
              </div>
              <blockquote className={styles.testimonialContent}>
                <p>"Printed over a weekend, runs like a charm. The STL files are perfectly optimized and the assembly guide is crystal clear. My kids love driving it around!"</p>
              </blockquote>
              <div className={styles.testimonialFooter}>
                <span className={styles.productTag}>Tiger I Kit</span>
              </div>
            </article>

            <article className={styles.testimonialCard}>
              <div className={styles.testimonialHeader}>
                <div className={styles.customerInfo}>
                  <div className={styles.customerAvatar}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className={styles.customerDetails}>
                    <h4 className={styles.customerName}>A. Novak</h4>
                    <div className={styles.starRating}>
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
                <div className={styles.reviewDate}>1 month ago</div>
              </div>
              <blockquote className={styles.testimonialContent}>
                <p>"Clean STLs, no supports needed on my setup. The modular design makes it easy to customize and the electronics integration is seamless. Highly recommended!"</p>
              </blockquote>
              <div className={styles.testimonialFooter}>
                <span className={styles.productTag}>Sherman STL Bundle</span>
              </div>
            </article>

            <article className={styles.testimonialCard}>
              <div className={styles.testimonialHeader}>
                <div className={styles.customerInfo}>
                  <div className={styles.customerAvatar}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className={styles.customerDetails}>
                    <h4 className={styles.customerName}>M. Chen</h4>
                    <div className={styles.starRating}>
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
                <div className={styles.reviewDate}>3 weeks ago</div>
              </div>
              <blockquote className={styles.testimonialContent}>
                <p>"Amazing quality! The tracks work perfectly and the suspension system is incredibly realistic. Assembly took exactly as advertised - under 4 hours."</p>
              </blockquote>
              <div className={styles.testimonialFooter}>
                <span className={styles.productTag}>T-34 Kit</span>
              </div>
            </article>

            <article className={styles.testimonialCard}>
              <div className={styles.testimonialHeader}>
                <div className={styles.customerInfo}>
                  <div className={styles.customerAvatar}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className={styles.customerDetails}>
                    <h4 className={styles.customerName}>R. Schmidt</h4>
                    <div className={styles.starRating}>
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
                <div className={styles.reviewDate}>1 week ago</div>
              </div>
              <blockquote className={styles.testimonialContent}>
                <p>"The attention to detail is incredible. Every bolt and rivet is perfectly modeled. The controller range is impressive and the sound effects are spot on!"</p>
              </blockquote>
              <div className={styles.testimonialFooter}>
                <span className={styles.productTag}>Panther STL Bundle</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 7) Newsletter */}
      <section className={`${styles.homeSection} ${styles.newsletter}`} aria-label={t('newsletter.title')}>
        <div className={styles.container}>
          <div className={styles.newsletterContainer}>
            <div className={styles.newsletterContent}>
              <div className={styles.newsletterHeader}>
                <div className={styles.newsletterIcon}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className={styles.newsletterTitle}>{t('newsletter.title')}</h2>
                <p className={styles.newsletterDescription}>
                  {t('newsletter.description')}
                </p>
              </div>
              
              <div className={styles.newsletterBenefits}>
                <div className={styles.benefitItem}>
                  <div className={styles.benefitIcon}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>{t('newsletter.benefits.early_access')}</span>
                </div>
                <div className={styles.benefitItem}>
                  <div className={styles.benefitIcon}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>{t('newsletter.benefits.exclusive_guides')}</span>
                </div>
                <div className={styles.benefitItem}>
                  <div className={styles.benefitIcon}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>{t('newsletter.benefits.member_discounts')}</span>
                </div>
              </div>
            </div>
            
            <div className={styles.newsletterFormContainer}>
              <form className={styles.newsletterForm} onSubmit={(e) => { e.preventDefault(); setSubscribed(true); console.log('newsletter_subscribed'); }}>
                <div className={styles.formGroup}>
                  <label htmlFor="newsletter-email" className={styles.formLabel}>{t('newsletter.email_label')}</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      id="newsletter-email" 
                      name="email" 
                      type="email" 
                      required 
                      placeholder={t('newsletter.email_placeholder')} 
                      className={styles.newsletterInput}
                      aria-label={t('newsletter.subscribe_button')}
                    />
                    <button type="submit" className={styles.newsletterSubmit} aria-label={t('newsletter.subscribe_button')}>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p className={styles.formNote}>
                  {t('newsletter.privacy_note')}
                </p>
              </form>
              
              {subscribed && (
                <div className={styles.newsletterSuccess} role="status" aria-live="polite">
                  <div className={styles.successIcon}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className={styles.successContent}>
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
}