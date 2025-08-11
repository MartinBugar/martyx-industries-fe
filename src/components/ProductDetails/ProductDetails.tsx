import React from 'react';
import { type Product } from '../../data/productData';
import { useCart } from '../../context/useCart';
import './ProductDetails.css';

interface ProductDetailsProps {
  product: Product;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const { addToCart } = useCart();
  
  const handleAddToCart = () => {
    addToCart(product);
  };
  
  return (
    <div className="product-details">
      <h2>{product.name}</h2>
      <div className="product-type">{product.productType}</div>
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
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductDetails;