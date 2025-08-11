import React, { useState } from 'react';
import ModelViewer from '../ModelViewer';
import Gallery from '../Gallery/Gallery';
import { type Product, defaultModelViewerSettings } from '../../data/productData';
import './ProductView.css';

interface ProductViewProps {
  product: Product;
}

const ProductView: React.FC<ProductViewProps> = ({ product }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);


  const settings = product.id === '1' ? defaultModelViewerSettings : (product.modelViewerSettings ?? {});

  return (
    <div className="product-view-container">
      <div className="model-container">
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
      </div>

      {/* Toolbar below model */}
      <div className="model-toolbar" aria-label="Model actions">
        <button 
          className="fullscreen-btn"
          onClick={() => setIsFullscreen(!isFullscreen)}
          aria-pressed={isFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'View in fullscreen'}
        >
          {isFullscreen ? 'Exit Fullscreen' : 'View in Fullscreen'}
        </button>
      </div>
      
      {/* Product Gallery */}
      <div id="gallery" className="product-gallery-section">
        <Gallery productName={product.name} images={product.gallery} />
      </div>
    </div>
  );
};

export default ProductView;