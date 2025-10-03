'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import WishlistButton from '@/components/WishlistButton/WishlistButton';
import NewsletterForm from '@/components/NewsletterForm';
import OptimizedImage from '@/components/OptimizedImage';
import { getFeaturedProducts } from '@/lib/api';
import { getImageSrcSet, getBestImageUrl, getBaseNameFromPath, isCDNEnabled } from '@/utils/cdnImages';
import styles from './home.module.css';

interface Product {
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

export default function Home() {
  const { t, i18n } = useTranslation('home');
  const [products, setProducts] = useState<Product[]>([]);
  const featured = useMemo(() => products.slice(0, 6), [products]);

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

  // Try to import hero image via bundler; fallback to CSS placeholder if not present
  const heroAlt = t('hero.image_alt');
  const heroSrc = '/assets/home/tank.png';

  return (
    <div className={styles.homeRoot} aria-label="Home Page">
      {/* Hero Section */}
      <section className={styles.heroSection} aria-label="Hero">
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.heroContentWrapper}>
                <div className={styles.heroMascotContainer}>
                  <OptimizedImage
                    src="/cassandra/Home-Cass.png"
                    srcSet="/cassandra/Home-Cass.png 1x, /cassandra/Home-Cass.png 2x"
                    sizes="(max-width: 360px) 160px, (max-width: 480px) 200px, (max-width: 768px) 260px, 320px"
                    alt="Cassandra - Váš 3D sprievodca"
                    className={styles.mascotImageHome}
                    width={400}
                    height={400}
                    priority
                    loading="eager"
                    decoding="sync"
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
              <OptimizedImage
                src={heroSrc}
                alt={heroAlt}
                width={1800}
                height={1000}
                priority
                loading="eager"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  borderRadius: 'var(--radius-lg)',
                  userSelect: 'none'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howSection} aria-label={t('how_it_works.title')}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>{t('how_it_works.title')}</h2>
          </div>
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

      {/* Featured Products */}
      <section className={`${styles.homeSection} ${styles.featuredSection}`} aria-label={t('featured.title')}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>{t('featured.title')}</h2>
            <div style={{textAlign: 'center', marginTop: '1rem'}}>
              <Link className={`${styles.btn} ${styles.btnAccent}`} href="/products">
                {t('featured.view_all')}
              </Link>
            </div>
          </div>
          <div className={styles.featuredGrid}>
            {featured.map((p) => (
              <article key={p.id} className={styles.productCard}>
                <div className={styles.productCardImageContainer}>
                  <Link href={`/products/${p.slug || p.id}`} className={styles.productCardLink}>
                    <OptimizedImage
                      src={(() => {
                        const mainImage = p.gallery?.[0]?.url || '/assets/kit-01.png';
                        const isCDNUrl = mainImage.includes('digitaloceanspaces.com') || mainImage.includes(process.env.NEXT_PUBLIC_CDN_BASE || '');
                        return !isCDNUrl && isCDNEnabled() ? getBestImageUrl(getBaseNameFromPath(mainImage), 400) : mainImage;
                      })()}
                      srcSet={(() => {
                        const mainImage = p.gallery?.[0]?.url || '/assets/kit-01.png';
                        const isCDNUrl = mainImage.includes('digitaloceanspaces.com') || mainImage.includes(process.env.NEXT_PUBLIC_CDN_BASE || '');
                        return !isCDNUrl && isCDNEnabled() ? getImageSrcSet(getBaseNameFromPath(mainImage)) : undefined;
                      })()}
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      alt={`${p.title} - main image`}
                      className={styles.productImage}
                      width={400}
                      height={400}
                      loading="lazy"
                      decoding="async"
                      onLoad={() => {
                        if (process.env.NODE_ENV === 'development' && p.id === "1") {
                          console.log(`✅ Product card image for ${p.title} loaded successfully`);
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
                    <h3 className={styles.productTitle}>{p.title}</h3>
                    <div className={styles.productPrice}>{p.currency} {p.price.toFixed(2)}</div>
                    <p className={styles.productDescription}>{p.shortDescription || p.description}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
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
                <div className={styles.reviewDate}>{t('testimonials.time_ago.weeks_2')}</div>
              </div>
              <blockquote className={styles.testimonialContent}>
                <p>&quot;{t('testimonials.review_1')}&quot;</p>
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
                <div className={styles.reviewDate}>{t('testimonials.time_ago.month_1')}</div>
              </div>
              <blockquote className={styles.testimonialContent}>
                <p>&quot;{t('testimonials.review_2')}&quot;</p>
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
                <div className={styles.reviewDate}>{t('testimonials.time_ago.weeks_3')}</div>
              </div>
              <blockquote className={styles.testimonialContent}>
                <p>&quot;{t('testimonials.review_3')}&quot;</p>
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
                <div className={styles.reviewDate}>{t('testimonials.time_ago.week_1')}</div>
              </div>
              <blockquote className={styles.testimonialContent}>
                <p>&quot;{t('testimonials.review_4')}&quot;</p>
              </blockquote>
              <div className={styles.testimonialFooter}>
                <span className={styles.productTag}>Panther STL Bundle</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Newsletter */}
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

            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}
