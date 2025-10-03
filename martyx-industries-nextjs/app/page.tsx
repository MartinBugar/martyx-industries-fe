import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import WishlistButton from '@/components/WishlistButton/WishlistButton';
import NewsletterForm from '@/components/NewsletterForm';
import styles from './home.module.css';

// ISR Configuration
export const revalidate = 300;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  gallery: string[];
}

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/v1/products`, {
      next: {
        revalidate: 300,
        tags: ['home', 'products']
      },
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data.slice(0, 6) : [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export default async function Home() {
  const products = await getFeaturedProducts();
  const featured = products.slice(0, 6);

  return (
    <div className={styles.homeRoot} aria-label="Home Page">
      {/* Hero Section */}
      <section className={styles.heroSection} aria-label="Hero">
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <div className={styles.heroContentWrapper}>
                <div className={styles.heroMascotContainer}>
                  <Image
                    src="/cassandra/Home-Cass.png"
                    alt="Cassandra - Váš 3D sprievodca"
                    className={styles.mascotImageHome}
                    width={400}
                    height={400}
                    priority
                  />
                </div>
                <div className={styles.heroTextContent}>
                  <h1 className={styles.heroTitle}>Premium 3D-Printed RC Models & STL Files</h1>
                  <p className={styles.heroSub}>
                    Professional-grade RC tanks and vehicles. Download STL files or order complete kits with electronics.
                  </p>
                  <div className={styles.heroCtas}>
                    <Link href="/products" className={`${styles.btn} ${styles.btnAccent}`}>
                      Shop Kits
                    </Link>
                    <Link href="/products" className={`${styles.btn} ${styles.btnOutline}`}>
                      Download STL
                    </Link>
                  </div>
                  <ul className={styles.heroKpis} aria-label="Key Features">
                    <li>Assembly in 3-4 hours</li>
                    <li>Optimized for layer adhesion</li>
                    <li>Electronics-ready design</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <Image
                src="/assets/home/tank.png"
                alt="Featured RC Tank Model"
                width={1800}
                height={1000}
                priority
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
      <section className={styles.howSection} aria-label="How It Works">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>How It Works</h2>
          </div>
          <div className={styles.howGrid}>
            <article className={styles.howCard}>
              <span className={styles.howStep}>Step 1</span>
              <h3>Choose Your Model</h3>
              <p>Browse our collection of optimized 3D models. Each design is tested and ready for printing.</p>
            </article>
            <article className={styles.howCard}>
              <span className={styles.howStep}>Step 2</span>
              <h3>Download or Order</h3>
              <p>Get instant access to STL files or order a complete kit with all electronics included.</p>
            </article>
            <article className={styles.howCard}>
              <span className={styles.howStep}>Step 3</span>
              <h3>Build & Enjoy</h3>
              <p>Follow our detailed assembly guide and start driving your RC model in just a few hours.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className={`${styles.homeSection} ${styles.featuredSection}`} aria-label="Featured Products">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Featured Products</h2>
            <div style={{textAlign: 'center', marginTop: '1rem'}}>
              <Link className={`${styles.btn} ${styles.btnAccent}`} href="/products">
                View All
              </Link>
            </div>
          </div>
          <div className={styles.featuredGrid}>
            {featured.map((p) => (
              <article key={p.id} className={styles.productCard}>
                <div className={styles.productCardImageContainer}>
                  <Link href={`/products/${p.id}`} className={styles.productCardLink}>
                    <Image
                      src={p.gallery?.[0] || '/assets/kit-01.png'}
                      alt={p.name}
                      className={styles.productImage}
                      width={400}
                      height={400}
                      loading="lazy"
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
                <Link href={`/products/${p.id}`} className={styles.productCardLink}>
                  <div className={styles.productInfo}>
                    <h3 className={styles.productTitle}>{p.name}</h3>
                    <div className={styles.productPrice}>{p.currency} {p.price.toFixed(2)}</div>
                    <p className={styles.productDescription}>{p.description}</p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`${styles.homeSection} ${styles.testimonials}`} aria-label="Customer Reviews">
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>What Our Customers Say</h2>
            <p className={styles.sectionSubtitle}>Real feedback from RC enthusiasts worldwide</p>
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
                <p>&quot;Printed over a weekend, runs like a charm. The STL files are perfectly optimized and the assembly guide is crystal clear. My kids love driving it around!&quot;</p>
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
                <p>&quot;Clean STLs, no supports needed on my setup. The modular design makes it easy to customize and the electronics integration is seamless. Highly recommended!&quot;</p>
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
                <p>&quot;Amazing quality! The tracks work perfectly and the suspension system is incredibly realistic. Assembly took exactly as advertised - under 4 hours.&quot;</p>
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
                <p>&quot;The attention to detail is incredible. Every bolt and rivet is perfectly modeled. The controller range is impressive and the sound effects are spot on!&quot;</p>
              </blockquote>
              <div className={styles.testimonialFooter}>
                <span className={styles.productTag}>Panther STL Bundle</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className={`${styles.homeSection} ${styles.newsletter}`} aria-label="Newsletter Signup">
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
                <h2 className={styles.newsletterTitle}>Stay in the Loop</h2>
                <p className={styles.newsletterDescription}>
                  Get exclusive updates, new model releases, and special discounts delivered to your inbox.
                </p>
              </div>

              <div className={styles.newsletterBenefits}>
                <div className={styles.benefitItem}>
                  <div className={styles.benefitIcon}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Early access to new models</span>
                </div>
                <div className={styles.benefitItem}>
                  <div className={styles.benefitIcon}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Exclusive printing guides & tips</span>
                </div>
                <div className={styles.benefitItem}>
                  <div className={styles.benefitIcon}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Members-only discounts</span>
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
