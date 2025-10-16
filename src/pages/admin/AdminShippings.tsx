import React, { useState, useEffect } from 'react';
import { adminShippingsService, Shipping, ShippingStats, ShippingFilters } from '../../services/adminShippingsService';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';
import { Download, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { downloadCsvExport } from '../../utils/exportHelpers';
import '../../styles/admin/AdminReviews.css';

const AdminShippings: React.FC = () => {
  const [shippings, setShippings] = useState<Shipping[]>([]);
  const [stats, setStats] = useState<ShippingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);
  const [filters, setFilters] = useState<ShippingFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchShippings();
    fetchStats();
  }, [currentPage, filters]);

  const fetchShippings = async () => {
    try {
      setLoading(true);
      const response = await adminShippingsService.getAll(currentPage, pageSize, filters);
      setShippings(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Failed to fetch shippings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await adminShippingsService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch shipping stats:', error);
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this shipping record?')) return;

    try {
      await adminShippingsService.delete(id);
      fetchShippings();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete shipping:', error);
      alert('Failed to delete shipping');
    }
  };

  const handleExport = async () => {
    try {
      await downloadCsvExport('shippings', `shippings_export_${Date.now()}.csv`);
    } catch (error) {
      console.error('Failed to export shippings:', error);
      alert('Failed to export shippings');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'status-badge status-paid';
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 'status-badge status-processing';
      case 'PENDING':
        return 'status-badge status-pending';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      <div className="admin-reviews-container">
        <div className="admin-reviews-header">
          <h1>Shipping Management</h1>
          <Button variant="outline" icon={Download} onClick={handleExport}>
            Export CSV
          </Button>
        </div>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon"><Package size={24} /></div>
              <div className="stat-content">
                <div className="stat-label">Total Shipments</div>
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-warning"><Clock size={24} /></div>
              <div className="stat-content">
                <div className="stat-label">Pending</div>
                <div className="stat-value">{stats.byStatus.pending}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-info"><Truck size={24} /></div>
              <div className="stat-content">
                <div className="stat-label">In Transit</div>
                <div className="stat-value">{stats.byStatus.inTransit}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon stat-icon-success"><CheckCircle size={24} /></div>
              <div className="stat-content">
                <div className="stat-label">Delivered</div>
                <div className="stat-value">{stats.byStatus.delivered}</div>
              </div>
            </div>
          </div>
        )}

        <div className="admin-reviews-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search by tracking number, carrier, or recipient..."
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
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        </div>

        <div className="admin-reviews-content">
          {loading ? (
            <div className="loading-state">Loading shippings...</div>
          ) : shippings.length === 0 ? (
            <div className="empty-state">No shippings found</div>
          ) : (
            <>
              <div className="table-responsive desktop-only">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Order</th>
                      <th>Carrier</th>
                      <th>Tracking</th>
                      <th>Status</th>
                      <th>Recipient</th>
                      <th>Destination</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shippings.map((shipping) => (
                      <tr key={shipping.id}>
                        <td>{shipping.id}</td>
                        <td>
                          {shipping.orderNumber ? (
                            <a href={`/admin/orders`} className="link">{shipping.orderNumber}</a>
                          ) : '-'}
                        </td>
                        <td>{shipping.carrier || '-'}</td>
                        <td>
                          {shipping.trackingUrl ? (
                            <a href={shipping.trackingUrl} target="_blank" rel="noopener noreferrer" className="link">
                              {shipping.trackingNumber}
                            </a>
                          ) : (
                            shipping.trackingNumber || '-'
                          )}
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(shipping.status)}>
                            {shipping.status}
                          </span>
                        </td>
                        <td>{shipping.recipientName || '-'}</td>
                        <td>{shipping.shippingCity ? `${shipping.shippingCity}, ${shipping.shippingCountry}` : '-'}</td>
                        <td>{formatDate(shipping.createdAt)}</td>
                        <td>
                          <Button variant="danger" size="small" onClick={() => handleDelete(shipping.id)}>
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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

export default AdminShippings;
