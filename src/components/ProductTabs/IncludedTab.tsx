import React from 'react';
import { type TabContent } from '../../data/productData';
import DOMPurify from 'dompurify';
import './ProductTabs.css';

interface IncludedTabProps {
  content: TabContent;
}

/**
 * IncludedTab - Displays detailed information about what's included in the product variant
 * Shows components with full descriptions, file sizes, and metadata
 */
const IncludedTab: React.FC<IncludedTabProps> = ({ content }) => {
  // For 'components' content kind, we expect data to be passed as text containing JSON
  // or as a dedicated 'components' kind that we'll need to add to TabContent union

  // For now, handle text that contains components data
  if (content.kind === 'text') {
    try {
      const components = JSON.parse(content.text);
      if (Array.isArray(components)) {
        return (
          <div className="included-components">
            <h3>What's Included in This Package:</h3>
            <ol className="components-list">
              {components
                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                .map((component) => (
                  <li key={component.id} className="component-item">
                    <div className="component-content">
                      <div className="component-title-row">
                        <span
                          className="component-badge"
                          style={{
                            backgroundColor: component.badgeColor === 'blue' ? '#eff6ff' :
                                            component.badgeColor === 'green' ? '#f0fdf4' :
                                            component.badgeColor === 'purple' ? '#faf5ff' :
                                            '#f3f4f6',
                            color: component.badgeColor === 'blue' ? '#1e40af' :
                                   component.badgeColor === 'green' ? '#15803d' :
                                   component.badgeColor === 'purple' ? '#7c3aed' :
                                   '#4b5563'
                          }}
                        >
                          {component.label || component.componentType}
                        </span>
                        {component.quantity && component.quantity > 1 && (
                          <span className="component-quantity">×{component.quantity}</span>
                        )}
                      </div>
                      <h4 className="component-name">{component.componentName}</h4>
                      {component.description && (
                        <p className="component-description">{component.description}</p>
                      )}
                      <div className="component-meta">
                        {component.digital && <span className="meta-tag digital">Digital</span>}
                        {component.physical && <span className="meta-tag physical">Physical</span>}
                        {component.formattedFileSize && (
                          <span className="meta-size">{component.formattedFileSize}</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        );
      }
    } catch (e) {
      // If not JSON, just display as text
      const sanitizedHtml = DOMPurify.sanitize(content.text);
      return <div className="tab-content" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
    }
  }

  if (content.kind === 'list') {
    return (
      <ul className="tab-list">
        {content.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }

  return <p>No component information available.</p>;
};

export default IncludedTab;
