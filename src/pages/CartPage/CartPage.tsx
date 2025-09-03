import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/useCart';
import './CartPage.css';

const CartPage: React.FC = () => {
  const { items, removeFromCart, updateQuantity, getTotalItems, getTotalPrice } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => navigate('/checkout');
  const handleBackToShopping = () => navigate('/products');

  // Robustna mena (default EUR)
  const formatPrice = (amount: number, currency?: string) => {
    const code = currency || (items[0]?.product?.currency ?? 'EUR');
    try {
      return new Intl.NumberFormat('sk-SK', { style: 'currency', currency: code }).format(amount);
    } catch {
      // fallback ak pride custom mena
      const suffix = code === 'EUR' ? '€' : code;
      return `${amount.toFixed(2)} ${suffix}`;
    }
  };

  // Slovenske pluraly
  const skItemWord = (count: number) => (count === 1 ? 'položka' : (count >= 2 && count <= 4) ? 'položky' : 'položiek');
  const skPreparedWord = (count: number) => (count === 1 ? 'pripravená na objednanie' : 'pripravené na objednanie');

  const subtotal = getTotalPrice();
  const hasPhysicalProducts = items.some(i => i.product.productType === 'PHYSICAL');
  const shipping = items.length > 0 && hasPhysicalProducts ? 5.99 : 0;
  const total = subtotal + shipping;
  const isEmpty = items.length === 0;

  const onQty = (productId: string, next: number, isDigital: boolean) => {
    if (next < 1) return removeFromCart(productId);
    if (isDigital && next > 1) return; // digital max 1 ks
    updateQuantity(productId, next);
  };

  return (
    <div className="cart-page-container">
      <div className="container">
        <header className="header">
          <h1>Nákupný košík</h1>
          <p>
            {isEmpty
              ? 'Váš košík čaká na skvelé produkty!'
              : `${getTotalItems()} ${skItemWord(getTotalItems())} ${skPreparedWord(getTotalItems())}`}
          </p>
        </header>

        {isEmpty ? (
          <section className="cart-items" role="region" aria-labelledby="empty">
            <div className="empty-cart">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <circle cx="9" cy="21" r="1"/>
                <circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
              </svg>
              <h3 id="empty">Váš košík je prázdny</h3>
              <p>Objavte skvelé produkty a začnite nakupovať ešte dnes.</p>
              <a className="continue-shopping" onClick={handleBackToShopping} href="#stay"
                 aria-label="Pokračovať v nákupe">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M5 12l7 7m-7-7l7-7"/>
                </svg>
                Pokračovať v nákupe
              </a>
            </div>
          </section>
        ) : (
          <div className="cart-layout">
            {/* ITEMS */}
            <section className="cart-items" aria-label="Položky v košíku">
              {items.map(item => {
                const isDigital = item.product.productType === 'DIGITAL';
                const thumb = item.product.gallery?.[0];

                return (
                  <div key={item.product.id} className="cart-item">
                    <div className="item-image" aria-hidden="true">
                      {thumb ? (
                        <img src={thumb} alt={item.product.name}/>
                      ) : (
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2"/>
                          <path d="M3 9h18"/>
                          <path d="M9 21V9"/>
                        </svg>
                      )}
                    </div>

                    <div className="item-details">
                      <div className="item-name">{item.product.name}</div>

                      <div className="item-type" aria-label={isDigital ? 'Digitálny produkt' : 'Fyzický produkt'}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12.5L10 17.5L20 6.5"/>
                        </svg>
                        {isDigital ? 'DIGITAL' : 'PHYSICAL'}
                      </div>
                    </div>

                    <div className="item-price-section">
                      <div className="quantity-control" aria-label={`Upraviť množstvo pre ${item.product.name}`}>
                        <button
                          className="quantity-btn"
                          aria-label="Znížiť množstvo"
                          onClick={() => onQty(item.product.id, item.quantity - 1, isDigital)}
                          disabled={item.quantity <= 1}
                        >−</button>
                        <span className="quantity" aria-live="polite">{item.quantity}</span>
                        <button
                          className="quantity-btn"
                          aria-label="Zvýšiť množstvo"
                          onClick={() => onQty(item.product.id, item.quantity + 1, isDigital)}
                          disabled={isDigital && item.quantity >= 1}
                        >+</button>
                      </div>

                      <div className="item-price">
                        {formatPrice(item.product.price * item.quantity, item.product.currency)}
                      </div>

                      <button
                        className="remove-btn"
                        aria-label={`Odstrániť ${item.product.name}`}
                        onClick={() => removeFromCart(item.product.id)}
                        title="Odstrániť"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="6" y1="6" x2="18" y2="18" />
                          <line x1="6" y1="18" x2="18" y2="6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              <a className="continue-shopping" onClick={handleBackToShopping} href="#stay" aria-label="Pokračovať v nákupe">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M5 12l7 7m-7-7l7-7"/>
                </svg>
                Pokračovať v nákupe
              </a>
            </section>

            {/* SUMMARY */}
            <aside className="order-summary" aria-label="Súhrn objednávky">
              <h2 className="summary-title">Súhrn objednávky</h2>

              <div className="summary-row">
                <span>Medzisúčet ({getTotalItems()} {skItemWord(getTotalItems())})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {hasPhysicalProducts ? (
                <div className="summary-row">
                  <span>Doprava</span>
                  <span>{shipping > 0 ? formatPrice(shipping) : 'Zdarma'}</span>
                </div>
              ) : (
                <div className="delivery-info">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13"/>
                    <path d="M16 8h4l3 3v5h-7V8z"/>
                    <circle cx="5.5" cy="18.5" r="2.5"/>
                    <circle cx="18.5" cy="18.5" r="2.5"/>
                  </svg>
                  <span>Digitálny produkt - doručený emailom</span>
                </div>
              )}

              <div className="summary-row total">
                <span>Celkom</span>
                <span>{formatPrice(total)}</span>
              </div>

              <button className="checkout-btn" onClick={handleCheckout}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                Prejsť k platbe
              </button>

              <div className="secure-text">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="10" rx="2"/>
                  <path d="M12 11V7a5 5 0 010-10"/>
                </svg>
                Zabezpečená platba
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;