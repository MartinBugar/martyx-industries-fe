import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import { adminInventoryService, type PageResponse } from '../../services/adminInventoryService';
import type { InventoryItemDto } from '../../types/inventory';
import { Button, Badge, SkeletonTable } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';

const AdminInventory: React.FC = () => {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<InventoryItemDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Search with debounce
  const [searchQuery, setSearchQuery] = useState<string>('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const loadInventory = async (pageNum: number = page, search?: string, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse: PageResponse<InventoryItemDto> = await adminInventoryService.getAllInventoryItems(
        pageNum,
        20,
        'masterProductName',
        'ASC',
        search || undefined,
        status || undefined
      );
      setItems(pageResponse.content);
      setTotalPages(pageResponse.totalPages);
      setTotalElements(pageResponse.totalElements);
      setPage(pageResponse.number);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load inventory';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Load inventory on mount
  useEffect(() => {
    loadInventory(0, debouncedSearch, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <Badge variant="success" size="sm"><CheckCircle size={12} style={{ marginRight: 4 }} />In Stock</Badge>;
      case 'LOW_STOCK':
        return <Badge variant="warning" size="sm"><AlertTriangle size={12} style={{ marginRight: 4 }} />Low Stock</Badge>;
      case 'OUT_OF_STOCK':
        return <Badge variant="danger" size="sm"><X size={12} style={{ marginRight: 4 }} />Out of Stock</Badge>;
      case 'PRE_ORDER':
        return <Badge variant="info" size="sm">Pre-Order</Badge>;
      case 'DISCONTINUED':
        return <Badge variant="secondary" size="sm">Discontinued</Badge>;
      case 'BACKORDERED':
        return <Badge variant="warning" size="sm">Backordered</Badge>;
      default:
        return <Badge variant="secondary" size="sm">{status}</Badge>;
    }
  };

  const getCategoryLabel = (cat?: string): string => {
    if (!cat) return '—';
    const labels: Record<string, string> = {
      MODEL_KIT: 'Model Kit',
      MERCHANDISE: 'Merchandise',
      ELECTRONICS: 'Electronics',
      ACCESSORIES: 'Accessories',
      DIGITAL_DOWNLOAD: 'Digital',
    };
    return labels[cat] || cat;
  };

  return (
    <AdminLayout title="Inventory / Sklad">
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Filters Section */}
          <div className="admin-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px', minWidth: '250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by SKU, product name, or variant..."
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

            {/* Status Filter */}
            <div style={{ minWidth: '180px' }}>
              <select
                className="form-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ height: '42px' }}
              >
                <option value="">All Status</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="PRE_ORDER">Pre-Order</option>
                <option value="BACKORDERED">Backordered</option>
                <option value="DISCONTINUED">Discontinued</option>
              </select>
            </div>

            {loading && (debouncedSearch || statusFilter) && (
              <span style={{ fontSize: '14px', color: '#6b7280' }}>Filtering...</span>
            )}
          </div>

          {/* Mobile Card Layout */}
          <div className="mobile-table-cards">
            {loading ? (
              <div className="mobile-table-card">
                <SkeletonTable rows={5} columns={4} />
              </div>
            ) : items.length === 0 ? (
              <div className="mobile-table-card">
                <div className="table-empty">No inventory items found.</div>
              </div>
            ) : (
              items.map(item => (
                <div key={`mobile-${item.variantId}`} className="mobile-table-card">
                  <div className="mobile-card-header">
                    <div>
                      <h4 className="mobile-card-title">{item.masterProductName}</h4>
                      <p className="mobile-card-subtitle">{item.variantName} • SKU: {item.sku}</p>
                    </div>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-field">
                      <span className="mobile-field-label">Category:</span>
                      <span className="mobile-field-value">{getCategoryLabel(item.category)}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Stock:</span>
                      <span className="mobile-field-value">
                        <strong>{item.stockQuantity}</strong>
                        {item.reservedQuantity > 0 && (
                          <span style={{ color: '#f59e0b', marginLeft: '4px' }}>
                            ({item.reservedQuantity} reserved)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Available:</span>
                      <span className="mobile-field-value"><strong>{item.availableQuantity}</strong></span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Price:</span>
                      <span className="mobile-field-value">{item.currency} {item.priceWithVat.toFixed(2)}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Status:</span>
                      <span className="mobile-field-value">{getStatusBadge(item.availabilityStatus)}</span>
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
                  <th style={{ width: 100 }}>SKU</th>
                  <th>Product / Variant</th>
                  <th style={{ width: 120 }}>Category</th>
                  <th style={{ width: 100 }} className="text-right">Stock</th>
                  <th style={{ width: 100 }} className="text-right">Reserved</th>
                  <th style={{ width: 100 }} className="text-right">Available</th>
                  <th style={{ width: 110 }}>Price</th>
                  <th style={{ width: 140 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="table-empty">
                    <SkeletonTable rows={5} columns={8} />
                  </td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={8} className="table-empty">No inventory items found.</td></tr>
                ) : (
                  items.map(item => (
                    <tr key={item.variantId as React.Key}>
                      <td>
                        <code style={{ fontSize: '12px', padding: '2px 6px', background: '#f3f4f6', borderRadius: '4px' }}>
                          {item.sku}
                        </code>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.masterProductName}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            <Package size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {item.variantName}
                          </div>
                        </div>
                      </td>
                      <td>{getCategoryLabel(item.category)}</td>
                      <td className="text-right">
                        <strong>{item.stockQuantity}</strong>
                      </td>
                      <td className="text-right">
                        {item.reservedQuantity > 0 ? (
                          <span style={{ color: '#f59e0b', fontWeight: 500 }}>{item.reservedQuantity}</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>0</span>
                        )}
                      </td>
                      <td className="text-right">
                        <strong style={{ color: item.availableQuantity <= 0 ? '#ef4444' : item.availableQuantity <= (item.lowStockThreshold || 0) ? '#f59e0b' : '#10b981' }}>
                          {item.availableQuantity}
                        </strong>
                      </td>
                      <td>{item.currency} {item.priceWithVat.toFixed(2)}</td>
                      <td>{getStatusBadge(item.availabilityStatus)}</td>
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
                Showing {items.length > 0 ? (page * 20 + 1) : 0} - {Math.min((page + 1) * 20, totalElements)} of {totalElements} items
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadInventory(page - 1, debouncedSearch, statusFilter)}
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
                  onClick={() => loadInventory(page + 1, debouncedSearch, statusFilter)}
                  disabled={page >= totalPages - 1 || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminInventory;
