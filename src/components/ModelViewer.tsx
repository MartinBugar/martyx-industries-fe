import React, { useEffect, useRef } from 'react';
import '@google/model-viewer';

// Declare the model-viewer element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src: string;
          alt?: string;
          poster?: string;
          loading?: 'auto' | 'lazy' | 'eager';
          reveal?: 'auto' | 'interaction' | 'manual';
          'camera-controls'?: boolean;
          'auto-rotate'?: boolean;
          ar?: boolean;
          'ar-modes'?: string;
          'ar-scale'?: 'auto' | 'fixed';
          'environment-image'?: string;
          exposure?: string;
          'shadow-intensity'?: string;
          'shadow-softness'?: string;
          'animation-name'?: string;
          'animation-crossfade-duration'?: string;
          'field-of-view'?: string;
          'max-camera-orbit'?: string;
          'min-camera-orbit'?: string;
          'camera-orbit'?: string;
          'camera-target'?: string;
          'bounds'?: string;
          'disable-zoom'?: boolean;
          'disable-pan'?: boolean;
          'disable-tap'?: boolean;
          'touch-action'?: string;
          'interaction-prompt'?: 'auto' | 'when-focused' | 'none';
          'interaction-prompt-style'?: 'basic' | 'wiggle';
          'interaction-prompt-threshold'?: string;
          'orbit-sensitivity'?: string;
          'rotation-sensitivity'?: string;
          'scale'?: string;
          'skybox-image'?: string;
          'tone-mapping'?: 'auto' | 'commerce' | 'filmic' | 'neutral' | 'legacy';
          'variant-name'?: string;
          'with-credentials'?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

interface ModelViewerProps {
  modelPath: string;
  alt?: string;
  poster?: string;
  cameraControls?: boolean;
  autoRotate?: boolean;
  ar?: boolean;
  environmentImage?: string;
  exposure?: string;
  shadowIntensity?: string;
  shadowSoftness?: string;
  fieldOfView?: string;
  width?: string;
  height?: string;
  backgroundColor?: string;
}

const ModelViewer: React.FC<ModelViewerProps> = ({
  modelPath,
  alt = 'A 3D model',
  poster,
  cameraControls = true,
  autoRotate = false,
  ar = false,
  environmentImage = 'neutral',
  exposure = '1',
  shadowIntensity = '1',
  shadowSoftness = '1',
  fieldOfView = 'auto',
  width = '100%',
  height = '400px',
  backgroundColor = '#f5f5f5',
}) => {
  const modelViewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // You can add any initialization logic here if needed
    if (modelViewerRef.current) {
      // Example: Add event listeners or configure the model-viewer
      modelViewerRef.current.addEventListener('load', () => {
        console.log('Model loaded successfully');
      });
    }

    return () => {
      // Cleanup if needed
      if (modelViewerRef.current) {
        modelViewerRef.current.removeEventListener('load', () => {
          console.log('Model loaded successfully');
        });
      }
    };
  }, []);

  return (
    <div style={{ width, height }}>
      <model-viewer
        ref={modelViewerRef}
        src={modelPath}
        alt={alt}
        poster={poster}
        camera-controls={cameraControls}
        auto-rotate={autoRotate}
        ar={ar}
        environment-image={environmentImage}
        exposure={exposure}
        shadow-intensity={shadowIntensity}
        shadow-softness={shadowSoftness}
        field-of-view={fieldOfView}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor,
        }}
      ></model-viewer>
    </div>
  );
};

export default ModelViewer;