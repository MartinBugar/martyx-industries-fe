import React, { useState, useEffect, Suspense } from 'react';
// Lazy load ModelViewer to reduce initial bundle size (Three.js is heavy)
const ModelViewer = React.lazy(() => import('../ModelViewer'));
import Gallery from '../Gallery/Gallery';
import { ConfiguratorPreview } from '../Configurator';
import { type Product, defaultModelViewerSettings } from '../../data/productData';
import { systemSettingsService } from '../../services/systemSettingsService';
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
  configuratorEnabled?: boolean;
}

const ProductView: React.FC<ProductViewProps> = ({ product, galleryData, configuratorEnabled }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [globalAutoRotate, setGlobalAutoRotate] = useState<boolean | null>(null);

  // Fetch global 3D model settings on mount (only needed when configurator is disabled)
  useEffect(() => {
    if (configuratorEnabled) return; // Skip if using configurator

    const fetchDisplaySettings = async () => {
      try {
        const displaySettings = await systemSettingsService.get3DModelSettings();
        setGlobalAutoRotate(displaySettings.autoRotate);
      } catch {
        // Default to false if API fails
        setGlobalAutoRotate(false);
      }
    };
    fetchDisplaySettings();
  }, [configuratorEnabled]);

  const settings = product.masterProductId === 1 ? defaultModelViewerSettings : (product.modelViewerSettings ?? {});

  // Use global setting if available, otherwise fall back to product-specific setting
  const effectiveAutoRotate = globalAutoRotate !== null ? globalAutoRotate : (settings?.autoRotate ?? false);

  return (
    <div className="product-view-container">
      <div className="model-container">
        {/* Show ConfiguratorPreview when configurator is enabled, otherwise show ModelViewer */}
        {configuratorEnabled ? (
          <ConfiguratorPreview />
        ) : (
          <Suspense fallback={<ModelViewerFallback />}>
            <ModelViewer
              modelPath={product.modelPath}
              alt={`A 3D model of ${product.name}`}
              poster={settings?.poster}
              camera-orbit={settings?.cameraOrbit}
              touch-action={settings?.touchAction}
              cameraControls={settings?.cameraControls}
              autoRotate={effectiveAutoRotate}
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
        )}
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