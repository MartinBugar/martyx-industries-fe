import React, { useEffect, useState, useCallback } from 'react';
import { adminCategoryService } from '../../services/adminCategoryService';
import type { ProductCategory } from '../../types/category';
import AdminLayout from './AdminLayout';
import { Button, Badge, ConfirmDialog, useConfirmDialog } from '../../components/ui';
import { Eye, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import './AdminUsers.css';
import './AdminButtonOverrides.css';

/**
 * Admin page for managing product categories
 * CRUD operations: Create, Read, Update, Delete categories
 */
const AdminCategories: React.FC = () => {
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'all-categories' | 'create-category'>('all-categories');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { confirm, dialogProps } = useConfirmDialog({
    title: 'Confirm Delete',
    variant: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  });

  // Form state
  const [formData, setFormData] = useState<Partial<ProductCategory>>({
    name: '',
    slug: '',
    description: '',
    icon: '',
    displayOrder: 0,
    isActive: true,
    seoTitle: '',
    seoDescription: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminCategoryService.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      displayOrder: categories.length,
      isActive: true,
      seoTitle: '',
      seoDescription: ''
    });
    setActiveTab('create-category');
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setFormData(category);
    setActiveTab('create-category');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.slug?.trim()) {
      setError('Slug is required');
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        // Update existing
        await adminCategoryService.updateCategory(editingCategory.id, formData);
        showSuccess('Category updated successfully!');
      } else {
        // Create new
        await adminCategoryService.createCategory(formData);
        showSuccess('Category created successfully!');
      }
      resetForm();
      setActiveTab('all-categories');
      loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: '',
      displayOrder: categories.length,
      isActive: true,
      seoTitle: '',
      seoDescription: ''
    });
  };

  const handleDelete = useCallback(async (id: number, name: string) => {
    const confirmed = await confirm({
      message: `Are you sure you want to delete category "${name}"?\n\nNote: Products in this category will need to be reassigned.`,
    });

    if (!confirmed) {
      return;
    }

    try {
      await adminCategoryService.deleteCategory(id);
      showSuccess('Category deleted successfully!');
      loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  }, [confirm]);

  const handleToggleActive = async (id: number) => {
    try {
      await adminCategoryService.toggleActive(id);
      showSuccess('Category status updated!');
      loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle category status');
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const autoGenerateSlug = () => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setFormData({ ...formData, slug });
    }
  };

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'all-categories' ? 'active' : ''}`}
        data-tab="all-categories"
        onClick={() => setActiveTab('all-categories')}
        aria-label="View all categories"
      >
        All Categories
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'create-category' ? 'active' : ''}`}
        data-tab="create-category"
        onClick={() => setActiveTab('create-category')}
        aria-label="Create new category"
      >
        {editingCategory ? 'Edit Category' : 'Create New Category'}
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Product Categories" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && (
            <div className="alert alert-error">
              {error}
              <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              {successMessage}
              <button onClick={() => setSuccessMessage(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
          )}

          {/* Create/Edit Category Tab */}
          {activeTab === 'create-category' && (
            <div className="admin-card">
              <h3 className="section-title">{editingCategory ? 'Edit Category' : 'Create New Category'}</h3>
              <p className="form-help-text" style={{ marginBottom: '20px', color: '#6b7280' }}>
                Categories are displayed in the golden navbar on the products page. Use emojis as icons for visual appeal.
              </p>
              <form onSubmit={handleSave} className="form-grid">
                <div>
                  <label className="form-label">Name *</label>
                  <input
                    className="form-input"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., 3D Printed Models"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Slug (URL) *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      className="form-input"
                      value={formData.slug || ''}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g., 3d-printed-models"
                      required
                      style={{ flex: 1 }}
                    />
                    <Button variant="outline" type="button" onClick={autoGenerateSlug}>
                      Auto
                    </Button>
                  </div>
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Used in URLs: /products?category={formData.slug || 'slug'}</small>
                </div>

                <div>
                  <label className="form-label">Icon (Emoji)</label>
                  <input
                    className="form-input"
                    value={formData.icon || ''}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🏎️"
                    maxLength={10}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Single emoji recommended</small>
                </div>

                <div>
                  <label className="form-label">Display Order</label>
                  <input
                    className="form-input"
                    type="number"
                    value={formData.displayOrder || 0}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                    min={0}
                  />
                  <small style={{ fontSize: '12px', color: '#6b7280' }}>Lower numbers appear first</small>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this category"
                  />
                </div>

                <div>
                  <label className="form-label">SEO Title</label>
                  <input
                    className="form-input"
                    value={formData.seoTitle || ''}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    placeholder="3D Printed Models | Your Shop"
                    maxLength={255}
                  />
                </div>

                <div>
                  <label className="form-label">SEO Description</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={formData.seoDescription || ''}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    placeholder="Meta description (150-160 chars)"
                    maxLength={500}
                  />
                </div>

                <div>
                  <label className="form-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive ?? true}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ marginRight: '8px' }}
                    />
                    Active
                  </label>
                </div>

                <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                  <Button variant="primary" type="submit" disabled={saving} loading={saving}>
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </Button>
                  <Button variant="outline" type="button" onClick={() => { resetForm(); setActiveTab('all-categories'); }} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* All Categories Tab */}
          {activeTab === 'all-categories' && (
            <>
              {loading ? (
                <div className="table-empty">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="admin-card">
                  <div className="table-empty">
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                    <h3>No categories yet</h3>
                    <p>Create your first product category to organize your shop</p>
                    <Button variant="primary" onClick={handleCreate} style={{ marginTop: '16px' }}>
                      Create First Category
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>Icon</th>
                        <th>Name</th>
                        <th>Slug</th>
                        <th style={{ width: 100 }}>Order</th>
                        <th style={{ width: 100 }}>Products</th>
                        <th style={{ width: 100 }}>Status</th>
                        <th style={{ width: 220 }} className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id}>
                          <td style={{ fontSize: '24px', textAlign: 'center' }}>
                            {category.icon || '—'}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{category.name}</div>
                            {category.description && (
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>{category.description}</div>
                            )}
                          </td>
                          <td>
                            <code style={{ fontSize: '12px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
                              {category.slug}
                            </code>
                          </td>
                          <td>{category.displayOrder}</td>
                          <td>
                            <Badge variant="info" size="sm">
                              {category.productCount || 0}
                            </Badge>
                          </td>
                          <td>
                            <Badge variant={category.isActive ? 'success' : 'warning'} size="sm">
                              {category.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <div className="action-buttons">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(category)} title="Edit category">
                                <Eye size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(category.id)}
                                title={category.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {category.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDelete(category.id, category.name)} title="Delete category">
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  );
};

export default AdminCategories;
