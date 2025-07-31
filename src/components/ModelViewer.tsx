import React, {useEffect, useRef, useState} from 'react';
// Import the model-viewer web component
import '@google/model-viewer';

// Type declarations for model-viewer are in src/model-viewer.d.ts

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
    toneMapping?: 'auto' | 'commerce' | 'filmic' | 'neutral' | 'legacy';
    fullscreen?: boolean;
    // Additional props that might be passed directly to model-viewer
    'camera-orbit'?: string;
    'touch-action'?: string;
    'camera-target'?: string;
    'max-camera-orbit'?: string;
    'min-camera-orbit'?: string;
    'interaction-prompt'?: 'auto' | 'when-focused' | 'none';
    'interaction-prompt-style'?: 'basic' | 'wiggle';
}

const ModelViewer: React.FC<ModelViewerProps> = ({
                                                     modelPath,
                                                     alt = 'A 3D model',
                                                     poster,
                                                     cameraControls = true,
                                                     autoRotate = false,
                                                     ar = false,
                                                     environmentImage = 'legacy',
                                                     exposure = '2.0',
                                                     shadowIntensity = '1.5',
                                                     shadowSoftness = '0.8',
                                                     fieldOfView = 'auto',
                                                     width = '100%',
                                                     height = '400px',
                                                     backgroundColor = '#111111',
                                                     toneMapping = 'filmic',
                                                     fullscreen = false,
                                                     ...otherProps
                                                 }) => {
    const modelViewerRef = useRef<HTMLElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(fullscreen);

    useEffect(() => {
        // You can add any initialization logic here if needed
        if (modelViewerRef.current) {
            // Example: Add event listeners or configure the model-viewer
            modelViewerRef.current.addEventListener('load', () => {
                console.log('Model loaded successfully');
            });
        }

        // Add event listener for ESC key to exit fullscreen
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        
        document.addEventListener('keydown', handleEscKey);

        return () => {
            // Cleanup if needed
            if (modelViewerRef.current) {
                modelViewerRef.current.removeEventListener('load', () => {
                    console.log('Model loaded successfully');
                });
            }
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isFullscreen]);

    // Update isFullscreen when fullscreen prop changes
    useEffect(() => {
        setIsFullscreen(fullscreen);
    }, [fullscreen]);

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const containerStyle = isFullscreen ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1000,
        backgroundColor: 'black',
    } : {
        width,
        height,
    };

    return (
        <div style={containerStyle}>
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
                tone-mapping={toneMapping}
                {...otherProps}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor,
                }}
            ></model-viewer>
            <button 
                onClick={toggleFullscreen}
                style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    zIndex: 1001,
                    padding: '8px 12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }}
            >
                {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
        </div>
    );
};

export default ModelViewer;