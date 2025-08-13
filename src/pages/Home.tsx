import React from 'react';
import { products } from '../data/productData';
import ProductView from '../components/ProductView/ProductView';
import ProductDetails from '../components/ProductDetails/ProductDetails';
import './Pages.css';

const Home: React.FC = () => {
  const product = products.find(p => p.id === "1") ?? products[0];
  return (
    <div className="page-container home-page">
      
      <div className="product-container">
        <ProductView product={product} />
        <ProductDetails product={product} />
      </div>

      <section className="hero-section" aria-label="Martyx Industries Hero">
        <div className="hero-video">
          <iframe
            src="https://www.youtube-nocookie.com/embed/bXxOCo0VL1Y"
            title="Martyx Industries Intro Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </section>
    </div>
  );
};

export default Home;