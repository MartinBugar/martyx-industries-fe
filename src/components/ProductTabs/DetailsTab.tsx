import React from 'react';
import { type TabContent } from '../../data/productData';

interface DetailsTabProps {
  content: TabContent;
}

const DetailsTab: React.FC<DetailsTabProps> = ({ content }) => {
  if (content.kind === 'text') {
    return <p>{content.text}</p>;
  }
  return (
    <ul>
      {content.items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
};

export default DetailsTab;
