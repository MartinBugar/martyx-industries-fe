import React from 'react';
import { product } from '../data/productData';
import ProductView from '../components/ProductView/ProductView';
import ProductDetails from '../components/ProductDetails/ProductDetails';
import './Pages.css';

const Products: React.FC = () => {
  return (
    <div className="page-container products-page">
      <h1>Our Products</h1>
      
      <div className="products-intro">
        <p>
          Explore our collection of high-quality 3D models and products.
          Each product is meticulously designed to meet the highest standards.
        </p>
      </div>
      
      <div className="featured-product">
        <h2>Featured Product</h2>
        <div className="product-container">
          <ProductView product={product} />
          <ProductDetails product={product} />
        </div>
      </div>
      
      {/* More products can be added here in the future */}
      <div className="more-products">
        <h2>More Products Coming Soon</h2>
        <p>
          We're constantly working on new products. Check back soon for more additions to our catalog.
        </p>
      </div>
    </div>
  );
};

export default Products;