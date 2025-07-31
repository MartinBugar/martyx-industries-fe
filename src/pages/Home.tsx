import React from 'react';
import { product } from '../data/productData';
import ProductView from '../components/ProductView/ProductView';
import ProductDetails from '../components/ProductDetails/ProductDetails';
import './Pages.css';

const Home: React.FC = () => {
  return (
    <div className="page-container home-page">
      {/*<div className="hero-section">*/}
      {/*  <h1>Welcome to Martyx Industries</h1>*/}
      {/*  <p>Explore our premium 3D products</p>*/}
      {/*</div>*/}
      
      <div className="product-container">
        <ProductView product={product} />
        <ProductDetails product={product} />
      </div>
    </div>
  );
};

export default Home;