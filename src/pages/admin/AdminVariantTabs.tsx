/**
 * Admin Variant Tabs Management Page
 *
 * Dedicated page for managing product tabs for a specific variant.
 * Provides a clean, professional interface for CRUD operations.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Copy, GripVertical } from 'lucide-react';
import AdminLayout from './AdminLayout';
import type { ProductTabDto, ProductTabCreateRequest } from '../../types/api';
import {
  adminGetTabsForVariant,
  adminCreateTab,
  adminUpdateTab,
  adminDeleteTab,
  adminDuplicateTab,
  adminReorderTabs
} from '../../services/productTabService';
import { Button } from '../../components/ui';
import { apiClient } from '../../services/apiClient';
import './AdminUsers.css';

const AdminVariantTabs: React.FC = () => {
  const { productId, variantId } = useParams<{ productId: string; variantId: string }>();
  const navigate = useNavigate();

  const [tabs, setTabs] = useState<ProductTabDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTab, setEditingTab] = useState<ProductTabDto | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load tabs
  const loadTabs = async () => {
    if (!variantId) return;

    try {
      setLoading(true);
      setError(null);
      const loadedTabs = await adminGetTabsForVariant(Number(variantId), 'en');
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
  }, [variantId]);

  // Delete tab
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tab?')) return;

    try {
      await adminDeleteTab(id);
      // Clear cache so frontend sees changes immediately
      apiClient.clearCache();
      await loadTabs();
    } catch (err) {
      console.error('Error deleting tab:', err);
      setError('Failed to delete tab');
    }
  };

  // Duplicate tab
  const handleDuplicate = async (id: number) => {
    try {
      await adminDuplicateTab(id);
      // Clear cache so frontend sees changes immediately
      apiClient.clearCache();
      await loadTabs();
    } catch (err) {
      console.error('Error duplicating tab:', err);
      setError('Failed to duplicate tab');
    }
  };

  // Navigate to edit page
  const handleEdit = (tab: ProductTabDto) => {
    navigate(`/admin/products/${productId}/variants/${variantId}/tabs/${tab.id}/edit`);
  };

  // Navigate to create page
  const handleCreate = () => {
    navigate(`/admin/products/${productId}/variants/${variantId}/tabs/new`);
  };

  return (
    <AdminLayout title="Variant Tabs Management">
      <div className="admin-page">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-header">
            <div className="header-actions">
              <Link to={`/admin/products/${productId}`} className="btn btn-outline">
                <ArrowLeft size={16} style={{ marginRight: 8 }} />
                Back to Product
              </Link>
              <Button variant="primary" onClick={handleCreate}>
                <Plus size={16} style={{ marginRight: 8 }} />
                Add New Tab
              </Button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Tabs List */}
          {loading ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '40px' }}>
              Loading tabs...
            </div>
          ) : tabs.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <h3 style={{ marginBottom: 8 }}>No Tabs Yet</h3>
              <p style={{ color: '#6b7280', marginBottom: 24 }}>
                Create your first tab to start configuring product information.
              </p>
              <Button variant="primary" onClick={handleCreate}>
                <Plus size={16} style={{ marginRight: 8 }} />
                Create First Tab
              </Button>
            </div>
          ) : (
            <div className="admin-card">
              <h3 className="section-title" style={{ marginBottom: 16 }}>
                Tabs ({tabs.length})
              </h3>

              <div style={{ display: 'grid', gap: 12 }}>
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className="tab-list-item"
                    style={{
                      padding: '16px 20px',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      transition: 'border-color 0.2s ease'
                    }}
                  >
                    {/* Drag handle */}
                    <div style={{ cursor: 'grab', color: '#9ca3af' }}>
                      <GripVertical size={20} />
                    </div>

                    {/* Tab info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: '#1f2937' }}>
                          {tab.tabLabel}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            background: '#e0e7ff',
                            color: '#4338ca',
                            fontWeight: 500
                          }}
                        >
                          {tab.contentType}
                        </span>
                        {tab.isActive ? (
                          <span
                            style={{
                              padding: '2px 8px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              background: '#d1fae5',
                              color: '#065f46',
                              fontWeight: 500
                            }}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              padding: '2px 8px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              background: '#fee2e2',
                              color: '#991b1b',
                              fontWeight: 500
                            }}
                          >
                            Inactive
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        Key: <code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '3px' }}>{tab.tabKey}</code>
                        {' • '}Order: {tab.displayOrder}
                        {' • '}Locale: {tab.locale}
                        {tab.componentName && (
                          <>
                            {' • '}Component: <code style={{ background: '#e5e7eb', padding: '2px 6px', borderRadius: '3px' }}>{tab.componentName}</code>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(tab)}>
                        <Edit size={14} />
                      </Button>
                      <Button variant="info" size="sm" onClick={() => handleDuplicate(tab.id)}>
                        <Copy size={14} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(tab.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminVariantTabs;
