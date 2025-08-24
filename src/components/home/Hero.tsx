import { Link } from "react-router-dom";
import './Hero.css';

export default function Hero() {

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
          <div className="hero-img-wrap">
            <img 
              src="/assets/hero-tank.png" 
              alt="MartyX RC tank" 
              className="hero-tank-image"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
