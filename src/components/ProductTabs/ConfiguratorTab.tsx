/**
 * ConfiguratorTab Component
 *
 * 3D product configurator using Three.js (React Three Fiber).
 * Allows customers to customize products by selecting different components
 * and see live preview of their configuration.
 */

import React, { useState, useEffect, useRef, Suspense, useMemo, useCallback, Component, type ErrorInfo, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';
import { configuratorService } from '../../services/configuratorService';
import type { Configurator, ConfiguratorOption, SelectedConfiguration } from '../../types/configurator';
import type { Product } from '../../data/productData';
import { useCart } from '../../context/useCart';
import toast from 'react-hot-toast';
import { logError } from '../../services/logger';
import './ConfiguratorTab.css';

// =========================================================================
// CONSTANTS
// =========================================================================

const LOADING_TIMEOUT_MS = 15000; // 15 seconds timeout for loading
const ALLOWED_CDN_ORIGINS = [
  'https://martyx-industries.fra1.cdn.digitaloceanspaces.com',
  'https://martyx-industries.fra1.digitaloceanspaces.com',
];

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
        <div className="configurator-error">
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

/**
 * Validate URL is from allowed CDN origins
 */
const isValidGLBUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return ALLOWED_CDN_ORIGINS.some(origin => urlObj.origin === origin);
  } catch {
    return false;
  }
};

/**
 * Validate mount point structure
 */
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

/**
 * Validate configuration structure before sending to cart
 */
const validateConfiguration = (
  config: SelectedConfiguration,
  validSlotKeys: Set<string>
): boolean => {
  for (const key of Object.keys(config)) {
    if (!validSlotKeys.has(key)) return false;

    const value = config[key];
    if (typeof value !== 'object' || value === null) return false;
    if (typeof value.optionId !== 'number' || value.optionId < 0) return false;
    if (typeof value.optionKey !== 'string') return false;
    if (typeof value.displayName !== 'string') return false;
    if (typeof value.priceModifier !== 'number') return false;
  }
  return true;
};

// =========================================================================
// INTERFACES
// =========================================================================

interface ConfiguratorTabProps {
  masterProductId: number;
  product?: Product;
  onConfigurationChange?: (config: SelectedConfiguration, totalModifier: number) => void;
}

interface MountPoint {
  name: string;
  position: number[];
  rotation: number[];
}

// =========================================================================
// 3D MODEL COMPONENTS
// =========================================================================

/**
 * Base 3D Model component with cleanup
 */
const BaseModel: React.FC<{ url: string }> = ({ url }) => {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Cleanup on unmount
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
  }, [clonedScene]);

  return <primitive object={clonedScene} />;
};

/**
 * Option 3D Model component with proper cloning and cleanup
 */
const OptionModel: React.FC<{
  url: string;
  mountPoints: MountPoint[];
}> = ({ url, mountPoints }) => {
  const { scene } = useGLTF(url);
  const clonedScenesRef = useRef<THREE.Object3D[]>([]);

  // Validate and filter mount points - stable serialization for comparison
  const mountPointsKey = useMemo(() => {
    return JSON.stringify(
      mountPoints
        .filter(isValidMountPoint)
        .map(mp => ({ name: mp.name, position: mp.position, rotation: mp.rotation }))
    );
  }, [mountPoints]);

  const validMountPoints = useMemo(() =>
    mountPoints.filter(isValidMountPoint),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mountPointsKey]
  );

  // Helper to dispose cloned scenes
  const disposeClones = useCallback((clones: THREE.Object3D[]) => {
    clones.forEach(clonedScene => {
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
  }, []);

  // Memoize cloned scenes with proper cleanup of previous clones
  const clonedScenes = useMemo(() => {
    // Dispose previous clones before creating new ones
    if (clonedScenesRef.current.length > 0) {
      disposeClones(clonedScenesRef.current);
    }

    const newClones = validMountPoints.map(() => {
      const clone = scene.clone();
      clone.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      return clone;
    });

    clonedScenesRef.current = newClones;
    return newClones;
  }, [scene, validMountPoints, disposeClones]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disposeClones(clonedScenesRef.current);
      clonedScenesRef.current = [];
    };
  }, [disposeClones]);

  return (
    <>
      {validMountPoints.map((mp, index) => {
        const rotation = mp.rotation.map((r) => {
          const radians = (r * Math.PI) / 180;
          return isFinite(radians) ? radians : 0;
        });

        return (
          <primitive
            key={`${mp.name}-${index}`}
            object={clonedScenes[index]}
            position={mp.position as [number, number, number]}
            rotation={rotation as [number, number, number]}
          />
        );
      })}
    </>
  );
};

