import React from 'react';
import { useParams } from 'react-router-dom';
import { product as defaultProduct, products } from '../data/productData';
import ProductView from '../components/ProductView/ProductView';
import ProductDetails from '../components/ProductDetails/ProductDetails';
import './Pages.css';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const selected = products.find(p => p.id === id) ?? defaultProduct;

  return (
    <div className="page-container product-detail-page">
      <div className="product-container">
        <div className="product-main-content">
          <ProductView product={selected} />
        </div>
        
        <div className="product-sidebar">
          <ProductDetails product={selected} />
        </div>

        <nav className="product-bookmarks" aria-label="Product sections">
          <a href="#gallery">Gallery</a>
          <a href="#details">Details</a>
          <a href="#features">Features</a>
          <a href="#interaction">Interaction</a>
        </nav>
      </div>
    </div>
  );
};

export default ProductDetail;
