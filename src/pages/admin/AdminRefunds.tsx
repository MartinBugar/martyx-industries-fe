import React, { useState, useEffect, useCallback } from 'react';
import { ConfirmDialog, useConfirmDialog } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  type RefundDto,
  type RefundStatsDto,
  type RefundStatus,
  type RefundReason,
  type Page,
  getAllRefunds,
  getRefundsWithFilters,
  getPendingRefunds,
  searchRefunds,
  getRefundStats,
  approveRefund,
  rejectRefund,
  executeRefund,
  cancelRefund,
  getStatusLabel,
  getStatusColor,
  getReasonLabel,
  formatAmount,
  formatTimeAgo,
  canApprove,
  canReject,
  canExecute,
  canCancel,
} from '../../services/adminRefundsService';
import './AdminRefunds.css';

type TabType = 'all' | 'pending' | 'approved' | 'completed' | 'failed';

const AdminRefunds: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [refunds, setRefunds] = useState<RefundDto[]>([]);
  const [stats, setStats] = useState<RefundStatsDto | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<RefundStatus | ''>('');
  const [reasonFilter, setReasonFilter] = useState<RefundReason | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  // Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRefundId, setRejectingRefundId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Confirm dialog
  const { confirm, dialogProps } = useConfirmDialog({
    title: 'Zrušiť refund',
    message: 'Naozaj chcete zrušiť tento refund?',
    variant: 'warning',
    confirmText: 'Zrušiť refund',
    cancelText: 'Späť'
  });

  // Load stats
  useEffect(() => {
    getRefundStats().then(setStats).catch(console.error);
  }, []);

  // Load refunds based on filters
  const loadRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result: Page<RefundDto>;

      if (searchQuery.trim()) {
        result = await searchRefunds(searchQuery, page, pageSize);
      } else if (activeTab === 'pending') {
        const pending = await getPendingRefunds();
        result = {
          content: pending,
          totalElements: pending.length,
          totalPages: 1,
          number: 0,
          size: pending.length
        };
      } else {
        let status: RefundStatus | undefined;
        if (activeTab === 'approved') status = 'APPROVED';
        else if (activeTab === 'completed') status = 'COMPLETED';
        else if (activeTab === 'failed') status = 'FAILED';
        else if (statusFilter) status = statusFilter;

        result = await getRefundsWithFilters(
          { status, reason: reasonFilter || undefined },
          page,
          pageSize
        );
      }

      setRefunds(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to load refunds:', err);
      setError('Nepodarilo sa načítať refundy');
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter, reasonFilter, searchQuery, page, pageSize]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [activeTab, statusFilter, reasonFilter, searchQuery]);

  // Handlers
  const handleRefundClick = (refund: RefundDto) => {
    navigate(`/admin/refunds/${refund.id}`);
  };

  const handleApprove = async (e: React.MouseEvent, refundId: number) => {
    e.stopPropagation();
    setActionLoading(refundId);
    setActionError(null);
    try {
      await approveRefund(refundId);
      await loadRefunds();
      getRefundStats().then(setStats);
    } catch (err) {
      console.error('Failed to approve refund:', err);
      setActionError('Nepodarilo sa schváliť refund');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (e: React.MouseEvent, refundId: number) => {
    e.stopPropagation();
    setRejectingRefundId(refundId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectingRefundId || !rejectReason.trim()) return;
    setActionLoading(rejectingRefundId);
    setActionError(null);
    try {
      await rejectRefund(rejectingRefundId, rejectReason);
      setShowRejectModal(false);
      setRejectingRefundId(null);
      await loadRefunds();
      getRefundStats().then(setStats);
    } catch (err) {
      console.error('Failed to reject refund:', err);
      setActionError('Nepodarilo sa zamietnuť refund');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecute = async (e: React.MouseEvent, refundId: number) => {
    e.stopPropagation();
    setActionLoading(refundId);
    setActionError(null);
    try {
      await executeRefund(refundId);
      await loadRefunds();
      getRefundStats().then(setStats);
    } catch (err) {
      console.error('Failed to execute refund:', err);
      setActionError('Nepodarilo sa vykonať refund');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = useCallback(async (e: React.MouseEvent, refundId: number) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: 'Zrušiť refund',
      message: 'Naozaj chcete zrušiť tento refund?',
      variant: 'warning',
      confirmText: 'Zrušiť refund',
      cancelText: 'Späť'
    });
    if (!confirmed) return;
    setActionLoading(refundId);
    setActionError(null);
    try {
      await cancelRefund(refundId);
      await loadRefunds();
      getRefundStats().then(setStats);
    } catch (err) {
      console.error('Failed to cancel refund:', err);
      setActionError('Nepodarilo sa zrušiť refund');
    } finally {
      setActionLoading(null);
    }
  }, [confirm, loadRefunds]);

  // Navigation Tabs
  const NavTabs = (
    <nav className="refunds-nav-tabs">
      <button
        className={`nav-tab ${activeTab === 'all' ? 'active' : ''}`}
        onClick={() => setActiveTab('all')}
      >
        Všetky
        {stats && <span className="tab-count">{stats.totalRefunds}</span>}
      </button>
      <button
        className={`nav-tab ${activeTab === 'pending' ? 'active' : ''}`}
        onClick={() => setActiveTab('pending')}
      >
        Čakajúce
        {stats && stats.pendingCount > 0 && (
          <span className="tab-count warning">{stats.pendingCount}</span>
        )}
      </button>
      <button
        className={`nav-tab ${activeTab === 'approved' ? 'active' : ''}`}
        onClick={() => setActiveTab('approved')}
      >
        Schválené
        {stats && stats.approvedCount > 0 && (
          <span className="tab-count info">{stats.approvedCount}</span>
        )}
      </button>
      <button
        className={`nav-tab ${activeTab === 'completed' ? 'active' : ''}`}
        onClick={() => setActiveTab('completed')}
      >
        Dokončené
        {stats && <span className="tab-count success">{stats.completedCount}</span>}
      </button>
      <button
        className={`nav-tab ${activeTab === 'failed' ? 'active' : ''}`}
        onClick={() => setActiveTab('failed')}
      >
        Zlyhané
        {stats && stats.failedCount > 0 && (
          <span className="tab-count danger">{stats.failedCount}</span>
        )}
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Refundy" navTabs={NavTabs}>
      <div className="admin-refunds">
        {/* Stats Cards */}
        {stats && (
          <div className="refunds-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.pendingCount}</div>
              <div className="stat-label">Čakajúce</div>
            </div>
            <div className="stat-card info">
              <div className="stat-value">{formatAmount(stats.pendingAmount)}</div>
              <div className="stat-label">Čakajúca suma</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{formatAmount(stats.refundedThisMonth)}</div>
              <div className="stat-label">Tento mesiac</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatAmount(stats.totalRefundedAmount)}</div>
              <div className="stat-label">Celkom vrátené</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="refunds-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Hľadať (číslo, email, objednávka)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RefundStatus | '')}
              disabled={activeTab !== 'all'}
            >
              <option value="">Všetky stavy</option>
              <option value="PENDING">Čaká na schválenie</option>
              <option value="APPROVED">Schválený</option>
              <option value="PROCESSING">Spracováva sa</option>
              <option value="COMPLETED">Dokončený</option>
              <option value="FAILED">Zlyhalo</option>
              <option value="REJECTED">Zamietnutý</option>
              <option value="CANCELLED">Zrušený</option>
            </select>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value as RefundReason | '')}
            >
              <option value="">Všetky dôvody</option>
              <option value="CUSTOMER_REQUEST">Žiadosť zákazníka</option>
              <option value="PRODUCT_DEFECTIVE">Chybný produkt</option>
              <option value="PRODUCT_NOT_AS_DESCRIBED">Nezodpovedá popisu</option>
              <option value="WRONG_ITEM_SENT">Nesprávna položka</option>
              <option value="ORDER_CANCELLED">Zrušená objednávka</option>
              <option value="DUPLICATE_ORDER">Duplicita</option>
              <option value="SHIPPING_ISSUE">Problém s dopravou</option>
              <option value="NEVER_RECEIVED">Nedoručené</option>
              <option value="GOODWILL">Gesto dobrej vôle</option>
              <option value="OTHER">Iný dôvod</option>
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/admin/refunds/new')}
          >
            + Nový refund
          </button>
        </div>

        {/* Error */}
        {error && <div className="refunds-error">{error}</div>}
        {actionError && (
          <div className="refunds-error action-error">
            {actionError}
            <button onClick={() => setActionError(null)}>×</button>
          </div>
        )}

        {/* Loading */}
        {loading && <div className="refunds-loading">Načítava sa...</div>}

        {/* Refunds Table */}
        {!loading && (
          <>
            <div className="refunds-table-wrapper">
              <table className="refunds-table">
                <thead>
                  <tr>
                    <th>Refund</th>
                    <th>Objednávka</th>
                    <th>Zákazník</th>
                    <th>Suma</th>
                    <th>Dôvod</th>
                    <th>Stav</th>
                    <th>Vytvorené</th>
                    <th>Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-row">
                        Žiadne refundy na zobrazenie
                      </td>
                    </tr>
                  ) : (
                    refunds.map(refund => (
                      <tr
                        key={refund.id}
                        onClick={() => handleRefundClick(refund)}
                        className="refund-row"
                      >
                        <td className="refund-number">
                          <span className="refund-id">{refund.refundNumber}</span>
                          <span className="refund-type">{refund.refundTypeLabel}</span>
                        </td>
                        <td className="order-info">
                          <span className="order-number">{refund.orderNumber}</span>
                        </td>
                        <td className="customer-info">
                          <span className="customer-name">{refund.orderUserName || refund.orderUserEmail}</span>
                          {refund.orderUserName && (
                            <span className="customer-email">{refund.orderUserEmail}</span>
                          )}
                        </td>
                        <td className="amount-cell">
                          <span className="amount">{formatAmount(refund.amount, refund.currency)}</span>
                          {refund.originalOrderAmount && (
                            <span className="original-amount">z {formatAmount(refund.originalOrderAmount, refund.currency)}</span>
                          )}
                        </td>
                        <td className="reason-cell">
                          <span className="reason">{getReasonLabel(refund.reason)}</span>
                        </td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(refund.status) }}
                          >
                            {getStatusLabel(refund.status)}
                          </span>
                        </td>
                        <td className="date-cell">
                          <span className="time-ago">{formatTimeAgo(refund.createdAt)}</span>
                        </td>
                        <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                          {actionLoading === refund.id ? (
                            <span className="action-loading">...</span>
                          ) : (
                            <>
                              {canApprove(refund) && (
                                <button
                                  className="btn-icon btn-success"
                                  onClick={(e) => handleApprove(e, refund.id)}
                                  title="Schváliť"
                                  disabled={actionLoading !== null}
                                >
                                  ✓
                                </button>
                              )}
                              {canReject(refund) && (
                                <button
                                  className="btn-icon btn-danger"
                                  onClick={(e) => handleRejectClick(e, refund.id)}
                                  title="Zamietnuť"
                                  disabled={actionLoading !== null}
                                >
                                  ✕
                                </button>
                              )}
                              {canExecute(refund) && (
                                <button
                                  className="btn-icon btn-primary"
                                  onClick={(e) => handleExecute(e, refund.id)}
                                  title="Vykonať"
                                  disabled={actionLoading !== null}
                                >
                                  ▶
                                </button>
                              )}
                              {canCancel(refund) && (
                                <button
                                  className="btn-icon btn-secondary"
                                  onClick={(e) => handleCancel(e, refund.id)}
                                  title="Zrušiť"
                                  disabled={actionLoading !== null}
                                >
                                  ⊘
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="refunds-pagination">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Predch.
                </button>
                <span>
                  Strana {page + 1} z {totalPages} ({totalElements} refundov)
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Ďalšia
                </button>
              </div>
            )}
          </>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Zamietnuť refund</h3>
              <p>Zadajte dôvod zamietnutia:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Dôvod zamietnutia..."
                rows={4}
                autoFocus
              />
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  Zrušiť
                </button>
                <button
                  className="btn-danger"
                  onClick={handleRejectConfirm}
                  disabled={!rejectReason.trim()}
                >
                  Zamietnuť
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog {...dialogProps} />
      </div>
    </AdminLayout>
  );
};

export default AdminRefunds;
