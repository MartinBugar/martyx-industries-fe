'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenExpired } from '@/lib/services/apiUtils';
import AdminLayout from '@/components/admin/AdminLayout';
import { adminProductsService, type AdminProductDigital, type AdminProductPhysical } from '@/lib/services/adminProductsService';
import './AdminProducts.css';

type ProductTab = 'all' | 'create';
type ProductType = 'DIGITAL' | 'PHYSICAL';

interface AllProducts {
  digital: AdminProductDigital[];
  physical: AdminProductPhysical[];
}

export default function AdminProducts() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProductTab>('all');
  const [products, setProducts] = useState<AllProducts>({ digital: [], physical: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'DIGITAL' | 'PHYSICAL'>('all');

  // Create product form
  const [createType, setCreateType] = useState<ProductType>('DIGITAL');
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    category: '',
    imageUrl: '',
    // Digital specific
    downloadUrl: '',
    fileSize: '',
    // Physical specific
    weight: '',
    dimensions: ''
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    const hasWindow = typeof window !== 'undefined';
    const adminFlag = hasWindow && window.localStorage.getItem('adminAuthed') === 'true';
    const token = hasWindow ? window.localStorage.getItem('token') : null;
    const validToken = !!token && !isTokenExpired(token);

    if (!adminFlag || !validToken) {
      router.replace('/admin');
      return;
    }

    if (activeTab === 'all') {
      loadProducts();
    }
  }, [router, activeTab]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [digital, physical] = await Promise.all([
        adminProductsService.getAllDigitalProducts(),
        adminProductsService.getAllPhysicalProducts()
      ]);
      setProducts({ digital, physical });
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const allProductsFlat = [
    ...products.digital.map(p => ({ ...p, type: 'DIGITAL' as const })),
    ...products.physical.map(p => ({ ...p, type: 'PHYSICAL' as const }))
  ];

  const filteredProducts = allProductsFlat.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || product.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDeleteProduct = async (productId: number, type: ProductType) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      if (type === 'DIGITAL') {
        await adminProductsService.deleteDigitalProduct(productId);
      } else {
        await adminProductsService.deletePhysicalProduct(productId);
      }
      await loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Failed to delete product');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(false);

    if (!createForm.name || !createForm.price) {
      setCreateError('Name and price are required');
      return;
    }

    setCreating(true);
    try {
      const baseData = {
        name: createForm.name,
        description: createForm.description,
        price: parseFloat(createForm.price),
        stockQuantity: parseInt(createForm.stockQuantity) || 0,
        category: createForm.category,
        imageUrl: createForm.imageUrl
      };

      if (createType === 'DIGITAL') {
        await adminProductsService.createDigitalProduct({
          ...baseData,
          downloadUrl: createForm.downloadUrl,
          fileSize: parseInt(createForm.fileSize) || 0
        });
      } else {
        await adminProductsService.createPhysicalProduct({
          ...baseData,
          weight: parseFloat(createForm.weight) || 0,
          dimensions: createForm.dimensions
        });
      }

      setCreateSuccess(true);
      setCreateForm({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        category: '',
        imageUrl: '',
        downloadUrl: '',
        fileSize: '',
        weight: '',
        dimensions: ''
      });

      if (activeTab === 'all') {
        await loadProducts();
      }
    } catch (error) {
      console.error('Failed to create product:', error);
      setCreateError('Failed to create product. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const navTabs = (
    <div className="admin-nav-tabs">
      <button
        className={`admin-nav-tab${activeTab === 'all' ? ' active' : ''}`}
        onClick={() => setActiveTab('all')}
      >
        📦 All Products
      </button>
      <button
        className={`admin-nav-tab${activeTab === 'create' ? ' active' : ''}`}
        onClick={() => setActiveTab('create')}
      >
        ➕ Create Product
      </button>
    </div>
  );

  return (
    <AdminLayout title="Product Management" navTabs={navTabs}>
      {/* All Products Tab */}
      {activeTab === 'all' && (
        <div className="products-section">
          {/* Filters */}
          <div className="filters-row">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search products by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-box">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'DIGITAL' | 'PHYSICAL')}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="DIGITAL">Digital</option>
                <option value="PHYSICAL">Physical</option>
              </select>
            </div>

            <button className="refresh-btn" onClick={loadProducts}>
              🔄 Refresh
            </button>
          </div>

          {/* Summary Stats */}
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{allProductsFlat.length}</div>
              <div className="stat-label">Total Products</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{products.digital.length}</div>
              <div className="stat-label">Digital Products</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{products.physical.length}</div>
              <div className="stat-label">Physical Products</div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Loading products...</div>
          ) : (
            <div className="table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={`${product.type}-${product.id}`}>
                      <td>{product.id}</td>
                      <td>
                        <div className="product-info">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="product-thumb"
                            />
                          )}
                          <div>
                            <div className="product-name">{product.name}</div>
                            <div className="product-desc">{product.description?.substring(0, 50)}...</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${product.type.toLowerCase()}`}>
                          {product.type}
                        </span>
                      </td>
                      <td className="price-cell">€{product.price.toFixed(2)}</td>
                      <td>{product.stockQuantity}</td>
                      <td>{product.category || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => router.push(`/admin/products/${product.id}?type=${product.type}`)}
                            className="action-btn view-btn"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.type)}
                            className="action-btn delete-btn"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProducts.length === 0 && (
                <div className="empty-state">
                  <p>No products found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Product Tab */}
      {activeTab === 'create' && (
        <div className="create-section">
          <h2 className="section-title">Create New Product</h2>

          {/* Product Type Selector */}
          <div className="type-selector">
            <button
              className={`type-btn${createType === 'DIGITAL' ? ' active' : ''}`}
              onClick={() => setCreateType('DIGITAL')}
            >
              💿 Digital Product
            </button>
            <button
              className={`type-btn${createType === 'PHYSICAL' ? ' active' : ''}`}
              onClick={() => setCreateType('PHYSICAL')}
            >
              📦 Physical Product
            </button>
          </div>

          <form onSubmit={handleCreateProduct} className="create-form">
            {createError && (
              <div className="alert alert-error">{createError}</div>
            )}

            {createSuccess && (
              <div className="alert alert-success">Product created successfully!</div>
            )}

            {/* Common Fields */}
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Product Name *</label>
                  <input
                    id="name"
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Enter product name"
                    disabled={creating}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="price">Price (€) *</label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    value={createForm.price}
                    onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                    placeholder="0.00"
                    disabled={creating}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stockQuantity">Stock Quantity</label>
                  <input
                    id="stockQuantity"
                    type="number"
                    value={createForm.stockQuantity}
                    onChange={(e) => setCreateForm({ ...createForm, stockQuantity: e.target.value })}
                    placeholder="0"
                    disabled={creating}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <input
                    id="category"
                    type="text"
                    value={createForm.category}
                    onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                    placeholder="e.g., Electronics"
                    disabled={creating}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={4}
                  disabled={creating}
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="imageUrl">Image URL</label>
                <input
                  id="imageUrl"
                  type="url"
                  value={createForm.imageUrl}
                  onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Digital Product Fields */}
            {createType === 'DIGITAL' && (
              <div className="form-section">
                <h3 className="form-section-title">Digital Product Details</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="downloadUrl">Download URL</label>
                    <input
                      id="downloadUrl"
                      type="url"
                      value={createForm.downloadUrl}
                      onChange={(e) => setCreateForm({ ...createForm, downloadUrl: e.target.value })}
                      placeholder="https://example.com/download"
                      disabled={creating}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fileSize">File Size (MB)</label>
                    <input
                      id="fileSize"
                      type="number"
                      value={createForm.fileSize}
                      onChange={(e) => setCreateForm({ ...createForm, fileSize: e.target.value })}
                      placeholder="0"
                      disabled={creating}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Physical Product Fields */}
            {createType === 'PHYSICAL' && (
              <div className="form-section">
                <h3 className="form-section-title">Physical Product Details</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="weight">Weight (kg)</label>
                    <input
                      id="weight"
                      type="number"
                      step="0.01"
                      value={createForm.weight}
                      onChange={(e) => setCreateForm({ ...createForm, weight: e.target.value })}
                      placeholder="0.0"
                      disabled={creating}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="dimensions">Dimensions (L x W x H cm)</label>
                    <input
                      id="dimensions"
                      type="text"
                      value={createForm.dimensions}
                      onChange={(e) => setCreateForm({ ...createForm, dimensions: e.target.value })}
                      placeholder="10 x 10 x 10"
                      disabled={creating}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={creating}>
                {creating ? 'Creating...' : 'Create Product'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => {
                  setCreateForm({
                    name: '',
                    description: '',
                    price: '',
                    stockQuantity: '',
                    category: '',
                    imageUrl: '',
                    downloadUrl: '',
                    fileSize: '',
                    weight: '',
                    dimensions: ''
                  });
                  setCreateError(null);
                  setCreateSuccess(false);
                }}
                disabled={creating}
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}
