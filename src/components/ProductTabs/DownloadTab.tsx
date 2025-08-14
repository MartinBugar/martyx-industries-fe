import React from 'react';
import { type TabContent } from '../../data/productData';

interface DownloadTabProps {
  content: TabContent;
}

const DownloadTab: React.FC<DownloadTabProps> = ({ content }) => {
  switch (content.kind) {
    case 'text':
      return (
        <div
          className="rich-text"
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
        <section className="downloads-section" aria-label="Available downloads">
          <ul className="downloads-list">
            {content.items.map((d, i) => (
              <li key={i} className="download-item">
                <div className="download-info">
                  <div className="download-title-row">
                    <div className="download-label">{d.label}</div>
                    <a
                      className="secondary-btn download-btn"
                      href={d.url}
                      download
                      rel="noopener noreferrer"
                      aria-label={`Download ${d.label}${d.format ? ` (${d.format})` : ''}${d.size ? `, size ${d.size}` : ''}`}
                    >
                      Download
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
      return <p>No downloads available.</p>;
  }
};

export default DownloadTab;
