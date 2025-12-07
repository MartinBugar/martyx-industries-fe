import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';

export type ProductTabId =
  | 'product-info'
  | 'variants'
  | 'tabs'
  | 'attachments'
  | 'gallery'
  | '3d-model'
  | 'digital-file'
  | 'configurator';

interface ProductNavTabsProps {
  productId: string;
  activeTab: ProductTabId;
  variantCount?: number;
  /** For tabs that have internal sub-tabs (like Product Info / Variants), pass the onClick handler */
  onTabClick?: (tab: 'product-info' | 'variants') => void;
}

/**
 * Shared navigation tabs component for all admin product pages.
 * Ensures consistent navigation across Product Detail, Gallery, 3D Model, Configurator, etc.
 */
const ProductNavTabs: React.FC<ProductNavTabsProps> = ({
  productId,
  activeTab,
  variantCount = 0,
  onTabClick,
}) => {
  const tabs: Array<{
    id: ProductTabId;
    label: string;
    icon: string | React.ReactNode;
    path?: string;
    isButton?: boolean;
  }> = [
    { id: 'product-info', label: 'Product Info', icon: '📝', isButton: !!onTabClick },
    { id: 'variants', label: `Variants (${variantCount})`, icon: <Package size={16} style={{ marginRight: 4 }} />, isButton: !!onTabClick },
    { id: 'tabs', label: 'Manage Tabs', icon: '📋', path: `/admin/products/${productId}/tabs` },
    { id: 'attachments', label: 'Manage Attachments', icon: '📎', path: `/admin/products/${productId}/attachments` },
    { id: 'gallery', label: 'Gallery', icon: '📸', path: `/admin/products/${productId}/gallery` },
    { id: '3d-model', label: '3D Model', icon: '🎲', path: `/admin/products/${productId}/3d-model` },
    { id: 'digital-file', label: 'Digital File', icon: '💾', path: `/admin/products/${productId}/digital-file` },
    { id: 'configurator', label: 'Configurator', icon: '🔧', path: `/admin/products/${productId}/configurator` },
  ];

  return (
    <div className="admin-nav-tabs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const className = `admin-nav-tab ${isActive ? 'active' : ''}`;

        // For product-info and variants tabs on the main product detail page
        if (tab.isButton && (tab.id === 'product-info' || tab.id === 'variants')) {
          return (
            <button
              key={tab.id}
              onClick={() => onTabClick?.(tab.id as 'product-info' | 'variants')}
              className={className}
            >
              {typeof tab.icon === 'string' ? tab.icon : tab.icon} {tab.label}
            </button>
          );
        }

        // For link-based tabs
        // If we're on product detail page (product-info or variants), these link to their routes
        // If we're on another page, product-info and variants link back to main page
        const linkPath = tab.path || `/admin/products/${productId}`;

        return (
          <Link
            key={tab.id}
            to={linkPath}
            className={className}
          >
            {typeof tab.icon === 'string' ? tab.icon : tab.icon} {tab.label}
          </Link>
        );
      })}
    </div>
  );
};

export default ProductNavTabs;
