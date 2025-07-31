import React, { useState } from 'react';
import ModelViewer from '../ModelViewer';
import { type Product, defaultModelViewerSettings } from '../../data/productData';
import './ProductView.css';

interface ProductViewProps {
  product: Product;
}

const ProductView: React.FC<ProductViewProps> = ({ product }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="model-container">
      <ModelViewer 
        modelPath={product.modelPath}
        alt={`A 3D model of ${product.name}`}
        poster={defaultModelViewerSettings.poster}
        camera-orbit={defaultModelViewerSettings.cameraOrbit}
        touch-action={defaultModelViewerSettings.touchAction}
        cameraControls={defaultModelViewerSettings.cameraControls}
        autoRotate={defaultModelViewerSettings.autoRotate}
        interaction-prompt={defaultModelViewerSettings.interactionPrompt}
        shadowIntensity={defaultModelViewerSettings.shadowIntensity}
        exposure={defaultModelViewerSettings.exposure}
        environment-image={defaultModelViewerSettings.environmentImage}
        shadow-softness={defaultModelViewerSettings.shadowSoftness}
        toneMapping={defaultModelViewerSettings.toneMapping}
        metallicFactor={defaultModelViewerSettings.metallicFactor}
        roughnessFactor={defaultModelViewerSettings.roughnessFactor}
        height={defaultModelViewerSettings.height}
        fullscreen={isFullscreen}
      />
      <button 
        className="fullscreen-btn"
        onClick={toggleFullscreen}
      >
        {isFullscreen ? 'Exit Fullscreen' : 'View in Fullscreen'}
      </button>
    </div>
  );
};

export default ProductView;