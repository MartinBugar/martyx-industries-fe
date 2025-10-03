'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { type TabContent } from '../../lib/types/product';
import styles from './ProductTabs.module.css';

interface DownloadTabProps {
  content: TabContent;
}

const DownloadTab: React.FC<DownloadTabProps> = ({ content }) => {
  const { t } = useTranslation('products');
  switch (content.kind) {
    case 'text':
      return (
        <div
          className={styles['rich-text']}
          dangerouslySetInnerHTML={{ __html: content.text }}
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
        <section className={styles['downloads-section']} aria-label="Available downloads">
          <ul className={styles['downloads-list']}>
            {content.items.map((d, i) => (
              <li key={i} className={styles['download-item']}>
                <div className={styles['download-info']}>
                  <div className={styles['download-title-row']}>
                    <div className={styles['download-label']}>{d.label}</div>
                    <a
                      className={styles['download-btn']}
                      href={d.url}
                      download
                      rel="noopener noreferrer"
                      aria-label={`Download ${d.label}${d.format ? ` (${d.format})` : ''}${d.size ? `, size ${d.size}` : ''}`}
                    >
                      {t('downloads.download_button', 'Download')}
                    </a>
                  </div>
                  {(d.size || d.format) && (
                    <div className={styles['download-meta']}>
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
