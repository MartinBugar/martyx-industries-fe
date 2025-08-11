import React, { useState } from 'react';
import { product, type Product } from '../data/productData';
import { useCart } from '../context/useCart';
import BottomSheet from '../components/BottomSheet/BottomSheet';
import './Pages.css';

const Products: React.FC = () => {
  const { addToCart } = useCart();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const productsList: Product[] = [product];

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

      {/* Mobile Filters Trigger */}
      <div className="products-toolbar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="add-to-cart-btn" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog" aria-expanded={filtersOpen}>
          Filters
        </button>
      </div>

      <section aria-label="Product catalog" className="products-grid">
        {productsList.map((p) => (
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

      <BottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        {/* Example filters UI - minimal/no-op for now */}
        <form style={{ display: 'grid', gap: 12 }} onSubmit={(e) => e.preventDefault()}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Sort by</span>
            <select defaultValue="relevance">
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            <span>Max price</span>
            <input type="number" min={0} placeholder="$" />
          </label>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="add-to-cart-btn" onClick={() => setFiltersOpen(false)}>Apply</button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
};

export default Products;