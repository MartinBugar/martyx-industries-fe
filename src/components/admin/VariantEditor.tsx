import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '../ui';
import type { ProductVariantDto } from '../../services/adminProductsService';
import AdminProductTabs from '../AdminProductTabs/AdminProductTabs';
import AttachmentManager from '../AttachmentManager/AttachmentManager';

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

// Reusable styles
const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid #374151',
  background: '#0F1115',
  color: '#ffffff',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: '#9CA3AF',
  marginBottom: '8px',
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
  const [showTabsManager, setShowTabsManager] = useState(false);
  const [showAttachmentsManager, setShowAttachmentsManager] = useState(false);

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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1F2538 0%, #1B2030 100%)',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid #4B5563',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid #374151',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(59, 130, 246, 0.05)',
            flexShrink: 0,
          }}
        >
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#ffffff' }}>
            {variant ? 'Edit Variant' : 'Create New Variant'}
          </h3>
          <button
            onClick={onCancel}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: '#E5E7EB',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              margin: '20px 28px 0',
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#FCA5A5',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            padding: '16px 28px 0',
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid #374151',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {[
            { key: 'basic', label: 'Basic Info' },
            { key: 'inventory', label: 'Inventory' },
            { key: 'physical', label: 'Physical' },
            { key: 'digital', label: 'Digital' },
            { key: 'advanced', label: 'Advanced' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '10px 16px',
                background: activeTab === tab.key ? '#3B82F6' : 'transparent',
                border: activeTab === tab.key ? '1px solid #3B82F6' : '1px solid #374151',
                borderBottom: 'none',
                borderRadius: '8px 8px 0 0',
                color: activeTab === tab.key ? '#ffffff' : '#9CA3AF',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '-1px',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#9CA3AF';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content - Scrollable */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', minHeight: '500px' }}>
          <form onSubmit={handleSubmit} id="variant-form">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                }}
              >
                <div>
                  <label style={labelStyle}>Variant Name *</label>
                  <input
                    style={inputStyle}
                    value={formData.variantName || ''}
                    onChange={(e) => updateField('variantName', e.target.value)}
                    placeholder="e.g., Digital Edition, Full Kit"
                    required
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>SKU *</label>
                  <input
                    style={inputStyle}
                    value={formData.sku || ''}
                    onChange={(e) => updateField('sku', e.target.value)}
                    placeholder="e.g., ENV-DIG-001"
                    required
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Variant Type</label>
                  <select
                    style={inputStyle}
                    value={formData.variantType || 'PHYSICAL_ONLY'}
                    onChange={(e) => updateField('variantType', e.target.value)}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  >
                    <option value="DIGITAL_ONLY">Digital Only</option>
                    <option value="PHYSICAL_ONLY">Physical Only</option>
                    <option value="HYBRID">Hybrid (Digital + Physical)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Fulfillment Type</label>
                  <select
                    style={inputStyle}
                    value={formData.fulfillmentType || 'PHYSICAL'}
                    onChange={(e) => updateField('fulfillmentType', e.target.value)}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  >
                    <option value="DIGITAL">Digital Delivery</option>
                    <option value="PHYSICAL">Physical Shipping</option>
                    <option value="MIXED">Mixed (Digital + Shipping)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Price (with VAT) *</label>
                  <input
                    type="number"
                    step="0.01"
                    style={inputStyle}
                    value={formData.priceWithVat || ''}
                    onChange={(e) => updateField('priceWithVat', parseFloat(e.target.value))}
                    placeholder="89.90"
                    required
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>VAT Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    style={inputStyle}
                    value={formData.vatRate || 23}
                    onChange={(e) => updateField('vatRate', parseFloat(e.target.value))}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Currency</label>
                  <select
                    style={inputStyle}
                    value={formData.currency || 'EUR'}
                    onChange={(e) => updateField('currency', e.target.value)}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>EAN Code</label>
                  <input
                    style={inputStyle}
                    value={formData.eanCode || ''}
                    onChange={(e) => updateField('eanCode', e.target.value)}
                    placeholder="EAN-13 barcode"
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#E5E7EB', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active ?? true}
                      onChange={(e) => updateField('active', e.target.checked)}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Active (visible in store)
                  </label>
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                }}
              >
                <div>
                  <label style={labelStyle}>Stock Quantity</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.stockQuantity ?? 0}
                    onChange={(e) => updateField('stockQuantity', parseInt(e.target.value))}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Availability Status</label>
                  <select
                    style={inputStyle}
                    value={formData.availabilityStatus || 'IN_STOCK'}
                    onChange={(e) => updateField('availabilityStatus', e.target.value)}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="PRE_ORDER">Pre-Order</option>
                    <option value="DISCONTINUED">Discontinued</option>
                    <option value="BACKORDERED">Backordered</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Low Stock Threshold</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.lowStockThreshold ?? 10}
                    onChange={(e) => updateField('lowStockThreshold', parseInt(e.target.value))}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Min Order Quantity</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.minOrderQuantity ?? 1}
                    onChange={(e) => updateField('minOrderQuantity', parseInt(e.target.value))}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Max Order Quantity</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.maxOrderQuantity || ''}
                    onChange={(e) => updateField('maxOrderQuantity', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="No limit"
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#E5E7EB', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.trackInventory ?? true}
                      onChange={(e) => updateField('trackInventory', e.target.checked)}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Track Inventory
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#E5E7EB', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.allowBackorder ?? false}
                      onChange={(e) => updateField('allowBackorder', e.target.checked)}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Allow Backorders
                  </label>
                </div>
              </div>
            )}

            {/* Physical Properties Tab */}
            {activeTab === 'physical' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                }}
              >
                <div>
                  <label style={labelStyle}>Weight (grams)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.weightGrams || ''}
                    onChange={(e) => updateField('weightGrams', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="e.g., 500"
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Length (cm)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.lengthCm || ''}
                    onChange={(e) => updateField('lengthCm', e.target.value ? parseInt(e.target.value) : null)}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Width (cm)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.widthCm || ''}
                    onChange={(e) => updateField('widthCm', e.target.value ? parseInt(e.target.value) : null)}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Height (cm)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.heightCm || ''}
                    onChange={(e) => updateField('heightCm', e.target.value ? parseInt(e.target.value) : null)}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#E5E7EB', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.requiresShipping ?? false}
                      onChange={(e) => updateField('requiresShipping', e.target.checked)}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Requires Shipping
                  </label>
                </div>
              </div>
            )}

            {/* Digital Properties Tab */}
            {activeTab === 'digital' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                }}
              >
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#E5E7EB', fontSize: '14px', cursor: 'pointer', marginBottom: '16px' }}>
                    <input
                      type="checkbox"
                      checked={formData.hasDigitalContent ?? false}
                      onChange={(e) => updateField('hasDigitalContent', e.target.checked)}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Has Digital Content
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>Digital File URL</label>
                  <input
                    style={{ ...inputStyle, opacity: formData.hasDigitalContent ? 1 : 0.5 }}
                    value={formData.digitalFileUrl || ''}
                    onChange={(e) => updateField('digitalFileUrl', e.target.value)}
                    placeholder="https://..."
                    disabled={!formData.hasDigitalContent}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>File Format</label>
                  <input
                    style={{ ...inputStyle, opacity: formData.hasDigitalContent ? 1 : 0.5 }}
                    value={formData.digitalFileFormat || ''}
                    onChange={(e) => updateField('digitalFileFormat', e.target.value)}
                    placeholder="ZIP, PDF, STL"
                    disabled={!formData.hasDigitalContent}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Download Limit</label>
                  <input
                    type="number"
                    style={{ ...inputStyle, opacity: formData.hasDigitalContent ? 1 : 0.5 }}
                    value={formData.downloadLimit ?? 5}
                    onChange={(e) => updateField('downloadLimit', parseInt(e.target.value))}
                    disabled={!formData.hasDigitalContent}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Download Expiry (days)</label>
                  <input
                    type="number"
                    style={{ ...inputStyle, opacity: formData.hasDigitalContent ? 1 : 0.5 }}
                    value={formData.downloadExpiryDays ?? 30}
                    onChange={(e) => updateField('downloadExpiryDays', parseInt(e.target.value))}
                    disabled={!formData.hasDigitalContent}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#E5E7EB', fontSize: '14px', cursor: formData.hasDigitalContent ? 'pointer' : 'not-allowed', opacity: formData.hasDigitalContent ? 1 : 0.5 }}>
                    <input
                      type="checkbox"
                      checked={formData.downloadable ?? false}
                      onChange={(e) => updateField('downloadable', e.target.checked)}
                      disabled={!formData.hasDigitalContent}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: formData.hasDigitalContent ? 'pointer' : 'not-allowed' }}
                    />
                    Downloadable
                  </label>
                </div>
              </div>
            )}

            {/* Advanced Tab */}
            {activeTab === 'advanced' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                }}
              >
                <div>
                  <label style={labelStyle}>Compare At Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    style={inputStyle}
                    value={formData.compareAtPrice || ''}
                    onChange={(e) => updateField('compareAtPrice', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="Was €129.90"
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Discount Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    style={inputStyle}
                    value={formData.discountPercentage || ''}
                    onChange={(e) => updateField('discountPercentage', e.target.value ? parseFloat(e.target.value) : null)}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: '#E5E7EB', fontSize: '14px', cursor: 'pointer', marginBottom: '16px' }}>
                    <input
                      type="checkbox"
                      checked={formData.onSale ?? false}
                      onChange={(e) => updateField('onSale', e.target.checked)}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    On Sale
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>Meta Title</label>
                  <input
                    style={inputStyle}
                    value={formData.metaTitle || ''}
                    onChange={(e) => updateField('metaTitle', e.target.value)}
                    placeholder="SEO title"
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Meta Description</label>
                  <textarea
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    rows={3}
                    value={formData.metaDescription || ''}
                    onChange={(e) => updateField('metaDescription', e.target.value)}
                    placeholder="SEO description"
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#374151')}
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '20px 28px',
            borderTop: '1px solid #374151',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            background: 'rgba(15, 17, 21, 0.5)',
            flexShrink: 0,
          }}
        >
          {formData.id && (
            <>
              <button
                type="button"
                onClick={() => setShowTabsManager(!showTabsManager)}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📋 {showTabsManager ? 'Hide' : 'Manage'} Tabs
              </button>

              <button
                type="button"
                onClick={() => setShowAttachmentsManager(!showAttachmentsManager)}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                📎 {showAttachmentsManager ? 'Hide' : 'Manage'} Attachments
              </button>
            </>
          )}
          <Button variant="outline" type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={saving}
            loading={saving}
            icon={Save}
            onClick={handleSubmit}
          >
            {variant ? 'Save Changes' : 'Create Variant'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VariantEditor;
