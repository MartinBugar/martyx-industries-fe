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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h3>{component ? 'Edit Component' : 'Add New Component'}</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Component Type *</label>
              <select
                className="form-input"
                value={formData.componentType || 'STL_FILES'}
                onChange={(e) => updateField('componentType', e.target.value)}
                required
              >
                <optgroup label="Digital Components">
                  <option value="STL_FILES">STL Files</option>
                  <option value="ASSEMBLY_GUIDE">Assembly Guide</option>
                  <option value="BOM">Bill of Materials</option>
                  <option value="SOFTWARE">Software</option>
                </optgroup>
                <optgroup label="Physical Components">
                  <option value="PRINTED_PARTS">3D Printed Parts</option>
                  <option value="MECHANICAL_PARTS">Mechanical Parts</option>
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="FASTENERS">Fasteners</option>
                  <option value="TOOLS">Tools</option>
                  <option value="PACKAGING">Packaging</option>
                </optgroup>
                <optgroup label="Extras">
                  <option value="GIFT">Gift</option>
                  <option value="OTHER">Other</option>
                </optgroup>
              </select>
              <div style={{ marginTop: 8, fontSize: '13px', color: '#6b7280' }}>
                <Badge variant={isDigitalType() ? 'info' : 'success'} size="sm">
                  {isDigitalType() ? 'Digital (Downloadable)' : 'Physical (Shipped)'}
                </Badge>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Component Name *</label>
              <input
                className="form-input"
                value={formData.componentName || ''}
                onChange={(e) => updateField('componentName', e.target.value)}
                placeholder="e.g., Complete STL Files Package, Servo Motors"
                required
              />
            </div>

            <div>
              <label className="form-label">Quantity</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.quantity ?? 1}
                onChange={(e) => updateField('quantity', parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="form-label">Display Order</label>
              <input
                type="number"
                className="form-input"
                value={formData.displayOrder ?? 0}
                onChange={(e) => updateField('displayOrder', parseInt(e.target.value))}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief description of this component"
              />
            </div>

            {/* Digital File Properties */}
            {isDigitalType() && (
              <>
                <div style={{ gridColumn: '1 / -1' }}>
                  <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                  <h4 style={{ marginBottom: 12, fontSize: '14px', fontWeight: 600 }}>Digital File Properties</h4>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">File Path/URL</label>
                  <input
                    className="form-input"
                    value={formData.filePath || ''}
                    onChange={(e) => updateField('filePath', e.target.value)}
                    placeholder="/files/endeavour/stl/complete.zip or https://..."
                  />
                </div>

                <div>
                  <label className="form-label">File Format</label>
                  <input
                    className="form-input"
                    value={formData.fileFormat || ''}
                    onChange={(e) => updateField('fileFormat', e.target.value)}
                    placeholder="ZIP, PDF, STL, STEP"
                  />
                </div>

                <div>
                  <label className="form-label">File Size (bytes)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.fileSizeBytes || ''}
                    onChange={(e) => updateField('fileSizeBytes', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="e.g., 52428800 (50 MB)"
                  />
                  {formData.fileSizeBytes && (
                    <div style={{ marginTop: 4, fontSize: '12px', color: '#6b7280' }}>
                      ≈ {(formData.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="form-actions" style={{ marginTop: 24 }}>
            <Button variant="primary" type="submit" disabled={saving} loading={saving} icon={component ? Save : Plus}>
              {component ? 'Save Changes' : 'Add Component'}
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

export default ComponentEditor;
