import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, X, Search, Package } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import { adminProductsService, type MasterProductDto, type PageResponse } from '../../services/adminProductsService';
import { Button, Badge, SkeletonTable } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';

type CreateMasterProduct = {
  name: string;
  slug?: string;
  shortDescription?: string;
  longDescription?: string;
  productCategory?: string;
  active?: boolean;
  featured?: boolean;
  bestseller?: boolean;
  newProduct?: boolean;
  manufacturer?: string;
  brand?: string;
};

const initialCreate: CreateMasterProduct = {
  name: '',
  slug: '',
  shortDescription: '',
  longDescription: '',
  productCategory: 'MODEL_KIT',
  active: true,
  featured: false,
  bestseller: false,
  newProduct: false,
  manufacturer: '',
  brand: '',
};

const AdminProducts: React.FC = () => {
  const { t } = useTranslation('common');
  const [products, setProducts] = useState<MasterProductDto[]>([]);
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

  // Search with debounce for server-side filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const loadProducts = async (pageNum: number = page, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse: PageResponse<MasterProductDto> = await adminProductsService.getMasterProducts(
        { search: search || undefined },
        pageNum,
        20,
        'id',
        'DESC'
      );
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

  // Load products on mount
  useEffect(() => {
    loadProducts(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload products when debounced search changes
  useEffect(() => {
    loadProducts(0, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

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
      const payload: MasterProductDto = {
        name: createData.name.trim(),
        slug: createData.slug?.trim() || undefined,
        shortDescription: createData.shortDescription?.trim() || undefined,
        longDescription: createData.longDescription?.trim() || undefined,
        productCategory: createData.productCategory || 'MODEL_KIT',
        active: createData.active ?? true,
        featured: createData.featured ?? false,
        bestseller: createData.bestseller ?? false,
        newProduct: createData.newProduct ?? false,
        manufacturer: createData.manufacturer?.trim() || undefined,
        brand: createData.brand?.trim() || undefined,
      };

      await adminProductsService.createMasterProduct(payload);

      // Reload products to show the new one
      await loadProducts(0);

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
      await adminProductsService.deleteMasterProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('common:admin.failed_delete_product');
      setError(msg);
    }
  };

  const getCategoryLabel = (cat?: string | null): string => {
    if (!cat) return '—';
    const labels: Record<string, string> = {
      MODEL_KIT: 'Model Kit',
      MERCHANDISE: 'Merchandise',
      ELECTRONICS: 'Electronics',
      ACCESSORIES: 'Accessories',
      DIGITAL_DOWNLOAD: 'Digital Download',
    };
    return labels[cat] || cat;
  };

  const getVariantsSummary = (product: MasterProductDto): string => {
    const variantCount = product.variants?.length || 0;
    if (variantCount === 0) return 'No variants';
    if (variantCount === 1) return '1 variant';
    return `${variantCount} variants`;
  };

  const getPriceRange = (product: MasterProductDto): string => {
    const variants = product.variants || [];
    if (variants.length === 0) return '—';

    const prices = variants
      .map(v => v.priceWithVat)
      .filter((p): p is number => typeof p === 'number' && p > 0);

    if (prices.length === 0) return '—';

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) return `€${min.toFixed(2)}`;
    return `€${min.toFixed(2)} - €${max.toFixed(2)}`;
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
              <p className="admin-subtitle">Manage your product catalog. Create master products and their variants with full pricing and inventory control.</p>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Create Master Product Tab */}
          {activeTab === 'create-product' && (
          <div className="admin-card">
            <h3 className="section-title">Create New Master Product</h3>
            <p className="form-help-text" style={{ marginBottom: '20px', color: '#6b7280' }}>
              Create a product concept (e.g., "ENDEAVOUR Robot Model"). You can add variants (Digital Edition, Full Kit) later in the product detail page.
            </p>
            <form onSubmit={handleCreate} className="form-grid">
              <div>
                <label className="form-label">Name *</label>
                <input
                  className="form-input"
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  placeholder="e.g., ENDEAVOUR Robot Model"
                  required
                />
              </div>
              <div>
                <label className="form-label">Slug (URL)</label>
                <input
                  className="form-input"
                  value={createData.slug || ''}
                  onChange={(e) => setCreateData({ ...createData, slug: e.target.value })}
                  placeholder="e.g., endeavour-robot-model"
                />
              </div>
              <div>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={createData.productCategory || 'MODEL_KIT'}
                  onChange={(e) => setCreateData({ ...createData, productCategory: e.target.value })}
                >
                  <option value="MODEL_KIT">Model Kit</option>
                  <option value="MERCHANDISE">Merchandise</option>
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="ACCESSORIES">Accessories</option>
                  <option value="DIGITAL_DOWNLOAD">Digital Download</option>
                </select>
              </div>
              <div>
                <label className="form-label">Manufacturer</label>
                <input
                  className="form-input"
                  value={createData.manufacturer || ''}
                  onChange={(e) => setCreateData({ ...createData, manufacturer: e.target.value })}
                  placeholder="e.g., MartyX Industries"
                />
              </div>
              <div>
                <label className="form-label">Brand</label>
                <input
                  className="form-input"
                  value={createData.brand || ''}
                  onChange={(e) => setCreateData({ ...createData, brand: e.target.value })}
                  placeholder="e.g., MartyX"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Short Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={createData.shortDescription || ''}
                  onChange={(e) => setCreateData({ ...createData, shortDescription: e.target.value })}
                  placeholder="Brief product description (1-2 sentences)"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Long Description</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={createData.longDescription || ''}
                  onChange={(e) => setCreateData({ ...createData, longDescription: e.target.value })}
                  placeholder="Detailed product description"
                />
              </div>
              <div>
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={createData.active ?? true}
                    onChange={(e) => setCreateData({ ...createData, active: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  Active
                </label>
              </div>
              <div>
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={createData.featured ?? false}
                    onChange={(e) => setCreateData({ ...createData, featured: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  Featured
                </label>
              </div>
              <div>
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={createData.bestseller ?? false}
                    onChange={(e) => setCreateData({ ...createData, bestseller: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  Bestseller
                </label>
              </div>
              <div>
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={createData.newProduct ?? false}
                    onChange={(e) => setCreateData({ ...createData, newProduct: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  New Product
                </label>
              </div>
              <div className="form-actions" style={{ gridColumn: '1 / -1' }}>
                <Button variant="primary" type="submit" disabled={creating} loading={creating}>
                  Create Master Product
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
            <div className="admin-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search products by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {loading && debouncedSearch && (
                <span style={{ fontSize: '14px', color: '#6b7280' }}>Searching...</span>
              )}
            </div>

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
                        <p className="mobile-card-subtitle">{p.slug || `ID: ${p.id}`}</p>
                      </div>
                      <div className="mobile-card-actions">
                        <Link to={`/admin/products/${p.id}`} className="btn btn-outline btn-sm" title="View/Edit product">
                          <Eye size={16} />
                        </Link>
                        <Button variant="danger" size="sm" icon={X} onClick={() => handleDelete(p.id!)} title="Delete product" />
                      </div>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-field">
                        <span className="mobile-field-label">Category:</span>
                        <span className="mobile-field-value">{getCategoryLabel(p.productCategory)}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Variants:</span>
                        <span className="mobile-field-value">
                          <Badge variant="info" size="sm">
                            <Package size={12} style={{ marginRight: 4 }} />
                            {getVariantsSummary(p)}
                          </Badge>
                        </span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Price Range:</span>
                        <span className="mobile-field-value">{getPriceRange(p)}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Status:</span>
                        <span className="mobile-field-value">
                          <Badge variant={p.active ? 'success' : 'warning'} size="sm">
                            {p.active ? 'Active' : 'Inactive'}
                          </Badge>
                          {p.featured && <Badge variant="info" size="sm" style={{ marginLeft: 4 }}>Featured</Badge>}
                          {p.bestseller && <Badge variant="success" size="sm" style={{ marginLeft: 4 }}>Bestseller</Badge>}
                          {p.newProduct && <Badge variant="info" size="sm" style={{ marginLeft: 4 }}>New</Badge>}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table Layout */}
            <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 70 }}>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Variants</th>
                  <th>Price Range</th>
                  <th>Status</th>
                  <th style={{ width: 180 }} className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="table-empty">
                    <SkeletonTable rows={5} columns={7} />
                  </td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={7} className="table-empty">No products found.</td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id as React.Key}>
                      <td>{p.id}</td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{p.name}</div>
                          {p.slug && <div style={{ fontSize: '12px', color: '#6b7280' }}>{p.slug}</div>}
                        </div>
                      </td>
                      <td>{getCategoryLabel(p.productCategory)}</td>
                      <td>
                        <Badge variant="info" size="sm">
                          <Package size={12} style={{ marginRight: 4 }} />
                          {getVariantsSummary(p)}
                        </Badge>
                      </td>
                      <td>{getPriceRange(p)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <Badge variant={p.active ? 'success' : 'warning'} size="sm">
                            {p.active ? 'Active' : 'Inactive'}
                          </Badge>
                          {p.featured && <Badge variant="info" size="sm">Featured</Badge>}
                          {p.bestseller && <Badge variant="success" size="sm">Best</Badge>}
                          {p.newProduct && <Badge variant="info" size="sm">New</Badge>}
                        </div>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons">
                          <Link to={`/admin/products/${p.id}`} className="btn btn-outline btn-sm" title="View/Edit product">
                            <Eye size={16} />
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
