import React, {useEffect, useRef, useState} from 'react';
// Import the model-viewer web component
import '@google/model-viewer';

// Extend the HTMLElement interface to include model-viewer specific properties
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
    roughnessFactor?: string | number;
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
                                                     metallicFactor = '0.28',
                                                     roughnessFactor = '0.36',
                                                     fullscreen = false,
                                                     ...otherProps
                                                 }) => {
    const modelViewerRef = useRef<ModelViewerElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(fullscreen);
    const [metalness, setMetalness] = useState(typeof metallicFactor === 'string' ? parseFloat(metallicFactor) : metallicFactor);
    const [roughness, setRoughness] = useState(typeof roughnessFactor === 'string' ? parseFloat(roughnessFactor) : roughnessFactor);
    
    // Function to update both metalness and roughness directly on the model materials
    const updateMaterialProps = (m: number, r: number) => {
        const el = modelViewerRef.current;
        if (el && el.model) {
            el.model.materials.forEach((mat) => {
                // Set metalness
                mat.pbrMetallicRoughness.setMetallicFactor(m);
                // Set roughness
                mat.pbrMetallicRoughness.setRoughnessFactor(r);
            });
        }
    };
    
    // Handle metalness slider change
    const handleMetalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setMetalness(v);
        updateMaterialProps(v, roughness);
    };
    
    // Handle roughness slider change
    const handleRoughChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setRoughness(v);
        updateMaterialProps(metalness, v);
    };

    // Effect for model event listeners
    useEffect(() => {
        // Define event handlers outside to ensure the same reference is used for cleanup
        const handleModelLoad = () => {
            console.log('Model loaded successfully');
            // Apply metalness and roughness when model is loaded
            updateMaterialProps(metalness, roughness);
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
    }, [isFullscreen, metalness, roughness]);
    
    // Effect to update metalness when the metallicFactor prop changes
    useEffect(() => {
        const newValue = typeof metallicFactor === 'string' ? parseFloat(metallicFactor) : metallicFactor;
        setMetalness(newValue);
    }, [metallicFactor]);
    
    // Effect to update roughness when the roughnessFactor prop changes
    useEffect(() => {
        const newValue = typeof roughnessFactor === 'string' ? parseFloat(roughnessFactor) : roughnessFactor;
        setRoughness(newValue);
    }, [roughnessFactor]);

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
                metallic-factor={metalness}
                roughness-factor={roughness}
                {...otherProps}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor,
                }}
            ></model-viewer>
            
            {/* Material controls */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '50px',
                    left: '10px',
                    zIndex: 1001,
                    padding: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '12px',
                }}
            >
                {/* Metalness slider */}
                <div style={{ marginBottom: '0px' }}>
                    <label htmlFor="metalness-slider">
                        Metalness: {metalness.toFixed(2)}
                        <input
                            id="metalness-slider"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={metalness}
                            onChange={handleMetalChange}
                            style={{
                                width: '150px',
                                display: 'block',
                                marginTop: '5px'
                            }}
                        />
                    </label>
                </div>
                
                {/* Roughness slider */}
                <div style={{ marginBottom: '0px' }}>
                    <label htmlFor="roughness-slider">
                        Roughness: {roughness.toFixed(2)}
                        <input
                            id="roughness-slider"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={roughness}
                            onChange={handleRoughChange}
                            style={{
                                width: '150px',
                                display: 'block',
                                marginTop: '5px'
                            }}
                        />
                    </label>
                </div>
            </div>
            
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