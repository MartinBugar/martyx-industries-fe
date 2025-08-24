import React from 'react';
import { type TabContent } from '../../data/productData';
import './ProductTabs.css';

interface DetailsTabProps {
  content: TabContent;
}

const DetailsTab: React.FC<DetailsTabProps> = ({ content }) => {
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
    case 'image':
      return (
        <figure className="tab-image">
          <img src={content.image.src} alt={content.image.alt ?? ''} />
          {content.image.caption && <figcaption>{content.image.caption}</figcaption>}
        </figure>
      );
    case 'gallery':
      return (
        <div className="tab-gallery">
          {content.images.map((im, i) => (
            <figure key={i} className="tab-gallery-item">
              <img src={im.src} alt={im.alt ?? ''} />
              {im.caption && <figcaption>{im.caption}</figcaption>}
            </figure>
          ))}
        </div>
      );
    default:
      return null;
  }
};

export default DetailsTab;
