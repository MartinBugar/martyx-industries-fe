import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './PolicyPage.css';

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
  const { t } = useTranslation('common');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Generate section IDs for table of contents
  const generateSectionId = (title: string, index: number): string => {
    if (!title) return `section-${index}`;
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = (content: string | string[], links?: Array<{ text: string; to: string; }>) => {
    if (Array.isArray(content)) {
      return (
        <ul>
          {content.map((item, index) => (
            <li key={index}>{renderTextWithLinks(item, links)}</li>
          ))}
        </ul>
      );
    }
    
    return <p>{renderTextWithLinks(content, links)}</p>;
  };

  const renderTextWithLinks = (text: string, links?: Array<{ text: string; to: string; }>) => {
    if (!links || links.length === 0) {
      return text;
    }

    let processedText = text;
    const linkElements: React.ReactElement[] = [];
    
    links.forEach((link, index) => {
      const placeholder = `[${link.text}]`;
      const linkKey = `__LINK_${index}__`;
      
      if (processedText.includes(placeholder)) {
        processedText = processedText.replace(placeholder, linkKey);
        linkElements[index] = (
          <Link key={index} to={link.to} className="policy-link">
            {link.text}
          </Link>
        );
      }
    });

    // Split by link placeholders and render
    const parts = processedText.split(/(__LINK_\d+__)/);
    return (
      <>
        {parts.map((part, partIndex) => {
          const linkMatch = part.match(/__LINK_(\d+)__/);
          if (linkMatch) {
            const linkIndex = parseInt(linkMatch[1]);
            return linkElements[linkIndex] || part;
          }
          return <span key={partIndex}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className="policy-page">
      <div className="policy-container">
        <header className="policy-header">
          <h1 className="policy-title">{title}</h1>
          <p className="policy-last-updated">
            {t('admin.last_updated')}: {lastUpdated}
          </p>
        </header>



        {/* Content Sections */}
        <div className="policy-content">
          {sections.map((section, index) => {
            const sectionId = section.title ? generateSectionId(section.title, index) : `section-${index}`;
            const isIntro = !section.title;
            
            return (
              <section 
                key={index} 
                id={sectionId}
                className={`policy-section ${isIntro ? 'policy-intro' : ''}`}
              >
                {section.title && (
                  <h2 className="policy-section-title">{section.title}</h2>
                )}
                <div className="policy-section-content">
                  {renderContent(section.content, section.links)}
                </div>
              </section>
            );
          })}
        </div>

        {/* Scroll to Top Button */}
        <button
          className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
          onClick={scrollToTop}
          type="button"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      </div>
    </div>
  );
};

export default PolicyPage;