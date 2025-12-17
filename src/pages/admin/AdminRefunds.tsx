import React, { useState, useEffect, useCallback } from 'react';
import { Button, Badge, SkeletonTable, ConfirmDialog, useConfirmDialog } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { Search, X, Plus, Check, XCircle, Play, Ban, Eye, Clock, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { logError } from '../../services/logger';
import AdminLayout from './AdminLayout';
import {
  type RefundDto,
  type RefundStatsDto,
  type RefundStatus,
  type RefundReason,
  type Page,
  getRefundsWithFilters,
  searchRefunds,
  getRefundStats,
  approveRefund,
  rejectRefund,
  executeRefund,
  cancelRefund,
  getStatusLabel,
  getReasonLabel,
  formatAmount,
  formatTimeAgo,
  canApprove,
  canReject,
  canExecute,
  canCancel,
} from '../../services/adminRefundsService';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
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
    getRefundStats().then(setStats).catch(logError);
  }, []);

  // Load refunds based on filters
  const loadRefunds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result: Page<RefundDto>;

      if (searchQuery.trim()) {
        result = await searchRefunds(searchQuery, page, pageSize);
      } else {
        // Map tab to status filter
        let status: RefundStatus | undefined;
        if (activeTab === 'pending') status = 'PENDING';
        else if (activeTab === 'approved') status = 'APPROVED';
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
      logError('Failed to load refunds:', err);
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
      logError('Failed to approve refund:', err);
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
      logError('Failed to reject refund:', err);
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
      logError('Failed to execute refund:', err);
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
      logError('Failed to cancel refund:', err);
      setActionError('Nepodarilo sa zrušiť refund');
    } finally {
      setActionLoading(null);
    }
  }, [confirm, loadRefunds]);

  // Navigation Tabs
  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${activeTab === 'all' ? 'active' : ''}`}
        onClick={() => setActiveTab('all')}
      >
        Všetky
        {stats && <Badge variant="default" size="sm" style={{ marginLeft: 8 }}>{stats.totalRefunds}</Badge>}
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'pending' ? 'active' : ''}`}
        onClick={() => setActiveTab('pending')}
      >
        Čakajúce
        {stats && stats.pendingCount > 0 && (
          <Badge variant="warning" size="sm" style={{ marginLeft: 8 }}>{stats.pendingCount}</Badge>
        )}
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'approved' ? 'active' : ''}`}
        onClick={() => setActiveTab('approved')}
      >
        Schválené
        {stats && stats.approvedCount > 0 && (
          <Badge variant="info" size="sm" style={{ marginLeft: 8 }}>{stats.approvedCount}</Badge>
        )}
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'completed' ? 'active' : ''}`}
        onClick={() => setActiveTab('completed')}
      >
        Dokončené
        {stats && <Badge variant="success" size="sm" style={{ marginLeft: 8 }}>{stats.completedCount}</Badge>}
      </button>
      <button
        className={`dashboard-tab ${activeTab === 'failed' ? 'active' : ''}`}
        onClick={() => setActiveTab('failed')}
      >
        Zlyhané
        {stats && stats.failedCount > 0 && (
          <Badge variant="danger" size="sm" style={{ marginLeft: 8 }}>{stats.failedCount}</Badge>
        )}
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Refundy" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}
          {actionError && (
            <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {actionError}
              <button onClick={() => setActionError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="refund-stats-grid">
              <div className="refund-stat-card refund-stat-warning">
                <div className="refund-stat-icon">
                  <Clock size={24} />
                </div>
                <div className="refund-stat-content">
                  <div className="refund-stat-value">{stats.pendingCount}</div>
                  <div className="refund-stat-label">Čakajúce na schválenie</div>
                </div>
              </div>
              <div className="refund-stat-card refund-stat-info">
                <div className="refund-stat-icon">
                  <DollarSign size={24} />
                </div>
                <div className="refund-stat-content">
                  <div className="refund-stat-value">{formatAmount(stats.pendingAmount)}</div>
                  <div className="refund-stat-label">Čakajúca suma na vrátenie</div>
                </div>
              </div>
              <div className="refund-stat-card refund-stat-success">
                <div className="refund-stat-icon">
                  <Calendar size={24} />
                </div>
                <div className="refund-stat-content">
                  <div className="refund-stat-value">{formatAmount(stats.refundedThisMonth)}</div>
                  <div className="refund-stat-label">Vrátené tento mesiac</div>
                </div>
              </div>
              <div className="refund-stat-card refund-stat-neutral">
                <div className="refund-stat-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="refund-stat-content">
                  <div className="refund-stat-value">{formatAmount(stats.totalRefundedAmount)}</div>
                  <div className="refund-stat-label">Celkom vrátené (všetky obdobia)</div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="admin-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Hľadať (číslo, email, objednávka)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                  title="Vymazať"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RefundStatus | '')}
              disabled={activeTab !== 'all'}
              style={{ width: 'auto', minWidth: '160px' }}
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
              className="form-input"
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value as RefundReason | '')}
              style={{ width: 'auto', minWidth: '180px' }}
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
            <Button variant="primary" onClick={() => navigate('/admin/refunds/new')}>
              <Plus size={16} style={{ marginRight: 4 }} />
              Nový refund
            </Button>
          </div>

          {/* Mobile Card Layout */}
          <div className="mobile-table-cards">
            {loading ? (
              <div className="mobile-table-card">
                <SkeletonTable rows={5} columns={4} />
              </div>
            ) : refunds.length === 0 ? (
              <div className="mobile-table-card">
                <div className="table-empty">Žiadne refundy na zobrazenie</div>
              </div>
            ) : (
              refunds.map(refund => (
                <div key={`mobile-${refund.id}`} className="mobile-table-card" onClick={() => handleRefundClick(refund)}>
                  <div className="mobile-card-header">
                    <div>
                      <h4 className="mobile-card-title">{refund.refundNumber}</h4>
                      <p className="mobile-card-subtitle">{refund.orderNumber}</p>
                    </div>
                    <div className="mobile-card-actions" onClick={e => e.stopPropagation()}>
                      <Button variant="outline" size="sm" onClick={() => handleRefundClick(refund)} title="Detail">
                        <Eye size={14} />
                      </Button>
                    </div>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-field">
                      <span className="mobile-field-label">Zákazník:</span>
                      <span className="mobile-field-value">{refund.orderUserName || refund.orderUserEmail}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Suma:</span>
                      <span className="mobile-field-value" style={{ fontWeight: 600 }}>{formatAmount(refund.amount, refund.currency)}</span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Stav:</span>
                      <span className="mobile-field-value">
                        <Badge variant={refund.status === 'COMPLETED' ? 'success' : refund.status === 'PENDING' ? 'warning' : refund.status === 'FAILED' ? 'danger' : 'default'} size="sm">
                          {getStatusLabel(refund.status)}
                        </Badge>
                      </span>
                    </div>
                    <div className="mobile-field">
                      <span className="mobile-field-label">Vytvorené:</span>
                      <span className="mobile-field-value">{formatTimeAgo(refund.createdAt)}</span>
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
                  <th>Refund</th>
                  <th>Objednávka</th>
                  <th>Zákazník</th>
                  <th>Suma</th>
                  <th>Dôvod</th>
                  <th>Stav</th>
                  <th>Vytvorené</th>
                  <th style={{ width: 160 }} className="text-right">Akcie</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="table-empty">
                    <SkeletonTable rows={5} columns={8} />
                  </td></tr>
                ) : refunds.length === 0 ? (
                  <tr><td colSpan={8} className="table-empty">Žiadne refundy na zobrazenie</td></tr>
                ) : (
                  refunds.map(refund => (
                    <tr key={refund.id} onClick={() => handleRefundClick(refund)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500, color: '#6366f1' }}>{refund.refundNumber}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{refund.refundTypeLabel}</div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{refund.orderNumber}</span>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{refund.orderUserName || refund.orderUserEmail}</div>
                          {refund.orderUserName && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{refund.orderUserEmail}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600 }}>{formatAmount(refund.amount, refund.currency)}</div>
                          {refund.originalOrderAmount && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>z {formatAmount(refund.originalOrderAmount, refund.currency)}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px' }}>{getReasonLabel(refund.reason)}</span>
                      </td>
                      <td>
                        <Badge
                          variant={refund.status === 'COMPLETED' ? 'success' : refund.status === 'PENDING' ? 'warning' : refund.status === 'FAILED' || refund.status === 'REJECTED' ? 'danger' : refund.status === 'APPROVED' ? 'info' : 'default'}
                          size="sm"
                        >
                          {getStatusLabel(refund.status)}
                        </Badge>
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>{formatTimeAgo(refund.createdAt)}</span>
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="action-buttons">
                          {actionLoading === refund.id ? (
                            <span style={{ fontSize: '13px', color: '#6b7280' }}>...</span>
                          ) : (
                            <>
                              {canApprove(refund) && (
                                <Button variant="primary" size="sm" onClick={(e) => handleApprove(e, refund.id)} title="Schváliť" disabled={actionLoading !== null}>
                                  <Check size={14} />
                                </Button>
                              )}
                              {canReject(refund) && (
                                <Button variant="danger" size="sm" onClick={(e) => handleRejectClick(e, refund.id)} title="Zamietnuť" disabled={actionLoading !== null}>
                                  <XCircle size={14} />
                                </Button>
                              )}
                              {canExecute(refund) && (
                                <Button variant="primary" size="sm" onClick={(e) => handleExecute(e, refund.id)} title="Vykonať" disabled={actionLoading !== null}>
                                  <Play size={14} />
                                </Button>
                              )}
                              {canCancel(refund) && (
                                <Button variant="outline" size="sm" onClick={(e) => handleCancel(e, refund.id)} title="Zrušiť" disabled={actionLoading !== null}>
                                  <Ban size={14} />
                                </Button>
                              )}
                            </>
                          )}
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
                Zobrazené {refunds.length > 0 ? (page * pageSize + 1) : 0} - {Math.min((page + 1) * pageSize, totalElements)} z {totalElements} refundov
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 0 || loading}
                >
                  Predch.
                </Button>
                <span style={{ padding: '8px 12px', fontSize: '14px', color: '#374151' }}>
                  Strana {page + 1} z {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1 || loading}
                >
                  Ďalšia
                </Button>
              </div>
            </div>
          )}

          {/* Reject Modal */}
          {showRejectModal && (
            <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">Zamietnuť refund</h3>
                  <button className="modal-close" onClick={() => setShowRejectModal(false)} aria-label="Zavrieť">
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  <p style={{ marginBottom: '12px' }}>Zadajte dôvod zamietnutia:</p>
                  <textarea
                    className="form-input"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Dôvod zamietnutia..."
                    rows={4}
                    autoFocus
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                    Zrušiť
                  </Button>
                  <Button variant="danger" onClick={handleRejectConfirm} disabled={!rejectReason.trim()}>
                    Zamietnuť
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  );
};

export default AdminRefunds;
