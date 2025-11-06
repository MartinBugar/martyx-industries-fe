/**
 * Admin Product Tabs Component
 *
 * Simplified tab management interface for admin panel.
 * Allows creating, editing, deleting, and reordering product tabs.
 */

import React, { useState, useEffect } from 'react';
import type { ProductTabDto, ProductTabCreateRequest } from '../../types/api';
import {
  adminGetTabsForMasterProduct,
  adminGetTabsForVariant,
  adminCreateTab,
  adminUpdateTab,
  adminDeleteTab,
  adminDuplicateTab
} from '../../services/productTabService';
import './AdminProductTabs.css';

interface AdminProductTabsProps {
  masterProductId?: number;
  variantId?: number;
  locale?: string;
}

const AdminProductTabs: React.FC<AdminProductTabsProps> = ({
  masterProductId,
  variantId,
  locale = 'en'
}) => {
  const [tabs, setTabs] = useState<ProductTabDto[]>([]);
  const [editingTab, setEditingTab] = useState<ProductTabDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initial form state
  const emptyForm: ProductTabCreateRequest = {
    masterProductId: masterProductId || null,
    variantId: variantId || null,
    tabKey: '',
    tabLabel: '',
    contentType: 'HTML',
    contentHtml: '',
    displayOrder: tabs.length,
    locale: locale,
    isActive: true,
    requiresAuthentication: false
  };

  const [formData, setFormData] = useState<ProductTabCreateRequest>(emptyForm);

  // Load tabs
  const loadTabs = async () => {
    try {
      setLoading(true);
      setError(null);

      let loadedTabs: ProductTabDto[] = [];

      if (masterProductId) {
        loadedTabs = await adminGetTabsForMasterProduct(masterProductId, locale);
      } else if (variantId) {
        loadedTabs = await adminGetTabsForVariant(variantId, locale);
      }

      setTabs(loadedTabs);
    } catch (err) {
      console.error('Error loading tabs:', err);
      setError('Failed to load tabs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabs();
  }, [masterProductId, variantId, locale]);

  // Handle create
  const handleCreate = async () => {
    try {
      setError(null);
      await adminCreateTab(formData);
      setIsCreating(false);
      setFormData(emptyForm);
      await loadTabs();
    } catch (err) {
      console.error('Error creating tab:', err);
      setError('Failed to create tab');
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!editingTab) return;

    try {
      setError(null);
      await adminUpdateTab(editingTab.id, formData);
      setEditingTab(null);
      setFormData(emptyForm);
      await loadTabs();
    } catch (err) {
      console.error('Error updating tab:', err);
      setError('Failed to update tab');
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tab?')) return;

    try {
      setError(null);
      await adminDeleteTab(id);
      await loadTabs();
    } catch (err) {
      console.error('Error deleting tab:', err);
      setError('Failed to delete tab');
    }
  };

  // Handle duplicate
  const handleDuplicate = async (id: number) => {
    try {
      setError(null);
      await adminDuplicateTab(id);
      await loadTabs();
    } catch (err) {
      console.error('Error duplicating tab:', err);
      setError('Failed to duplicate tab');
    }
  };

  // Start editing
  const startEdit = (tab: ProductTabDto) => {
    setEditingTab(tab);
    setFormData({
      masterProductId: tab.masterProductId,
      variantId: tab.variantId,
      tabKey: tab.tabKey,
      tabLabel: tab.tabLabel,
      contentType: tab.contentType,
      contentHtml: tab.contentHtml || '',
      contentMarkdown: tab.contentMarkdown || '',
      contentJson: tab.contentJson || '',
      componentName: tab.componentName || '',
      displayOrder: tab.displayOrder,
      iconName: tab.iconName || '',
      isActive: tab.isActive,
      showForVariantType: tab.showForVariantType || '',
      requiresAuthentication: tab.requiresAuthentication,
      locale: tab.locale,
      description: tab.description || '',
      cssClass: tab.cssClass || ''
    });
    setIsCreating(false);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingTab(null);
    setIsCreating(false);
    setFormData(emptyForm);
  };

  return (
    <div className="admin-product-tabs">
      <div className="admin-tabs-header">
        <h3>Product Tabs</h3>
        <button
          className="btn btn-primary"
          onClick={() => {
            setIsCreating(true);
            setEditingTab(null);
            setFormData({ ...emptyForm, displayOrder: tabs.length });
          }}
        >
          + Add New Tab
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading && <div>Loading tabs...</div>}

      {/* Tab List */}
      <div className="tabs-list">
        {tabs.map(tab => (
          <div key={tab.id} className="tab-item">
            <div className="tab-item-header">
              <span className="tab-label">
                {tab.tabLabel} <small>({tab.tabKey})</small>
              </span>
              <span className={`tab-status ${tab.isActive ? 'active' : 'inactive'}`}>
                {tab.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="tab-item-meta">
              <span>Type: {tab.contentType}</span>
              <span>Order: {tab.displayOrder}</span>
              <span>Locale: {tab.locale}</span>
            </div>
            <div className="tab-item-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => startEdit(tab)}>
                Edit
              </button>
              <button className="btn btn-sm btn-info" onClick={() => handleDuplicate(tab.id)}>
                Duplicate
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(tab.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Form */}
      {(isCreating || editingTab) && (
        <div className="tab-form-modal">
          <div className="tab-form">
            <h4>{isCreating ? 'Create New Tab' : 'Edit Tab'}</h4>

            <div className="form-group">
              <label>Tab Key (slug)</label>
              <input
                type="text"
                value={formData.tabKey}
                onChange={(e) => setFormData({ ...formData, tabKey: e.target.value })}
                placeholder="e.g., details, features"
              />
            </div>

            <div className="form-group">
              <label>Tab Label (Display Name)</label>
              <input
                type="text"
                value={formData.tabLabel}
                onChange={(e) => setFormData({ ...formData, tabLabel: e.target.value })}
                placeholder="e.g., Product Details"
              />
            </div>

            <div className="form-group">
              <label>Content Type</label>
              <select
                value={formData.contentType}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value as any })}
              >
                <option value="HTML">HTML</option>
                <option value="MARKDOWN">Markdown</option>
                <option value="JSON">JSON</option>
                <option value="COMPONENT">Component</option>
              </select>
            </div>

            {formData.contentType === 'HTML' && (
              <div className="form-group">
                <label>HTML Content</label>
                <textarea
                  value={formData.contentHtml || ''}
                  onChange={(e) => setFormData({ ...formData, contentHtml: e.target.value })}
                  rows={15}
                  placeholder="Enter HTML content..."
                  style={{ fontFamily: 'monospace', fontSize: '13px' }}
                />
              </div>
            )}

            {formData.contentType === 'COMPONENT' && (
              <div className="form-group">
                <label>Component Name</label>
                <input
                  type="text"
                  value={formData.componentName || ''}
                  onChange={(e) => setFormData({ ...formData, componentName: e.target.value })}
                  placeholder="e.g., DetailsTab, ReviewsTab"
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                />
              </div>

              <div className="form-group">
                <label>Icon Name</label>
                <input
                  type="text"
                  value={formData.iconName || ''}
                  onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                  placeholder="e.g., FileText, Star"
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                {' '}Active
              </label>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.requiresAuthentication}
                  onChange={(e) => setFormData({ ...formData, requiresAuthentication: e.target.checked })}
                />
                {' '}Requires Authentication
              </label>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={isCreating ? handleCreate : handleUpdate}>
                {isCreating ? 'Create Tab' : 'Update Tab'}
              </button>
              <button className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductTabs;
