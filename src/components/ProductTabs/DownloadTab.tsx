/**
 * DownloadTab - Wrapper component for backward compatibility
 *
 * Delegates to ProductDownloads component for unified download experience.
 * Kept for legacy tab configurations that reference 'DownloadTab' component name.
 */

import React from 'react';
import { type TabContent } from '../../data/productData';
import ProductDownloads from './ProductDownloads';

interface DownloadTabProps {
  content: TabContent;
  variantId?: number;
  masterProductId?: number;
  tabId?: number;
}

const DownloadTab: React.FC<DownloadTabProps> = ({
  variantId,
  masterProductId,
  tabId
}) => {
  return (
    <ProductDownloads
      variantId={variantId}
      masterProductId={masterProductId}
      tabId={tabId}
    />
  );
};

export default DownloadTab;
