import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { type TabContent } from '../../data/productData';
import { getAttachmentsForVariant, trackDownload } from '../../services/productAttachmentService';
import type { ProductAttachmentDto } from '../../types/api';
import { downloadFile } from '../../services/download';
import './ProductTabs.css';
import { logError } from '../../services/logger';
import toast from 'react-hot-toast';

interface DownloadTabProps {
  content: TabContent;
  variantId?: number;
}

const DownloadTab: React.FC<DownloadTabProps> = ({ content, variantId }) => {
  const { t } = useTranslation('products');
  const [attachments, setAttachments] = useState<ProductAttachmentDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (variantId) {
      loadAttachments();
    }
  }, [variantId]);

  const loadAttachments = async () => {
    if (!variantId) return;

    try {
      setLoading(true);
      const data = await getAttachmentsForVariant(variantId);
      setAttachments(data);
    } catch (error) {
      logError('Failed to load attachments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (attachment: ProductAttachmentDto) => {
    try {
      // Track the download
      await trackDownload(attachment.id);

      // Download file using downloadFile service (works for cross-origin URLs)
      const url = attachment.cdnUrl || attachment.fileUrl;
      await downloadFile(url, {
        suggestedName: attachment.displayLabel || attachment.fileName || 'download',
        withCredentials: false, // CDN URLs don't need credentials
      });
    } catch (error) {
      logError('Download failed', error);
      toast.error('Failed to download file. Please try again.');
    }
  };

  if (attachments.length > 0) {
    return (
      <section className="downloads-section" aria-label="Available downloads">
        {loading && <p>Loading...</p>}
        <ul className="downloads-list">
          {attachments.map((att) => (
            <li key={att.id} className="download-item">
              <div className="download-info">
                <div className="download-title-row">
                  <div className="download-label">{att.displayLabel}</div>
                  <button
                    className="download-btn"
                    onClick={() => handleDownload(att)}
                    aria-label={`Download ${att.displayLabel}`}
                  >
                    {t('downloads.download_button', 'Download')}
                  </button>
                </div>
                {att.description && (
                  <p className="download-description" style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                    {att.description}
                  </p>
                )}
                {(att.formattedFileSize || att.fileFormat) && (
                  <div className="download-meta">
                    {att.fileFormat ? att.fileFormat : ''}
                    {att.formattedFileSize ? ` · ${att.formattedFileSize}` : ''}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  switch (content.kind) {
    case 'text':
      return (
        <div
          className="rich-text"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.text) }}
        />
      );
    case 'list':
      return (
        <ul>
          {content.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    case 'downloads':
      return (
        <section className="downloads-section">
          <ul className="downloads-list">
            {content.items.map((d, i) => (
              <li key={i} className="download-item">
                <div className="download-info">
                  <div className="download-title-row">
                    <div className="download-label">{d.label}</div>
                    <a
                      className="download-btn"
                      href={d.url}
                      download
                      rel="noopener noreferrer"
                    >
                      {t('downloads.download_button', 'Download')}
                    </a>
                  </div>
                  {(d.size || d.format) && (
                    <div className="download-meta">
                      {d.format ? d.format : ''}
                      {d.size ? ` · ${d.size}` : ''}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      );
    default:
      return <p>{t('downloads.no_downloads')}</p>;
  }
};

export default DownloadTab;
