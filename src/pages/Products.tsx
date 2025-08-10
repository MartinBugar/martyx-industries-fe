import React from 'react';
import { products, type Product } from '../data/productData';
import { useCart } from '../context/useCart';
import './Pages.css';

const Products: React.FC = () => {
  const { addToCart } = useCart();

  const handleAdd = (p: Product) => () => addToCart(p);

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="page-container products-page">
      <h1>Our Products</h1>

      <div className="products-intro">
        <p>
          Explore our collection of high-quality 3D models and products.
          Each item is designed with precision—clean, minimal, and user-friendly.
        </p>
      </div>

      <section aria-label="Product catalog" className="products-grid">
        {products.map((p) => (
          <article key={p.id} className="product-card">
            <div className="card-media" aria-hidden="true">
              {/* Minimal visual placeholder aligned with site style */}
              <div className="poster-placeholder">3D</div>
            </div>
            <div className="card-body">
              <h3 className="card-title">{p.name}</h3>
              <p className="card-price">{formatPrice(p.price)}</p>
              <p className="card-desc">{p.description}</p>
              <div className="card-actions">
                <button className="add-to-cart-btn" onClick={handleAdd(p)}>Add to Cart</button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default Products;