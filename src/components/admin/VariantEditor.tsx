import React, {useEffect, useState} from 'react';
import {Save} from 'lucide-react';
import {Button} from '../ui';
import type {ProductVariantDto} from '../../services/adminProductsService';

interface VariantEditorProps {
  variant?: ProductVariantDto | null;
  masterProductId: number;
  masterProductName?: string;
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

// Reusable styles - using admin theme variables
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.625rem 1rem',
  borderRadius: 'var(--admin-radius-md)',
  border: '1px solid var(--admin-border)',
  background: 'var(--admin-bg-primary)',
  color: 'var(--admin-primary)',
  fontSize: 'var(--admin-text-sm)',
  outline: 'none',
  transition: 'all var(--admin-transition-base)',
  fontFamily: 'var(--admin-font-sans)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--admin-text-sm)',
  fontWeight: 'var(--admin-font-medium)' as any,
  color: 'var(--admin-secondary)',
  marginBottom: 'var(--admin-space-sm)',
};

export const VariantEditor: React.FC<VariantEditorProps> = ({
  variant,
  masterProductId,
  masterProductName,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<ProductVariantDto>>({ ...emptyVariant });
  const [activeTab, setActiveTab] = useState<'basic' | 'inventory' | 'physical'>('basic');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (variant) {
      setFormData({ ...variant });
    } else {
      setFormData({ ...emptyVariant, masterProductId });
    }
  }, [variant, masterProductId]);

  const updateField = (key: keyof ProductVariantDto, value: ProductVariantDto[keyof ProductVariantDto]) => {
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save variant');
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
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--admin-z-modal)' as any,
        padding: 'var(--admin-space-lg)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--admin-bg-primary)',
          borderRadius: 'var(--admin-radius-lg)',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: 'var(--admin-shadow-xl)',
          border: '1px solid var(--admin-border)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--admin-space-lg)',
            borderBottom: '1px solid var(--admin-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: 'var(--admin-bg-secondary)',
            flexShrink: 0,
          }}
        >
          <div>
            <h3 style={{
              margin: 0,
              fontSize: 'var(--admin-text-xl)',
              fontWeight: 'var(--admin-font-semibold)' as any,
              color: 'var(--admin-primary)'
            }}>
              {variant ? 'Edit Variant' : 'Create New Variant'}
            </h3>
            {masterProductName && (
              <div style={{
                marginTop: 'var(--admin-space-sm)',
                fontSize: 'var(--admin-text-sm)',
                color: 'var(--admin-secondary)'
              }}>
                Product: <span style={{
                  color: 'var(--admin-primary)',
                  fontWeight: 'var(--admin-font-medium)' as any
                }}>{masterProductName}</span>
              </div>
            )}
            {variant && (
              <div style={{
                marginTop: 'var(--admin-space-xs)',
                fontSize: 'var(--admin-text-sm)',
                color: 'var(--admin-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--admin-space-sm)',
                flexWrap: 'wrap'
              }}>
                <span style={{
                  fontWeight: 'var(--admin-font-medium)' as any,
                  color: 'var(--admin-primary)'
                }}>{variant.variantName}</span>
                <span style={{ color: 'var(--admin-divider)' }}>•</span>
                <code style={{
                  fontSize: 'var(--admin-text-xs)',
                  padding: '0.25rem 0.5rem',
                  background: 'var(--admin-accent-light)',
                  border: '1px solid var(--admin-accent)',
                  borderRadius: 'var(--admin-radius-sm)',
                  color: 'var(--admin-accent)',
                  fontFamily: 'var(--admin-font-mono)',
                }}>
                  {variant.sku}
                </code>
              </div>
            )}
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            style={{
              background: 'var(--admin-error-bg)',
              border: '1px solid var(--admin-error)',
              borderRadius: 'var(--admin-radius-md)',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all var(--admin-transition-base)',
              color: 'var(--admin-error)',
              fontSize: 'var(--admin-text-xl)',
              fontWeight: 'var(--admin-font-bold)' as any,
              flexShrink: 0,
              padding: 0,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--admin-error)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--admin-error-bg)';
              e.currentTarget.style.color = 'var(--admin-error)';
            }}
          >
            <span style={{ display: 'block', transform: 'translateY(-1px)' }}>×</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              margin: 'var(--admin-space-md) var(--admin-space-lg) 0',
              padding: '1rem 1.25rem',
              background: 'var(--admin-error-bg)',
              border: '1px solid var(--admin-error)',
              borderLeft: '4px solid var(--admin-error)',
              borderRadius: 'var(--admin-radius-md)',
              color: '#991B1B',
              fontSize: 'var(--admin-text-sm)',
            }}
          >
            {error}
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            padding: 'var(--admin-space-md) var(--admin-space-lg) 0',
            display: 'flex',
            gap: 'var(--admin-space-xs)',
            borderBottom: '1px solid var(--admin-border)',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {[
            { key: 'basic', label: 'Basic Info' },
            { key: 'inventory', label: 'Inventory' },
            { key: 'physical', label: 'Physical' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'basic' | 'inventory' | 'physical')}
              style={{
                padding: '0.625rem 1.25rem',
                background: activeTab === tab.key ? 'var(--admin-accent)' : 'transparent',
                border: activeTab === tab.key ? '1px solid var(--admin-accent)' : '1px solid var(--admin-border)',
                borderBottom: 'none',
                borderRadius: 'var(--admin-radius-md) var(--admin-radius-md) 0 0',
                color: activeTab === tab.key ? 'white' : 'var(--admin-secondary)',
                fontSize: 'var(--admin-text-sm)',
                fontWeight: 'var(--admin-font-medium)' as any,
                cursor: 'pointer',
                transition: 'all var(--admin-transition-base)',
                marginBottom: '-1px',
                fontFamily: 'var(--admin-font-sans)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'var(--admin-bg-secondary)';
                  e.currentTarget.style.color = 'var(--admin-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--admin-secondary)';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content - Scrollable */}
        <div style={{ flex: 1, overflow: 'auto', padding: 'var(--admin-space-lg)', minHeight: '500px' }}>
          <form onSubmit={handleSubmit} id="variant-form">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 'var(--admin-space-lg)',
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
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
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
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Variant Type</label>
                  <select
                    style={inputStyle}
                    value={formData.variantType || 'PHYSICAL_ONLY'}
                    onChange={(e) => updateField('variantType', e.target.value)}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="DIGITAL_ONLY">Digital Only</option>
                    <option value="PHYSICAL_ONLY">Physical Only</option>
                    {/* HYBRID is deprecated - only show if editing existing HYBRID variant */}
                    {formData.variantType === 'HYBRID' && (
                      <option value="HYBRID" disabled>Hybrid (DEPRECATED - convert to separate variants)</option>
                    )}
                  </select>
                  {formData.variantType === 'HYBRID' && (
                    <p style={{ color: 'var(--admin-warning)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      ⚠️ HYBRID is deprecated. Please create separate Digital and Physical variants instead.
                    </p>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Fulfillment Type</label>
                  <select
                    style={inputStyle}
                    value={formData.fulfillmentType || 'PHYSICAL'}
                    onChange={(e) => updateField('fulfillmentType', e.target.value)}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <option value="DIGITAL">Digital Delivery</option>
                    <option value="PHYSICAL">Physical Shipping</option>
                    {/* MIXED is deprecated - only show if editing existing MIXED variant */}
                    {formData.fulfillmentType === 'MIXED' && (
                      <option value="MIXED" disabled>Mixed (DEPRECATED)</option>
                    )}
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
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
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
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Currency</label>
                  <select
                    style={inputStyle}
                    value={formData.currency || 'EUR'}
                    onChange={(e) => updateField('currency', e.target.value)}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
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
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: 'var(--admin-space-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: 'var(--admin-primary)', fontSize: 'var(--admin-text-sm)', cursor: 'pointer' }}>
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
                  gap: 'var(--admin-space-lg)',
                }}
              >
                <div>
                  <label style={labelStyle}>Stock Quantity</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.stockQuantity ?? 0}
                    onChange={(e) => updateField('stockQuantity', parseInt(e.target.value))}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Availability Status</label>
                  <select
                    style={inputStyle}
                    value={formData.availabilityStatus || 'IN_STOCK'}
                    onChange={(e) => updateField('availabilityStatus', e.target.value)}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
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
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Min Order Quantity</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.minOrderQuantity ?? 1}
                    onChange={(e) => updateField('minOrderQuantity', parseInt(e.target.value))}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
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
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: 'var(--admin-space-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--admin-space-md)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: 'var(--admin-primary)', fontSize: 'var(--admin-text-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.trackInventory ?? true}
                      onChange={(e) => updateField('trackInventory', e.target.checked)}
                      style={{ marginRight: '8px', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Track Inventory
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', color: 'var(--admin-primary)', fontSize: 'var(--admin-text-sm)', cursor: 'pointer' }}>
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
                  gap: 'var(--admin-space-lg)',
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
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Length (cm)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.lengthCm || ''}
                    onChange={(e) => updateField('lengthCm', e.target.value ? parseInt(e.target.value) : null)}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Width (cm)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.widthCm || ''}
                    onChange={(e) => updateField('widthCm', e.target.value ? parseInt(e.target.value) : null)}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Height (cm)</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={formData.heightCm || ''}
                    onChange={(e) => updateField('heightCm', e.target.value ? parseInt(e.target.value) : null)}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-accent)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px var(--admin-accent-light)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--admin-border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: 'var(--admin-space-sm)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', color: 'var(--admin-primary)', fontSize: 'var(--admin-text-sm)', cursor: 'pointer' }}>
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

          </form>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: 'var(--admin-space-lg)',
            borderTop: '1px solid var(--admin-border)',
            display: 'flex',
            gap: 'var(--admin-space-md)',
            justifyContent: 'flex-end',
            background: 'var(--admin-bg-secondary)',
            flexShrink: 0,
          }}
        >
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
