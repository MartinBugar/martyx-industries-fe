/**
 * ProductDownloads Component - Unified Downloads Tab
 *
 * Displays downloadable attachments for products with:
 * - Category grouping by attachmentType
 * - Dark theme with brand colors (yellow/dark/black)
 * - Modern minimalist UX
 * - Download tracking
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

// Attachment type icons and labels
const ATTACHMENT_TYPE_CONFIG: Record<string, { icon: string; label: string; labelSk: string }> = {
  ASSEMBLY_GUIDE: { icon: '🔧', label: 'Assembly Guides', labelSk: 'Návody na zostavenie' },
  USER_MANUAL: { icon: '📖', label: 'User Manuals', labelSk: 'Používateľské príručky' },
  WIRING_DIAGRAM: { icon: '⚡', label: 'Wiring Diagrams', labelSk: 'Schémy zapojenia' },
  PARTS_LIST: { icon: '📋', label: 'Parts Lists', labelSk: 'Zoznamy dielov' },
  QUICK_START_GUIDE: { icon: '🚀', label: 'Quick Start', labelSk: 'Rýchly štart' },
  DATASHEET: { icon: '📊', label: 'Datasheets', labelSk: 'Technické listy' },
  VIDEO_TUTORIAL: { icon: '🎬', label: 'Video Tutorials', labelSk: 'Video tutoriály' },
  SOURCE_CODE: { icon: '💻', label: 'Source Code', labelSk: 'Zdrojový kód' },
  OTHER: { icon: '📁', label: 'Other Files', labelSk: 'Ostatné súbory' }
};

// File format detection - with fallback to filename extension
const getFileExtension = (format?: string | null, fileName?: string | null): string => {
  let ext = format?.toUpperCase();
  if (!ext && fileName) {
    const match = fileName.match(/\.([a-zA-Z0-9]+)$/);
    if (match) ext = match[1].toUpperCase();
  }
  return ext || '';
};

// SVG Icons for file types
const FileIcon: React.FC<{ ext: string }> = ({ ext }) => {
  // PDF icon - red
  if (ext === 'PDF') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4C6 2.89543 6.89543 2 8 2H18L26 10V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" fill="#E53935"/>
        <path d="M18 2L26 10H20C18.8954 10 18 9.10457 18 8V2Z" fill="#FFCDD2"/>
        <text x="16" y="22" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" fontFamily="system-ui">PDF</text>
      </svg>
    );
  }

  // ZIP/Archive icon - yellow/orange
  if (['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(ext)) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4C6 2.89543 6.89543 2 8 2H18L26 10V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" fill="#F6C845"/>
        <path d="M18 2L26 10H20C18.8954 10 18 9.10457 18 8V2Z" fill="#FFF3CD"/>
        <text x="16" y="22" textAnchor="middle" fill="#0f1419" fontSize="7" fontWeight="bold" fontFamily="system-ui">ZIP</text>
      </svg>
    );
  }

  // Code files - blue
  if (['INO', 'CPP', 'H', 'PY', 'JS', 'TS', 'C'].includes(ext)) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4C6 2.89543 6.89543 2 8 2H18L26 10V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" fill="#2196F3"/>
        <path d="M18 2L26 10H20C18.8954 10 18 9.10457 18 8V2Z" fill="#BBDEFB"/>
        <text x="16" y="22" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="system-ui">&lt;/&gt;</text>
      </svg>
    );
  }

  // 3D files - purple
  if (['STL', '3MF', 'OBJ', 'STEP', 'STP'].includes(ext)) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4C6 2.89543 6.89543 2 8 2H18L26 10V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" fill="#9C27B0"/>
        <path d="M18 2L26 10H20C18.8954 10 18 9.10457 18 8V2Z" fill="#E1BEE7"/>
        <text x="16" y="22" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="system-ui">3D</text>
      </svg>
    );
  }

  // Image files - green
  if (['JPG', 'JPEG', 'PNG', 'GIF', 'SVG', 'WEBP'].includes(ext)) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4C6 2.89543 6.89543 2 8 2H18L26 10V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" fill="#4CAF50"/>
        <path d="M18 2L26 10H20C18.8954 10 18 9.10457 18 8V2Z" fill="#C8E6C9"/>
        <text x="16" y="22" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="system-ui">IMG</text>
      </svg>
    );
  }

  // Video files - orange
  if (['MP4', 'MOV', 'AVI', 'WEBM', 'MKV'].includes(ext)) {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 4C6 2.89543 6.89543 2 8 2H18L26 10V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" fill="#FF9800"/>
        <path d="M18 2L26 10H20C18.8954 10 18 9.10457 18 8V2Z" fill="#FFE0B2"/>
        <text x="16" y="22" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="system-ui">VID</text>
      </svg>
    );
  }

  // Default file icon - gray
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 4C6 2.89543 6.89543 2 8 2H18L26 10V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" fill="#6b7280"/>
      <path d="M18 2L26 10H20C18.8954 10 18 9.10457 18 8V2Z" fill="#d1d5db"/>
      <text x="16" y="22" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="system-ui">{ext || 'FILE'}</text>
    </svg>
  );
};

interface ProductDownloadsProps {
  masterProductId?: number;
  variantId?: number;
  tabId?: number;
}

const ProductDownloads: React.FC<ProductDownloadsProps> = ({
  masterProductId,
  variantId,
  tabId
}) => {
  const { t, i18n } = useTranslation('products');
  const [attachments, setAttachments] = useState<ProductAttachmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const isSlovak = i18n.language === 'sk';

  useEffect(() => {
    logInfo('[ProductDownloads] Props received:', { masterProductId, variantId, tabId });
    loadAttachments();
  }, [masterProductId, variantId, tabId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      setError(null);

      let data: ProductAttachmentDto[];

      if (tabId) {
        logInfo('[ProductDownloads] Loading attachments for tabId:', tabId);
        data = await getAttachmentsForTab(tabId);
      } else if (variantId) {
        logInfo('[ProductDownloads] Loading attachments for variantId:', variantId);
        data = await getAttachmentsForVariant(variantId);
      } else if (masterProductId) {
        logInfo('[ProductDownloads] Loading attachments for masterProductId:', masterProductId);
        data = await getAttachmentsForMasterProduct(masterProductId);
      } else {
        throw new Error('No product ID or tab ID provided');
      }

      // Sort by displayOrder
      data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setAttachments(data);
      logInfo('[ProductDownloads] Loaded attachments:', data.length);
    } catch (err) {
      logError('Error loading attachments:', err);
      setError(t('downloads.error', 'Failed to load downloads'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (attachment: ProductAttachmentDto) => {
    try {
      setDownloadingId(attachment.id);

      // Track download first
      try {
        await trackDownload(attachment.id);
      } catch (trackErr) {
        logError('Track download failed (non-blocking):', trackErr);
      }

      // Use backend proxy for CORS-safe download
      const proxyUrl = `/api/public/product-attachments/${attachment.id}/file`;

      await downloadFile(proxyUrl, {
        suggestedName: attachment.displayLabel || attachment.fileName || 'download',
        withCredentials: true,
      });

      toast.success(t('downloads.success', 'Download started!'));
    } catch (err) {
      logError('Error downloading file:', err);
      toast.error(t('downloads.error_download', 'Failed to download. Please try again.'));
    } finally {
      setDownloadingId(null);
    }
  };

  // Group attachments by type
  const groupedAttachments = useMemo(() => {
    const groups: Record<string, ProductAttachmentDto[]> = {};

    attachments.forEach((att) => {
      const type = att.attachmentType || 'OTHER';
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(att);
    });

    // Sort groups by predefined order
    const typeOrder = Object.keys(ATTACHMENT_TYPE_CONFIG);
    const sortedGroups: Array<{ type: string; items: ProductAttachmentDto[] }> = [];

    typeOrder.forEach((type) => {
      if (groups[type] && groups[type].length > 0) {
        sortedGroups.push({ type, items: groups[type] });
      }
    });

    return sortedGroups;
  }, [attachments]);

  // Loading state
  if (loading) {
    return (
      <div className="downloads-container">
        <div className="downloads-skeleton">
          <div className="skeleton-header" />
          <div className="skeleton-items">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-item">
                <div className="skeleton-icon" />
                <div className="skeleton-content">
                  <div className="skeleton-title" />
                  <div className="skeleton-meta" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="downloads-container">
        <div className="downloads-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
          <button onClick={loadAttachments} className="retry-btn">
            {t('downloads.retry', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (attachments.length === 0) {
    return (
      <div className="downloads-container">
        <div className="downloads-empty">
          <span className="empty-icon">📂</span>
          <h3>{t('downloads.empty_title', 'No Downloads Available')}</h3>
          <p>{t('downloads.empty_description', 'There are no downloadable files for this product yet.')}</p>
        </div>
      </div>
    );
  }

  // Show ungrouped list if only one category or few items
  const showGrouped = groupedAttachments.length > 1 && attachments.length > 3;

  return (
    <div className="downloads-container">
      {showGrouped ? (
        // Grouped view
        <div className="downloads-grouped">
          {groupedAttachments.map(({ type, items }) => {
            const config = ATTACHMENT_TYPE_CONFIG[type] || ATTACHMENT_TYPE_CONFIG.OTHER;
            return (
              <div key={type} className="download-group">
                <div className="group-header">
                  <span className="group-icon">{config.icon}</span>
                  <h3 className="group-title">
                    {isSlovak ? config.labelSk : config.label}
                  </h3>
                  <span className="group-count">{items.length}</span>
                </div>
                <div className="group-items">
                  {items.map((attachment) => (
                    <DownloadItem
                      key={attachment.id}
                      attachment={attachment}
                      onDownload={handleDownload}
                      isDownloading={downloadingId === attachment.id}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Simple list view
        <div className="downloads-list">
          {attachments.map((attachment) => (
            <DownloadItem
              key={attachment.id}
              attachment={attachment}
              onDownload={handleDownload}
              isDownloading={downloadingId === attachment.id}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Individual download item component
interface DownloadItemProps {
  attachment: ProductAttachmentDto;
  onDownload: (attachment: ProductAttachmentDto) => void;
  isDownloading: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

const DownloadItem: React.FC<DownloadItemProps> = ({
  attachment,
  onDownload,
  isDownloading,
  t
}) => {
  const ext = getFileExtension(attachment.fileFormat, attachment.fileName);

  return (
    <div
      className={`download-item ${isDownloading ? 'downloading' : ''}`}
      onClick={() => !isDownloading && onDownload(attachment)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          !isDownloading && onDownload(attachment);
        }
      }}
      aria-label={`${t('downloads.download', 'Download')} ${attachment.displayLabel}`}
    >
      <div className="item-icon">
        {isDownloading ? (
          <span className="spinner" />
        ) : (
          <FileIcon ext={ext} />
        )}
      </div>

      <div className="item-content">
        <h4 className="item-title">{attachment.displayLabel}</h4>
        {attachment.description && (
          <p className="item-description">{attachment.description}</p>
        )}
        <div className="item-meta">
          {attachment.fileFormat && (
            <span className="meta-format">{attachment.fileFormat}</span>
          )}
          {attachment.formattedFileSize && (
            <span className="meta-size">{attachment.formattedFileSize}</span>
          )}
          {attachment.downloadCount !== undefined && attachment.downloadCount > 0 && (
            <span className="meta-downloads">
              {attachment.downloadCount} {t('downloads.downloads', 'downloads')}
            </span>
          )}
        </div>
      </div>

      <div className="item-action">
        <span className="download-arrow">↓</span>
      </div>
    </div>
  );
};

export default ProductDownloads;
