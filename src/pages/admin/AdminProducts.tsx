import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [products, setProducts] = useState<BaseProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState<string>('');
  const [activeOnly, setActiveOnly] = useState<boolean>(false);

  // Create form state
  const [createData, setCreateData] = useState<typeof initialCreate>({ ...initialCreate });
  const [creating, setCreating] = useState<boolean>(false);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  const filteredProducts = useMemo(() => {
    let data = products;
    if (category.trim()) {
      const q = category.toLowerCase();
      data = data.filter(p => String(p.category ?? '').toLowerCase().includes(q));
    }
    if (activeOnly) {
      data = data.filter(p => p.active === true);
    }
    return data;
  }, [products, category, activeOnly]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminProductsService.getProducts({
        category: category.trim() || undefined,
        active: activeOnly || undefined,
      });
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
      setError('Name is required');
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
      setShowCreateForm(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create product';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setError(null);
    try {
      await adminProductsService.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete product';
      setError(msg);
    }
  };

  const getProductType = (p: BaseProduct): string => {
    const t: unknown = p.productType ?? (p as Record<string, unknown>)['type'];
    return typeof t === 'string' && t.trim() ? t : '—';
  };

  return (
    <AdminLayout title="Products">
      <div className="admin-page">
        <div className="admin-container">
          <div className="admin-header">
            <div>
              <h2 className="admin-title">Product Management</h2>
              <p className="admin-subtitle">List, create, edit and delete products.</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Filter by category..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.target.checked)} /> Active only
              </label>
              <button className="btn btn-outline" onClick={loadProducts} disabled={loading}>Apply</button>
              <button className="btn btn-outline" onClick={() => { setCategory(''); setActiveOnly(false); }} disabled={loading}>Clear</button>
              <button className="btn btn-primary" onClick={() => { if (!showCreateForm) resetCreate(); setShowCreateForm(!showCreateForm); }}>
                {showCreateForm ? 'Hide Create Form' : 'Create New Product'}
              </button>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Create Product */}
          {showCreateForm && (
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
                <button type="button" className="btn" onClick={() => { resetCreate(); setShowCreateForm(false); }} disabled={creating}>Cancel</button>
              </div>
            </form>
          </div>
          )}

          {/* Products Table */}
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
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={8} className="table-empty">No products found.</td></tr>
                ) : (
                  filteredProducts.map(p => (
                    <tr key={p.id as React.Key}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.sku || '—'}</td>
                      <td>{p.category || '—'}</td>
                      <td>{getProductType(p)}</td>
                      <td>{typeof p.price === 'number' ? `${p.price} ${p.currency ?? ''}` : '—'}</td>
                      <td>{p.active ? 'Yes' : 'No'}</td>
                      <td className="text-right">
                        <Link to={`/admin/products/${p.id}`} className="btn btn-outline btn-sm mr-8">View / Edit</Link>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id!)}>Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
