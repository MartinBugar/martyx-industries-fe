import React, { useEffect, useRef, useState } from 'react';
import { type Product } from '../../data/productData';
import { useCart } from '../../context/useCart';
import './ProductDetails.css';

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const { addToCart } = useCart();

  const [popup, setPopup] = useState<{ visible: boolean; message: string; variant: 'success' | 'warning' }>({
    visible: false,
    message: '',
    variant: 'success'
  });
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  const handleAddToCart = () => {
    const status = addToCart(product);
    const isLimit = status === 'limit';
    const message = isLimit ? 'Only 1 piece of this product is allowed in cart' : 'Product was added to cart';
    const variant = isLimit ? 'warning' : 'success';

    setPopup({ visible: true, message, variant });
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      setPopup(p => ({ ...p, visible: false }));
    }, 2000);
  };
  
  return (
    <div id="details" className="product-details">
      <h2>{product.name}</h2>
      <div className="product-type">{product.productType === 'DIGITAL' ? 'DIGITAL PRODUCT' : (product.productType === 'PHYSICAL' ? 'PHYSICAL PRODUCT' : product.productType)}</div>
      <div className="price">${product.price.toFixed(2)}</div>
      <p className="description">{product.description}</p>
      
      <h3 id="features">Features:</h3>
      <ul className="features-list">
        {product.features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>

      
      <button 
        className={`add-to-cart-btn${popup.visible ? ` is-popup ${popup.variant}` : ''}`}
        onClick={handleAddToCart}
        disabled={popup.visible}
        aria-live="polite"
      >
        {popup.visible ? popup.message : 'Add to Cart'}
      </button>
    </div>
  );
};

export default ProductDetails;