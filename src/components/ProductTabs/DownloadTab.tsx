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
        <ul className="downloads-list">
          {content.items.map((d, i) => (
            <li key={i} className="download-item">
              <a href={d.url} download>
                {d.label}
              </a>
              {(d.size || d.format) && (
                <span className="download-meta">
                  {d.format ? ` ${d.format}` : ''}
                  {d.size ? ` · ${d.size}` : ''}
                </span>
              )}
            </li>
          ))}
        </ul>
      );
    default:
      return <p>No downloads available.</p>;
  }
};

export default DownloadTab;
