import React from 'react';
import { type TabContent } from '../../data/productData';

interface ReviewsTabProps {
  content: TabContent;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ content }) => {
  let body: React.ReactNode = null;
  switch (content.kind) {
    case 'text':
      body = (
        <div
          className="rich-text"
          dangerouslySetInnerHTML={{ __html: content.text }}
        />
      );
      break;
    case 'list':
      body = (
        <ul>
          {content.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
      break;
    case 'image':
      body = (
        <figure className="tab-image">
          <img src={content.image.src} alt={content.image.alt ?? ''} />
          {content.image.caption && <figcaption>{content.image.caption}</figcaption>}
        </figure>
      );
      break;
    case 'gallery':
      body = (
        <div className="tab-gallery">
          {content.images.map((im, i) => (
            <figure key={i} className="tab-gallery-item">
              <img src={im.src} alt={im.alt ?? ''} />
              {im.caption && <figcaption>{im.caption}</figcaption>}
            </figure>
          ))}
        </div>
      );
      break;
    case 'downloads':
      body = (
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
      break;
    default:
      body = null;
  }

  return (
    <>
      {body}
      <div className="review-container">AAAA</div>
    </>
  );
};

export default ReviewsTab;
