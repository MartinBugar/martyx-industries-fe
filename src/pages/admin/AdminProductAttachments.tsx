/**
 * Admin Product Attachments Management Page
 *
 * Dedicated page for managing downloadable files for a master product.
 * These attachments are public downloads (assembly guides, manuals, etc.)
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Download, FileText } from 'lucide-react';
import AdminLayout from './AdminLayout';
import type { ProductAttachmentDto } from '../../types/api';
import {
  adminGetAttachmentsForMasterProduct,
  adminDeleteAttachment
} from '../../services/productAttachmentService';
import { Button } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
import './AdminUsers.css';
import { logInfo, logWarn, logError } from '../../services/logger';

const AdminProductAttachments: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  const [attachments, setAttachments] = useState<ProductAttachmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load attachments
  const loadAttachments = async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);
      const loadedAttachments = await adminGetAttachmentsForMasterProduct(Number(productId));
      setAttachments(loadedAttachments);
    } catch (err) {
      logError('Error loading attachments:', err);
      setError('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [productId]);

  // Delete attachment
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this attachment? This will also delete the file from storage.')) return;

    try {
      await adminDeleteAttachment(id);
      // Clear cache so frontend sees changes immediately
      apiClient.clearCache();
      await loadAttachments();
    } catch (err) {
      logError('Error deleting attachment:', err);
      setError('Failed to delete attachment');
    }
  };

  // Navigate to edit page
  const handleEdit = (attachment: ProductAttachmentDto) => {
    navigate(`/admin/products/${productId}/attachments/${attachment.id}/edit`);
  };

  // Navigate to create page
  const handleCreate = () => {
    navigate(`/admin/products/${productId}/attachments/new`);
  };

  // Download file
  const handleDownload = (attachment: ProductAttachmentDto) => {
    window.open(attachment.cdnUrl || attachment.fileUrl, '_blank');
  };

  // Navigation tabs
  const navTabs = (
    <div className="admin-nav-tabs">
      <Link to={`/admin/products/${productId}`} className="admin-nav-tab">
        📝 Product Detail
      </Link>
      <Link to={`/admin/products/${productId}`} className="admin-nav-tab">
        📦 Variants
      </Link>
      <Link to={`/admin/products/${productId}/tabs`} className="admin-nav-tab">
        📋 Manage Tabs
      </Link>
      <Link to={`/admin/products/${productId}/attachments`} className="admin-nav-tab active">
        📎 Manage Attachments
      </Link>
      <Link to={`/admin/products/${productId}/gallery`} className="admin-nav-tab">
        📸 Gallery
      </Link>
      <Link to={`/admin/products/${productId}/3d-model`} className="admin-nav-tab">
        🎲 3D Model
      </Link>
      <Link to={`/admin/products/${productId}/digital-file`} className="admin-nav-tab">
        💾 Digital File
      </Link>
    </div>
  );

  return (
    <AdminLayout title="Product Attachments Management" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <div>
              <h2 style={{ marginBottom: 8 }}>Product Attachments</h2>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>
                Manage public downloadable files (assembly guides, manuals, etc.)
              </p>
            </div>
            <div className="header-actions">
              <Link to={`/admin/products/${productId}`} className="btn btn-outline">
                <ArrowLeft size={16} style={{ marginRight: 8 }} />
                Back to Product
              </Link>
              <Button variant="primary" onClick={handleCreate}>
                <Plus size={16} style={{ marginRight: 8 }} />
                Upload New File
              </Button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Attachments List */}
          {loading ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
              Loading attachments...
            </div>
          ) : attachments.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <FileText size={48} style={{ color: '#9ca3af', marginBottom: 16 }} />
              <h3 style={{ marginBottom: 8 }}>No Attachments Yet</h3>
              <p style={{ color: '#6b7280', marginBottom: 24 }}>
                Upload your first file to provide assembly guides, manuals, or other downloadable content.
              </p>
              <Button variant="primary" onClick={handleCreate}>
                <Plus size={16} style={{ marginRight: 8 }} />
                Upload First File
              </Button>
            </div>
          ) : (
            <div className="admin-card">
              <h3 className="section-title" style={{ marginBottom: 16 }}>
                Attachments ({attachments.length})
              </h3>

              <div style={{ display: 'grid', gap: 12 }}>
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="attachment-list-item"
                    style={{
                      padding: '16px 20px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    {/* File icon */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: '8px',
                        background: '#e0e7ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <FileText size={24} style={{ color: '#4338ca' }} />
                    </div>

                    {/* Attachment info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>
                          {attachment.displayLabel}
                        </span>
                        {attachment.attachmentType && (
                          <span
                            style={{
                              padding: '2px 8px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              background: '#e0e7ff',
                              color: '#4338ca',
                              fontWeight: 500
                            }}
                          >
                            {attachment.attachmentType}
                          </span>
                        )}
                        {attachment.active ? (
                          <span
                            style={{
                              padding: '2px 8px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              background: '#d1fae5',
                              color: '#065f46',
                              fontWeight: 500
                            }}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '2px 8px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              background: '#fee2e2',
                              color: '#991b1b',
                              fontWeight: 500
                            }}
                          >
                            Inactive
                          </span>
                        )}
                        {attachment.featured && (
                          <span
                            style={{
                              padding: '2px 8px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              background: '#fef3c7',
                              color: '#92400e',
                              fontWeight: 500
                            }}
                          >
                            Featured
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: 2 }}>
                        {attachment.fileName}
                        {attachment.formattedFileSize && (
                          <>
                            {' • '}
                            {attachment.formattedFileSize}
                          </>
                        )}
                        {attachment.fileFormat && (
                          <>
                            {' • '}
                            {attachment.fileFormat}
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        Downloads: {attachment.downloadCount || 0}
                        {' • '}Order: {attachment.displayOrder}
                        {' • '}Locale: {attachment.locale}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="info" size="sm" onClick={() => handleDownload(attachment)}>
                        <Download size={14} />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(attachment)}>
                        <Edit size={14} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(attachment.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProductAttachments;
