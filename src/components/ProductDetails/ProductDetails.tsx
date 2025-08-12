import React, { useState } from 'react';
import { type Product } from '../../data/productData';
import { useCart } from '../../context/useCart';
import './ProductDetails.css';

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const { addToCart, items } = useCart();
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'warning'>('success');
  const [expandedSections, setExpandedSections] = useState<{
    features: boolean;
    interaction: boolean;
  }>({
    features: false,
    interaction: false,
  });
  
  const handleAddToCart = () => {
    // Check if this is a digital product and if it's already in the cart
    if (product.productType === 'DIGITAL') {
      const existingItem = items.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Digital product already in cart - show warning
        setPopupMessage('Only one digital product is allowed in the cart');
        setPopupType('warning');
        setShowPopup(true);
        
        // Hide popup after 3 seconds
        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
        return;
      }
    }
    
    // Add product to cart and show success message
    addToCart(product);
    setPopupMessage(`${product.name} added to cart!`);
    setPopupType('success');
    setShowPopup(true);
    
    // Hide popup after 3 seconds
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);
  };

  const toggleSection = (section: 'features' | 'interaction') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  return (
    <div id="details" className="product-details">
      {/* Header Section */}
      <div className="product-header">
        <h2>{product.name}</h2>
        <div className="product-type">{product.productType}</div>
        <div className="price">${product.price.toFixed(2)}</div>
      </div>

      {/* Description */}
      <div className="product-description">
        <p>{product.description}</p>
      </div>

      {/* Features Section - Collapsible */}
      <div className="product-section">
        <button 
          className="section-toggle"
          onClick={() => toggleSection('features')}
          aria-expanded={expandedSections.features}
        >
          <span>Features</span>
          <span className="toggle-icon">{expandedSections.features ? '−' : '+'}</span>
        </button>
        <div className={`section-content ${expandedSections.features ? 'expanded' : ''}`}>
          <ul className="features-list">
            {product.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interaction Section - Collapsible */}
      <div className="product-section">
        <button 
          className="section-toggle"
          onClick={() => toggleSection('interaction')}
          aria-expanded={expandedSections.interaction}
        >
          <span>3D Model Controls</span>
          <span className="toggle-icon">{expandedSections.interaction ? '−' : '+'}</span>
        </button>
        <div className={`section-content ${expandedSections.interaction ? 'expanded' : ''}`}>
          <ul className="interaction-list">
            {product.interactionInstructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Popup Message - appears above the button */}
      {showPopup && (
        <div className={`popup-message ${popupType}`}>
          <div className="popup-content">
            <span className="popup-icon">
              {popupType === 'success' ? '✓' : '⚠'}
            </span>
            <span className="popup-text">{popupMessage}</span>
            <button 
              className="popup-close"
              onClick={() => setShowPopup(false)}
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <button 
        className="add-to-cart-btn"
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductDetails;