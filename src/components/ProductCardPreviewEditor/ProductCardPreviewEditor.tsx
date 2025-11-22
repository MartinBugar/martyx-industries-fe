import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProductCard from '../ProductCard/ProductCard';
import { type Product } from '../../data/productData';
import './ProductCardPreviewEditor.css';

export interface ImageDisplaySettings {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

interface ProductCardPreviewEditorProps {
  imageUrl: string;
  imageName: string;
  initialSettings?: ImageDisplaySettings;
  onSettingsChange: (settings: ImageDisplaySettings) => void;
  onSave: (settings: ImageDisplaySettings) => Promise<void>;
}

/**
 * Component for previewing and editing how product card images are displayed.
 * Allows adjusting zoom and position with real-time preview using the actual ProductCard component.
 */
const ProductCardPreviewEditor: React.FC<ProductCardPreviewEditorProps> = ({
  imageUrl,
  imageName,
  initialSettings = { zoom: 1.0, offsetX: 0, offsetY: 0 },
  onSettingsChange,
  onSave
}) => {
  const [settings, setSettings] = useState<ImageDisplaySettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update local settings when initial settings change (e.g., when selecting different image)
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Debounced callback for onSettingsChange
  const debouncedOnSettingsChange = useCallback((newSettings: ImageDisplaySettings) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onSettingsChange(newSettings);
    }, 150); // 150ms debounce delay
  }, [onSettingsChange]);

  const handleSettingChange = (field: keyof ImageDisplaySettings, value: number) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings); // Update immediately for responsive UI
    debouncedOnSettingsChange(newSettings); // Debounced callback
  };

  const handleReset = () => {
    const defaultSettings: ImageDisplaySettings = { zoom: 1.0, offsetX: 0, offsetY: 0 };
    setSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      await onSave(settings);
      setSaveMessage('✅ Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save settings';
      setSaveMessage(`❌ ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  // Create a mock product for preview using the actual imageUrl being edited
  const mockProduct: Product = {
    // Master product fields
    masterProductId: 0,
    name: 'Premium Product Name',
    slug: 'preview-product',
    description: 'High-quality product with advanced features and exceptional performance. Perfect for professional use with industry-leading specifications.',
    longDescription: 'Detailed product description with advanced specifications',
    productCategory: 'MODEL_KIT',

    // Variant fields
    variantId: 0,
    variantName: 'Standard Edition',
    sku: 'PREVIEW-001',
    priceWithVat: 499.90,
    priceWithoutVat: 416.58,
    vatRate: 20,
    vatAmount: 83.32,
    currency: 'EUR',
    variantType: 'PHYSICAL_ONLY',
    fulfillmentType: 'PHYSICAL',
    stockQuantity: 100,
    availabilityStatus: 'IN_STOCK',
    requiresShipping: true,

    // Frontend data
    features: ['Premium Quality', 'Fast Shipping', 'Professional Grade'],
    modelPath: '',
    gallery: [imageUrl], // Use the actual image being edited
    interactionInstructions: [],
    availableVariants: []
  };

  // Calculate CSS custom properties for image transformation
  const previewStyle = {
    '--preview-zoom': settings.zoom,
    '--preview-offset-x': `${settings.offsetX / settings.zoom}px`,
    '--preview-offset-y': `${settings.offsetY / settings.zoom}px`,
  } as React.CSSProperties;

  return (
    <div className="product-card-preview-editor">
      {/* Preview Section */}
      <div className="preview-section">
        <h4 className="preview-title">Product Card Preview</h4>
        <p className="preview-description">
          This is how the image will appear on the product card in /products page
        </p>

        {/* Actual Product Card with preview transformations applied */}
        <div className="product-card-preview-wrapper" style={previewStyle}>
          <ProductCard
            product={mockProduct}
            showWishlistButton={false}
            showAddToCart={false}
            disableLink={true}
          />
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <h4 className="controls-title">Adjust Image Display</h4>

        {/* Zoom Control */}
        <div className="control-group">
          <label htmlFor="zoom-slider" className="control-label">
            <span aria-hidden="true">🔍</span> Zoom: <span className="control-value">{(settings.zoom * 100).toFixed(0)}%</span>
          </label>
          <input
            id="zoom-slider"
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={settings.zoom}
            onChange={(e) => handleSettingChange('zoom', parseFloat(e.target.value))}
            className="control-slider"
            aria-label={`Image zoom level: ${(settings.zoom * 100).toFixed(0)}%`}
            aria-valuemin={50}
            aria-valuemax={300}
            aria-valuenow={Number((settings.zoom * 100).toFixed(0))}
            aria-valuetext={`${(settings.zoom * 100).toFixed(0)} percent`}
          />
          <div className="control-range-labels">
            <span>50%</span>
            <span>300%</span>
          </div>
        </div>

        {/* Horizontal Offset Control */}
        <div className="control-group">
          <label htmlFor="offsetX-slider" className="control-label">
            <span aria-hidden="true">↔️</span> Horizontal Position: <span className="control-value">{settings.offsetX}px</span>
          </label>
          <input
            id="offsetX-slider"
            type="range"
            min="-500"
            max="500"
            step="10"
            value={settings.offsetX}
            onChange={(e) => handleSettingChange('offsetX', parseInt(e.target.value, 10))}
            className="control-slider"
            aria-label={`Horizontal position: ${settings.offsetX} pixels`}
            aria-valuemin={-500}
            aria-valuemax={500}
            aria-valuenow={settings.offsetX}
            aria-valuetext={`${settings.offsetX} pixels ${settings.offsetX < 0 ? 'left' : settings.offsetX > 0 ? 'right' : 'center'}`}
          />
          <div className="control-range-labels">
            <span>← Left (-500px)</span>
            <span>Right (+500px) →</span>
          </div>
        </div>

        {/* Vertical Offset Control */}
        <div className="control-group">
          <label htmlFor="offsetY-slider" className="control-label">
            <span aria-hidden="true">↕️</span> Vertical Position: <span className="control-value">{settings.offsetY}px</span>
          </label>
          <input
            id="offsetY-slider"
            type="range"
            min="-500"
            max="500"
            step="10"
            value={settings.offsetY}
            onChange={(e) => handleSettingChange('offsetY', parseInt(e.target.value, 10))}
            className="control-slider"
            aria-label={`Vertical position: ${settings.offsetY} pixels`}
            aria-valuemin={-500}
            aria-valuemax={500}
            aria-valuenow={settings.offsetY}
            aria-valuetext={`${settings.offsetY} pixels ${settings.offsetY < 0 ? 'up' : settings.offsetY > 0 ? 'down' : 'center'}`}
          />
          <div className="control-range-labels">
            <span>↑ Up (-500px)</span>
            <span>Down (+500px) ↓</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="control-actions">
          <button
            onClick={handleReset}
            className="btn-reset"
            disabled={saving}
          >
            Reset to Default
          </button>
          <button
            onClick={handleSave}
            className="btn-save"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`save-message ${saveMessage.startsWith('✅') ? 'success' : 'error'}`}
          >
            {saveMessage}
          </div>
        )}

        {/* Info Box */}
        <div className="info-box">
          <strong>💡 Tip:</strong> Use zoom to focus on important product details,
          and position sliders to center the subject perfectly in the product card.
        </div>
      </div>
    </div>
  );
};

export default ProductCardPreviewEditor;
