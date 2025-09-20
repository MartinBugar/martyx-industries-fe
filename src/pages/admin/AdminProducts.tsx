import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminProductsService, type BaseProduct, type DigitalProduct, type PhysicalProduct } from '../../services/adminProductsService';

type CreateProduct = BaseProduct & { productType: 'DIGITAL' | 'PHYSICAL' };

const initialCreate: CreateProduct = {
  name: '',
  sku: '',
  category: '',
  price: undefined,
  currency: 'USD',
  description: '',
  active: true,
  productType: 'DIGITAL',
};

const AdminProducts: React.FC = () => {
  const { t } = useTranslation('common');
  const [products, setProducts] = useState<BaseProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'all-products' | 'create-product'>('all-products');

  // Create form state
  const [createData, setCreateData] = useState<typeof initialCreate>({ ...initialCreate });
  const [creating, setCreating] = useState<boolean>(false);


  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminProductsService.getProducts({});
      setProducts(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load products';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetCreate = () => setCreateData({ ...initialCreate });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!createData.name?.trim()) {
      setError(t('common:admin.name_required'));
      return;
    }

    setCreating(true);
    try {
      let created: BaseProduct;
      const payload: Record<string, unknown> = { ...createData };
      // Clean empty strings to null/undefined to avoid backend validation issues
      (['sku','category','description','currency'] as const).forEach((k) => {
        if (payload[k] === '') (payload as Record<string, unknown>)[k] = undefined;
      });

      if (createData.productType === 'DIGITAL') {
        created = await adminProductsService.createDigitalProduct(payload as DigitalProduct);
      } else {
        created = await adminProductsService.createPhysicalProduct(payload as PhysicalProduct);
      }
      setProducts(prev => [created, ...prev]);
      resetCreate();
      setActiveTab('all-products');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common:admin.failed_create_product');
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm(t('common:admin.confirm_delete_product'))) return;
    setError(null);
    try {
      await adminProductsService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common:admin.failed_delete_product');
      setError(msg);
    }
  };

  const getProductType = (p: BaseProduct): string => {
    const t: unknown = p.productType ?? (p as Record<string, unknown>)['type'];
    return typeof t === 'string' && t.trim() ? t : '—';
  };

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'all-products' ? 'active' : ''}`}
        data-tab="all-products"
        onClick={() => setActiveTab('all-products')}
        aria-label="View all products in inventory"
      >
        All Products
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'create-product' ? 'active' : ''}`}
        data-tab="create-product"
        onClick={() => setActiveTab('create-product')}
        aria-label="Create new product"
      >
        Create New Product
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Products" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h2 className="admin-title">Product Management</h2>
              <p className="admin-subtitle">Manage your product inventory with ease. Create, edit, and organize all your products in one place.</p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Create Product Tab */}
          {activeTab === 'create-product' && (
          <div className="admin-card">
            <h3 className="section-title">Create New Product</h3>
            <form onSubmit={handleCreate} className="form-grid">
              <div>
                <label className="form-label">Type</label>
                <select
                  className="form-input"
                  value={createData.productType}
                  onChange={(e) => setCreateData({ ...createData, productType: e.target.value as 'DIGITAL' | 'PHYSICAL' })}
                >
                  <option value="DIGITAL">Digital</option>
                  <option value="PHYSICAL">Physical</option>
                </select>
              </div>
              <div>
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  placeholder="Product name"
                  required
                />
              </div>
              <div>
                <label className="form-label">SKU</label>
                <input
                  className="form-input"
                  value={String(createData.sku ?? '')}
                  onChange={(e) => setCreateData({ ...createData, sku: e.target.value })}
                  placeholder="Optional SKU"
                />
              </div>
              <div>
                <label className="form-label">Category</label>
                <input
                  className="form-input"
                  value={String(createData.category ?? '')}
                  onChange={(e) => setCreateData({ ...createData, category: e.target.value })}
                  placeholder="Category"
                />
              </div>
              <div>
                <label className="form-label">Price</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={typeof createData.price === 'number' ? createData.price : ''}
                  onChange={(e) => setCreateData({ ...createData, price: e.target.value === '' ? undefined : Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="form-label">Currency</label>
                <input
                  className="form-input"
                  value={String(createData.currency ?? '')}
                  onChange={(e) => setCreateData({ ...createData, currency: e.target.value })}
                  placeholder="USD"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={String(createData.description ?? '')}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  placeholder="Description"
                />
              </div>
              <div>
                <label className="form-label">Active</label>
                <select
                  className="form-input"
                  value={String(createData.active ?? true)}
                  onChange={(e) => setCreateData({ ...createData, active: e.target.value === 'true' })}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Product'}
                </button>
                <button type="button" className="btn btn-outline" onClick={resetCreate} disabled={creating}>Clear</button>
              </div>
            </form>
          </div>
          )}

          {/* All Products Tab */}
          {activeTab === 'all-products' && (
          <>
            {/* Mobile Card Layout */}
            <div className="mobile-table-cards">
              {loading ? (
                <div className="mobile-table-card">
                  <div className="table-empty">Loading products...</div>
                </div>
              ) : products.length === 0 ? (
                <div className="mobile-table-card">
                  <div className="table-empty">No products found.</div>
                </div>
              ) : (
                products.map(p => (
                  <div key={`mobile-${p.id}`} className="mobile-table-card">
                    <div className="mobile-card-header">
                      <div>
                        <h4 className="mobile-card-title">{p.name}</h4>
                        <p className="mobile-card-subtitle">ID: {p.id}</p>
                      </div>
                      <div className="mobile-card-actions">
                        <Link to={`/admin/products/${p.id}/view`} className="btn btn-outline btn-sm" title="View product details">
                          👁️
                        </Link>
                        <Link to={`/admin/products/${p.id}/edit`} className="btn btn-outline btn-sm" title="Edit product">
                          ✏️
                        </Link>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id!)} title="Delete product">
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-field">
                        <span className="mobile-field-label">SKU:</span>
                        <span className="mobile-field-value">{p.sku || '—'}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Category:</span>
                        <span className="mobile-field-value">{p.category || '—'}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Type:</span>
                        <span className="mobile-field-value">{getProductType(p)}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Price:</span>
                        <span className="mobile-field-value">{typeof p.price === 'number' ? `${p.price} ${p.currency ?? ''}` : '—'}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Active:</span>
                        <span className="mobile-field-value">
                          <span className={`user-status ${p.active ? 'confirmed' : 'unconfirmed'}`}>
                            {p.active ? 'Yes' : 'No'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Active</th>
                  <th style={{ width: 240 }} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="table-empty">Loading products...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={8} className="table-empty">No products found.</td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id as React.Key}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.sku || '—'}</td>
                      <td>{p.category || '—'}</td>
                      <td>{getProductType(p)}</td>
                      <td>{typeof p.price === 'number' ? `${p.price} ${p.currency ?? ''}` : '—'}</td>
                      <td>{p.active ? 'Yes' : 'No'}</td>
                      <td className="text-right">
                        <div className="action-buttons">
                          <Link to={`/admin/products/${p.id}/view`} className="btn btn-outline btn-sm" title="View product details">
                            👁️
                          </Link>
                          <Link to={`/admin/products/${p.id}/edit`} className="btn btn-outline btn-sm" title="Edit product">
                            ✏️
                          </Link>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id!)} title="Delete product">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
