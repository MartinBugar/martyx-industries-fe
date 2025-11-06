/**
 * Admin Master Product Tab Form Page
 *
 * Dedicated page for creating or editing a product tab for a master product.
 * These tabs are shared by all variants unless overridden.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Download } from 'lucide-react';
import AdminLayout from './AdminLayout';
import type { ProductTabDto, ProductTabCreateRequest, ProductTabTemplate } from '../../types/api';
import {
  adminGetTabById,
  adminCreateTab,
  adminUpdateTab,
  adminGetTabTemplates
} from '../../services/productTabService';
import { Button } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
import './AdminUsers.css';

const AdminMasterProductTabForm: React.FC = () => {
  const { productId, tabId } = useParams<{
    productId: string;
    tabId?: string;
  }>();
  const navigate = useNavigate();
  const isEditMode = !!tabId && tabId !== 'new';

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<ProductTabTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const [formData, setFormData] = useState<ProductTabCreateRequest>({
    masterProductId: productId ? Number(productId) : null,
    variantId: null,
    tabKey: '',
    tabLabel: '',
    contentType: 'HTML',
    contentHtml: '',
    contentMarkdown: '',
    contentJson: '',
    componentName: '',
    displayOrder: 0,
    iconName: '',
    isActive: true,
    showForVariantType: '',
    requiresAuthentication: false,
    locale: 'en',
    description: '',
    cssClass: ''
  });

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const loadedTemplates = await adminGetTabTemplates();
        setTemplates(loadedTemplates);
      } catch (err) {
        console.error('Error loading templates:', err);
      }
    };
    loadTemplates();
  }, []);

  // Load existing tab data if editing
  useEffect(() => {
    if (isEditMode && tabId) {
      loadTab(Number(tabId));
    }
  }, [tabId, isEditMode]);

  const loadTab = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const tab = await adminGetTabById(id);

      setFormData({
        masterProductId: tab.masterProductId,
        variantId: tab.variantId,
        tabKey: tab.tabKey,
        tabLabel: tab.tabLabel,
        contentType: tab.contentType,
        contentHtml: tab.contentHtml || '',
        contentMarkdown: tab.contentMarkdown || '',
        contentJson: tab.contentJson || '',
        componentName: tab.componentName || '',
        displayOrder: tab.displayOrder,
        iconName: tab.iconName || '',
        isActive: tab.isActive,
        showForVariantType: tab.showForVariantType || '',
        requiresAuthentication: tab.requiresAuthentication,
        locale: tab.locale,
        description: tab.description || '',
        cssClass: tab.cssClass || ''
      });
    } catch (err) {
      console.error('Error loading tab:', err);
      setError('Failed to load tab');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setError(null);
    setFieldErrors({});

    // Client-side validation
    if (!formData.tabKey || !formData.tabLabel) {
      setError('Tab Key and Tab Label are required');
      return;
    }

    try {
      setSaving(true);

      if (isEditMode && tabId) {
        await adminUpdateTab(Number(tabId), formData);
      } else {
        await adminCreateTab(formData);
      }

      // Clear cache so frontend sees new tabs immediately
      apiClient.clearCache();

      // Navigate back to tabs list
      navigate(`/admin/products/${productId}/tabs`);
    } catch (err: any) {
      console.error('Error saving tab:', err);

      // Parse validation errors from backend
      const errorData = err.errorData || err.response?.data || {};

      if (errorData.details && Array.isArray(errorData.details)) {
        const errors: Record<string, string> = {};
        errorData.details.forEach((detail: any) => {
          if (detail.field && detail.message) {
            errors[detail.field] = detail.message;
          }
        });
        setFieldErrors(errors);
        setError('Please fix the validation errors below');
      } else if (errorData.message) {
        setError(errorData.message);
      } else {
        setError('Failed to save tab');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/products/${productId}/tabs`);
  };

  const handleLoadTemplate = () => {
    if (!selectedTemplateId) return;

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    setFormData({
      ...formData,
      tabKey: template.defaultTabKey,
      tabLabel: template.defaultTabLabel,
      contentType: template.contentType,
      contentHtml: template.defaultContentHtml || '',
      contentMarkdown: template.defaultContentMarkdown || '',
      contentJson: template.defaultContentJson || '',
      componentName: template.defaultComponentName || '',
      displayOrder: template.defaultDisplayOrder,
      iconName: template.defaultIconName || '',
      description: template.description || ''
    });

    setError(null);
    setFieldErrors({});
  };

  if (loading) {
    return (
      <AdminLayout title={isEditMode ? 'Edit Tab' : 'Create Tab'}>
        <div className="admin-page">
          <div className="admin-container">
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
              Loading tab data...
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditMode ? 'Edit Master Product Tab' : 'Create New Master Product Tab'}>
      <div className="admin-page">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <div>
              <h2 style={{ marginBottom: 8 }}>
                {isEditMode ? 'Edit Master Product Tab' : 'Create New Master Product Tab'}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                This tab will be shared by all variants unless overridden
              </p>
            </div>
            <div className="header-actions">
              <Link
                to={`/admin/products/${productId}/tabs`}
                className="btn btn-outline"
              >
                <ArrowLeft size={16} style={{ marginRight: 8 }} />
                Back to Tabs
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 24 }}>
              <strong>{error}</strong>
              {Object.keys(fieldErrors).length > 0 && (
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                  {Object.entries(fieldErrors).map(([field, message]) => (
                    <li key={field}>
                      <strong>{field}:</strong> {message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Template Selector */}
          {!isEditMode && templates.length > 0 && (
            <div className="admin-card" style={{ marginBottom: 24, background: '#f0f9ff', borderColor: '#bae6fd' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 16, color: '#0c4a6e' }}>
                Start from Template
              </h4>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ color: '#0c4a6e' }}>
                    Choose a template to pre-fill the form
                  </label>
                  <select
                    className="form-control"
                    value={selectedTemplateId || ''}
                    onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">-- Select Template --</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.templateName} - {template.defaultTabLabel}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="info"
                  onClick={handleLoadTemplate}
                  disabled={!selectedTemplateId}
                  style={{ minWidth: 140 }}
                >
                  <Download size={16} style={{ marginRight: 8 }} />
                  Load Template
                </Button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="admin-card">
              <h3 className="section-title" style={{ marginBottom: 24 }}>
                {isEditMode ? 'Edit Tab' : 'Create New Tab'}
              </h3>

              {/* Basic Information */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
                  Basic Information
                </h4>

                <div style={{ display: 'grid', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">
                      Tab Key (slug) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.tabKey}
                      onChange={(e) => {
                        setFormData({ ...formData, tabKey: e.target.value });
                        if (fieldErrors.tabKey) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.tabKey;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="e.g., details, features, reviews"
                      required
                      style={fieldErrors.tabKey ? { borderColor: '#ef4444' } : {}}
                    />
                    {fieldErrors.tabKey && (
                      <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>
                        ⚠ {fieldErrors.tabKey}
                      </div>
                    )}
                    <small style={{ color: '#6b7280', fontSize: '13px' }}>
                      Unique identifier for this tab. Use lowercase with hyphens (e.g., details-tab, features, info-sheet).
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Tab Label (Display Name) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.tabLabel}
                      onChange={(e) => {
                        setFormData({ ...formData, tabLabel: e.target.value });
                        if (fieldErrors.tabLabel) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.tabLabel;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="e.g., Product Details"
                      required
                      style={fieldErrors.tabLabel ? { borderColor: '#ef4444' } : {}}
                    />
                    {fieldErrors.tabLabel && (
                      <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>
                        ⚠ {fieldErrors.tabLabel}
                      </div>
                    )}
                    <small style={{ color: '#6b7280', fontSize: '13px' }}>
                      The label shown to users on the tab button.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of this tab's purpose"
                    />
                  </div>
                </div>
              </div>

              {/* Content Configuration */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
                  Content Configuration
                </h4>

                <div style={{ display: 'grid', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Content Type</label>
                    <select
                      className="form-control"
                      value={formData.contentType}
                      onChange={(e) => setFormData({ ...formData, contentType: e.target.value as any })}
                    >
                      <option value="HTML">HTML</option>
                      <option value="MARKDOWN">Markdown</option>
                      <option value="JSON">JSON</option>
                      <option value="COMPONENT">Component</option>
                    </select>
                  </div>

                  {formData.contentType === 'HTML' && (
                    <div className="form-group">
                      <label className="form-label">HTML Content</label>
                      <textarea
                        className="form-control"
                        value={formData.contentHtml || ''}
                        onChange={(e) => setFormData({ ...formData, contentHtml: e.target.value })}
                        rows={20}
                        placeholder="Enter HTML content..."
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                    </div>
                  )}

                  {formData.contentType === 'MARKDOWN' && (
                    <div className="form-group">
                      <label className="form-label">Markdown Content</label>
                      <textarea
                        className="form-control"
                        value={formData.contentMarkdown || ''}
                        onChange={(e) => setFormData({ ...formData, contentMarkdown: e.target.value })}
                        rows={20}
                        placeholder="Enter Markdown content..."
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                    </div>
                  )}

                  {formData.contentType === 'JSON' && (
                    <div className="form-group">
                      <label className="form-label">JSON Content</label>
                      <textarea
                        className="form-control"
                        value={formData.contentJson || ''}
                        onChange={(e) => setFormData({ ...formData, contentJson: e.target.value })}
                        rows={20}
                        placeholder='{"key": "value"}'
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      />
                    </div>
                  )}

                  {formData.contentType === 'COMPONENT' && (
                    <div className="form-group">
                      <label className="form-label">Component Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.componentName || ''}
                        onChange={(e) => setFormData({ ...formData, componentName: e.target.value })}
                        placeholder="e.g., DetailsTab, ReviewsTab"
                      />
                      <small style={{ color: '#6b7280', fontSize: '13px' }}>
                        Name of the React component to render for this tab.
                      </small>
                    </div>
                  )}
                </div>
              </div>

              {/* Display Settings */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
                  Display Settings
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Display Order</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.displayOrder}
                      onChange={(e) => {
                        setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 });
                        if (fieldErrors.displayOrder) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.displayOrder;
                            return newErrors;
                          });
                        }
                      }}
                      min="0"
                      style={fieldErrors.displayOrder ? { borderColor: '#ef4444' } : {}}
                    />
                    {fieldErrors.displayOrder && (
                      <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>
                        ⚠ {fieldErrors.displayOrder}
                      </div>
                    )}
                    <small style={{ color: '#6b7280', fontSize: '13px' }}>
                      Lower numbers appear first.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Icon Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.iconName || ''}
                      onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                      placeholder="e.g., FileText, Star"
                    />
                    <small style={{ color: '#6b7280', fontSize: '13px' }}>
                      Lucide icon name (optional).
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">CSS Class</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.cssClass || ''}
                      onChange={(e) => setFormData({ ...formData, cssClass: e.target.value })}
                      placeholder="custom-tab-class"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Locale</label>
                    <select
                      className="form-control"
                      value={formData.locale}
                      onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                    >
                      <option value="en">English (en)</option>
                      <option value="sk">Slovak (sk)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
                  Advanced Settings
                </h4>

                <div style={{ display: 'grid', gap: 16 }}>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>Active</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.requiresAuthentication}
                        onChange={(e) => setFormData({ ...formData, requiresAuthentication: e.target.checked })}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: '#374151' }}>Requires Authentication</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{
                display: 'flex',
                gap: 12,
                paddingTop: 24,
                borderTop: '1px solid #e5e7eb'
              }}>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  style={{ minWidth: 120 }}
                >
                  {saving ? (
                    'Saving...'
                  ) : (
                    <>
                      <Save size={16} style={{ marginRight: 8 }} />
                      {isEditMode ? 'Update Tab' : 'Create Tab'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMasterProductTabForm;
