import React, {useEffect, useRef, useState} from 'react';
// Import the model-viewer web component
import '@google/model-viewer';
// Import the Slider component
import Slider from './Slider/Slider';
// Import CSS
import './ModelViewer.css';
import { logInfo, logWarn } from '../services/logger';

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
        getCameraOrbit?: () => { radius: number; theta: number; phi: number };
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
                                                     backgroundColor = 'white',
                                                     toneMapping = 'neutral',
                                                     metallicFactor = '0.41',
                                                     roughnessFactor = '0.36',
                                                     fullscreen = false,
                                                     onFullscreenChange,
                                                     ...otherProps
                                                 }) => {
    const modelViewerRef = useRef<ModelViewerElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(fullscreen);
    const [isLoading, setIsLoading] = useState(true);
    const [metalness, setMetalness] = useState(typeof metallicFactor === 'string' ? parseFloat(metallicFactor) : metallicFactor);
    const [roughness, setRoughness] = useState(typeof roughnessFactor === 'string' ? parseFloat(roughnessFactor) : roughnessFactor);
    const [exposureValue, setExposureValue] = useState(typeof exposure === 'string' ? parseFloat(exposure) : exposure);
    
    // Function to update both metalness and roughness directly on the model materials
    const updateMaterialProps = async (m: number, r: number) => {
        const el = modelViewerRef.current;

        if (el && el.model) {
            const materials = el.model.materials;
            if (!materials || materials.length === 0) {
                return;
            }

            // Process materials with proper error handling
            for (let index = 0; index < materials.length; index++) {
                const mat = materials[index];
                try {
                    // Ensure material is loaded before setting properties
                    if (mat && typeof (mat as any).ensureLoaded === 'function') {
                        await (mat as any).ensureLoaded();
                    }

                    // Check if material has PBR properties
                    if (mat && mat.pbrMetallicRoughness) {
                        // Set metalness if method exists
                        if (typeof mat.pbrMetallicRoughness.setMetallicFactor === 'function') {
                            mat.pbrMetallicRoughness.setMetallicFactor(m);
                        }
                        // Set roughness if method exists
                        if (typeof mat.pbrMetallicRoughness.setRoughnessFactor === 'function') {
                            mat.pbrMetallicRoughness.setRoughnessFactor(r);
                        }
                    }
                } catch (error) {
                    // Silently skip materials that can't be loaded or configured
                    // This prevents console spam while allowing other materials to work
                    if (import.meta.env.DEV) {
                        logWarn(`Skipping material ${index}: not loaded or incompatible`);
                    }
                }
            }
        }
    };
    
    // Handle metalness slider change
    const handleMetalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setMetalness(v);

        // Set via HTML attribute as backup
        const el = modelViewerRef.current;
        if (el) {
            el.setAttribute('metallic-factor', v.toString());
        }

        updateMaterialProps(v, roughness).catch(() => {
            // Ignore errors - already handled in updateMaterialProps
        });
    };

    // Handle roughness slider change
    const handleRoughChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setRoughness(v);

        // Set via HTML attribute as backup
        const el = modelViewerRef.current;
        if (el) {
            el.setAttribute('roughness-factor', v.toString());
        }

        updateMaterialProps(metalness, v).catch(() => {
            // Ignore errors - already handled in updateMaterialProps
        });
    };
    
    // Handle exposure slider change
    const handleExposureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = parseFloat(e.target.value);
        setExposureValue(v);
    };

    // Effect for model event listeners
    useEffect(() => {
        const modelElement = modelViewerRef.current;
        if (!modelElement) return;

        // Define event handlers outside to ensure the same reference is used for cleanup
        const handleModelLoad = () => {
            if (import.meta.env.DEV) {
                logInfo('Model loaded successfully');
            }

            // Hide loading indicator
            setIsLoading(false);

            // Auto-adjust to desired zoom radius (works in both dev and production)
            setTimeout(() => {
                    const modelElementWithOrbit = modelElement as ModelViewerElement & { getCameraOrbit?: () => { radius: number } };
                    if (modelElementWithOrbit.getCameraOrbit) {
                        const cameraOrbit = modelElementWithOrbit.getCameraOrbit();
                        const currentRadius = cameraOrbit.radius;
                        const targetRadius = 1.3369;

                        if (import.meta.env.DEV) {
                            logInfo('Initial zoom radius:', currentRadius.toFixed(4));
                        }

                        if (Math.abs(currentRadius - targetRadius) > 0.01) {
                            // Calculate how many scroll steps we need (zoom in)
                            const radiusDiff = currentRadius - targetRadius;
                            const steps = Math.round(radiusDiff / 0.02); // Approximate step size

                            if (import.meta.env.DEV) {
                                logInfo(`Auto-scrolling ${steps} steps to reach target radius ${targetRadius.toFixed(4)}`);
                            }

                            // Try accessing model-viewer's internal zoom methods
                            const modelViewer = modelElement as ModelViewerElement & { zoom?: (factor: number) => void };

                            if (import.meta.env.DEV) {
                                // Look for internal zoom/camera methods
                                logInfo('Available methods:', Object.getOwnPropertyNames(modelViewer).filter(name =>
                                    name.toLowerCase().includes('zoom') ||
                                    name.toLowerCase().includes('camera') ||
                                    name.toLowerCase().includes('orbit')
                                ));
                            }

                            // Use the zoom method we know works
                            if (typeof modelViewer.zoom === 'function') {
                                if (import.meta.env.DEV) {
                                    logInfo('Using zoom method');
                                }

                                // Calculate zoom factor based on radius difference
                                // Current: 1.4938 → Target: 1.3369
                                // zoom(targetRadius) gave 1.4587, so we need more zoom
                                const currentToTarget = targetRadius / currentRadius;
                                const zoomFactor = currentToTarget * 7; // 3x more zoom than before (was 2x, now 6x)

                                if (import.meta.env.DEV) {
                                    logInfo(`Zoom factor: ${zoomFactor.toFixed(4)}`);
                                }

                                try {
                                    modelViewer.zoom(zoomFactor);
                                    if (import.meta.env.DEV) {
                                        logInfo('Zoom method executed successfully');
                                    }
                                } catch (e) {
                                    if (import.meta.env.DEV) {
                                        logInfo('Zoom method failed:', (e as Error).message);
                                    }
                                }
                            } else {
                                if (import.meta.env.DEV) {
                                    logInfo('Zoom method not available');
                                }
                            }


                            // Always verify final result
                            setTimeout(() => {
                                const finalOrbit = modelElementWithOrbit.getCameraOrbit?.();
                                if (finalOrbit && import.meta.env.DEV) {
                                    logInfo('Final zoom radius after method attempt:', finalOrbit.radius.toFixed(4));
                                }
                            }, 200);
                        }
                    }
                }, 500); // Longer delay to ensure model is fully loaded

            // Apply metalness and roughness when model is loaded with a slight delay
            setTimeout(() => {
                updateMaterialProps(metalness, roughness).catch(() => {
                    // Ignore errors - already handled in updateMaterialProps
                });
            }, 100);
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

        // Add event listener for wheel/scroll to log zoom changes
        const handleWheel = (event: WheelEvent) => {
            // Use setTimeout to log after the zoom change has been applied
            setTimeout(() => {
                // Use getCameraOrbit method to get actual current zoom radius
                const modelElementWithOrbit = modelElement as ModelViewerElement & { getCameraOrbit?: () => { radius: number } };
                if (modelElementWithOrbit.getCameraOrbit) {
                    const cameraOrbit = modelElementWithOrbit.getCameraOrbit();
                    const radius = cameraOrbit.radius;
                    const direction = event.deltaY > 0 ? 'zoom out' : 'zoom in';

                    logInfo(`Current zoom radius: ${radius.toFixed(4)} (${direction})`);
                } else {
                    logInfo('getCameraOrbit method not available');
                }
            }, 50);
        };
        
        // Add event listeners
        modelElement.addEventListener('load', handleModelLoad);
        modelElement.addEventListener('wheel', handleWheel);
        document.addEventListener('keydown', handleEscKey);

        if (import.meta.env.DEV) {
            // Log initial camera position only in dev
            const initialCameraOrbit = modelElement.getAttribute('camera-orbit');
            logInfo('Initial camera position:', initialCameraOrbit);
        }

        return () => {
            // Cleanup event listeners using the same function references
            modelElement.removeEventListener('load', handleModelLoad);
            modelElement.removeEventListener('wheel', handleWheel);
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isFullscreen]); // Reduced dependencies to prevent unnecessary re-runs
    
    // Effect to update material properties when props change
    useEffect(() => {
        const newMetalness = typeof metallicFactor === 'string' ? parseFloat(metallicFactor) : metallicFactor;
        const newRoughness = typeof roughnessFactor === 'string' ? parseFloat(roughnessFactor) : roughnessFactor;
        const newExposure = typeof exposure === 'string' ? parseFloat(exposure) : exposure;
        
        setMetalness(newMetalness);
        setRoughness(newRoughness);
        setExposureValue(newExposure);
        
        // Update material properties with debouncing to avoid rapid updates
        const timeoutId = setTimeout(() => {
            updateMaterialProps(newMetalness, newRoughness).catch(() => {
                // Ignore errors - already handled in updateMaterialProps
            });
        }, 50);
        
        return () => clearTimeout(timeoutId);
    }, [metallicFactor, roughnessFactor, exposure]);

    // Update isFullscreen when fullscreen prop changes
    useEffect(() => {
        setIsFullscreen(fullscreen);
    }, [fullscreen]);

    // Reset loading state when model path changes
    useEffect(() => {
        setIsLoading(true);
    }, [modelPath]);

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
        width: '100dvw',
        height: '100dvh',
        zIndex: 3000,
        backgroundColor: 'black',
    } : {
        width: '100%',
        height: '100%',
    };

    return (
        <div className={`model-viewer-container${isFullscreen ? ' fullscreen' : ''}`} style={containerStyle}>
            {/* Loading Overlay */}
            {isLoading && (
                <div className="model-viewer-loading">
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
                    <p className="loading-text">Loading 3D Model...</p>
                </div>
            )}

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
                'camera-target': 'auto',
                bounds: 'tight',
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
            
            <button
                type="button"
                onClick={toggleFullscreen}
                className="fullscreen-button"
                aria-pressed={isFullscreen}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'View in fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'View in fullscreen'}
            >
                {isFullscreen ? 'Exit Fullscreen' : 'View in Fullscreen'}
            </button>
        </div>
    );
};

export default ModelViewer;