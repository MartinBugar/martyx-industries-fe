import React from 'react';
import { type TabContent } from '../../data/productData';

interface FeaturesTabProps {
  content: TabContent;
}

const FeaturesTab: React.FC<FeaturesTabProps> = ({ content }) => {
  if (content.kind === 'list') {
    return (
      <ul>
        {content.items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    );
  }
  // Fallback: render text as a single list item to keep consistent UI for Features
  return (
    <ul>
      <li>{content.text}</li>
    </ul>
  );
};

export default FeaturesTab;
