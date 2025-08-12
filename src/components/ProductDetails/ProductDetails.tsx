import React, { useState } from 'react';
import { type Product } from '../../data/productData';
import { useCart } from '../../context/useCart';
import './ProductDetails.css';

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [expandedSections, setExpandedSections] = useState<{
    features: boolean;
    interaction: boolean;
  }>({
    features: false,
    interaction: false,
  });
  
  const handleAddToCart = () => {
    addToCart(product);
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