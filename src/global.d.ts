import React from 'react';

// Define the ModelViewerElement interface for use with refs
interface ModelViewerElement extends HTMLElement {
  model?: {
    materials: Array<{
      pbrMetallicRoughness: {
        setMetallicFactor: (value: number) => void;
        setRoughnessFactor: (value: number) => void;
      }
    }>;
  };
  getCameraOrbit?: () => string;
}

// Define ModelViewerJSX interface for the model-viewer element props
interface ModelViewerJSX {
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
  exposure?: string | number;
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
  'metallic-factor'?: string | number;
  'roughness-factor'?: string | number;
  'variant-name'?: string;
  'with-credentials'?: boolean;
  ref?: React.Ref<ModelViewerElement>;
  className?: string;
  style?: React.CSSProperties;
}

// Extend the JSX namespace to include model-viewer
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & ModelViewerJSX,
        HTMLElement
      >;
    }
  }
  
  interface Window {
    gtag?: (...args: any[]) => void;
    __I18N_MISSING_KEYS?: Set<string>;
    __i18nDebug?: {
      getMissingKeys: () => string[];
      clearMissingKeys: () => void;
      changeLanguage: (lang: string) => Promise<void>;
      currentLanguage: () => string;
      supportedLanguages: () => string[];
      loadedNamespaces: () => string[];
    };
  }
}