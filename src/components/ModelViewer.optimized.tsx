/**
 * Optimized ModelViewer Component
 * 
 * Performance improvements:
 * - React.memo for preventing unnecessary re-renders
 * - Optimized useEffect dependencies
 * - Better debouncing for material updates
 * - Memoized style objects
 * - Stable callback references
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStableCallback, useDebouncedEffect } from '../hooks/useOptimizedEffect';
import './ModelViewer.css';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': ModelViewerElement;
        }
    }
}

interface ModelViewerElement extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
    src?: string;
    'environment-image'?: string;
    'skybox-image'?: string;
    alt?: string;
    'ios-src'?: string;
    poster?: string;
    seamless?: boolean;
    'shadow-intensity'?: number;
    'shadow-softness'?: number;
    exposure?: number;
    'camera-controls'?: boolean;
    'camera-orbit'?: string;
    'field-of-view'?: string;
    'min-camera-orbit'?: string;
    'max-camera-orbit'?: string;
    'min-field-of-view'?: string;
    'max-field-of-view'?: string;
    'interpolation-decay'?: number;
    'interaction-policy'?: 'always-allow' | 'allow-when-focused';
    'interaction-prompt'?: 'auto' | 'when-focused' | 'none';
    'interaction-prompt-style'?: 'basic' | 'wiggle';
}

interface ModelViewerProps {
    modelPath: string;
    environmentImage?: string;
    skyboxImage?: string;
    alt?: string;
    iosSrc?: string;
    poster?: string;
    seamless?: boolean;
    shadowIntensity?: number;
    shadowSoftness?: number;
    exposure?: number | string;
    cameraControls?: boolean;
    cameraOrbit?: string;
    fieldOfView?: string;
    minCameraOrbit?: string;
    maxCameraOrbit?: string;
    minFieldOfView?: string;
    maxFieldOfView?: string;
    interpolationDecay?: number;
    interactionPolicy?: 'always-allow' | 'allow-when-focused';
    interactionPrompt?: 'auto' | 'when-focused' | 'none';
    interactionPromptStyle?: 'basic' | 'wiggle';
    fullscreen?: boolean;
    onFullscreenChange?: (isFullscreen: boolean) => void;
    metallicFactor?: number | string;
    roughnessFactor?: number | string;
}

const ModelViewer: React.FC<ModelViewerProps> = React.memo(({
    modelPath,
    environmentImage = 'neutral',
    skyboxImage,
    alt = '3D model',
    iosSrc,
    poster,
    seamless = false,
    shadowIntensity = 1,
    shadowSoftness = 1,
    exposure = 1,
    cameraControls = true,
    cameraOrbit = 'auto auto auto',
    fieldOfView = 'auto',
    minCameraOrbit = 'auto auto auto',
    maxCameraOrbit = 'auto auto auto',
    minFieldOfView = 'auto',
    maxFieldOfView = 'auto',
    interpolationDecay = 100,
    interactionPolicy = 'always-allow',
    interactionPrompt = 'auto',
    interactionPromptStyle = 'basic',
    fullscreen = false,
    onFullscreenChange,
    metallicFactor = 0,
    roughnessFactor = 1
}) => {
    // State management
    const [isFullscreen, setIsFullscreen] = useState(fullscreen);
    const [metalness, setMetalness] = useState(typeof metallicFactor === 'string' ? parseFloat(metallicFactor) : metallicFactor);
    const [roughness, setRoughness] = useState(typeof roughnessFactor === 'string' ? parseFloat(roughnessFactor) : roughnessFactor);
    const [exposureValue, setExposureValue] = useState(typeof exposure === 'string' ? parseFloat(exposure) : exposure);

    // Refs
    const modelViewerRef = useRef<any>(null);

    // Memoized styles to prevent recreation on every render
    const containerStyle = useMemo(() => {
        return isFullscreen ? {
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
    }, [isFullscreen]);

    // Stable callback for material property updates
    const updateMaterialProps = useStableCallback((newMetalness: number, newRoughness: number) => {
        const modelViewer = modelViewerRef.current;
        if (!modelViewer) return;

        try {
            const material = modelViewer.model?.materials?.[0];
            if (material) {
                if (material.pbrMetallicRoughness) {
                    material.pbrMetallicRoughness.metallicFactor = newMetalness;
                    material.pbrMetallicRoughness.roughnessFactor = newRoughness;
                }
            }
        } catch (error) {
            console.warn('Error updating material properties:', error);
        }
    });

    // Stable callback for fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        const newFullscreenState = !isFullscreen;
        setIsFullscreen(newFullscreenState);
        onFullscreenChange?.(newFullscreenState);
    }, [isFullscreen, onFullscreenChange]);

    // Stable callback for escape key handling
    const handleEscKey = useStableCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape' && isFullscreen) {
            toggleFullscreen();
        }
    });

    // Effect for keyboard event listeners (optimized dependencies)
    useEffect(() => {
        if (isFullscreen) {
            document.addEventListener('keydown', handleEscKey);
            return () => document.removeEventListener('keydown', handleEscKey);
        }
    }, [isFullscreen, handleEscKey]);

    // Debounced effect for material property updates (prevents excessive calls)
    useDebouncedEffect(() => {
        const newMetalness = typeof metallicFactor === 'string' ? parseFloat(metallicFactor) : metallicFactor;
        const newRoughness = typeof roughnessFactor === 'string' ? parseFloat(roughnessFactor) : roughnessFactor;
        const newExposure = typeof exposure === 'string' ? parseFloat(exposure) : exposure;
        
        setMetalness(newMetalness);
        setRoughness(newRoughness);
        setExposureValue(newExposure);
        
        updateMaterialProps(newMetalness, newRoughness);
    }, [metallicFactor, roughnessFactor, exposure, updateMaterialProps], 100);

    // Effect for fullscreen prop changes
    useEffect(() => {
        setIsFullscreen(fullscreen);
    }, [fullscreen]);

    // Memoized model-viewer props to prevent unnecessary attribute changes
    const modelViewerProps = useMemo(() => ({
        ref: modelViewerRef,
        src: modelPath,
        'environment-image': environmentImage,
        'skybox-image': skyboxImage,
        alt,
        'ios-src': iosSrc,
        poster,
        seamless,
        'shadow-intensity': shadowIntensity,
        'shadow-softness': shadowSoftness,
        exposure: exposureValue,
        'camera-controls': cameraControls,
        'camera-orbit': cameraOrbit,
        'field-of-view': fieldOfView,
        'min-camera-orbit': minCameraOrbit,
        'max-camera-orbit': maxCameraOrbit,
        'min-field-of-view': minFieldOfView,
        'max-field-of-view': maxFieldOfView,
        'interpolation-decay': interpolationDecay,
        'interaction-policy': interactionPolicy,
        'interaction-prompt': interactionPrompt,
        'interaction-prompt-style': interactionPromptStyle,
        className: "model-viewer",
        style: { width: '100%', height: '100%' }
    }), [
        modelPath, environmentImage, skyboxImage, alt, iosSrc, poster,
        seamless, shadowIntensity, shadowSoftness, exposureValue,
        cameraControls, cameraOrbit, fieldOfView, minCameraOrbit,
        maxCameraOrbit, minFieldOfView, maxFieldOfView, interpolationDecay,
        interactionPolicy, interactionPrompt, interactionPromptStyle
    ]);

    return (
        <div 
            className={`model-viewer-container${isFullscreen ? ' fullscreen' : ''}`} 
            style={containerStyle}
        >
            {React.createElement('model-viewer', modelViewerProps)}
            
            {/* Fullscreen toggle button */}
            <button
                onClick={toggleFullscreen}
                className="fullscreen-toggle"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                type="button"
            >
                {isFullscreen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>
                    </svg>
                )}
            </button>
        </div>
    );
});

ModelViewer.displayName = 'ModelViewer';

export default ModelViewer;
