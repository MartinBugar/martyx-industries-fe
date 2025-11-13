import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, ShoppingBag } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import {
  manualOrdersService,
  type ManualOrderHistoryDTO,
} from '../../services/manualOrdersService';
import type { PageResponse } from '../../services/adminOrdersService';
import { Button, Badge, SkeletonTable } from '../../components/ui';

const AdminManualOrderHistory: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [orders, setOrders] = useState<ManualOrderHistoryDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Search/filter
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    loadOrders(0);
  }, []);

  const loadOrders = async (pageNum: number = page) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse: PageResponse<ManualOrderHistoryDTO> =
        await manualOrdersService.getManualOrderHistory(pageNum, 20, 'orderDate,desc');
      setOrders(pageResponse.content);
      setTotalPages(pageResponse.totalPages);
      setTotalElements(pageResponse.totalElements);
      setPage(pageResponse.number);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load manual orders';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (value?: string): string => {
    if (!value) return '—';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  };

  const formatMoney = (amount: number | undefined, currency?: string): string => {
    const a = typeof amount === 'number' && isFinite(amount) ? amount : 0;
    return `${a.toFixed(2)} ${currency ?? 'EUR'}`.trim();
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'danger' => {
    switch (status.toUpperCase()) {
      case 'PAID':
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'danger';
      default:
        return 'warning';
    }
  };

  const filtered = orders.filter((o) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      `${o.orderNumber ?? ''} ${o.recipientEmail ?? ''} ${o.storeLocation ?? ''} ${o.firstName ?? ''} ${o.lastName ?? ''}`
        .toLowerCase()
        .includes(q)
    );
  });

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className="dashboard-tab"
        onClick={() => navigate('/admin/manual-orders/create')}
        aria-label="Create manual order"
      >
        Create Manual Order
      </button>
      <button className="dashboard-tab active" aria-label="View manual order history">
        Order History
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Manual Order History" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Header Actions */}
          <div className="admin-header-actions">
            <input
              type="text"
              className="form-input"
              placeholder="Search by order number, email, store location..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="outline" onClick={() => loadOrders()}>
              Refresh
            </Button>
          </div>

          {/* Mobile Card Layout */}
          <div className="mobile-table-cards">
            {loading ? (
              <div className="mobile-table-card">
                <SkeletonTable rows={5} columns={4} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="mobile-table-card">
                <div className="table-empty">
                  {query ? 'No orders match your search.' : 'No manual orders found.'}
                </div>
              </div>
            ) : (
              filtered.map((order) => (
                <div key={`mobile-${order.orderId}`} className="mobile-table-card">
                  <div className="mobile-card-header">
                    <div>
                      <h4 className="mobile-card-title">Order #{order.orderNumber}</h4>
                      <p className="mobile-card-subtitle">
                        {order.firstName} {order.lastName}
                      </p>
                    </div>
                    <div className="mobile-card-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/orders/${order.orderId}`)}
                        title="View order details"
                      >
                        <Eye size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-field">
                      <span className="mobile-field-label">Email:</span>
                      <span className="mobile-field-value">{order.recipientEmail}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Status:</span>
                      <span className="mobile-field-value">
                        <Badge variant={getStatusBadgeVariant(order.orderStatus)} size="sm">
                          {order.orderStatus}
                        </Badge>
                      </span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Store:</span>
                      <span className="mobile-field-value">{order.storeLocation || '—'}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Order Date:</span>
                      <span className="mobile-field-value">{formatDateTime(order.orderDate)}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Total:</span>
                      <span className="mobile-field-value">
                        {formatMoney(order.totalAmount, order.currency)}
                      </span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Created by:</span>
                      <span className="mobile-field-value">
                        {order.createdByAdminEmail || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 120 }}>Order #</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Store Location</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Created By</th>
                  <th>Order Date</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="table-empty">
                      <SkeletonTable rows={5} columns={10} />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="table-empty">
                      {query ? 'No orders match your search.' : 'No manual orders found.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => (
                    <tr key={order.orderId}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{order.orderNumber}</div>
                        {order.invoiceNumber && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Invoice: {order.invoiceNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        {order.firstName || order.lastName ? (
                          <>
                            {order.firstName} {order.lastName}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{order.recipientEmail}</td>
                      <td>
                        <Badge variant={getStatusBadgeVariant(order.orderStatus)} size="sm">
                          {order.orderStatus}
                        </Badge>
                      </td>
                      <td>
                        <div>{order.storeLocation || '—'}</div>
                        {order.storeEmployeeName && (
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {order.storeEmployeeName}
                          </div>
                        )}
                      </td>
                      <td>
                        <div>{order.itemCount}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {order.hasDigitalItems && (
                            <span title="Has digital products">
                              <FileText size={12} />
                            </span>
                          )}
                          {order.hasPhysicalItems && (
                            <span title="Has physical products">
                              <ShoppingBag size={12} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{formatMoney(order.totalAmount, order.currency)}</td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{order.createdByAdminEmail || '—'}</div>
                        {order.paymentMethod && (
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                            {order.paymentMethod}
                          </div>
                        )}
                      </td>
                      <td>
                        <div>{formatDateTime(order.orderDate)}</div>
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/orders/${order.orderId}`)}
                          title="View order details"
                        >
                          <Eye size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              className="pagination-controls"
              style={{
                marginTop: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Showing {orders.length > 0 ? page * 20 + 1 : 0} -{' '}
                {Math.min((page + 1) * 20, totalElements)} of {totalElements} orders
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadOrders(page - 1)}
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
                  onClick={() => loadOrders(page + 1)}
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

export default AdminManualOrderHistory;
