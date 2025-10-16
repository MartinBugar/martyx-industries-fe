import React, { useState, useEffect, useMemo } from 'react';
import { adminPaymentsService, Payment, PaymentStats, PaymentFilters } from '../../services/adminPaymentsService';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';
import { Download, DollarSign, CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { downloadCsvExport } from '../../utils/exportHelpers';
import '../../styles/admin/AdminReviews.css';

/**
 * Admin Payments Management Page
 *
 * Features:
 * - View all payments with pagination
 * - Filter by status and provider
 * - Search by reference, email, or transaction ID
 * - View payment statistics
 * - Status badges with color coding
 * - CSV export
 */
const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [currentPage, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await adminPaymentsService.getAll(currentPage, pageSize, filters);
      setPayments(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await adminPaymentsService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch payment stats:', error);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm });
    setCurrentPage(0);
  };

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status: status === 'ALL' ? undefined : status });
    setCurrentPage(0);
  };

  const handleProviderFilter = (provider: string) => {
    setFilters({ ...filters, provider: provider === 'ALL' ? undefined : provider });
    setCurrentPage(0);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return;
    }

    try {
      await adminPaymentsService.delete(id);
      fetchPayments();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete payment:', error);
      alert('Failed to delete payment');
    }
  };

  const handleExport = async () => {
    try {
      await downloadCsvExport('payments', `payments_export_${Date.now()}.csv`);
    } catch (error) {
      console.error('Failed to export payments:', error);
      alert('Failed to export payments');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'status-badge status-paid';
      case 'PENDING':
      case 'PROCESSING':
        return 'status-badge status-pending';
      case 'FAILED':
        return 'status-badge status-cancelled';
      case 'REFUNDED':
        return 'status-badge status-refunded';
      case 'CANCELLED':
        return 'status-badge status-cancelled';
      default:
        return 'status-badge';
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="admin-reviews-container">
        <div className="admin-reviews-header">
          <h1>Payments Management</h1>
          <Button variant="outline" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <DollarSign size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Payments</div>
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-success">
                <CheckCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{stats.byStatus.completed}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-warning">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Pending</div>
                <div className="stat-value">{stats.byStatus.pending}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-error">
                <AlertCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">Failed</div>
                <div className="stat-value">{stats.byStatus.failed}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="admin-reviews-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search by reference, email, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>

          <div className="filter-group">
            <select
              value={filters.status || 'ALL'}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={filters.provider || 'ALL'}
              onChange={(e) => handleProviderFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Providers</option>
              <option value="PAYPAL">PayPal</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Payments Table */}
        <div className="admin-reviews-content">
          {loading ? (
            <div className="loading-state">Loading payments...</div>
          ) : payments.length === 0 ? (
            <div className="empty-state">No payments found</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="table-responsive desktop-only">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Reference</th>
                      <th>Order</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Provider</th>
                      <th>Status</th>
                      <th>Payer Email</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.id}</td>
                        <td>
                          <span className="text-monospace">{payment.paymentReference}</span>
                        </td>
                        <td>
                          {payment.orderNumber ? (
                            <a href={`/admin/orders`} className="link">
                              {payment.orderNumber}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          <strong>{formatAmount(payment.amount, payment.currency)}</strong>
                        </td>
                        <td>{payment.paymentMethod}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CreditCard size={14} />
                            {payment.provider}
                          </div>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(payment.status)}>
                            {payment.status}
                          </span>
                        </td>
                        <td>{payment.payerEmail || '-'}</td>
                        <td>{formatDate(payment.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Button
                              variant="danger"
                              size="small"
                              onClick={() => handleDelete(payment.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="mobile-only">
                {payments.map((payment) => (
                  <div key={payment.id} className="mobile-card">
                    <div className="mobile-card-header">
                      <div>
                        <div className="mobile-card-title">Payment #{payment.id}</div>
                        <div className="text-monospace" style={{ fontSize: '0.85rem', marginTop: 4 }}>
                          {payment.paymentReference}
                        </div>
                      </div>
                      <span className={getStatusBadgeClass(payment.status)}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Amount:</span>
                        <span className="mobile-card-value">
                          <strong>{formatAmount(payment.amount, payment.currency)}</strong>
                        </span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Order:</span>
                        <span className="mobile-card-value">{payment.orderNumber || '-'}</span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Method:</span>
                        <span className="mobile-card-value">{payment.paymentMethod}</span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Provider:</span>
                        <span className="mobile-card-value">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CreditCard size={14} />
                            {payment.provider}
                          </div>
                        </span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Payer:</span>
                        <span className="mobile-card-value">{payment.payerEmail || '-'}</span>
                      </div>
                      <div className="mobile-card-row">
                        <span className="mobile-card-label">Created:</span>
                        <span className="mobile-card-value">{formatDate(payment.createdAt)}</span>
                      </div>
                      {payment.errorMessage && (
                        <div className="mobile-card-row">
                          <span className="mobile-card-label">Error:</span>
                          <span className="mobile-card-value error-text">{payment.errorMessage}</span>
                        </div>
                      )}
                    </div>
                    <div className="mobile-card-actions">
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => handleDelete(payment.id)}
                        fullWidth
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    Previous
                  </Button>
                  <span className="pagination-info">
                    Page {currentPage + 1} of {totalPages} ({totalElements} total)
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
