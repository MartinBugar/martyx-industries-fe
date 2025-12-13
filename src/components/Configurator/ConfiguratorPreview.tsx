/**
 * ConfiguratorPreview Component
 *
 * 3D preview canvas for the product configurator.
 * Shows the base model with selected option models at mount points.
 *
 * This component replaces the ModelViewer in ProductView when configurator is enabled.
 */

import React, { Suspense, useMemo, useEffect, useRef, useState, Component, type ErrorInfo, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Center, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { useConfigurator } from '../../context/ConfiguratorContext';
import { logError } from '../../services/logger';
import './ConfiguratorPreview.css';

// =========================================================================
// CAMERA SETTINGS
// =========================================================================
const CAMERA_SETTINGS = {
  position: [-0.390, 0.086, -0.594] as [number, number, number],
  fov: 45,
  minDistance: 0.4,
  maxDistance: 10,
};

// =========================================================================
// VISUAL SETTINGS (matching ModelViewer defaults)
// =========================================================================

const DEFAULT_VISUAL_SETTINGS = {
  exposure: 0.1,
  metalness: 0.41,
  roughness: 0.36,
  ambientIntensity: 0.3,
  mainLightIntensity: 1.2,
  fillLightIntensity: 0.4,
  rimLightIntensity: 0.3,
  hemisphereIntensity: 0.4,
  envMapIntensity: 1.0,
};

// Show debug panel only in development
const SHOW_DEBUG_PANEL = import.meta.env.DEV;

// =========================================================================
// CONSTANTS
// =========================================================================

// CDN origins from environment or fallback defaults
const ALLOWED_CDN_ORIGINS: string[] = (() => {
  const envOrigins = import.meta.env.VITE_CDN_ORIGINS;
  if (envOrigins && typeof envOrigins === 'string') {
    return envOrigins.split(',').map(o => o.trim()).filter(Boolean);
  }
  // Fallback for development
  return [
    'https://martyx-industries.fra1.cdn.digitaloceanspaces.com',
    'https://martyx-industries.fra1.digitaloceanspaces.com',
    'https://mi-gallery.fra1.cdn.digitaloceanspaces.com',
  ];
})();

// =========================================================================
// WEBGL DETECTION
// =========================================================================

const detectWebGLSupport = (): { supported: boolean; version: number; error?: string } => {
  try {
    const canvas = document.createElement('canvas');

    // Try WebGL 2 first
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      return { supported: true, version: 2 };
    }

    // Fall back to WebGL 1
    const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl1) {
      return { supported: true, version: 1 };
    }

    return { supported: false, version: 0, error: 'WebGL is not supported by your browser' };
  } catch (e) {
    return { supported: false, version: 0, error: 'Failed to detect WebGL support' };
  }
};

// Cache WebGL detection result
const webGLSupport = detectWebGLSupport();

// =========================================================================
// ERROR BOUNDARY
// =========================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class CanvasErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError('3D Canvas error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="configurator-preview-error">
          <p>Failed to render 3D preview</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================

const isValidGLBUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return ALLOWED_CDN_ORIGINS.some(origin => urlObj.origin === origin);
  } catch {
    return false;
  }
};

const isValidMountPoint = (mp: unknown): mp is { name: string; position: number[]; rotation: number[] } => {
  if (!mp || typeof mp !== 'object') return false;
  const obj = mp as Record<string, unknown>;

  if (typeof obj.name !== 'string') return false;

  if (!Array.isArray(obj.position) || obj.position.length !== 3) return false;
  if (!obj.position.every((p: unknown) => typeof p === 'number' && isFinite(p as number))) return false;

  if (!Array.isArray(obj.rotation) || obj.rotation.length !== 3) return false;
  if (!obj.rotation.every((r: unknown) => typeof r === 'number' && isFinite(r as number))) return false;

  return true;
};

// =========================================================================
// 3D MODEL COMPONENTS
// =========================================================================

interface MountPoint {
  name: string;
  position: number[];
  rotation: number[];
}

/**
 * Apply PBR material settings to match ModelViewer appearance
 */
const applyMaterialSettings = (material: THREE.Material, settings: typeof DEFAULT_VISUAL_SETTINGS) => {
  if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhysicalMaterial) {
    // Only override if not explicitly set in the GLB
    if (material.metalness === 0) {
      material.metalness = settings.metalness;
    }
    if (material.roughness === 1) {
      material.roughness = settings.roughness;
    }
    material.envMapIntensity = settings.envMapIntensity;
    material.needsUpdate = true;
  }
};

