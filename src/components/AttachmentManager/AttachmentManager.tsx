import React, { useState, useEffect } from 'react';
import {
  adminGetAttachmentsForVariant,
  adminUploadAttachment,
  adminDeleteAttachment
} from '../../services/productAttachmentService';
import type { ProductAttachmentDto } from '../../types/api';
import './AttachmentManager.css';

interface AttachmentManagerProps {
  variantId: number;
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({ variantId }) => {
  const [attachments, setAttachments] = useState<ProductAttachmentDto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayLabel, setDisplayLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadAttachments();
  }, [variantId]);

  const loadAttachments = async () => {
    try {
      const data = await adminGetAttachmentsForVariant(variantId);
      setAttachments(data);
    } catch (err) {
      console.error('Failed to load attachments', err);
      setError('Failed to load attachments');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !displayLabel.trim()) {
      setError('Please select a file and enter a label');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      await adminUploadAttachment(selectedFile, {
        variantId,
        displayLabel,
        description,
        active: true,
        displayOrder: attachments.length
      });

      // Reset form
      setSelectedFile(null);
      setDisplayLabel('');
      setDescription('');

      // Clear file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reload
      await loadAttachments();
    } catch (err: any) {
      console.error('Upload failed', err);
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;

    try {
      await adminDeleteAttachment(id);
      await loadAttachments();
    } catch (err) {
      console.error('Delete failed', err);
      setError('Failed to delete attachment');
    }
  };

  return (
    <div className="attachment-manager">
      <h4>📎 Attachments (Assembly Guides, Manuals)</h4>

      {error && <div className="error-message">{error}</div>}

      {/* Upload Form */}
      <div className="upload-form">
        <h5>Upload New File</h5>
        <input
          type="file"
          accept=".pdf,.zip,.doc,.docx,.txt"
          onChange={handleFileChange}
        />
        {selectedFile && (
          <div className="selected-file">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
        <input
          type="text"
          placeholder="Display Label (e.g., 'Assembly Guide')"
          value={displayLabel}
          onChange={(e) => setDisplayLabel(e.target.value)}
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : '⬆️ Upload'}
        </button>
      </div>

      {/* Attachments List */}
      <div className="attachments-list">
        <h5>Existing Attachments ({attachments.length})</h5>
        {attachments.length === 0 && <p>No attachments yet.</p>}
        {attachments.map((att) => (
          <div key={att.id} className="attachment-item">
            <div className="attachment-info">
              <strong>{att.displayLabel}</strong>
              <span className="file-name">{att.fileName}</span>
              <span className="file-size">{att.formattedFileSize || `${(att.fileSizeBytes || 0) / 1024 / 1024} MB`}</span>
              {att.description && <p className="attachment-description">{att.description}</p>}
            </div>
            <div className="attachment-actions">
              <a href={att.cdnUrl || att.fileUrl} target="_blank" rel="noopener noreferrer">
                📥 Download
              </a>
              <button onClick={() => handleDelete(att.id)} className="btn-delete">
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentManager;
