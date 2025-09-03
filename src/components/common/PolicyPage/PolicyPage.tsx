import React from 'react';
import { Link } from 'react-router-dom';
import '../../../pages/Pages.css';

interface PolicySection {
  title?: string;
  content: string | string[];
  links?: Array<{ text: string; to: string; }>;
}

interface PolicyPageProps {
  title: string;
  lastUpdated: string;
  sections: PolicySection[];
}

const PolicyPage: React.FC<PolicyPageProps> = ({ title, lastUpdated, sections }) => {
  const renderContent = (content: string | string[], links?: Array<{ text: string; to: string; }>) => {
    if (Array.isArray(content)) {
      return (
        <ul>
          {content.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
    }
    
    // For string content, replace link placeholders with actual Link components
    let processedContent = content;
    if (links) {
      links.forEach(link => {
        const linkComponent = `<Link to="${link.to}">${link.text}</Link>`;
        processedContent = processedContent.replace(`[${link.text}]`, linkComponent);
      });
    }
    
    // For simple text content with potential links
    const parts = processedContent.split(/(<Link.*?<\/Link>)/);
    return (
      <p>
        {parts.map((part, index) => {
          if (part.startsWith('<Link')) {
            const match = part.match(/to="([^"]*)".*?>([^<]*)</);
            if (match) {
              return <Link key={index} to={match[1]}>{match[2]}</Link>;
            }
          }
          return part;
        })}
      </p>
    );
  };

  return (
    <div className="page-container">
      <h1>{title}</h1>
      <p style={{ color: '#666' }}>Last updated: {lastUpdated}</p>

      {sections.map((section, index) => (
        <section key={index} className="about-section">
          {section.title && <h2>{section.title}</h2>}
          {renderContent(section.content, section.links)}
        </section>
      ))}
    </div>
  );
};

export default PolicyPage;