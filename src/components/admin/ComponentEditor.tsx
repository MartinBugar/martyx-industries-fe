import React, { useState, useEffect } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { Button, Badge } from '../ui';
import type { VariantComponentDto } from '../../services/adminProductsService';

interface ComponentEditorProps {
  component?: VariantComponentDto | null;
  variantId: number;
  onSave: (component: VariantComponentDto) => Promise<void>;
  onCancel: () => void;
}

const emptyComponent: Partial<VariantComponentDto> = {
  componentName: '',
  componentType: 'STL_FILES',
  quantity: 1,
  description: '',
  displayOrder: 0,
};

export const ComponentEditor: React.FC<ComponentEditorProps> = ({
  component,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<VariantComponentDto>>({ ...emptyComponent });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (component) {
      setFormData({ ...component });
    } else {
      setFormData({ ...emptyComponent });
    }
  }, [component]);

  const updateField = (key: keyof VariantComponentDto, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.componentName?.trim()) {
      setError('Component name is required');
      return;
    }
    if (!formData.componentType) {
      setError('Component type is required');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData as VariantComponentDto);
    } catch (e: any) {
      setError(e.message || 'Failed to save component');
      setSaving(false);
    }
  };

  const isDigitalType = () => {
    const digitalTypes = ['STL_FILES', 'ASSEMBLY_GUIDE', 'BOM', 'SOFTWARE'];
    return digitalTypes.includes(formData.componentType || '');
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
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid #4B5563',
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
          }}
        >
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#ffffff' }}>
            {component ? 'Edit Component' : 'Add New Component'}
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
              margin: '20px 28px',
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px 28px' }}>
            {/* Component Type */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#9CA3AF', marginBottom: 8 }}>
                Component Type *
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  background: '#0F1115',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                value={formData.componentType || 'STL_FILES'}
                onChange={(e) => updateField('componentType', e.target.value)}
                required
                onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#374151'}
              >
                <optgroup label="Digital Components" style={{ background: '#1F2538', color: '#ffffff' }}>
                  <option value="STL_FILES">STL Files</option>
                  <option value="ASSEMBLY_GUIDE">Assembly Guide</option>
                  <option value="BOM">Bill of Materials</option>
                  <option value="SOFTWARE">Software</option>
                </optgroup>
                <optgroup label="Physical Components" style={{ background: '#1F2538', color: '#ffffff' }}>
                  <option value="PRINTED_PARTS">3D Printed Parts</option>
                  <option value="MECHANICAL_PARTS">Mechanical Parts</option>
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="FASTENERS">Fasteners</option>
                  <option value="TOOLS">Tools</option>
                  <option value="PACKAGING">Packaging</option>
                </optgroup>
                <optgroup label="Extras" style={{ background: '#1F2538', color: '#ffffff' }}>
                  <option value="GIFT">Gift</option>
                  <option value="OTHER">Other</option>
                </optgroup>
              </select>
              <div style={{ marginTop: 8 }}>
                <Badge variant={isDigitalType() ? 'info' : 'success'} size="sm">
                  {isDigitalType() ? 'Digital (Downloadable)' : 'Physical (Shipped)'}
                </Badge>
              </div>
            </div>

            {/* Component Name */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#9CA3AF', marginBottom: 8 }}>
                Component Name *
              </label>
              <input
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  background: '#0F1115',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
                value={formData.componentName || ''}
                onChange={(e) => updateField('componentName', e.target.value)}
                placeholder="e.g., Complete STL Files Package, Servo Motors"
                required
                onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#374151'}
              />
            </div>

            {/* Quantity & Display Order */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#9CA3AF', marginBottom: 8 }}>
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #374151',
                    background: '#0F1115',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  value={formData.quantity ?? 1}
                  onChange={(e) => updateField('quantity', parseInt(e.target.value))}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#374151'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#9CA3AF', marginBottom: 8 }}>
                  Display Order
                </label>
                <input
                  type="number"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #374151',
                    background: '#0F1115',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  value={formData.displayOrder ?? 0}
                  onChange={(e) => updateField('displayOrder', parseInt(e.target.value))}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#374151'}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#9CA3AF', marginBottom: 8 }}>
                Description
              </label>
              <textarea
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #374151',
                  background: '#0F1115',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  resize: 'vertical',
                  minHeight: '80px',
                }}
                rows={3}
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief description of this component"
                onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#374151'}
              />
            </div>

            {/* Digital File Properties */}
            {isDigitalType() && (
              <>
                <div
                  style={{
                    margin: '32px 0 24px 0',
                    paddingTop: 24,
                    borderTop: '1px solid #374151',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 20px 0',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#9CA3AF',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Digital File Properties
                  </h4>

                  {/* File Path/URL */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#9CA3AF', marginBottom: 8 }}>
                      File Path/URL
                    </label>
                    <input
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid #374151',
                        background: '#0F1115',
                        color: '#ffffff',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                      }}
                      value={formData.filePath || ''}
                      onChange={(e) => updateField('filePath', e.target.value)}
                      placeholder="/files/endeavour/stl/complete.zip or https://..."
                      onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#374151'}
                    />
                  </div>

                  {/* File Format & Size */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#9CA3AF', marginBottom: 8 }}>
                        File Format
                      </label>
                      <input
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid #374151',
                          background: '#0F1115',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                        }}
                        value={formData.fileFormat || ''}
                        onChange={(e) => updateField('fileFormat', e.target.value)}
                        placeholder="ZIP, PDF, STL, STEP"
                        onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#374151'}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#9CA3AF', marginBottom: 8 }}>
                        File Size (bytes)
                      </label>
                      <input
                        type="number"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid #374151',
                          background: '#0F1115',
                          color: '#ffffff',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                        }}
                        value={formData.fileSizeBytes || ''}
                        onChange={(e) => updateField('fileSizeBytes', e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="e.g., 52428800 (50 MB)"
                        onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#374151'}
                      />
                      {formData.fileSizeBytes && (
                        <div style={{ marginTop: 6, fontSize: '12px', color: '#6B7280' }}>
                          ≈ {(formData.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '20px 28px',
              borderTop: '1px solid #374151',
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              background: 'rgba(15, 17, 21, 0.5)',
            }}
          >
            <Button variant="outline" type="button" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving} loading={saving} icon={component ? Save : Plus}>
              {component ? 'Save Changes' : 'Add Component'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComponentEditor;