/**
 * Component to configure Three.js renderer settings (tone mapping, exposure)
 * and set initial camera position using spherical coordinates
 */
const SceneSetup: React.FC<{ settings: typeof DEFAULT_VISUAL_SETTINGS }> = ({ settings }) => {
  const { gl, scene } = useThree();

  useEffect(() => {
    // Configure tone mapping to match model-viewer's "neutral" setting
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = settings.exposure * 10; // Scaled for Three.js
    gl.outputColorSpace = THREE.SRGBColorSpace;

    // Set white background to match ModelViewer
    scene.background = new THREE.Color('#ffffff');
  }, [gl, scene, settings.exposure]);

  return null;
};

const BaseModel: React.FC<{ url: string; onLoad?: () => void; settings: typeof DEFAULT_VISUAL_SETTINGS }> = ({ url, onLoad, settings }) => {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Call onLoad when model is ready
  useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Apply material settings
        if (Array.isArray(child.material)) {
          child.material.forEach(m => applyMaterialSettings(m, settings));
        } else if (child.material) {
          applyMaterialSettings(child.material, settings);
        }
      }
    });

    return () => {
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    };
  }, [clonedScene, settings]);

  // Scale from mm to m (model is in millimeters, Three.js expects meters)
  return <primitive object={clonedScene} scale={0.001} />;
};

const OptionModel: React.FC<{
  url: string;
  mountPoints: MountPoint[];
  settings: typeof DEFAULT_VISUAL_SETTINGS;
}> = ({ url, mountPoints, settings }) => {
  const { scene } = useGLTF(url);

  const validMountPoints = useMemo(() =>
    mountPoints.filter(isValidMountPoint),
    [mountPoints]
  );

  const clonedScenes = useMemo(() => {
    return validMountPoints.map((mp) => {
      const clone = scene.clone();
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Apply material settings
          if (Array.isArray(child.material)) {
            child.material.forEach(m => applyMaterialSettings(m, settings));
          } else if (child.material) {
            applyMaterialSettings(child.material, settings);
          }
        }
      });

      // Apply rotations in XYZ order around GLOBAL axes (extrinsic)
      // This matches PyVista's rotate_x, rotate_y, rotate_z behavior
      // Convert degrees to radians
      const rx = (mp.rotation[0] * Math.PI) / 180;
      const ry = (mp.rotation[1] * Math.PI) / 180;
      const rz = (mp.rotation[2] * Math.PI) / 180;

      // Create rotation matrices for each axis
      const rotX = new THREE.Matrix4().makeRotationX(rx);
      const rotY = new THREE.Matrix4().makeRotationY(ry);
      const rotZ = new THREE.Matrix4().makeRotationZ(rz);

      // Apply in order: X, then Y, then Z (global/extrinsic)
      clone.applyMatrix4(rotX);
      clone.applyMatrix4(rotY);
      clone.applyMatrix4(rotZ);

      // Scale from mm to m (model is in millimeters, Three.js expects meters)
      clone.scale.set(0.001, 0.001, 0.001);

      // Apply position (also convert from mm to m)
      clone.position.set(
        mp.position[0] * 0.001,
        mp.position[1] * 0.001,
        mp.position[2] * 0.001
      );

      return clone;
    });
  }, [scene, validMountPoints, settings]);

  useEffect(() => {
    return () => {
      clonedScenes.forEach(clonedScene => {
        clonedScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material?.dispose();
            }
          }
        });
      });
    };
  }, [clonedScenes]);

  return (
    <>
      {validMountPoints.map((mp, index) => (
        <primitive
          key={`${mp.name}-${index}`}
          object={clonedScenes[index]}
        />
      ))}
    </>
  );
};

const ModelLoader: React.FC = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#cccccc" wireframe />
  </mesh>
);

/**
 * Loading progress indicator for 3D models
 */
const LoadingProgress: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { progress, active } = useProgress();

  useEffect(() => {
    if (!active && progress === 100) {
      onComplete();
    }
  }, [active, progress, onComplete]);

  return null;
};

/**
 * WebGL not supported fallback
 */
