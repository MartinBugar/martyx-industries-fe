import React from 'react';
import { type Product } from '../../data/productData';
import './ProductDetails.css';

interface ProductDetailsProps {
  product: Product;
  onAddToCart: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onAddToCart }) => {
  return (
    <div className="product-details">
      <h2>{product.name}</h2>
      <div className="price">${product.price.toFixed(2)}</div>
      <p className="description">{product.description}</p>
      
      <h3>Features:</h3>
      <ul className="features-list">
        {product.features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      
      <div className="interaction-info">
        <h3>Interact with the 3D Model:</h3>
        <ul>
          {product.interactionInstructions.map((instruction, index) => (
            <li key={index}>{instruction}</li>
          ))}
        </ul>
      </div>
      
      <button 
        className="add-to-cart-btn"
        onClick={onAddToCart}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductDetails;