import React, { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react';
import { products } from '../data/productData';
import './Pages.css';

// Lazy chunks (loaded on intersection)
const Interactive3D = lazy(() => import('../components/home/Interactive3D'));
const VideoDemo = lazy(() => import('../components/home/VideoDemo'));

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
  const heroMap = import.meta.glob('../assets/home/hero-tank.png', { eager: true, as: 'url' });
  const heroSrc = (heroMap['../assets/home/hero-tank.png'] as string) || '';

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
      <section className="home-section hero" aria-label="Hero">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-copy">
              <h1 className="hero-title">RC Tank Kits & STL Files</h1>
              <p className="hero-sub">Build. Print. Command.</p>
              <div className="hero-ctas">
                <a className="btn btn-accent" href="/products" onClick={() => console.log('hero_shop_kits_click')}>Shop Kits</a>
                <a className="btn btn-outline" href="/products" onClick={() => console.log('hero_download_stl_click')}>Download STL</a>
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
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'var(--radius-lg)' }}
                />
              ) : (
                <div className="hero-image" role="img" aria-label={heroAlt} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2) How it works */}
      <section className="home-section how" aria-label="How it works">
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
      <section className="home-section featured" aria-label="Featured products">
        <div className="container">
          <div className="section-header row">
            <h2>Featured</h2>
            <a className="btn btn-soft" href="/products">View all</a>
          </div>
          <div className="featured-grid">
            {featured.map((p) => (
              <article key={p.id} className="product-card">
                <div className="media aspect-16-9" aria-hidden="true" />
                <div className="product-body">
                  <div className="row">
                    <strong className="name">{p.name}</strong>
                    <span className="price">{p.currency} {p.price.toFixed(2)}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 4) Interactive 3D (lazy) */}
      <section ref={threeRef} className="home-section three" aria-label="Interactive 3D">
        <div className="container">
          {show3D ? (
            <Suspense fallback={<div className="lazy-box" aria-label="Loading 3D preview" />}> 
              <Interactive3D 
                modelUrl={products[0]?.modelPath}
                onLoaded={() => console.log('interactive_3d_loaded')}
              />
            </Suspense>
          ) : (
            <div className="lazy-box" aria-label="3D preview placeholder" />
          )}
        </div>
      </section>

      {/* 5) Video Demo (lazy) */}
      <section ref={videoRef} className="home-section video" aria-label="Video Demo">
        <div className="container">
          {showVideo ? (
            <Suspense fallback={<div className="lazy-box" aria-label="Loading video" />}> 
              <VideoDemo />
            </Suspense>
          ) : (
            <div className="lazy-box" aria-label="Video placeholder" />
          )}
        </div>
      </section>

      {/* 6) Testimonials */}
      <section className="home-section testimonials" aria-label="Testimonials">
        <div className="container">
          <div className="testimonials-grid">
            <blockquote className="quote">
              <p>“Printed over a weekend, runs like a charm.”</p>
              <footer>— J. Park</footer>
            </blockquote>
            <blockquote className="quote">
              <p>“Clean STLs, no supports needed on my setup.”</p>
              <footer>— A. N.</footer>
            </blockquote>
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