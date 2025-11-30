import React, { useState, Suspense } from 'react';
// Lazy load ModelViewer to reduce initial bundle size (Three.js is heavy)
const ModelViewer = React.lazy(() => import('../ModelViewer'));
import Gallery from '../Gallery/Gallery';
import { type Product, defaultModelViewerSettings } from '../../data/productData';
import './ProductView.css';

// Loading fallback for 3D model viewer
const ModelViewerFallback: React.FC = () => (
  <div className="model-viewer-loading-fallback">
    <div className="loading-spinner-3d">
      <div className="spinner-cube">
        <div className="cube-face front"></div>
        <div className="cube-face back"></div>
        <div className="cube-face left"></div>
        <div className="cube-face right"></div>
        <div className="cube-face top"></div>
        <div className="cube-face bottom"></div>
      </div>
    </div>
    <p className="loading-text">Loading 3D Viewer...</p>
  </div>
);

interface ProductViewProps {
  product: Product;
  galleryData?: Array<{ url: string; thumbnailUrl?: string }>;
}

const ProductView: React.FC<ProductViewProps> = ({ product, galleryData }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);


  const settings = product.masterProductId === 1 ? defaultModelViewerSettings : (product.modelViewerSettings ?? {});

  return (
    <div className="product-view-container">
      <div className="model-container">
        <Suspense fallback={<ModelViewerFallback />}>
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
        </Suspense>
      </div>

      {/*/!* Toolbar below model *!/*/}
      {/*<div className="model-toolbar" aria-label="Model actions">*/}
      {/*  <button */}
      {/*    className="fullscreen-btn"*/}
      {/*    onClick={() => setIsFullscreen(!isFullscreen)}*/}
      {/*    aria-pressed={isFullscreen}*/}
      {/*    aria-label={isFullscreen ? 'Exit fullscreen' : 'View in fullscreen'}*/}
      {/*  >*/}
      {/*    {isFullscreen ? 'Exit Fullscreen' : 'View in Fullscreen'}*/}
      {/*  </button>*/}
      {/*</div>*/}

      {/* Product Gallery */}
      <div id="gallery" className="product-gallery-section">
        <Gallery productName={product.name} images={product.gallery} galleryData={galleryData} />
      </div>
    </div>
  );
};

export default ProductView;