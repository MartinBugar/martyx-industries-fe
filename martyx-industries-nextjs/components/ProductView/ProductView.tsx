'use client';

import React, { useState } from 'react';
import Gallery from '../Gallery/Gallery';
import { type Product } from '../../lib/types/product';
import styles from './ProductView.module.css';

interface ProductViewProps {
  product: Product;
}

const ProductView: React.FC<ProductViewProps> = ({ product }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Note: ModelViewer is skipped for now (3D rendering is complex)
  // We're using Gallery only as per requirements

  return (
    <div className={styles['product-view-container']}>
      {/* Model container - placeholder for future ModelViewer integration */}
      <div className={styles['model-container']}>
        {/* TODO: Integrate ModelViewer when ready */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#9ca3af',
          fontSize: '0.875rem'
        }}>
          3D Model Viewer - To be integrated
        </div>
      </div>

      {/* Product Gallery */}
      <div id="gallery" className={styles['product-gallery-section']}>
        <Gallery productName={product.name} images={product.gallery} />
      </div>
    </div>
  );
};

export default ProductView;
