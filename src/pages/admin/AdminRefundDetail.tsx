import React, { useState, useEffect, useCallback } from 'react';
import { ConfirmDialog, useConfirmDialog } from '../../components/ui';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  type RefundDto,
  getRefundById,
  approveRefund,
  rejectRefund,
  executeRefund,
  cancelRefund,
  deleteRefund,
  addRefundNotes,
  markCustomerNotified,
  getStatusLabel,
  getStatusColor,
  getReasonLabel,
  formatAmount,
  formatDateTime,
  canApprove,
  canReject,
  canExecute,
  canCancel,
  canDelete,
} from '../../services/adminRefundsService';
import { logError } from '../../services/logger';
import './AdminRefundDetail.css';

const AdminRefundDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [refund, setRefund] = useState<RefundDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Confirm dialog
  const { confirm, dialogProps } = useConfirmDialog({
    title: 'Potvrdiť akciu',
    message: 'Naozaj chcete vykonať túto akciu?',
    variant: 'warning',
    confirmText: 'Potvrdiť',
    cancelText: 'Zrušiť'
  });

  useEffect(() => {
    if (id) {
      loadRefund(parseInt(id));
    }
  }, [id]);

  const loadRefund = async (refundId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRefundById(refundId);
      setRefund(data);
    } catch (err) {
      logError('Failed to load refund:', err);
      setError('Nepodarilo sa načítať refund');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!refund) return;
    setActionLoading(true);
    try {
      const updated = await approveRefund(refund.id);
      setRefund(updated);
    } catch (err) {
      logError('Failed to approve:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!refund || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const updated = await rejectRefund(refund.id, rejectReason);
      setRefund(updated);
      setShowRejectModal(false);
      setRejectReason('');
    } catch (err) {
      logError('Failed to reject:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!refund) return;
    setActionLoading(true);
    try {
      const updated = await executeRefund(refund.id);
      setRefund(updated);
    } catch (err) {
      logError('Failed to execute:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = useCallback(async () => {
    if (!refund) return;
    const confirmed = await confirm({
      title: 'Zrušiť refund',
      message: 'Naozaj chcete zrušiť tento refund?',
      variant: 'warning',
      confirmText: 'Zrušiť refund',
      cancelText: 'Späť'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      const updated = await cancelRefund(refund.id);
      setRefund(updated);
    } catch (err) {
      logError('Failed to cancel:', err);
    } finally {
      setActionLoading(false);
    }
  }, [refund, confirm]);

  const handleDelete = useCallback(async () => {
    if (!refund) return;
    const confirmed = await confirm({
      title: 'Vymazať refund',
      message: 'Naozaj chcete vymazať tento refund? Táto akcia je nezvratná.',
      variant: 'danger',
      confirmText: 'Vymazať',
      cancelText: 'Zrušiť'
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await deleteRefund(refund.id);
      navigate('/admin/refunds');
    } catch (err) {
      logError('Failed to delete:', err);
    } finally {
      setActionLoading(false);
    }
  }, [refund, confirm, navigate]);

  const handleAddNote = async () => {
    if (!refund || !newNote.trim()) return;
    setActionLoading(true);
    try {
      const updated = await addRefundNotes(refund.id, newNote);
      setRefund(updated);
      setShowNotesModal(false);
      setNewNote('');
    } catch (err) {
      logError('Failed to add note:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNotified = async () => {
    if (!refund) return;
    setActionLoading(true);
    try {
      const updated = await markCustomerNotified(refund.id);
      setRefund(updated);
    } catch (err) {
      logError('Failed to mark notified:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Načítava sa...">
        <div className="refund-detail-loading">Načítava sa...</div>
      </AdminLayout>
    );
  }

  if (error || !refund) {
    return (
      <AdminLayout title="Chyba">
        <div className="refund-detail-error">
          {error || 'Refund nebol nájdený'}
          <button onClick={() => navigate('/admin/refunds')}>Späť na zoznam</button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`Refund ${refund.refundNumber}`}
    >
      <div className="admin-refund-detail">
        {/* Header with actions */}
        <div className="refund-header">
          <div className="refund-header-info">
            <h1>{refund.refundNumber}</h1>
            <span
              className="status-badge large"
              style={{ backgroundColor: getStatusColor(refund.status) }}
            >
              {getStatusLabel(refund.status)}
            </span>
          </div>
          <div className="refund-actions">
            {canApprove(refund) && (
              <button
                className="btn btn-success"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                Schváliť
              </button>
            )}
            {canReject(refund) && (
              <button
                className="btn btn-danger"
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading}
              >
                Zamietnuť
              </button>
            )}
            {canExecute(refund) && (
              <button
                className="btn btn-primary"
                onClick={handleExecute}
                disabled={actionLoading}
              >
                Vykonať refund
              </button>
            )}
            {canCancel(refund) && (
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={actionLoading}
              >
                Zrušiť
              </button>
            )}
            {canDelete(refund) && (
              <button
                className="btn btn-outline-danger"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                Vymazať
              </button>
            )}
          </div>
        </div>

        <div className="refund-content">
          {/* Main Info */}
          <div className="refund-section">
            <h2>Informácie o refunde</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Suma</label>
                <span className="amount-large">{formatAmount(refund.amount, refund.currency)}</span>
              </div>
              <div className="info-item">
                <label>Typ</label>
                <span>{refund.refundTypeLabel}</span>
              </div>
              <div className="info-item">
                <label>Dôvod</label>
                <span>{getReasonLabel(refund.reason)}</span>
              </div>
              {refund.reasonDetails && (
                <div className="info-item full-width">
                  <label>Detaily dôvodu</label>
                  <span>{refund.reasonDetails}</span>
                </div>
              )}
              {refund.originalOrderAmount && (
                <div className="info-item">
                  <label>Pôvodná suma objednávky</label>
                  <span>{formatAmount(refund.originalOrderAmount, refund.currency)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Order Info */}
          <div className="refund-section">
            <h2>Objednávka</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Číslo objednávky</label>
                <Link to={`/admin/orders/${refund.orderId}`} className="link">
                  {refund.orderNumber}
                </Link>
              </div>
              <div className="info-item">
                <label>Zákazník</label>
                <span>{refund.orderUserName || refund.orderUserEmail}</span>
              </div>
              {refund.orderUserName && (
                <div className="info-item">
                  <label>Email</label>
                  <span>{refund.orderUserEmail}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Provider */}
          {refund.paymentProvider && (
            <div className="refund-section">
              <h2>Platobná brána</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Poskytovateľ</label>
                  <span>{refund.paymentProvider}</span>
                </div>
                {refund.providerRefundId && (
                  <div className="info-item">
                    <label>ID refundu</label>
                    <span className="mono">{refund.providerRefundId}</span>
                  </div>
                )}
                {refund.providerStatus && (
                  <div className="info-item">
                    <label>Stav</label>
                    <span>{refund.providerStatus}</span>
                  </div>
                )}
                {refund.providerError && (
                  <div className="info-item full-width error">
                    <label>Chyba</label>
                    <span>{refund.providerError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Processing Info */}
          <div className="refund-section">
            <h2>Spracovanie</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Vytvorené</label>
                <span>{formatDateTime(refund.createdAt)}</span>
              </div>
              {refund.requestedByName && (
                <div className="info-item">
                  <label>Požiadal</label>
                  <span>{refund.requestedByName}</span>
                </div>
              )}
              {refund.processedAt && (
                <div className="info-item">
                  <label>Spracované</label>
                  <span>{formatDateTime(refund.processedAt)}</span>
                </div>
              )}
              {refund.processedByName && (
                <div className="info-item">
                  <label>Spracoval</label>
                  <span>{refund.processedByName}</span>
                </div>
              )}
              {refund.completedAt && (
                <div className="info-item">
                  <label>Dokončené</label>
                  <span>{formatDateTime(refund.completedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Notification */}
          <div className="refund-section">
            <h2>Notifikácia zákazníka</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Stav</label>
                <span className={refund.customerNotified ? 'success' : 'warning'}>
                  {refund.customerNotified ? 'Notifikovaný' : 'Nenotifikovaný'}
                </span>
              </div>
              {refund.customerNotifiedAt && (
                <div className="info-item">
                  <label>Dátum</label>
                  <span>{formatDateTime(refund.customerNotifiedAt)}</span>
                </div>
              )}
              {!refund.customerNotified && (
                <div className="info-item">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleMarkNotified}
                    disabled={actionLoading}
                  >
                    Označiť ako notifikovaného
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="refund-section">
            <div className="section-header">
              <h2>Interné poznámky</h2>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowNotesModal(true)}
              >
                + Pridať poznámku
              </button>
            </div>
            {refund.internalNotes ? (
              <pre className="notes-content">{refund.internalNotes}</pre>
            ) : (
              <p className="no-content">Žiadne poznámky</p>
            )}
          </div>
        </div>

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
                  className="btn btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                >
                  Zrušiť
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                >
                  Zamietnuť
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNotesModal && (
          <div className="modal-overlay" onClick={() => setShowNotesModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Pridať poznámku</h3>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Nová poznámka..."
                rows={4}
                autoFocus
              />
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowNotesModal(false)}
                >
                  Zrušiť
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || actionLoading}
                >
                  Pridať
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

export default AdminRefundDetail;
