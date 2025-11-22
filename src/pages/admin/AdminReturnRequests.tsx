import React, { useEffect, useState } from 'react';
import { Package, Eye, CheckCircle, XCircle, Truck, DollarSign, Search, Filter } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminDiscounts.css';
import './AdminButtonOverrides.css';
import { adminReturnRequestsService, type ReturnRequestDto, type ReturnRequestStats } from '../../services/adminReturnRequestsService';
import { Badge, Button, SkeletonTable } from '../../components/ui';
import { logError } from '../../services/logger';

type TabType = 'all-returns' | 'pending-approval' | 'view-details' | 'statistics';

const AdminReturnRequests: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequestDto[]>([]);
  const [stats, setStats] = useState<ReturnRequestStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<TabType>('all-returns');
  const [viewingReturn, setViewingReturn] = useState<ReturnRequestDto | null>(null);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchRma, setSearchRma] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const pageSize = 20;

  const loadReturns = async (page: number = 0, status?: string) => {
    setLoading(true);
    setError(null);
    try {
      const pageResponse = await adminReturnRequestsService.getAllReturns(page, pageSize, 'requested_at', 'DESC', status);
      setReturns(pageResponse.content);
      setTotalPages(pageResponse.totalPages);
      setCurrentPage(page);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load return requests';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingReturns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminReturnRequestsService.getPendingReturns();
      setReturns(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load pending returns';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminReturnRequestsService.getStats();
      setStats(data);
    } catch (e: unknown) {
      logError('Failed to load stats:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'all-returns') {
      loadReturns(0, filterStatus);
      loadStats();
    } else if (activeTab === 'pending-approval') {
      loadPendingReturns();
    } else if (activeTab === 'statistics') {
      loadStats();
    }
  }, [activeTab, filterStatus]);

  const handleSearchRma = async () => {
    if (!searchRma.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const returnRequest = await adminReturnRequestsService.getByRmaNumber(searchRma.trim());
      setReturns([returnRequest]);
      setTotalPages(1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'RMA not found';
      setError(msg);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReturn = (returnRequest: ReturnRequestDto) => {
    setViewingReturn(returnRequest);
    setActiveTab('view-details');
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm('Are you sure you want to approve this return request?')) return;
    try {
      await adminReturnRequestsService.approveReturn(id, {
        approved_by: 1, // TODO: Get from auth context
        admin_notes: 'Approved by admin',
      });
      if (activeTab === 'pending-approval') {
        await loadPendingReturns();
      } else {
        await loadReturns(currentPage, filterStatus);
      }
      if (viewingReturn?.id === id) {
        const updated = await adminReturnRequestsService.getById(id);
        setViewingReturn(updated);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to approve return';
      setError(msg);
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt('Please enter rejection reason:');
    if (!reason) return;
    try {
      await adminReturnRequestsService.rejectReturn(id, { rejected_reason: reason });
      if (activeTab === 'pending-approval') {
        await loadPendingReturns();
      } else {
        await loadReturns(currentPage, filterStatus);
      }
      if (viewingReturn?.id === id) {
        const updated = await adminReturnRequestsService.getById(id);
        setViewingReturn(updated);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to reject return';
      setError(msg);
    }
  };

  const handleMarkReceived = async (id: number) => {
    if (!window.confirm('Mark this return as received?')) return;
    try {
      await adminReturnRequestsService.markAsReceived(id);
      await loadReturns(currentPage, filterStatus);
      if (viewingReturn?.id === id) {
        const updated = await adminReturnRequestsService.getById(id);
        setViewingReturn(updated);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to mark as received';
      setError(msg);
    }
  };

  const handleProcessRefund = async (id: number) => {
    const amount = window.prompt('Enter refund amount:');
    if (!amount) return;
    try {
      await adminReturnRequestsService.processRefund(id, {
        refund_amount: parseFloat(amount),
        refund_transaction_id: 'TXN-' + Date.now(),
      });
      await loadReturns(currentPage, filterStatus);
      if (viewingReturn?.id === id) {
        const updated = await adminReturnRequestsService.getById(id);
        setViewingReturn(updated);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to process refund';
      setError(msg);
    }
  };

  const handleComplete = async (id: number) => {
    if (!window.confirm('Mark this return as completed?')) return;
    try {
      await adminReturnRequestsService.completeReturn(id);
      await loadReturns(currentPage, filterStatus);
      if (viewingReturn?.id === id) {
        const updated = await adminReturnRequestsService.getById(id);
        setViewingReturn(updated);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to complete return';
      setError(msg);
    }
  };

  const getStatusBadge = (status: string): React.ReactNode => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
      REQUESTED: 'info',
      APPROVED: 'success',
      REJECTED: 'default',
      RECEIVED: 'warning',
      PROCESSING: 'warning',
      COMPLETED: 'success',
      CANCELLED: 'default',
    };
    return <Badge variant={variants[status] || 'default'} size="sm">{status}</Badge>;
  };

  const getReturnTypeBadge = (type: string): React.ReactNode => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
      REFUND: 'warning',
      EXCHANGE: 'info',
      REPAIR: 'default',
    };
    return <Badge variant={variants[type] || 'default'} size="sm">{type}</Badge>;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount == null) return 'N/A';
    return new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'all-returns' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('all-returns');
          setViewingReturn(null);
        }}
        aria-label="All returns"
      >
        <Package size={16} />
        All Returns
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'pending-approval' ? 'active' : ''}`}
        onClick={() => {
          setActiveTab('pending-approval');
          setViewingReturn(null);
        }}
        aria-label="Pending approval"
      >
        <Filter size={16} />
        Pending Approval
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'statistics' ? 'active' : ''}`}
        onClick={() => setActiveTab('statistics')}
        aria-label="Statistics"
      >
        <DollarSign size={16} />
        Statistics
      </button>
      {viewingReturn && (
        <button
          className={`dashboard-tab ${activeTab === 'view-details' ? 'active' : ''}`}
          onClick={() => setActiveTab('view-details')}
          aria-label="View details"
        >
          <Eye size={16} />
          RMA Details
        </button>
      )}
    </nav>
  );

  return (
    <AdminLayout title="Return Requests (RMA)" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}

          {/* All Returns Tab */}
          {activeTab === 'all-returns' && (
            <>
              {/* Filters and Search */}
              <div className="admin-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                <select
                  className="form-input"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ maxWidth: '200px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="REQUESTED">REQUESTED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <div style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '400px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search by RMA number..."
                    value={searchRma}
                    onChange={(e) => setSearchRma(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchRma()}
                  />
                  <Button onClick={handleSearchRma} variant="outline">
                    <Search size={16} />
                  </Button>
                </div>
              </div>

              {/* Returns Table */}
              <div className="admin-card">
                {loading ? (
                  <SkeletonTable rows={10} columns={7} />
                ) : returns.length === 0 ? (
                  <div className="table-empty">No return requests found.</div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>RMA Number</th>
                            <th>Order ID</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Requested</th>
                            <th>Refund Amount</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {returns.map(returnRequest => (
                            <tr key={returnRequest.id}>
                              <td>
                                <code style={{ fontSize: '12px', fontWeight: 600 }}>{returnRequest.rma_number}</code>
                              </td>
                              <td>#{returnRequest.order_id}</td>
                              <td>{getReturnTypeBadge(returnRequest.return_type)}</td>
                              <td>{getStatusBadge(returnRequest.return_status)}</td>
                              <td>{formatDate(returnRequest.requested_at)}</td>
                              <td>{formatCurrency(returnRequest.refund_amount)}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <Button variant="outline" size="sm" onClick={() => handleViewReturn(returnRequest)}>
                                    <Eye size={14} />
                                  </Button>
                                  {returnRequest.return_status === 'REQUESTED' && (
                                    <>
                                      <Button variant="primary" size="sm" onClick={() => handleApprove(returnRequest.id)}>
                                        <CheckCircle size={14} />
                                      </Button>
                                      <Button variant="outline" size="sm" onClick={() => handleReject(returnRequest.id)}>
                                        <XCircle size={14} />
                                      </Button>
                                    </>
                                  )}
                                  {returnRequest.return_status === 'APPROVED' && (
                                    <Button variant="outline" size="sm" onClick={() => handleMarkReceived(returnRequest.id)}>
                                      <Truck size={14} />
                                    </Button>
                                  )}
                                  {returnRequest.return_status === 'RECEIVED' && (
                                    <Button variant="info" size="sm" onClick={() => handleProcessRefund(returnRequest.id)}>
                                      <DollarSign size={14} />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="pagination">
                        <button
                          onClick={() => loadReturns(currentPage - 1, filterStatus)}
                          disabled={currentPage === 0}
                          className="btn btn-outline"
                        >
                          Previous
                        </button>
                        <span>Page {currentPage + 1} of {totalPages}</span>
                        <button
                          onClick={() => loadReturns(currentPage + 1, filterStatus)}
                          disabled={currentPage >= totalPages - 1}
                          className="btn btn-outline"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* Pending Approval Tab */}
          {activeTab === 'pending-approval' && (
            <div className="admin-card">
              {loading ? (
                <SkeletonTable rows={5} columns={7} />
              ) : returns.length === 0 ? (
                <div className="table-empty">No pending return requests.</div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>RMA Number</th>
                        <th>Order ID</th>
                        <th>Type</th>
                        <th>Reason</th>
                        <th>Requested</th>
                        <th>Refund Method</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returns.map(returnRequest => (
                        <tr key={returnRequest.id}>
                          <td>
                            <code style={{ fontSize: '12px', fontWeight: 600 }}>{returnRequest.rma_number}</code>
                          </td>
                          <td>#{returnRequest.order_id}</td>
                          <td>{getReturnTypeBadge(returnRequest.return_type)}</td>
                          <td>{returnRequest.return_reason}</td>
                          <td>{formatDate(returnRequest.requested_at)}</td>
                          <td>{returnRequest.refund_method || 'N/A'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button variant="outline" size="sm" onClick={() => handleViewReturn(returnRequest)}>
                                <Eye size={14} />
                              </Button>
                              <Button variant="primary" size="sm" onClick={() => handleApprove(returnRequest.id)}>
                                <CheckCircle size={14} />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleReject(returnRequest.id)}>
                                <XCircle size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && stats && (
            <>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="admin-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Total Returns</div>
                  <div style={{ fontSize: '28px', fontWeight: 700 }}>{stats.total_returns}</div>
                </div>
                <div className="admin-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Pending</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>{stats.pending_returns}</div>
                </div>
                <div className="admin-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Completed</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#059669' }}>{stats.completed_returns}</div>
                </div>
                <div className="admin-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Total Refunded</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626' }}>{formatCurrency(stats.total_refunded)}</div>
                </div>
              </div>
            </>
          )}

          {/* View Details Tab */}
          {activeTab === 'view-details' && viewingReturn && (
            <div className="admin-card">
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 className="section-title" style={{ margin: 0, marginBottom: '8px' }}>RMA: {viewingReturn.rma_number}</h3>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>Order #{viewingReturn.order_id}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {getStatusBadge(viewingReturn.return_status)}
                    {getReturnTypeBadge(viewingReturn.return_type)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  {viewingReturn.return_status === 'REQUESTED' && (
                    <>
                      <Button variant="primary" onClick={() => handleApprove(viewingReturn.id)}>
                        <CheckCircle size={16} /> Approve Return
                      </Button>
                      <Button variant="outline" onClick={() => handleReject(viewingReturn.id)}>
                        <XCircle size={16} /> Reject Return
                      </Button>
                    </>
                  )}
                  {viewingReturn.return_status === 'APPROVED' && (
                    <Button variant="outline" onClick={() => handleMarkReceived(viewingReturn.id)}>
                      <Truck size={16} /> Mark as Received
                    </Button>
                  )}
                  {viewingReturn.return_status === 'RECEIVED' && (
                    <Button variant="info" onClick={() => handleProcessRefund(viewingReturn.id)}>
                      <DollarSign size={16} /> Process Refund
                    </Button>
                  )}
                  {viewingReturn.return_status === 'PROCESSING' && (
                    <Button variant="primary" onClick={() => handleComplete(viewingReturn.id)}>
                      <CheckCircle size={16} /> Complete Return
                    </Button>
                  )}
                </div>

                {/* Return Details */}
                <div className="form-grid" style={{ marginBottom: '24px' }}>
                  <div>
                    <label className="form-label">Return Reason</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>{viewingReturn.return_reason}</div>
                  </div>
                  <div>
                    <label className="form-label">Refund Method</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>{viewingReturn.refund_method || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="form-label">Refund Amount</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', fontWeight: 600 }}>
                      {formatCurrency(viewingReturn.refund_amount)}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Requested At</label>
                    <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>{formatDate(viewingReturn.requested_at)}</div>
                  </div>
                </div>

                {/* Customer Notes */}
                {viewingReturn.customer_notes && (
                  <div style={{ marginBottom: '24px' }}>
                    <label className="form-label">Customer Notes</label>
                    <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                      {viewingReturn.customer_notes}
                    </div>
                  </div>
                )}

                {/* Shipping Info */}
                {(viewingReturn.return_tracking_number || viewingReturn.return_shipping_carrier) && (
                  <div className="form-grid" style={{ marginBottom: '24px' }}>
                    {viewingReturn.return_tracking_number && (
                      <div>
                        <label className="form-label">Tracking Number</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px', fontFamily: 'monospace' }}>
                          {viewingReturn.return_tracking_number}
                        </div>
                      </div>
                    )}
                    {viewingReturn.return_shipping_carrier && (
                      <div>
                        <label className="form-label">Carrier</label>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}>{viewingReturn.return_shipping_carrier}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Processing Info */}
                {viewingReturn.inspection_notes && (
                  <div style={{ marginBottom: '24px' }}>
                    <label className="form-label">Inspection Notes</label>
                    <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                      {viewingReturn.inspection_notes}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '6px', fontSize: '12px', color: '#6b7280' }}>
                  <div>Requested: {formatDate(viewingReturn.requested_at)}</div>
                  {viewingReturn.approved_at && <div>Approved: {formatDate(viewingReturn.approved_at)}</div>}
                  {viewingReturn.received_at && <div>Received: {formatDate(viewingReturn.received_at)}</div>}
                  {viewingReturn.refund_processed_at && <div>Refunded: {formatDate(viewingReturn.refund_processed_at)}</div>}
                  {viewingReturn.completed_at && <div>Completed: {formatDate(viewingReturn.completed_at)}</div>}
                  <div>Last Updated: {formatDate(viewingReturn.updated_at)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReturnRequests;
