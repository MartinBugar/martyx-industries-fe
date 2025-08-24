import React, { useEffect, useRef } from 'react';
import '@google/model-viewer';

interface Interactive3DProps {
  modelUrl?: string;
  onLoaded?: () => void;
}

const Interactive3D: React.FC<Interactive3DProps> = ({ modelUrl, onLoaded }) => {
  const ref = useRef<HTMLElement | null>(null);

  // Optional poster import (will be empty until asset exists)
  const posterMap = import.meta.glob('../../assets/home/demo-poster.jpg', { eager: true, as: 'url' });
  const poster = (posterMap['../../assets/home/demo-poster.jpg'] as string) || undefined;

  useEffect(() => {
    const el = ref.current as HTMLElement | null;
    if (!el) return;
    const handler = () => { onLoaded?.(); };
    el.addEventListener('load', handler as EventListener);
    return () => el.removeEventListener('load', handler as EventListener);
  }, [onLoaded]);

  const props: Record<string, unknown> = {
    ref: (node: HTMLElement | null) => { ref.current = node; },
    src: modelUrl,
    alt: 'Interactive 3D model preview',
    style: { width: '100%', height: '420px', borderRadius: 'var(--radius-lg)', background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 32%, var(--background) 100%)' },
    'camera-controls': true,
    exposure: '0.4',
    'shadow-intensity': '1.2',
    'tone-mapping': 'neutral',
    'environment-image': 'legacy',
    poster,
    'disable-zoom': false,
    'interaction-prompt': 'none',
  };

  // Use React.createElement to avoid JSX intrinsic element typing for custom element
  return React.createElement('model-viewer', props);
};

export default Interactive3D;
