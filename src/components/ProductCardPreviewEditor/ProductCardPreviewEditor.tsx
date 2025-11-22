import React, { useState, useEffect } from 'react';
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
 * Allows adjusting zoom and position with real-time preview.
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

  // Update local settings when initial settings change (e.g., when selecting different image)
  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleSettingChange = (field: keyof ImageDisplaySettings, value: number) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
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

  // Calculate image style based on settings
  const imageStyle: React.CSSProperties = {
    transform: `scale(${settings.zoom}) translate(${settings.offsetX / settings.zoom}px, ${settings.offsetY / settings.zoom}px)`,
    transformOrigin: 'center center',
    transition: 'transform 0.2s ease-out'
  };

  return (
    <div className="product-card-preview-editor">
      {/* Preview Section */}
      <div className="preview-section">
        <h4 className="preview-title">Product Card Preview</h4>
        <p className="preview-description">
          This is how the image will appear on the product card in /products page
        </p>

        {/* Product Card Mock */}
        <div className="product-card-mock">
          <div className="product-card-mock__image-container">
            <div className="product-card-mock__image-wrapper">
              <img
                src={imageUrl}
                alt={imageName}
                className="product-card-mock__image"
                style={imageStyle}
              />
            </div>
          </div>
          <div className="product-card-mock__content">
            <h3 className="product-card-mock__title">Product Name</h3>
            <p className="product-card-mock__price">€499.90</p>
            <button className="product-card-mock__button">View Details</button>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <h4 className="controls-title">Adjust Image Display</h4>

        {/* Zoom Control */}
        <div className="control-group">
          <label htmlFor="zoom-slider" className="control-label">
            🔍 Zoom: <span className="control-value">{(settings.zoom * 100).toFixed(0)}%</span>
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
          />
          <div className="control-range-labels">
            <span>50%</span>
            <span>300%</span>
          </div>
        </div>

        {/* Horizontal Offset Control */}
        <div className="control-group">
          <label htmlFor="offsetX-slider" className="control-label">
            ↔️ Horizontal Position: <span className="control-value">{settings.offsetX}px</span>
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
          />
          <div className="control-range-labels">
            <span>← Left</span>
            <span>Right →</span>
          </div>
        </div>

        {/* Vertical Offset Control */}
        <div className="control-group">
          <label htmlFor="offsetY-slider" className="control-label">
            ↕️ Vertical Position: <span className="control-value">{settings.offsetY}px</span>
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
          />
          <div className="control-range-labels">
            <span>↑ Up</span>
            <span>Down ↓</span>
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
          <div className={`save-message ${saveMessage.startsWith('✅') ? 'success' : 'error'}`}>
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
