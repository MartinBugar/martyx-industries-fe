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
import './AdminProductAttachmentForm.css';
import { logError } from '../../services/logger';

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
    } catch (err: unknown) {
      logError('Error saving attachment:', err);
      const message = err instanceof Error ? err.message : 'Failed to save attachment';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={isEditMode ? 'Edit Attachment' : 'Upload Attachment'}>
        <div className="admin-page">
          <div className="admin-container">
            <div className="admin-card admin-attach-form-loading">
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
              <h2 className="admin-attach-form-title">
                {isEditMode ? 'Edit Attachment' : 'Upload New Attachment'}
              </h2>
              <p className="admin-attach-form-subtitle">
                {isEditMode
                  ? 'Update attachment metadata (file cannot be changed)'
                  : 'Upload a new file for public download'}
              </p>
            </div>
            <div className="header-actions">
              <Link to={`/admin/products/${productId}/attachments`} className="btn btn-outline">
                <ArrowLeft size={16} className="admin-attach-form-back-icon" />
                Back to Attachments
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-error admin-attach-form-error">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="admin-card">
              <h3 className="section-title admin-attach-form-section-title">
                {isEditMode ? 'Edit Attachment' : 'Upload New Attachment'}
              </h3>

              {/* File Upload Section (only in create mode) */}
              {!isEditMode && (
                <div className="admin-attach-form-section">
                  <h4 className="admin-attach-form-section-heading">
                    File Upload
                  </h4>

                  <div className="form-group">
                    <label className="form-label">
                      Select File <span className="admin-attach-form-required">*</span>
                    </label>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className={`form-control ${fieldErrors.file ? 'is-invalid' : ''}`}
                      accept=".pdf,.zip,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.svg"
                    />
                    {fieldErrors.file && (
                      <div className="admin-attach-form-field-error">
                        ⚠ {fieldErrors.file}
                      </div>
                    )}
                    {selectedFile && (
                      <div className="admin-attach-form-success">
                        ✓ Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    )}
                    <small className="admin-attach-form-hint">
                      Supported formats: PDF, ZIP, DOC, DOCX, TXT, MD, PNG, JPG, SVG
                    </small>
                  </div>
                </div>
              )}

              {/* Current File Info (edit mode) */}
              {isEditMode && existingAttachment && (
                <div className="admin-attach-form-section">
                  <div className="admin-attach-form-info-box">
                    <h4 className="admin-attach-form-info-title">
                      Current File
                    </h4>
                    <div className="admin-attach-form-info-content">
                      <div><strong>File:</strong> {existingAttachment.fileName}</div>
                      {existingAttachment.formattedFileSize && (
                        <div><strong>Size:</strong> {existingAttachment.formattedFileSize}</div>
                      )}
                      {existingAttachment.fileFormat && (
                        <div><strong>Format:</strong> {existingAttachment.fileFormat}</div>
                      )}
                      <div className="admin-attach-form-info-link-wrap">
                        <a
                          href={existingAttachment.cdnUrl || existingAttachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-attach-form-info-link"
                        >
                          View/Download File →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="admin-attach-form-section">
                <h4 className="admin-attach-form-section-heading">
                  Basic Information
                </h4>

                <div className="admin-attach-form-fields">
                  <div className="form-group">
                    <label className="form-label">
                      Display Label <span className="admin-attach-form-required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control ${fieldErrors.displayLabel ? 'is-invalid' : ''}`}
                      value={formData.displayLabel}
                      onChange={(e) => setFormData({ ...formData, displayLabel: e.target.value })}
                      placeholder="e.g., Complete Assembly Guide"
                    />
                    {fieldErrors.displayLabel && (
                      <div className="admin-attach-form-field-error">
                        ⚠ {fieldErrors.displayLabel}
                      </div>
                    )}
                    <small className="admin-attach-form-hint">
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
                    <small className="admin-attach-form-hint">
                      Brief description of what this file contains (optional).
                    </small>
                  </div>
                </div>
              </div>

              {/* Configuration */}
              <div className="admin-attach-form-section">
                <h4 className="admin-attach-form-section-heading">
                  Configuration
                </h4>

                <div className="admin-attach-form-grid-2col">
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
                    <small className="admin-attach-form-hint">
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
                    <small className="admin-attach-form-hint">
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
              <div className="admin-attach-form-section">
                <h4 className="admin-attach-form-section-heading">
                  Advanced Settings
                </h4>

                <div className="admin-attach-form-checkboxes">
                  <label className="admin-attach-form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="admin-attach-form-checkbox"
                    />
                    <span className="admin-attach-form-checkbox-text">Active (visible to users)</span>
                  </label>

                  <label className="admin-attach-form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="admin-attach-form-checkbox"
                    />
                    <span className="admin-attach-form-checkbox-text">Featured</span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="admin-attach-form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="admin-attach-form-submit-btn"
                >
                  {saving ? (
                    isEditMode ? 'Saving...' : 'Uploading...'
                  ) : (
                    <>
                      {isEditMode ? <Save size={16} className="admin-attach-form-btn-icon" /> : <Upload size={16} className="admin-attach-form-btn-icon" />}
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
