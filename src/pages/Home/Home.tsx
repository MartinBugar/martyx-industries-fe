import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../../data/productData';
import './Home.css';

const Home: React.FC = () => {
  const featured = useMemo(() => products.slice(0, 6), []);

  const [subscribed, setSubscribed] = useState(false);

  // Try to import hero image via bundler; fallback to CSS placeholder if not present
  const heroAlt = 'RC Tank Kits & STL Files — product hero image';
  const heroMap = import.meta.glob('../../assets/home/tank.png', { eager: true, as: 'url' });
  const heroSrc = (heroMap['../../assets/home/tank.png'] as string) || '/assets/hero-tank.png';

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
              <h1 className="hero-title">RC Tank Kits & STL Files</h1>
              <p className="hero-sub">Build. Print. Command.</p>
              <div className="hero-ctas">
                <Link to="/products" className="btn btn-accent" onClick={() => console.log('hero_shop_kits_click')}>Shop Kits</Link>
                <Link to="/products" className="btn btn-outline" onClick={() => console.log('hero_download_stl_click')}>Download STL</Link>
              </div>
              <ul className="hero-kpis" aria-label="Key product facts">
                <li>Assembly under 4h (prototype)</li>
                <li>Optimized for 0.1 mm layers</li>
                <li>Modular electronics ready</li>
              </ul>
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
                  style={{ 
                    width: '100%', 
                    height: 'auto', 
                    display: 'block', 
                    borderRadius: 'var(--radius-lg)',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none'
                  }}
                />
              ) : (
                <div className="hero-image" role="img" aria-label={heroAlt} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2) How it works */}
      <section className="how-section" aria-label="How it works">
        <div className="container">
          <div className="section-header"><h2>How it works</h2></div>
          <div className="how-grid">
            <article className="how-card">
              <span className="how-step">Step 1</span>
              <h3>Choose</h3>
              <p>Pick a Kit or STL bundle.</p>
            </article>
            <article className="how-card">
              <span className="how-step">Step 2</span>
              <h3>Build or Print</h3>
              <p>Assemble or 3D print.</p>
            </article>
            <article className="how-card">
              <span className="how-step">Step 3</span>
              <h3>Drive</h3>
              <p>Pair controller & enjoy.</p>
            </article>
          </div>
        </div>
      </section>

      {/* 3) Featured */}
      <section className="home-section featured-section" aria-label="Featured products">
        <div className="container">
          <div className="section-header">
            <h2>Featured Products</h2>
            <div style={{textAlign: 'center', marginTop: '1rem'}}>
              <Link className="btn primary" to="/products">View All Products</Link>
            </div>
          </div>
          <div className="featured-grid">
            {featured.map((p) => (
              <article key={p.id} className="product-card">
                <Link to={`/products/${p.id}`} className="product-card-link">
                  <img 
                    src={p.gallery?.[0] || '/assets/kit-01.png'} 
                    alt={p.name}
                    className="product-image"
                    loading="lazy"
                  />
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
      <section className="home-section testimonials" aria-label="Customer Reviews">
        <div className="container">
          <div className="section-header">
            <h2>What Our Customers Say</h2>
            <p className="section-subtitle">Real feedback from RC tank enthusiasts</p>
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
      <section className="home-section newsletter" aria-label="Newsletter subscribe">
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
                <h2 className="newsletter-title">Stay in the Loop</h2>
                <p className="newsletter-description">
                  Get exclusive access to new tank models, 3D printing tips, and special offers. 
                  Join our community of RC enthusiasts!
                </p>
              </div>
              
              <div className="newsletter-benefits">
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Early access to new releases</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Exclusive 3D printing guides</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span>Member-only discounts</span>
                </div>
              </div>
            </div>
            
            <div className="newsletter-form-container">
              <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); setSubscribed(true); console.log('newsletter_subscribed'); }}>
                <div className="form-group">
                  <label htmlFor="newsletter-email" className="form-label">Email address</label>
                  <div className="input-wrapper">
                    <input 
                      id="newsletter-email" 
                      name="email" 
                      type="email" 
                      required 
                      placeholder="Enter your email" 
                      className="newsletter-input"
                      aria-label="Email address for newsletter subscription"
                    />
                    <button type="submit" className="newsletter-submit" aria-label="Subscribe to newsletter">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="form-note">
                  🔒 We respect your privacy. Unsubscribe at any time.
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
                    <h3>Welcome aboard! 🎉</h3>
                    <p>You're now subscribed to our newsletter. Check your email for a welcome message.</p>
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