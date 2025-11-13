import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, ShoppingBag, Download, Mail } from 'lucide-react';
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
  const [searchInput, setSearchInput] = useState<string>('');

  // Resend email state
  const [resendingEmailFor, setResendingEmailFor] = useState<number | null>(null);
  const [resendEmailSuccess, setResendEmailSuccess] = useState<string | null>(null);

  // CSV export state
  const [exportingCsv, setExportingCsv] = useState<boolean>(false);

  useEffect(() => {
    loadOrders(0);
  }, [query]); // Reload when search query changes

  const loadOrders = async (pageNum: number = page) => {
    setLoading(true);
    setError(null);
    try {
      let pageResponse: PageResponse<ManualOrderHistoryDTO>;

      // Use server-side search if query exists, otherwise load all
      if (query.trim()) {
        pageResponse = await manualOrdersService.searchManualOrders(query, pageNum, 20);
      } else {
        pageResponse = await manualOrdersService.getManualOrderHistory(pageNum, 20, 'orderDate,desc');
      }

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

  const handleSearch = () => {
    setQuery(searchInput.trim());
    setPage(0); // Reset to first page on new search
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setQuery('');
    setPage(0);
  };

  const handleResendEmail = async (orderId: number) => {
    setResendingEmailFor(orderId);
    setResendEmailSuccess(null);
    setError(null);

    try {
      const response = await manualOrdersService.resendOrderEmail(orderId);
      setResendEmailSuccess(response.message);
      setTimeout(() => setResendEmailSuccess(null), 5000); // Clear after 5 seconds
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to resend email';
      setError(msg);
    } finally {
      setResendingEmailFor(null);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    setError(null);

    try {
      const blob = await manualOrdersService.exportManualOrdersCsv(0, 1000);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `manual_orders_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to export CSV';
      setError(msg);
    } finally {
      setExportingCsv(false);
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
          {resendEmailSuccess && <div className="alert alert-success">{resendEmailSuccess}</div>}

          {/* Header Actions */}
          <div className="admin-header-actions">
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by order number, email, store location..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                style={{ flex: 1 }}
              />
              <Button variant="primary" onClick={handleSearch} disabled={loading}>
                Search
              </Button>
              {query && (
                <Button variant="outline" onClick={handleClearSearch}>
                  Clear
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={exportingCsv || loading}
              title="Export to CSV"
            >
              <Download size={16} />
              {exportingCsv ? 'Exporting...' : 'Export CSV'}
            </Button>
            <Button variant="outline" onClick={() => loadOrders()} disabled={loading}>
              Refresh
            </Button>
          </div>

          {/* Mobile Card Layout */}
          <div className="mobile-table-cards">
            {loading ? (
              <div className="mobile-table-card">
                <SkeletonTable rows={5} columns={4} />
              </div>
            ) : orders.length === 0 ? (
              <div className="mobile-table-card">
                <div className="table-empty">
                  {query ? 'No orders match your search.' : 'No manual orders found.'}
                </div>
              </div>
            ) : (
              orders.map((order) => (
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
                        onClick={() => handleResendEmail(order.orderId)}
                        disabled={resendingEmailFor === order.orderId}
                        title="Resend confirmation email"
                      >
                        <Mail size={14} />
                      </Button>
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
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="table-empty">
                      {query ? 'No orders match your search.' : 'No manual orders found.'}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
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
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendEmail(order.orderId)}
                            disabled={resendingEmailFor === order.orderId}
                            title="Resend confirmation email"
                          >
                            <Mail size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/orders/${order.orderId}`)}
                            title="View order details"
                          >
                            <Eye size={14} />
                          </Button>
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
