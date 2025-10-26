import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../ui';
import type { ProductVariantDto } from '../../services/adminProductsService';

interface VariantEditorProps {
  variant?: ProductVariantDto | null;
  masterProductId: number;
  onSave: (variant: ProductVariantDto) => Promise<void>;
  onCancel: () => void;
}

const emptyVariant: Partial<ProductVariantDto> = {
  variantName: '',
  sku: '',
  variantType: 'PHYSICAL_ONLY',
  fulfillmentType: 'PHYSICAL',
  priceWithVat: 0,
  vatRate: 23,
  currency: 'EUR',
  stockQuantity: 0,
  trackInventory: true,
  allowBackorder: false,
  lowStockThreshold: 10,
  minOrderQuantity: 1,
  active: true,
  onSale: false,
};

export const VariantEditor: React.FC<VariantEditorProps> = ({
  variant,
  masterProductId,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<ProductVariantDto>>({ ...emptyVariant });
  const [activeTab, setActiveTab] = useState<'basic' | 'inventory' | 'physical' | 'digital' | 'advanced'>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (variant) {
      setFormData({ ...variant });
    } else {
      setFormData({ ...emptyVariant, masterProductId });
    }
  }, [variant, masterProductId]);

  const updateField = (key: keyof ProductVariantDto, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.variantName?.trim()) {
      setError('Variant name is required');
      return;
    }
    if (!formData.sku?.trim()) {
      setError('SKU is required');
      return;
    }
    if (!formData.priceWithVat || formData.priceWithVat <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData as ProductVariantDto);
    } catch (e: any) {
      setError(e.message || 'Failed to save variant');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h3>{variant ? 'Edit Variant' : 'Create New Variant'}</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Tabs */}
        <div className="dashboard-tabs" style={{ marginBottom: '20px' }}>
          <button
            className={`dashboard-tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'physical' ? 'active' : ''}`}
            onClick={() => setActiveTab('physical')}
          >
            Physical
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'digital' ? 'active' : ''}`}
            onClick={() => setActiveTab('digital')}
          >
            Digital
          </button>
          <button
            className={`dashboard-tab ${activeTab === 'advanced' ? 'active' : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="form-grid">
              <div>
                <label className="form-label">Variant Name *</label>
                <input
                  className="form-input"
                  value={formData.variantName || ''}
                  onChange={(e) => updateField('variantName', e.target.value)}
                  placeholder="e.g., Digital Edition, Full Kit"
                  required
                />
              </div>
              <div>
                <label className="form-label">SKU *</label>
                <input
                  className="form-input"
                  value={formData.sku || ''}
                  onChange={(e) => updateField('sku', e.target.value)}
                  placeholder="e.g., ENV-DIG-001"
                  required
                />
              </div>
              <div>
                <label className="form-label">Variant Type</label>
                <select
                  className="form-input"
                  value={formData.variantType || 'PHYSICAL_ONLY'}
                  onChange={(e) => updateField('variantType', e.target.value)}
                >
                  <option value="DIGITAL_ONLY">Digital Only</option>
                  <option value="PHYSICAL_ONLY">Physical Only</option>
                  <option value="HYBRID">Hybrid (Digital + Physical)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Fulfillment Type</label>
                <select
                  className="form-input"
                  value={formData.fulfillmentType || 'PHYSICAL'}
                  onChange={(e) => updateField('fulfillmentType', e.target.value)}
                >
                  <option value="DIGITAL">Digital Delivery</option>
                  <option value="PHYSICAL">Physical Shipping</option>
                  <option value="MIXED">Mixed (Digital + Shipping)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Price (with VAT) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.priceWithVat || ''}
                  onChange={(e) => updateField('priceWithVat', parseFloat(e.target.value))}
                  placeholder="89.90"
                  required
                />
              </div>
              <div>
                <label className="form-label">VAT Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.vatRate || 23}
                  onChange={(e) => updateField('vatRate', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label className="form-label">Currency</label>
                <select
                  className="form-input"
                  value={formData.currency || 'EUR'}
                  onChange={(e) => updateField('currency', e.target.value)}
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="form-label">EAN Code</label>
                <input
                  className="form-input"
                  value={formData.eanCode || ''}
                  onChange={(e) => updateField('eanCode', e.target.value)}
                  placeholder="EAN-13 barcode"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={formData.active ?? true}
                    onChange={(e) => updateField('active', e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Active (visible in store)
                </label>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="form-grid">
              <div>
                <label className="form-label">Stock Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.stockQuantity ?? 0}
                  onChange={(e) => updateField('stockQuantity', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="form-label">Availability Status</label>
                <select
                  className="form-input"
                  value={formData.availabilityStatus || 'IN_STOCK'}
                  onChange={(e) => updateField('availabilityStatus', e.target.value)}
                >
                  <option value="IN_STOCK">In Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="PRE_ORDER">Pre-Order</option>
                  <option value="DISCONTINUED">Discontinued</option>
                  <option value="BACKORDERED">Backordered</option>
                </select>
              </div>
              <div>
                <label className="form-label">Low Stock Threshold</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.lowStockThreshold ?? 10}
                  onChange={(e) => updateField('lowStockThreshold', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="form-label">Min Order Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.minOrderQuantity ?? 1}
                  onChange={(e) => updateField('minOrderQuantity', parseInt(e.target.value))}
                />
              </div>
              <div>
                <label className="form-label">Max Order Quantity</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.maxOrderQuantity || ''}
                  onChange={(e) => updateField('maxOrderQuantity', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="No limit"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.trackInventory ?? true}
                    onChange={(e) => updateField('trackInventory', e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Track Inventory
                </label>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={formData.allowBackorder ?? false}
                    onChange={(e) => updateField('allowBackorder', e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Allow Backorders
                </label>
              </div>
            </div>
          )}

          {/* Physical Properties Tab */}
          {activeTab === 'physical' && (
            <div className="form-grid">
              <div>
                <label className="form-label">Weight (grams)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.weightGrams || ''}
                  onChange={(e) => updateField('weightGrams', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 500"
                />
              </div>
              <div>
                <label className="form-label">Length (cm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.lengthCm || ''}
                  onChange={(e) => updateField('lengthCm', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="form-label">Width (cm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.widthCm || ''}
                  onChange={(e) => updateField('widthCm', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
              <div>
                <label className="form-label">Height (cm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.heightCm || ''}
                  onChange={(e) => updateField('heightCm', e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={formData.requiresShipping ?? false}
                    onChange={(e) => updateField('requiresShipping', e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Requires Shipping
                </label>
              </div>
            </div>
          )}

          {/* Digital Properties Tab */}
          {activeTab === 'digital' && (
            <div className="form-grid">
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <input
                    type="checkbox"
                    checked={formData.hasDigitalContent ?? false}
                    onChange={(e) => updateField('hasDigitalContent', e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  Has Digital Content
                </label>
              </div>
              <div>
                <label className="form-label">Digital File URL</label>
                <input
                  className="form-input"
                  value={formData.digitalFileUrl || ''}
                  onChange={(e) => updateField('digitalFileUrl', e.target.value)}
                  placeholder="https://..."
                  disabled={!formData.hasDigitalContent}
                />
              </div>
              <div>
                <label className="form-label">File Format</label>
                <input
                  className="form-input"
                  value={formData.digitalFileFormat || ''}
                  onChange={(e) => updateField('digitalFileFormat', e.target.value)}
                  placeholder="ZIP, PDF, STL"
                  disabled={!formData.hasDigitalContent}
                />
              </div>
              <div>
                <label className="form-label">Download Limit</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.downloadLimit ?? 5}
                  onChange={(e) => updateField('downloadLimit', parseInt(e.target.value))}
                  disabled={!formData.hasDigitalContent}
                />
              </div>
              <div>
                <label className="form-label">Download Expiry (days)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.downloadExpiryDays ?? 30}
                  onChange={(e) => updateField('downloadExpiryDays', parseInt(e.target.value))}
                  disabled={!formData.hasDigitalContent}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 0 }}>
                  <input
                    type="checkbox"
                    checked={formData.downloadable ?? false}
                    onChange={(e) => updateField('downloadable', e.target.checked)}
                    style={{ marginRight: 8 }}
                    disabled={!formData.hasDigitalContent}
                  />
                  Downloadable
                </label>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="form-grid">
              <div>
                <label className="form-label">Compare At Price (€)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.compareAtPrice || ''}
                  onChange={(e) => updateField('compareAtPrice', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="Was €129.90"
                />
              </div>
              <div>
                <label className="form-label">Discount Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.discountPercentage || ''}
                  onChange={(e) => updateField('discountPercentage', e.target.value ? parseFloat(e.target.value) : null)}
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <input
                    type="checkbox"
                    checked={formData.onSale ?? false}
                    onChange={(e) => updateField('onSale', e.target.checked)}
                    style={{ marginRight: 8 }}
                  />
                  On Sale
                </label>
              </div>
              <div>
                <label className="form-label">Meta Title</label>
                <input
                  className="form-input"
                  value={formData.metaTitle || ''}
                  onChange={(e) => updateField('metaTitle', e.target.value)}
                  placeholder="SEO title"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Meta Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={formData.metaDescription || ''}
                  onChange={(e) => updateField('metaDescription', e.target.value)}
                  placeholder="SEO description"
                />
              </div>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: 24 }}>
            <Button variant="primary" type="submit" disabled={saving} loading={saving} icon={Save}>
              {variant ? 'Save Changes' : 'Create Variant'}
            </Button>
            <Button variant="outline" type="button" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VariantEditor;
