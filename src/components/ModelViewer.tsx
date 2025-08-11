import React, {useEffect, useRef, useState} from 'react';
// Import the model-viewer web component
import '@google/model-viewer';
// Import the Slider component
import Slider from './Slider/Slider';
// Import CSS
import './ModelViewer.css';

// Use the ModelViewerElement interface from global.d.ts
declare global {
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
}

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
    onFullscreenChange?: (isFullscreen: boolean) => void;
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
                                                     onFullscreenChange,
                                                     ...otherProps
                                                 }) => {
    const modelViewerRef = useRef<ModelViewerElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(fullscreen);
    const [metalness, setMetalness] = useState(typeof metallicFactor === 'string' ? parseFloat(metallicFactor) : metallicFactor);
    const [roughness, setRoughness] = useState(typeof roughnessFactor === 'string' ? parseFloat(roughnessFactor) : roughnessFactor);
    const [exposureValue, setExposureValue] = useState(typeof exposure === 'string' ? parseFloat(exposure) : exposure);
    
    // Function to update both metalness and roughness directly on the model materials
    const updateMaterialProps = (m: number, r: number) => {
        const el = modelViewerRef.current;
        if (el && el.model) {
            el.model.materials.forEach((mat: {
                pbrMetallicRoughness: {
                    setMetallicFactor: (value: number) => void;
                    setRoughnessFactor: (value: number) => void;
                }
            }) => {
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
    
    // Handle exposure slider change
    const handleExposureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setExposureValue(v);
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
                if (onFullscreenChange) {
                    onFullscreenChange(false);
                }
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
    }, [isFullscreen, metalness, roughness, exposureValue]);
    
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
    
    // Effect to update exposure when the exposure prop changes
    useEffect(() => {
        const newValue = typeof exposure === 'string' ? parseFloat(exposure) : exposure;
        setExposureValue(newValue);
    }, [exposure]);

    // Update isFullscreen when fullscreen prop changes
    useEffect(() => {
        setIsFullscreen(fullscreen);
    }, [fullscreen]);

    const toggleFullscreen = () => {
        const newFullscreenState = !isFullscreen;
        setIsFullscreen(newFullscreenState);
        if (onFullscreenChange) {
            onFullscreenChange(newFullscreenState);
        }
    };

    const containerStyle = isFullscreen ? {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 3000,
        backgroundColor: 'black',
    } : {
        width,
        height,
    };

    return (
        <div className={`model-viewer-container${isFullscreen ? ' fullscreen' : ''}`} style={containerStyle}>
            {React.createElement('model-viewer', {
                ref: modelViewerRef,
                src: modelPath,
                alt: alt,
                poster: poster,
                'camera-controls': cameraControls,
                'auto-rotate': autoRotate,
                ar: ar,
                'environment-image': environmentImage,
                exposure: exposureValue,
                'shadow-intensity': shadowIntensity,
                'shadow-softness': shadowSoftness,
                'field-of-view': fieldOfView,
                'tone-mapping': toneMapping,
                'metallic-factor': metalness,
                'roughness-factor': roughness,
                ...otherProps,
                className: "model-viewer",
                style: { backgroundColor }
            })}
            
            {/* Material controls */}
            <div className="controls-container">
                {/* Metalness slider */}
                <Slider
                    id="metalness-slider"
                    label="Metalness"
                    value={metalness}
                    min="0"
                    max="1"
                    step="0.01"
                    onChange={handleMetalChange}
                />
                
                {/* Roughness slider */}
                <Slider
                    id="roughness-slider"
                    label="Roughness"
                    value={roughness}
                    min="0"
                    max="1"
                    step="0.01"
                    onChange={handleRoughChange}
                />
                
                {/* Exposure slider */}
                <Slider
                    id="exposure-slider"
                    label="Exposure"
                    value={exposureValue}
                    min="0"
                    max="2"
                    step="0.01"
                    onChange={handleExposureChange}
                />
            </div>
            
            {isFullscreen && (
                <button 
                    onClick={toggleFullscreen}
                    className="fullscreen-button"
                >
                    Exit Fullscreen
                </button>
            )}
        </div>
    );
};

export default ModelViewer;