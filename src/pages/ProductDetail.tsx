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
        <ProductView product={selected} />
        <ProductDetails product={selected} />

        <nav className="product-bookmarks" aria-label="Product sections">
          <a href="#Details">Details</a>
          <a href="#Download">Download</a>
          <a href="#Features">Features</a>
          <a href="#Reviews">Reviews</a>
        </nav>
      </div>
    </div>
  );
};

export default ProductDetail;
