/**
 * ProductDownloads Component
 *
 * Displays attachments for a product (master product or variant)
 * Used in product tabs with contentType: COMPONENT and componentName: ProductDownloads
 *
 * If tabId is provided, shows only attachments assigned to that specific tab.
 * Otherwise, shows all product attachments.
 */

import React, { useEffect, useState } from 'react';
import { Download, FileText, File, AlertCircle } from 'lucide-react';
import {
  getAttachmentsForMasterProduct,
  getAttachmentsForVariant,
  trackDownload
} from '../../services/productAttachmentService';
import { getAttachmentsForTab } from '../../services/productTabService';
import type { ProductAttachmentDto } from '../../types/api';
import { downloadFile } from '../../services/download';
import './ProductDownloads.css';
import { logInfo, logError } from '../../services/logger';
import toast from 'react-hot-toast';

interface ProductDownloadsProps {
  masterProductId?: number;
  variantId?: number;
  tabId?: number; // If provided, load only attachments assigned to this tab
}

const ProductDownloads: React.FC<ProductDownloadsProps> = ({
  masterProductId,
  variantId,
  tabId
}) => {
  const [attachments, setAttachments] = useState<ProductAttachmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logInfo('[ProductDownloads] Props received:', { masterProductId, variantId, tabId });
    loadAttachments();
  }, [masterProductId, variantId, tabId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: ProductAttachmentDto[];

      // If tabId is provided, load only attachments assigned to this tab
      if (tabId) {
        logInfo('[ProductDownloads] Loading attachments for tabId:', tabId);
        data = await getAttachmentsForTab(tabId);
        logInfo('[ProductDownloads] Loaded tab attachments:', data.length);
      }
      // Otherwise, load all attachments for the product
      else if (variantId) {
        logInfo('[ProductDownloads] Loading attachments for variantId:', variantId);
        data = await getAttachmentsForVariant(variantId);
      } else if (masterProductId) {
        logInfo('[ProductDownloads] Loading attachments for masterProductId:', masterProductId);
        data = await getAttachmentsForMasterProduct(masterProductId);
      } else {
        throw new Error('No product ID or tab ID provided');
      }

      setAttachments(data);
    } catch (err) {
      logError('Error loading attachments:', err);
      setError('Failed to load downloads');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (attachment: ProductAttachmentDto) => {
    try {
      // Track download
      await trackDownload(attachment.id);

      // Prepare download URL
      let url = attachment.cdnUrl || attachment.fileUrl;

      // Ensure URL has protocol (https://)
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Use downloadFile service for reliable cross-origin downloads
      await downloadFile(url, {
        suggestedName: attachment.displayLabel || attachment.fileName || 'download',
        withCredentials: false, // CDN URLs don't need credentials
      });
    } catch (err) {
      logError('Error downloading file:', err);
      toast.error('Failed to download file. Please try again.');
    }
  };

  const getFileIcon = (fileFormat?: string) => {
    if (!fileFormat) return <File size={24} />;

    const format = fileFormat.toLowerCase();
    if (format === 'pdf') return <FileText size={24} />;
    if (['zip', 'rar', '7z'].includes(format)) return <Download size={24} />;

    return <File size={24} />;
  };

  if (loading) {
    return (
      <div className="product-downloads">
        <div className="downloads-loading">
          <div className="spinner"></div>
          <p>Loading downloads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-downloads">
        <div className="downloads-error">
          <AlertCircle size={24} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="product-downloads">
        <div className="downloads-empty">
          <Download size={48} />
          <h3>No Downloads Available</h3>
          <p>There are currently no downloadable files for this product.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="product-downloads">
      <div className="downloads-header">
        <h2>Available Downloads</h2>
        <p className="downloads-subtitle">
          Click on any file to download or view it
        </p>
      </div>

      <div className="downloads-grid">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="download-card"
            onClick={() => handleDownload(attachment)}
          >
            <div className="download-icon">
              {getFileIcon(attachment.fileFormat || undefined)}
            </div>

            <div className="download-content">
              <h3 className="download-title">{attachment.displayLabel}</h3>

              {attachment.description && (
                <p className="download-description">{attachment.description}</p>
              )}

              <div className="download-meta">
                {attachment.fileFormat && (
                  <span className="download-format">{attachment.fileFormat}</span>
                )}
                {attachment.formattedFileSize && (
                  <span className="download-size">{attachment.formattedFileSize}</span>
                )}
                {attachment.downloadCount !== undefined && attachment.downloadCount > 0 && (
                  <span className="download-count">
                    {attachment.downloadCount} downloads
                  </span>
                )}
              </div>

              {attachment.attachmentType && attachment.attachmentType !== 'OTHER' && (
                <span className="download-type-badge">
                  {attachment.attachmentType.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <div className="download-action">
              <Download size={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductDownloads;
