import React from 'react';

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
          'variant-name'?: string;
          'with-credentials'?: boolean;
        },
        HTMLElement
      >;
    }
  }
}