const WebGLNotSupported: React.FC<{ error?: string }> = ({ error }) => (
  <div className="configurator-preview-error">
    <div className="configurator-webgl-error">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <h3>3D Preview Unavailable</h3>
      <p>{error || 'Your browser does not support WebGL, which is required for 3D previews.'}</p>
      <p className="configurator-webgl-hint">
        Try using a modern browser like Chrome, Firefox, or Edge.
      </p>
    </div>
  </div>
);

// =========================================================================
// DEBUG PANEL COMPONENT
// =========================================================================

interface DebugSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const DebugSlider: React.FC<DebugSliderProps> = ({ label, value, min, max, step, onChange }) => (
  <div className="debug-slider-row">
    <label className="debug-slider-label">
      {label}: <span className="debug-slider-value">{value.toFixed(2)}</span>
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="debug-slider-input"
    />
  </div>
);

interface DebugPanelProps {
  settings: typeof DEFAULT_VISUAL_SETTINGS;
  onSettingsChange: (settings: typeof DEFAULT_VISUAL_SETTINGS) => void;
  cameraInfo: { distance: number; position: [number, number, number] };
  minDistance: number;
  maxDistance: number;
  onMinDistanceChange: (value: number) => void;
  onMaxDistanceChange: (value: number) => void;
  autoRotate: boolean;
  onAutoRotateToggle: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  settings,
  onSettingsChange,
  cameraInfo,
  minDistance,
  maxDistance,
  onMinDistanceChange,
  onMaxDistanceChange,
  autoRotate,
  onAutoRotateToggle,
  isOpen,
  onToggle
}) => {
  const updateSetting = (key: keyof typeof DEFAULT_VISUAL_SETTINGS, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const copyToClipboard = () => {
    const code = `// Visual Settings
const VISUAL_SETTINGS = ${JSON.stringify(settings, null, 2)};

// Camera/Zoom Settings
const CAMERA_SETTINGS = {
  minDistance: ${minDistance},
  maxDistance: ${maxDistance},
};

// Current camera position: [${cameraInfo.position.map(p => p.toFixed(3)).join(', ')}]
// Current distance: ${cameraInfo.distance.toFixed(3)}`;
    navigator.clipboard.writeText(code);
    alert('Settings copied to clipboard!');
  };

  const resetToDefaults = () => {
    onSettingsChange({ ...DEFAULT_VISUAL_SETTINGS });
  };

  if (!isOpen) {
    return (
      <button className="debug-panel-toggle" onClick={onToggle} title="Open Debug Panel">
        Debug
      </button>
    );
  }

  return (
    <div className="debug-panel">
      <div className="debug-panel-header">
        <span>3D Debug Panel</span>
        <button className="debug-panel-close" onClick={onToggle}>X</button>
      </div>
      <div className="debug-panel-content">
        <div className="debug-section">
          <h4>Exposure & Tone</h4>
          <DebugSlider
            label="Exposure"
            value={settings.exposure}
            min={0.01}
            max={2}
            step={0.01}
            onChange={(v) => updateSetting('exposure', v)}
          />
        </div>

        <div className="debug-section">
          <h4>Material PBR</h4>
          <DebugSlider
            label="Metalness"
            value={settings.metalness}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateSetting('metalness', v)}
          />
          <DebugSlider
            label="Roughness"
            value={settings.roughness}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateSetting('roughness', v)}
          />
          <DebugSlider
            label="EnvMap Intensity"
            value={settings.envMapIntensity}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => updateSetting('envMapIntensity', v)}
          />
        </div>

        <div className="debug-section">
          <h4>Lighting</h4>
          <DebugSlider
            label="Ambient"
            value={settings.ambientIntensity}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => updateSetting('ambientIntensity', v)}
          />
          <DebugSlider
            label="Main Light"
            value={settings.mainLightIntensity}
            min={0}
            max={5}
            step={0.1}
            onChange={(v) => updateSetting('mainLightIntensity', v)}
          />
          <DebugSlider
            label="Fill Light"
            value={settings.fillLightIntensity}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => updateSetting('fillLightIntensity', v)}
          />
          <DebugSlider
            label="Rim Light"
            value={settings.rimLightIntensity}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => updateSetting('rimLightIntensity', v)}
          />
          <DebugSlider
            label="Hemisphere"
            value={settings.hemisphereIntensity}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => updateSetting('hemisphereIntensity', v)}
          />
        </div>

        <div className="debug-section">
          <h4>Camera & Zoom</h4>
          <div className="debug-info-row">
            <span>Position:</span>
            <span className="debug-info-value">
              [{cameraInfo.position.map(p => p.toFixed(3)).join(', ')}]
            </span>
          </div>
          <div className="debug-info-row">
            <span>Distance:</span>
            <span className="debug-info-value">{cameraInfo.distance.toFixed(3)}</span>
          </div>
          <DebugSlider
            label="Min Zoom"
            value={minDistance}
            min={0.1}
            max={2}
            step={0.05}
            onChange={onMinDistanceChange}
          />
          <DebugSlider
            label="Max Zoom"
            value={maxDistance}
            min={1}
            max={20}
            step={0.5}
            onChange={onMaxDistanceChange}
          />
          <button
            className={`debug-btn debug-btn-toggle ${autoRotate ? 'active' : ''}`}
            onClick={onAutoRotateToggle}
            style={{ marginTop: '8px', width: '100%' }}
          >
            Auto Rotate: {autoRotate ? 'ON' : 'OFF'}
          </button>
        </div>

        <div className="debug-panel-actions">
          <button className="debug-btn" onClick={copyToClipboard}>Copy Settings</button>
          <button className="debug-btn debug-btn-reset" onClick={resetToDefaults}>Reset</button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// MAIN COMPONENT
