import React, { useEffect, useState } from 'react';
import { adminCategoryService } from '../../services/adminCategoryService';
import type { ProductCategory } from '../../types/category';
import './AdminCategories.css';

/**
 * Admin page for managing product categories
 * CRUD operations: Create, Read, Update, Delete categories
 */
const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setIsModalOpen(true);
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setFormData(category);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
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
      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?\n\nNote: Products in this category will need to be reassigned.`)) {
      return;
    }

    try {
      await adminCategoryService.deleteCategory(id);
      showSuccess('Category deleted successfully!');
      loadCategories();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

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

  if (loading) {
    return (
      <div className="admin-categories">
        <div className="loading">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="admin-categories">
      <div className="admin-categories-header">
        <div>
          <h1>Product Categories</h1>
          <p className="header-subtitle">Manage product categories displayed in golden navbar</p>
        </div>
        <button className="btn-primary" onClick={handleCreate}>
          <span className="btn-icon">+</span>
          Add Category
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      <div className="categories-grid">
        {categories.map((category) => (
          <div key={category.id} className={`category-card ${!category.isActive ? 'inactive' : ''}`}>
            <div className="category-card-header">
              <div className="category-icon-name">
                {category.icon && <span className="category-icon-large">{category.icon}</span>}
                <div>
                  <h3>{category.name}</h3>
                  <code className="category-slug">{category.slug}</code>
                </div>
              </div>
              <div className="category-status">
                {category.isActive ? (
                  <span className="badge badge-success">Active</span>
                ) : (
                  <span className="badge badge-inactive">Inactive</span>
                )}
              </div>
            </div>

            {category.description && (
              <p className="category-description">{category.description}</p>
            )}

            <div className="category-meta">
              <div className="meta-item">
                <span className="meta-label">Products:</span>
                <span className="meta-value">{category.productCount || 0}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Order:</span>
                <span className="meta-value">{category.displayOrder}</span>
              </div>
            </div>

            <div className="category-actions">
              <button
                className="btn-secondary btn-sm"
                onClick={() => handleEdit(category)}
              >
                Edit
              </button>
              <button
                className="btn-secondary btn-sm"
                onClick={() => handleToggleActive(category.id)}
              >
                {category.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className="btn-danger btn-sm"
                onClick={() => handleDelete(category.id, category.name)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No categories yet</h3>
          <p>Create your first product category to organize your shop</p>
          <button className="btn-primary" onClick={handleCreate}>
            Add First Category
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'New Category'}</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  type="text"
                  className="form-control"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., 3D Printed Models"
                />
              </div>

              <div className="form-group">
                <label htmlFor="slug">Slug (URL) *</label>
                <div className="input-with-button">
                  <input
                    id="slug"
                    type="text"
                    className="form-control"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g., 3d-printed-models"
                  />
                  <button className="btn-secondary btn-sm" onClick={autoGenerateSlug}>
                    Auto
                  </button>
                </div>
                <small>Used in URLs: /products?category={formData.slug || 'slug'}</small>
              </div>

              <div className="form-group">
                <label htmlFor="icon">Icon (Emoji)</label>
                <input
                  id="icon"
                  type="text"
                  className="form-control"
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="🏎️"
                  maxLength={10}
                />
                <small>Single emoji recommended: 🏎️ 🔧 🎁</small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="form-control"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="displayOrder">Display Order</label>
                  <input
                    id="displayOrder"
                    type="number"
                    className="form-control"
                    value={formData.displayOrder || 0}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    min={0}
                  />
                  <small>Lower numbers appear first</small>
                </div>

                <div className="form-group">
                  <label htmlFor="isActive">Status</label>
                  <select
                    id="isActive"
                    className="form-control"
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="seoTitle">SEO Title</label>
                <input
                  id="seoTitle"
                  type="text"
                  className="form-control"
                  value={formData.seoTitle || ''}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="3D Printed Models | Your Shop Name"
                  maxLength={255}
                />
              </div>

              <div className="form-group">
                <label htmlFor="seoDescription">SEO Description</label>
                <textarea
                  id="seoDescription"
                  className="form-control"
                  value={formData.seoDescription || ''}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder="Meta description for search engines (150-160 chars recommended)"
                  rows={2}
                  maxLength={500}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSave}>
                {editingCategory ? 'Save Changes' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
