'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Gallery from '../Gallery/Gallery';

// Dynamic import ModelViewer with SSR disabled
const ModelViewer = dynamic(() => import('../ModelViewer/ModelViewer'), {
  ssr: false,
  loading: () => <div className={styles['model-viewer-loading']}>Loading 3D Model...</div>
});
import { type Product } from '../../lib/types/product';
import styles from './ProductView.module.css';

interface ProductViewProps {
  product: Product;
}

const ProductView: React.FC<ProductViewProps> = ({ product }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Get model viewer settings from product or use defaults
  const settings = product.modelViewerSettings || {};

  return (
    <div className={styles['product-view-container']}>
      {/* Model container with ModelViewer */}
      <div className={styles['model-container']}>
        {product.modelPath ? (
          <ModelViewer 
            modelPath={product.modelPath}
            alt={`A 3D model of ${product.name}`}
            poster={settings?.poster}
            camera-orbit={settings?.cameraOrbit}
            touch-action={settings?.touchAction}
            cameraControls={settings?.cameraControls}
            autoRotate={settings?.autoRotate}
            interaction-prompt={settings?.interactionPrompt}
            shadowIntensity={settings?.shadowIntensity}
            exposure={settings?.exposure}
            environment-image={settings?.environmentImage}
            shadow-softness={settings?.shadowSoftness}
            toneMapping={settings?.toneMapping}
            metallicFactor={settings?.metallicFactor}
            roughnessFactor={settings?.roughnessFactor}
            height={settings?.height}
            fullscreen={isFullscreen}
            onFullscreenChange={setIsFullscreen}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#9ca3af',
            fontSize: '0.875rem'
          }}>
            No 3D model available
          </div>
        )}
      </div>

      {/* Product Gallery */}
      <div id="gallery" className={styles['product-gallery-section']}>
        <Gallery productName={product.name} images={product.gallery} />
      </div>
    </div>
  );
};

export default ProductView;