// =========================================================================

interface ConfiguratorPreviewProps {
  className?: string;
}

const ConfiguratorPreview: React.FC<ConfiguratorPreviewProps> = ({ className }) => {
  const {
    configurator,
    loading,
    error,
    selectedOptions,
    autoRotate,
    pauseAutoRotate,
    resumeAutoRotate,
  } = useConfigurator();

  const controlsRef = useRef<any>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [visualSettings, setVisualSettings] = useState({ ...DEFAULT_VISUAL_SETTINGS });
  const [minDistance, setMinDistance] = useState(CAMERA_SETTINGS.minDistance);
  const [maxDistance, setMaxDistance] = useState(CAMERA_SETTINGS.maxDistance);
  const [debugAutoRotate, setDebugAutoRotate] = useState(false);
  const [cameraInfo, setCameraInfo] = useState<{ distance: number; position: [number, number, number] }>({
    distance: 0,
    position: [0, 0, 0]
  });

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleModelsLoaded = useMemo(
    () => () => setModelsLoading(false),
    []
  );

  // Update camera info when debug panel is open
  useEffect(() => {
    if (!debugOpen) return;

    const updateCameraInfo = () => {
      if (controlsRef.current?.object) {
        const camera = controlsRef.current.object;
        const target = controlsRef.current.target;
        const distance = camera.position.distanceTo(target);
        setCameraInfo({
          distance,
          position: [camera.position.x, camera.position.y, camera.position.z]
        });
      }
    };

    updateCameraInfo();
    const interval = setInterval(updateCameraInfo, 100);
    return () => clearInterval(interval);
  }, [debugOpen]);

  // Reset loading state when configurator changes
  useEffect(() => {
    if (configurator) {
      setModelsLoading(true);
    }
  }, [configurator?.baseModelUrl]);

  // Check WebGL support first
  if (!webGLSupport.supported) {
    return (
      <div className={`configurator-preview-container ${className || ''}`}>
        <WebGLNotSupported error={webGLSupport.error} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`configurator-preview-container ${className || ''}`}>
        <div className="configurator-preview-loading">
          <div className="configurator-loading-spinner-3d">
            <div className="configurator-spinner-cube">
              <div className="configurator-cube-face front"></div>
              <div className="configurator-cube-face back"></div>
              <div className="configurator-cube-face left"></div>
              <div className="configurator-cube-face right"></div>
              <div className="configurator-cube-face top"></div>
              <div className="configurator-cube-face bottom"></div>
            </div>
          </div>
          <p className="configurator-loading-text">Loading 3D preview...</p>
        </div>
      </div>
    );
  }

  if (error || !configurator) {
    return (
      <div className={`configurator-preview-container ${className || ''}`}>
        <div className="configurator-preview-error">
          <p>{error || 'Preview not available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`configurator-preview-container${isFullscreen ? ' fullscreen' : ''} ${className || ''}`} aria-label="3D product preview">
      {/* Loading Overlay */}
      {modelsLoading && (
        <div className="configurator-preview-loading">
          <div className="configurator-loading-spinner-3d">
            <div className="configurator-spinner-cube">
              <div className="configurator-cube-face front"></div>
              <div className="configurator-cube-face back"></div>
              <div className="configurator-cube-face left"></div>
              <div className="configurator-cube-face right"></div>
              <div className="configurator-cube-face top"></div>
              <div className="configurator-cube-face bottom"></div>
            </div>
          </div>
          <p className="configurator-loading-text">Loading 3D Model...</p>
        </div>
      )}

      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: CAMERA_SETTINGS.position, fov: CAMERA_SETTINGS.fov }}
          dpr={[1, 2]}
          gl={{ antialias: true }}
        >
          {/* Scene setup for tone mapping and exposure */}
          <SceneSetup settings={visualSettings} />

          {/* Lighting setup matching ModelViewer */}
          <ambientLight intensity={visualSettings.ambientIntensity} />
          {/* Main key light */}
          <directionalLight
            position={[5, 5, 5]}
            intensity={visualSettings.mainLightIntensity}
          />
          {/* Fill light */}
          <directionalLight
            position={[-5, 3, -5]}
            intensity={visualSettings.fillLightIntensity}
          />
          {/* Rim/back light for depth */}
          <directionalLight
            position={[0, 2, -5]}
            intensity={visualSettings.rimLightIntensity}
          />
          {/* Soft hemisphere light for ambient fill */}
          <hemisphereLight args={['#ffffff', '#666666', visualSettings.hemisphereIntensity]} />

          <Suspense fallback={<ModelLoader />}>
            {/* Loading progress tracker */}
            <LoadingProgress onComplete={handleModelsLoaded} />

            <Center>
              {/* Base model */}
              {configurator.baseModelUrl && isValidGLBUrl(configurator.baseModelUrl) && (
                <BaseModel url={configurator.baseModelUrl} onLoad={handleModelsLoaded} settings={visualSettings} />
              )}

              {/* Selected option models at mount points */}
              {configurator.slots.map((slot) => {
                const selectedOption = selectedOptions[slot.slotKey];
                if (!selectedOption || !selectedOption.glbUrl) return null;
                if (!isValidGLBUrl(selectedOption.glbUrl)) return null;

                return (
                  <OptionModel
                    key={`${slot.slotKey}-${selectedOption.id}`}
                    url={selectedOption.glbUrl}
                    mountPoints={slot.mountPoints}
                    settings={visualSettings}
                  />
                );
              })}
            </Center>
          </Suspense>

          <OrbitControls
            ref={(ref) => {
              controlsRef.current = ref;
              if (ref) {
                ref.minDistance = minDistance;
                ref.maxDistance = maxDistance;
              }
            }}
            makeDefault
            autoRotate={debugAutoRotate || autoRotate}
            autoRotateSpeed={1}
            enablePan={true}
            enableZoom={true}
            minDistance={minDistance}
            maxDistance={maxDistance}
            target={[0, 0, 0]}
            onStart={pauseAutoRotate}
            onEnd={resumeAutoRotate}
          />
        </Canvas>
      </CanvasErrorBoundary>

      {/* Debug Panel - only in development */}
      {SHOW_DEBUG_PANEL && (
        <DebugPanel
          settings={visualSettings}
          onSettingsChange={setVisualSettings}
          cameraInfo={cameraInfo}
          minDistance={minDistance}
          maxDistance={maxDistance}
          onMinDistanceChange={setMinDistance}
          onMaxDistanceChange={setMaxDistance}
          autoRotate={debugAutoRotate}
          onAutoRotateToggle={() => setDebugAutoRotate(!debugAutoRotate)}
          isOpen={debugOpen}
          onToggle={() => setDebugOpen(!debugOpen)}
        />
      )}

      {/* Fullscreen button - bottom right when not fullscreen */}
      {!isFullscreen && (
        <button
          className="configurator-fullscreen-btn"
          onClick={toggleFullscreen}
          title="Enter fullscreen"
        >
          Fullscreen
        </button>
      )}

      {/* Exit fullscreen button - top right when fullscreen */}
      {isFullscreen && (
        <button
          className="configurator-exit-fullscreen-btn"
          onClick={toggleFullscreen}
          title="Exit fullscreen"
        >
          Exit Fullscreen
        </button>
      )}
    </div>
  );
};

export default ConfiguratorPreview;