/**
 * Loading placeholder
 */
const ModelLoader: React.FC = () => (
  <mesh>
    <boxGeometry args={[1, 1, 1]} />
    <meshStandardMaterial color="#cccccc" wireframe />
  </mesh>
);

// =========================================================================
// MAIN COMPONENT
// =========================================================================

const ConfiguratorTab: React.FC<ConfiguratorTabProps> = ({
  masterProductId,
  product,
  onConfigurationChange,
}) => {
  const { addToCartWithConfiguration } = useCart();
  const [configurator, setConfigurator] = useState<Configurator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, ConfiguratorOption>>({});
  const [autoRotate, setAutoRotate] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const controlsRef = useRef<any>(null);
  const autoRotateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get valid slot keys for validation
  const validSlotKeys = useMemo(() =>
    new Set(configurator?.slots.map(s => s.slotKey) ?? []),
    [configurator]
  );

  // Get max quantity based on stock
  const maxQuantity = useMemo(() => {
    if (!product) return 99;
    const stock = product.stockQuantity ?? 99;
    return Math.min(99, stock);
  }, [product]);

  // Load configurator data with timeout
  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        setError('Loading took too long. Please try again.');
        setLoading(false);
      }
    }, LOADING_TIMEOUT_MS);

    const loadConfigurator = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await configuratorService.getPublicConfigurator(masterProductId);

        if (!isMounted) return;

        if (data) {
          setConfigurator(data);
          // Set default options
          const defaults: Record<string, ConfiguratorOption> = {};
          data.slots.forEach((slot) => {
            const defaultOption = slot.options.find((o) => o.isDefault) || slot.options[0];
            if (defaultOption) {
              defaults[slot.slotKey] = defaultOption;
            }
          });
          setSelectedOptions(defaults);
        } else {
          setError('Configurator not available for this product');
        }
      } catch (e) {
        if (!isMounted) return;
        let message = 'Failed to load configurator';
        if (e instanceof Error) {
          if (e.message.includes('404') || e.message.includes('not found')) {
            message = 'This product does not have a configurator available';
          } else if (e.message.includes('network') || e.message.includes('Network')) {
            message = 'Network error. Please check your connection.';
          } else if (e.message.includes('timeout')) {
            message = 'Loading took too long. Please try again.';
          }
        }
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadConfigurator();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [masterProductId]);

  // Cleanup auto-rotate timeout on unmount
  useEffect(() => {
    return () => {
      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current);
      }
    };
  }, []);

  // Notify parent of configuration changes
  useEffect(() => {
    if (!onConfigurationChange || Object.keys(selectedOptions).length === 0) return;

    const config: SelectedConfiguration = {};
    let totalModifier = 0;

    Object.entries(selectedOptions).forEach(([slotKey, option]) => {
      config[slotKey] = {
        optionId: option.id,
        optionKey: option.optionKey,
        displayName: option.displayName,
        priceModifier: option.priceModifier,
      };
      totalModifier += option.priceModifier;
    });

    onConfigurationChange(config, totalModifier);
  }, [selectedOptions, onConfigurationChange]);

  // Handle option selection
  const handleSelectOption = useCallback((slotKey: string, option: ConfiguratorOption) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [slotKey]: option,
    }));
  }, []);

  // Calculate total price modifier
  const getTotalModifier = useCallback((): number => {
    return Object.values(selectedOptions).reduce((sum, opt) => sum + opt.priceModifier, 0);
  }, [selectedOptions]);

  // Build selected configuration object for cart
  const getSelectedConfiguration = useCallback((): SelectedConfiguration => {
    const config: SelectedConfiguration = {};
    Object.entries(selectedOptions).forEach(([slotKey, option]) => {
      config[slotKey] = {
        optionId: option.id,
        optionKey: option.optionKey,
        displayName: option.displayName,
        priceModifier: option.priceModifier,
      };
    });
    return config;
  }, [selectedOptions]);

  // Handle quantity change with stock validation
  const handleQuantityChange = useCallback((delta: number) => {
    if (!Number.isInteger(delta) || Math.abs(delta) > 10) {
      logError('Invalid quantity delta:', delta);
      return;
    }

    setQuantity(prev => {
      const newQty = prev + delta;
      if (newQty < 1) return 1;
      if (newQty > maxQuantity) {
        if (maxQuantity < 99) {
          toast.error(`Maximum available: ${maxQuantity}`);
        }
        return maxQuantity;
      }
      return newQty;
    });
  }, [maxQuantity]);

  // Handle add to cart with configuration validation
  const handleAddToCart = useCallback(async () => {
    if (!product) {
      toast.error('Product information not available');
      return;
    }

    const configuration = getSelectedConfiguration();

    // Validate configuration before sending
    if (!validateConfiguration(configuration, validSlotKeys)) {
      toast.error('Invalid configuration. Please try again.');
      return;
    }

    setAddingToCart(true);
    try {
      const totalModifier = getTotalModifier();
      const result = await addToCartWithConfiguration(product, configuration, totalModifier, quantity);

      switch (result) {
        case 'added':
          toast.success('Configured product added to cart!');
          break;
        case 'limit':
          toast.error('Maximum quantity limit reached for this product');
          break;
        case 'out_of_stock':
          toast.error('This product is currently out of stock');
          break;
        case 'discontinued':
          toast.error('This product has been discontinued');
          break;
        case 'error':
          // Error toast already shown by addToCartWithConfiguration
          break;
      }
    } finally {
      setAddingToCart(false);
    }
  }, [product, getSelectedConfiguration, validSlotKeys, getTotalModifier, addToCartWithConfiguration, quantity]);

  // Pause auto-rotate on interaction
  const handleInteractionStart = useCallback(() => {
    if (autoRotateTimeoutRef.current) {
      clearTimeout(autoRotateTimeoutRef.current);
    }
    setAutoRotate(false);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    // Resume auto-rotate after 3 seconds of no interaction
    autoRotateTimeoutRef.current = setTimeout(() => setAutoRotate(true), 3000);
  }, []);

  // Keyboard shortcuts for 3D rotation
  useEffect(() => {
    const ROTATION_STEP = 0.1; // radians

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const controls = controlsRef.current;
      if (!controls) return;

      let handled = false;

      switch (e.key) {
        case 'ArrowLeft':
          controls.setAzimuthalAngle(controls.getAzimuthalAngle() + ROTATION_STEP);
          handled = true;
          break;
        case 'ArrowRight':
          controls.setAzimuthalAngle(controls.getAzimuthalAngle() - ROTATION_STEP);
          handled = true;
          break;
        case 'ArrowUp':
          controls.setPolarAngle(Math.max(0.1, controls.getPolarAngle() - ROTATION_STEP));
          handled = true;
          break;
        case 'ArrowDown':
          controls.setPolarAngle(Math.min(Math.PI - 0.1, controls.getPolarAngle() + ROTATION_STEP));
          handled = true;
          break;
        case 'r':
        case 'R':
          // Reset camera position
          controls.reset();
          handled = true;
          break;
        case ' ':
          // Toggle auto-rotate
          e.preventDefault();
          setAutoRotate(prev => !prev);
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        controls.update();
        // Pause auto-rotate on manual control
        if (e.key !== ' ') {
          handleInteractionStart();
          handleInteractionEnd();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInteractionStart, handleInteractionEnd]);

  // Get currency symbol from product
  const currencySymbol = product?.currency === 'USD' ? '$' : '€';

  if (loading) {
    return (
      <div className="configurator-tab">
        <div className="configurator-loading">
          <div className="loading-spinner" />
          <p>Loading configurator...</p>
        </div>
      </div>
    );
  }

  if (error || !configurator) {
    return (
      <div className="configurator-tab">
        <div className="configurator-error">
          <p>{error || 'Configurator not available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="configurator-tab" role="region" aria-label="Product Configurator">
      <div className="configurator-container">
        {/* 3D Preview Canvas */}
        <div className="configurator-preview" aria-label="3D product preview">
          <CanvasErrorBoundary>
            <Canvas
              camera={{ position: [3, 2, 3], fov: 45 }}
              shadows
              dpr={[1, 2]}
              gl={{ antialias: true }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight
                position={[5, 5, 5]}
                intensity={1.5}
                castShadow
                shadow-mapSize={[1024, 1024]}
              />
              <directionalLight position={[-5, 3, -5]} intensity={0.6} />

              <Suspense fallback={<ModelLoader />}>
                <Center>
                  {/* Base model */}
                  {configurator.baseModelUrl && isValidGLBUrl(configurator.baseModelUrl) && (
                    <BaseModel url={configurator.baseModelUrl} />
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
                      />
                    );
                  })}
                </Center>

                <Environment preset="studio" />
              </Suspense>

              <OrbitControls
                ref={controlsRef}
                autoRotate={autoRotate}
                autoRotateSpeed={1}
                enablePan={true}
                enableZoom={true}
                onStart={handleInteractionStart}
                onEnd={handleInteractionEnd}
              />
            </Canvas>
          </CanvasErrorBoundary>
        </div>

        {/* Configuration Options Panel */}
        <div className="configurator-options" role="form" aria-label="Configuration options">
          <h3 className="configurator-options-title">Configure Your Model</h3>

          {configurator.slots.map((slot) => (
            <fieldset key={slot.id} className="configurator-slot">
              <legend className="configurator-slot-title" id={`slot-${slot.id}-label`}>
                {slot.icon && <span className="slot-icon" aria-hidden="true">{slot.icon}</span>}
                {slot.displayName}
              </legend>

              <div
                className="configurator-option-grid"
                role="radiogroup"
                aria-labelledby={`slot-${slot.id}-label`}
              >
                {slot.options.map((option) => {
                  const isSelected = selectedOptions[slot.slotKey]?.id === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={`${option.displayName}, price modifier ${option.formattedPriceModifier}`}
                      className={`configurator-option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(slot.slotKey, option)}
                      tabIndex={isSelected ? 0 : -1}
                    >
                      {option.thumbnailUrl && (
                        <img
                          src={option.thumbnailUrl}
                          alt=""
                          aria-hidden="true"
                          className="option-thumbnail"
                          loading="lazy"
                        />
                      )}
                      <div className="option-info">
                        <span className="option-name">{option.displayName}</span>
                        <span className="option-price">
                          {option.priceModifier >= 0 ? '+' : ''}
                          {option.formattedPriceModifier}
                        </span>
                      </div>
                      {isSelected && <span className="option-check" aria-hidden="true">&#10003;</span>}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          {/* Total Price Modifier */}
          <div className="configurator-total" aria-live="polite">
            <span>Configuration Price:</span>
            <span className="total-price">
              {getTotalModifier() >= 0 ? '+' : ''}
              {currencySymbol}{getTotalModifier().toFixed(2)}
            </span>
          </div>

          {/* Quantity Selector and Add to Cart */}
          {product && (
            <div className="configurator-cart-section">
              <div className="configurator-quantity">
                <span className="quantity-label" id="quantity-label">Quantity:</span>
                <div className="quantity-controls" role="group" aria-labelledby="quantity-label">
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="quantity-value" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= maxQuantity}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                className="configurator-add-to-cart"
                onClick={handleAddToCart}
                disabled={addingToCart || Object.keys(selectedOptions).length === 0}
                aria-busy={addingToCart}
              >
                {addingToCart ? (
                  <>
                    <span className="button-spinner" aria-hidden="true" />
                    Adding...
                  </>
                ) : (
                  <>
                    <span className="cart-icon" aria-hidden="true">🛒</span>
                    Add to Cart
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfiguratorTab;
