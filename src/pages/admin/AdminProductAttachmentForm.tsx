/**
 * Admin Product Attachment Form
 *
 * Form for uploading new attachments or editing existing attachment metadata
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, Save } from 'lucide-react';
import AdminLayout from './AdminLayout';
import type { ProductAttachmentDto } from '../../types/api';
import {
  adminUploadAttachment,
  adminUpdateAttachment,
  adminGetAttachmentById
} from '../../services/productAttachmentService';
import { Button } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
import './AdminUsers.css';
import { logInfo, logWarn, logError } from '../../services/logger';

const ATTACHMENT_TYPES = [
  'ASSEMBLY_GUIDE',
  'USER_MANUAL',
  'WIRING_DIAGRAM',
  'PARTS_LIST',
  'QUICK_START_GUIDE',
  'DATASHEET',
  'VIDEO_TUTORIAL',
  'SOURCE_CODE',
  'OTHER'
];

const AdminProductAttachmentForm: React.FC = () => {
  const { productId, attachmentId } = useParams<{ productId: string; attachmentId?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!attachmentId;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    displayLabel: '',
    description: '',
    attachmentType: 'OTHER',
    iconName: '',
    displayOrder: 0,
    active: true,
    featured: false,
    locale: 'en'
  });

  const [existingAttachment, setExistingAttachment] = useState<ProductAttachmentDto | null>(null);

  // Load existing attachment for edit mode
  useEffect(() => {
    if (isEditMode && attachmentId) {
      loadAttachment();
    }
  }, [attachmentId]);

  const loadAttachment = async () => {
    if (!attachmentId) return;

    try {
      setLoading(true);
      const attachment = await adminGetAttachmentById(Number(attachmentId));
      setExistingAttachment(attachment);
      setFormData({
        displayLabel: attachment.displayLabel,
        description: attachment.description || '',
        attachmentType: attachment.attachmentType || 'OTHER',
        iconName: attachment.iconName || '',
        displayOrder: attachment.displayOrder,
        active: attachment.active,
        featured: attachment.featured,
        locale: attachment.locale
      });
    } catch (err) {
      logError('Error loading attachment:', err);
      setError('Failed to load attachment');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Auto-fill display label if empty
      if (!formData.displayLabel) {
        setFormData({
          ...formData,
          displayLabel: e.target.files[0].name
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError(null);

    // Validate
    const errors: Record<string, string> = {};
    if (!isEditMode && !selectedFile) {
      errors.file = 'Please select a file to upload';
    }
    if (!formData.displayLabel.trim()) {
      errors.displayLabel = 'Display label is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSaving(true);

      if (isEditMode && attachmentId) {
        // Update metadata only
        await adminUpdateAttachment(Number(attachmentId), {
          displayLabel: formData.displayLabel,
          description: formData.description || undefined,
          attachmentType: formData.attachmentType,
          displayOrder: formData.displayOrder,
          active: formData.active,
          featured: formData.featured,
          locale: formData.locale
        });
      } else if (selectedFile && productId) {
        // Upload new file
        await adminUploadAttachment(selectedFile, {
          masterProductId: Number(productId),
          displayLabel: formData.displayLabel,
          description: formData.description || undefined,
          attachmentType: formData.attachmentType,
          displayOrder: formData.displayOrder,
          active: formData.active,
          featured: formData.featured,
          locale: formData.locale
        });
      }

      // Clear cache
      apiClient.clearCache();

      // Navigate back to list
      navigate(`/admin/products/${productId}/attachments`);
    } catch (err: any) {
      logError('Error saving attachment:', err);
      setError(err.message || 'Failed to save attachment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={isEditMode ? 'Edit Attachment' : 'Upload Attachment'}>
        <div className="admin-page">
          <div className="admin-container">
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
              Loading...
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditMode ? 'Edit Attachment' : 'Upload New Attachment'}>
      <div className="admin-page">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <div>
              <h2 style={{ marginBottom: 8 }}>
                {isEditMode ? 'Edit Attachment' : 'Upload New Attachment'}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                {isEditMode
                  ? 'Update attachment metadata (file cannot be changed)'
                  : 'Upload a new file for public download'}
              </p>
            </div>
            <div className="header-actions">
              <Link to={`/admin/products/${productId}/attachments`} className="btn btn-outline">
                <ArrowLeft size={16} style={{ marginRight: 8 }} />
                Back to Attachments
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 24 }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="admin-card">
              <h3 className="section-title" style={{ marginBottom: 24 }}>
                {isEditMode ? 'Edit Attachment' : 'Upload New Attachment'}
              </h3>

              {/* File Upload Section (only in create mode) */}
              {!isEditMode && (
                <div style={{ marginBottom: 32 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
                    File Upload
                  </h4>

                  <div className="form-group">
                    <label className="form-label">
                      Select File <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="form-control"
                      accept=".pdf,.zip,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.svg"
                      style={fieldErrors.file ? { borderColor: '#ef4444' } : {}}
                    />
                    {fieldErrors.file && (
                      <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>
                        ⚠ {fieldErrors.file}
                      </div>
                    )}
                    {selectedFile && (
                      <div style={{ marginTop: 8, fontSize: '13px', color: '#10B981', fontWeight: 500 }}>
                        ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                    <small style={{ color: '#6b7280', fontSize: '13px' }}>
                      Supported formats: PDF, ZIP, DOC, DOCX, TXT, MD, PNG, JPG, SVG
                    </small>
                  </div>
                </div>
              )}

              {/* Current File Info (edit mode) */}
              {isEditMode && existingAttachment && (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ padding: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 12, color: '#0c4a6e' }}>
                      Current File
                    </h4>
                    <div style={{ fontSize: '14px', color: '#0c4a6e', display: 'grid', gap: 6 }}>
                      <div><strong>File:</strong> {existingAttachment.fileName}</div>
                      {existingAttachment.formattedFileSize && (
                        <div><strong>Size:</strong> {existingAttachment.formattedFileSize}</div>
                      )}
                      {existingAttachment.fileFormat && (
                        <div><strong>Format:</strong> {existingAttachment.fileFormat}</div>
                      )}
                      <div style={{ marginTop: 8 }}>
                        <a
                          href={existingAttachment.cdnUrl || existingAttachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#0284c7', textDecoration: 'underline', fontSize: '14px', fontWeight: 500 }}
                        >
                          View/Download File →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
                  Basic Information
                </h4>

                <div style={{ display: 'grid', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">
                      Display Label <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.displayLabel}
                      onChange={(e) => setFormData({ ...formData, displayLabel: e.target.value })}
                      placeholder="e.g., Complete Assembly Guide"
                      style={fieldErrors.displayLabel ? { borderColor: '#ef4444' } : {}}
                    />
                    {fieldErrors.displayLabel && (
                      <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>
                        ⚠ {fieldErrors.displayLabel}
                      </div>
                    )}
                    <small style={{ color: '#6b7280', fontSize: '13px' }}>
                      The name shown to users when viewing attachments.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description shown to users"
                      rows={3}
                    />
                    <small style={{ color: '#6b7280', fontSize: '13px' }}>
                      Brief description of what this file contains (optional).
                    </small>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16, color: '#374151' }}>
                  Configuration
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="form-group">
                    <label className="form-label">Attachment Type</label>
                    <select
                      className="form-control"
                      value={formData.attachmentType}
                      onChange={(e) => setFormData({ ...formData, attachmentType: e.target.value })}
                    >
                      {ATTACHMENT_TYPES.map(type => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: '#6b7280', fontSize: '13px' }}>
                      Category of this attachment.
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Display Order</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                      min={0}
                    />
                    <small style={{ color: '#6b7280', fontSize: '13px' }}>
                      Lower numbers appear first.
                    </small>
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

                <div style={{ display: 'flex', gap: 24 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>Active (visible to users)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#374151' }}>Featured</span>
                  </label>
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
                    isEditMode ? 'Saving...' : 'Uploading...'
                  ) : (
                    <>
                      {isEditMode ? <Save size={16} style={{ marginRight: 8 }} /> : <Upload size={16} style={{ marginRight: 8 }} />}
                      {isEditMode ? 'Save Changes' : 'Upload File'}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/admin/products/${productId}/attachments`)}
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

export default AdminProductAttachmentForm;
