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
    exposure?: string | number;
    shadowIntensity?: string;
    shadowSoftness?: string;
    fieldOfView?: string;
    width?: string;
    height?: string;
    backgroundColor?: string;
    toneMapping?: 'auto' | 'commerce' | 'filmic' | 'neutral' | 'legacy';
    metallicFactor?: string | number;
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
                                                     exposure = '0.1',
                                                     shadowIntensity = '1.8',
                                                     shadowSoftness = '0.8',
                                                     fieldOfView = 'auto',
                                                     width = '100%',
                                                     height = '400px',
                                                     backgroundColor = 'white',
                                                     toneMapping = 'neutral',
                                                     metallicFactor = '0.5',
                                                     fullscreen = false,
                                                     ...otherProps
                                                 }) => {
    const modelViewerRef = useRef<HTMLElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(fullscreen);

    useEffect(() => {
        // Define event handlers outside to ensure the same reference is used for cleanup
        const handleModelLoad = () => {
            console.log('Model loaded successfully');
        };
        
        // Handler for camera-change to log rotation position
        const handleCameraChange = () => {
            if (modelViewerRef.current) {
                // Get the current camera orbit (rotation position)
                const cameraOrbit = modelViewerRef.current.getCameraOrbit 
                    ? modelViewerRef.current.getCameraOrbit() 
                    : modelViewerRef.current.getAttribute('camera-orbit');
                
                console.log('Current rotation position:', cameraOrbit);
            }
        };
        
        // Add event listener for ESC key to exit fullscreen
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            }
        };
        
        // Add event listeners
        if (modelViewerRef.current) {
            modelViewerRef.current.addEventListener('load', handleModelLoad);
            modelViewerRef.current.addEventListener('camera-change', handleCameraChange);
            
            // Log initial camera position
            const initialCameraOrbit = modelViewerRef.current.getAttribute('camera-orbit');
            console.log('Initial camera position:', initialCameraOrbit);
        }
        
        document.addEventListener('keydown', handleEscKey);

        return () => {
            // Cleanup event listeners using the same function references
            if (modelViewerRef.current) {
                modelViewerRef.current.removeEventListener('load', handleModelLoad);
                modelViewerRef.current.removeEventListener('camera-change', handleCameraChange);
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
                metallic-factor={metallicFactor}
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