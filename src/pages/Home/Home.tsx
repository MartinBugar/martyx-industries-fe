import React, { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../../data/productData';
import './Home.css';

// Lazy chunks (loaded on intersection)
const Interactive3D = lazy(() => import('../../components/home/Interactive3D'));
const VideoDemo = lazy(() => import('../../components/home/VideoDemo'));

const Home: React.FC = () => {
  const featured = useMemo(() => products.slice(0, 6), []);

  // Intersection visibility for lazy sections
  const threeRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLDivElement | null>(null);
  const [show3D, setShow3D] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === threeRef.current) setShow3D(true);
          if (entry.target === videoRef.current) setShowVideo(true);
        }
      });
    }, { root: null, rootMargin: '200px 0px', threshold: 0.1 });

    if (threeRef.current) obs.observe(threeRef.current);
    if (videoRef.current) obs.observe(videoRef.current);
    return () => obs.disconnect();
  }, []);

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
          <form className="newsletter-form" onSubmit={(e) => { e.preventDefault(); setSubscribed(true); console.log('newsletter_subscribed'); }}>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input id="email" name="email" type="email" required placeholder="you@example.com" aria-label="Email address" />
            <button type="submit" className="btn btn-accent">Subscribe</button>
          </form>
          {subscribed && (
            <p className="newsletter-success" role="status" aria-live="polite">Thanks! You’re subscribed.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;