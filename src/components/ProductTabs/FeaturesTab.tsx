import React from 'react';
import { type TabContent } from '../../data/productData';

interface FeaturesTabProps {
  content: TabContent;
}

const FeaturesTab: React.FC<FeaturesTabProps> = ({ content }) => {
  switch (content.kind) {
    case 'list':
      return (
        <ul>
          {content.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    case 'text':
      return (
        <ul>
          <li>{content.text}</li>
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
      return <p>Content unavailable for Features.</p>;
  }
};

export default FeaturesTab;
