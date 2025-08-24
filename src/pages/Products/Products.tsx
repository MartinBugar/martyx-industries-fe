import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { product, type Product } from '../data/productData';
import { useCart } from '../context/useCart';
import './Products/Products.css';

const Products: React.FC = () => {
  const { addToCart } = useCart();
  const productsList: Product[] = [product];

  type Popup = { visible: boolean; message: string; variant: 'success' | 'warning' };
  const [popups, setPopups] = useState<Record<string, Popup>>({});
  const timersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      // cleanup all timers on unmount
      Object.values(timersRef.current).forEach(id => window.clearTimeout(id));
      timersRef.current = {};
    };
  }, []);

  const handleAdd = (p: Product) => () => {
    const status = addToCart(p);
    const isLimit = status === 'limit';
    const message = isLimit ? 'Only 1 piece of this product is allowed in cart' : 'Product was added to cart';
    const variant: Popup['variant'] = isLimit ? 'warning' : 'success';

    setPopups(prev => ({ ...prev, [p.id]: { visible: true, message, variant } }));

    const existing = timersRef.current[p.id];
    if (existing) window.clearTimeout(existing);

    timersRef.current[p.id] = window.setTimeout(() => {
      setPopups(prev => ({ ...prev, [p.id]: { ...(prev[p.id] || { message: '', variant: 'success' }), visible: false } }));
      delete timersRef.current[p.id];
    }, 2000);
  };

  const formatPrice = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="page-container products-page">
      <section aria-label="Product catalog" className="products-grid">
        {productsList.map((p) => {
          const mainImage = p.gallery && p.gallery.length > 0 ? p.gallery[0] : undefined;
          return (
            <article key={p.id} className="product-card">
              <Link to={`/products/${p.id}`} className="card-link" aria-label={`View details for ${p.name}`}>
                <div className="card-media" aria-hidden="true">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={`${p.name} - main image`}
                      className="card-image"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    // Minimal visual placeholder aligned with site style
                    <div className="poster-placeholder">3D</div>
                  )}
                </div>
                <div className="card-body">
                  <h3 className="card-title">{p.name}</h3>
                  <p className="card-price">{formatPrice(p.price)}</p>
                  <p className="card-desc">{p.description}</p>
                </div>
              </Link>
              <div className="card-actions">
                <button
                  className={`add-to-cart-btn${popups[p.id]?.visible ? ` is-popup ${popups[p.id].variant}` : ''}`}
                  onClick={handleAdd(p)}
                  disabled={!!popups[p.id]?.visible}
                  aria-live="polite"
                >
                  {popups[p.id]?.visible ? popups[p.id].message : 'Add to Cart'}
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};

export default Products;