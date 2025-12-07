/**
 * Dynamic Product Tabs Component
 *
 * Loads tabs from API and renders them dynamically.
 * Supports HTML, Markdown, JSON, and custom React components.
 */

import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import type { ProductTabDto } from '../../types/api';
import { getTabsForMasterProduct, getTabsForVariant, canViewTab, renderTabContent } from '../../services/productTabService';
import { useAuth } from '../../context/useAuth';
import './ProductTabs.css';

// Import existing tab components
import DetailsTab from './DetailsTab';
import DownloadTab from './DownloadTab';
import FeaturesTab from './FeaturesTab';
import ReviewsTab from './ReviewsTab';
import PrintInfoTab from './PrintInfoTab';
import IncludedTab from './IncludedTab';
import ProductDownloads from './ProductDownloads';
import BuildInfoTab from './BuildInfoTab';
import ConfiguratorTab from './ConfiguratorTab';

// Import Error Boundary for error handling
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import { logInfo, logError } from '../../services/logger';
import type { Product } from '../../data/productData';

interface DynamicProductTabsProps {
  masterProductId?: number;
  variantId?: number;
  locale?: string;
  product?: Product; // For configurator add-to-cart functionality
}

const DynamicProductTabs: React.FC<DynamicProductTabsProps> = ({
  masterProductId,
  variantId,
  locale = 'en',
  product
}) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [tabs, setTabs] = useState<ProductTabDto[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load tabs from API
  useEffect(() => {
    // Skip while auth is still loading to avoid race conditions
    if (isAuthLoading) return;

    const loadTabs = async () => {
      try {
        setLoading(true);
        setError(null);

        let loadedTabs: ProductTabDto[] = [];

        if (masterProductId) {
          loadedTabs = await getTabsForMasterProduct(masterProductId, locale);
        } else if (variantId) {
          loadedTabs = await getTabsForVariant(variantId, locale);
        }

        // Filter tabs based on visibility rules
        const visibleTabs = loadedTabs.filter(tab => canViewTab(tab, isAuthenticated));

        setTabs(visibleTabs);

        // Set first tab as active
        if (visibleTabs.length > 0) {
          setActiveTab(0);
        }
      } catch (err) {
        logError('Error loading product tabs:', err);
        setError('Failed to load product tabs');
      } finally {
        setLoading(false);
      }
    };

    loadTabs();
  }, [masterProductId, variantId, locale, isAuthenticated, isAuthLoading]);

  // Render component based on componentName
  const renderCustomComponent = (componentName: string, tabId?: number): React.ReactElement | null => {
    logInfo('[DynamicProductTabs] renderCustomComponent called:', { componentName, tabId, masterProductId, variantId });

    switch (componentName) {
      case 'DetailsTab':
        return <DetailsTab content={{ kind: 'text', text: '' }} />;
      case 'DownloadTab':
        return <DownloadTab content={{ kind: 'text', text: '' }} />;
      case 'ProductDownloads':
        logInfo('[DynamicProductTabs] Rendering ProductDownloads with props:', { masterProductId, variantId, tabId });
        return <ProductDownloads
          masterProductId={masterProductId}
          variantId={variantId}
          tabId={tabId}
        />;
      case 'FeaturesTab':
        return <FeaturesTab content={{ kind: 'text', text: '' }} />;
      case 'ReviewsTab':
        return <ReviewsTab content={{ kind: 'text', text: '' }} productId={masterProductId || 0} />;
      case 'PrintInfoTab':
        return <PrintInfoTab content={{ kind: 'printInfo', data: { printSettings: { printTime: '', layerHeight: '', infill: '', supports: false, materials: [] }, rcComponents: [] } }} />;
      case 'BuildInfoTab':
        return (
          <ErrorBoundary>
            <BuildInfoTab content={{ kind: 'buildInfo', data: { partsCount: 0, screwsCount: 0, filamentGrams: 0, filamentType: '', printTimeHours: 0, assemblyTimeHours: 0, requiredTools: [], skillsRequired: [], estimatedTotalHours: 0 } }} />
          </ErrorBoundary>
        );
      case 'IncludedTab':
        return <IncludedTab content={{ kind: 'text', text: '' }} />;
      case 'ConfiguratorTab':
        return (
          <ErrorBoundary>
            <ConfiguratorTab
              masterProductId={masterProductId || 0}
              product={product}
            />
          </ErrorBoundary>
        );
      default:
        return <div>Component not found: {componentName}</div>;
    }
  };

  // Render tab content
  const renderContent = (tab: ProductTabDto): React.ReactElement => {
    logInfo('[DynamicProductTabs] renderContent called for tab:', { id: tab.id, tabLabel: tab.tabLabel, contentType: tab.contentType });
    const { type, content } = renderTabContent(tab);

    switch (type) {
      case 'html':
        return (
          <div
            className={`rich-text ${tab.cssClass || ''}`}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content as string) }}
          />
        );

      case 'markdown':
        // For now, render as plain text. You can add a markdown library later
        return (
          <div className={`markdown-content ${tab.cssClass || ''}`}>
            <pre>{content as string}</pre>
          </div>
        );

      case 'json':
        // Render structured JSON data
        return (
          <div className={`json-content ${tab.cssClass || ''}`}>
            <pre>{JSON.stringify(content, null, 2)}</pre>
          </div>
        );

      case 'component':
        logInfo('[DynamicProductTabs] Rendering component type, passing tabId:', tab.id);
        return renderCustomComponent(content as string, tab.id) || <div>Component not available</div>;

      default:
        return <div>Unsupported content type</div>;
    }
  };

  if (loading) {
    return (
      <div className="tabs-loading-container">
        <div className="tabs-loading-bar">
          <div className="tabs-loading-progress"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-tabs-error">
        <p>{error}</p>
      </div>
    );
  }

  if (tabs.length === 0) {
    return null; // No tabs to display
  }

  return (
    <div className="product-tabs-wrapper">
      {/* Tab Navigation */}
      <div className="product-tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === index ? 'active' : ''}`}
            onClick={() => setActiveTab(index)}
            aria-label={tab.tabLabel}
          >
            {tab.iconName && <span className="tab-icon">{tab.iconName}</span>}
            {tab.tabLabel}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {tabs[activeTab] && renderContent(tabs[activeTab])}
      </div>
    </div>
  );
};

export default DynamicProductTabs;
