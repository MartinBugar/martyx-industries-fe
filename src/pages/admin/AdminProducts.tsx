import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Pencil, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminProductsService, type BaseProduct, type DigitalProduct, type PhysicalProduct, type PageResponse } from '../../services/adminProductsService';
import { Button, Badge, SkeletonTable } from '../../components/ui';

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

  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<'all-products' | 'create-product'>('all-products');

  // Create form state
  const [createData, setCreateData] = useState<typeof initialCreate>({ ...initialCreate });
  const [creating, setCreating] = useState<boolean>(false);


  const loadProducts = async (pageNum: number = page) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse: PageResponse<BaseProduct> = await adminProductsService.getProducts({}, pageNum, 20, 'id', 'DESC');
      setProducts(pageResponse.content);
      setTotalPages(pageResponse.totalPages);
      setTotalElements(pageResponse.totalElements);
      setPage(pageResponse.number);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load products';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts(0);
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
                <Button variant="primary" type="submit" disabled={creating} loading={creating}>
                  Create Product
                </Button>
                <Button variant="outline" type="button" onClick={resetCreate} disabled={creating}>
                  Clear
                </Button>
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
                  <SkeletonTable rows={5} columns={4} />
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
                          <Eye size={16} />
                        </Link>
                        <Link to={`/admin/products/${p.id}/edit`} className="btn btn-outline btn-sm" title="Edit product">
                          <Pencil size={16} />
                        </Link>
                        <Button variant="danger" size="sm" icon={X} onClick={() => handleDelete(p.id!)} title="Delete product" />
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
                        <span className="mobile-field-value">
                          <Badge variant="info" size="sm">{getProductType(p)}</Badge>
                        </span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Price:</span>
                        <span className="mobile-field-value">{typeof p.price === 'number' ? `${p.price} ${p.currency ?? ''}` : '—'}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Active:</span>
                        <span className="mobile-field-value">
                          <Badge variant={p.active ? 'success' : 'warning'} size="sm">
                            {p.active ? 'Yes' : 'No'}
                          </Badge>
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
                  <tr><td colSpan={8} className="table-empty">
                    <SkeletonTable rows={5} columns={8} />
                  </td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={8} className="table-empty">No products found.</td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id as React.Key}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.sku || '—'}</td>
                      <td>{p.category || '—'}</td>
                      <td><Badge variant="info" size="sm">{getProductType(p)}</Badge></td>
                      <td>{typeof p.price === 'number' ? `${p.price} ${p.currency ?? ''}` : '—'}</td>
                      <td><Badge variant={p.active ? 'success' : 'warning'} size="sm">{p.active ? 'Yes' : 'No'}</Badge></td>
                      <td className="text-right">
                        <div className="action-buttons">
                          <Link to={`/admin/products/${p.id}/view`} className="btn btn-outline btn-sm" title="View product details">
                            <Eye size={16} />
                          </Link>
                          <Link to={`/admin/products/${p.id}/edit`} className="btn btn-outline btn-sm" title="Edit product">
                            <Pencil size={16} />
                          </Link>
                          <Button variant="danger" size="sm" icon={X} onClick={() => handleDelete(p.id!)} title="Delete product" />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Showing {products.length > 0 ? (page * 20 + 1) : 0} - {Math.min((page + 1) * 20, totalElements)} of {totalElements} products
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadProducts(page - 1)}
                  disabled={page === 0 || loading}
                >
                  Previous
                </Button>
                <span style={{ padding: '8px 12px', fontSize: '14px', color: '#374151' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadProducts(page + 1)}
                  disabled={page >= totalPages - 1 || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
