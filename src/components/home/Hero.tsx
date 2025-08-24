import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  // Ensure the model-viewer web component is registered on the client
  useEffect(() => {
    import("@google/model-viewer").catch((err) => {
      console.warn("Model Viewer failed to load", err);
    });
  }, []);

  return (
    <section className="section" aria-labelledby="hero-title">
      <div className="hero">
        <div>
          <h1 id="hero-title" className="hero-title">RC Tank Kits & STL Files</h1>
          <p className="hero-sub">Build. Print. Command.</p>
          <div className="hero-cta">
            <Link className="btn primary" to="/shop/kits">Shop Kits</Link>
            <Link className="btn" to="/stl-files">Download STL</Link>
          </div>
          <ul className="hero-kpis">
            <li>Assembly under 4h (prototype)</li>
            <li>Optimized for 0.1mm layers</li>
            <li>Modular electronics ready</li>
          </ul>
        </div>
        <div className="hero-visual">
          <div className="hero-img-wrap viewer-wrap">
            {React.createElement('model-viewer', {
              src: '/assets/demo.glb',
              poster: '/assets/demo-poster.jpg',
              alt: 'MartyX RC tank 3D model',
              'camera-controls': true,
              'auto-rotate': true,
              exposure: 1,
              'shadow-intensity': 1,
              'environment-image': 'neutral',
              style: { width: '100%', height: '100%' }
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
