import React, { useState, useEffect, useCallback } from 'react';
import {
  type CustomerCommunicationDto,
  type CommunicationType,
  type CommunicationDirection,
  type CommunicationStatsDto,
  getCustomerTimeline,
  getFilteredTimeline,
  searchCommunications,
  getCustomerStats,
  addAdminNote,
  logPhoneCall,
  deleteNote,
  getTypeLabel,
  getTypeColor,
  formatTimeAgo,
  formatDateTime,
  formatDuration,
} from '../../services/adminCommunicationsService';
import './CustomerTimeline.css';

interface CustomerTimelineProps {
  userId: number;
  compact?: boolean;
  limit?: number;
}

const CustomerTimeline: React.FC<CustomerTimelineProps> = ({
  userId,
  compact = false,
  limit
}) => {
  const [communications, setCommunications] = useState<CustomerCommunicationDto[]>([]);
  const [stats, setStats] = useState<CommunicationStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<CommunicationType | ''>('');
  const [directionFilter, setDirectionFilter] = useState<CommunicationDirection | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Add note modal
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddCall, setShowAddCall] = useState(false);
  const [noteSubject, setNoteSubject] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [callDuration, setCallDuration] = useState<number | undefined>(undefined);
  const [callOutcome, setCallOutcome] = useState('');
  const [saving, setSaving] = useState(false);

  // Expanded items
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const pageSize = limit || 20;

  const loadCommunications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result;

      if (searchQuery.trim()) {
        result = await searchCommunications(userId, searchQuery, page, pageSize);
      } else if (typeFilter || directionFilter) {
        result = await getFilteredTimeline(
          userId,
          {
            type: typeFilter || undefined,
            direction: directionFilter || undefined
          },
          page,
          pageSize
        );
      } else {
        result = await getCustomerTimeline(userId, page, pageSize);
      }

      setCommunications(result.content);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to load communications:', err);
      setError('Nepodarilo sa načítať komunikáciu');
    } finally {
      setLoading(false);
    }
  }, [userId, typeFilter, directionFilter, searchQuery, page, pageSize]);

  const loadStats = useCallback(async () => {
    try {
      const data = await getCustomerStats(userId);
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, [userId]);

  useEffect(() => {
    loadCommunications();
  }, [loadCommunications]);

  useEffect(() => {
    if (!compact) {
      loadStats();
    }
  }, [compact, loadStats]);

  useEffect(() => {
    setPage(0);
  }, [typeFilter, directionFilter, searchQuery]);

  const handleAddNote = async () => {
    if (!noteSubject.trim()) return;
    setSaving(true);
    try {
      await addAdminNote(userId, { subject: noteSubject, content: noteContent });
      setShowAddNote(false);
      setNoteSubject('');
      setNoteContent('');
      loadCommunications();
      loadStats();
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCall = async () => {
    if (!noteSubject.trim()) return;
    setSaving(true);
    try {
      await logPhoneCall(userId, {
        subject: noteSubject,
        notes: noteContent,
        durationSeconds: callDuration,
        outcome: callOutcome || undefined
      });
      setShowAddCall(false);
      setNoteSubject('');
      setNoteContent('');
      setCallDuration(undefined);
      setCallOutcome('');
      loadCommunications();
      loadStats();
    } catch (err) {
      console.error('Failed to log call:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Naozaj chcete zmazať túto poznámku?')) return;
    try {
      await deleteNote(id);
      loadCommunications();
      loadStats();
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const getIconForType = (type: CommunicationType) => {
    switch (type) {
      case 'ORDER_CONFIRMATION': return '🛒';
      case 'SHIPPING_NOTIFICATION': return '🚚';
      case 'DELIVERY_CONFIRMATION': return '📦';
      case 'MARKETING_EMAIL': return '📣';
      case 'PROMOTIONAL_EMAIL': return '🏷️';
      case 'ABANDONED_CART_EMAIL': return '🛒';
      case 'SUPPORT_TICKET': return '🎫';
      case 'TICKET_REPLY': return '💬';
      case 'ADMIN_NOTE': return '📝';
      case 'PHONE_CALL': return '📞';
      case 'REFUND_NOTIFICATION': return '💳';
      case 'PASSWORD_RESET': return '🔑';
      case 'ACCOUNT_VERIFICATION': return '✅';
      case 'WELCOME_EMAIL': return '👋';
      case 'REVIEW_REQUEST': return '⭐';
      case 'INVOICE_EMAIL': return '📄';
      default: return '✉️';
    }
  };

  if (loading && communications.length === 0) {
    return <div className="timeline-loading">Načítava sa...</div>;
  }

  if (error) {
    return <div className="timeline-error">{error}</div>;
  }

  return (
    <div className={`customer-timeline ${compact ? 'compact' : ''}`}>
      {/* Stats (non-compact mode only) */}
      {!compact && stats && (
        <div className="timeline-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.totalCommunications}</span>
            <span className="stat-label">Celkom</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.outboundCount}</span>
            <span className="stat-label">Odoslané</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.inboundCount}</span>
            <span className="stat-label">Prijaté</span>
          </div>
          {stats.emailsSent > 0 && (
            <>
              <div className="stat-item">
                <span className="stat-value">{stats.openRate.toFixed(1)}%</span>
                <span className="stat-label">Open rate</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.clickRate.toFixed(1)}%</span>
                <span className="stat-label">Click rate</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filters and Actions (non-compact mode only) */}
      {!compact && (
        <div className="timeline-controls">
          <div className="timeline-filters">
            <input
              type="text"
              placeholder="Hľadať..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as CommunicationType | '')}
            >
              <option value="">Všetky typy</option>
              <option value="ORDER_CONFIRMATION">Potvrdenie objednávky</option>
              <option value="SHIPPING_NOTIFICATION">Odoslanie</option>
              <option value="SUPPORT_TICKET">Support tiket</option>
              <option value="TICKET_REPLY">Odpoveď na tiket</option>
              <option value="ADMIN_NOTE">Poznámka</option>
              <option value="PHONE_CALL">Hovor</option>
              <option value="MARKETING_EMAIL">Marketing</option>
              <option value="REFUND_NOTIFICATION">Refund</option>
            </select>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as CommunicationDirection | '')}
            >
              <option value="">Všetky smery</option>
              <option value="OUTBOUND">Odoslané</option>
              <option value="INBOUND">Prijaté</option>
            </select>
          </div>
          <div className="timeline-actions">
            <button className="btn-secondary" onClick={() => setShowAddNote(true)}>
              + Poznámka
            </button>
            <button className="btn-secondary" onClick={() => setShowAddCall(true)}>
              + Hovor
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="timeline-list">
        {communications.length === 0 ? (
          <div className="timeline-empty">Žiadna komunikácia</div>
        ) : (
          communications.map((comm) => (
            <div
              key={comm.id}
              className={`timeline-item ${comm.direction.toLowerCase()} ${expandedId === comm.id ? 'expanded' : ''}`}
              onClick={() => setExpandedId(expandedId === comm.id ? null : comm.id)}
            >
              <div
                className="timeline-icon"
                style={{ backgroundColor: getTypeColor(comm.communicationType) }}
              >
                {getIconForType(comm.communicationType)}
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-type">{getTypeLabel(comm.communicationType)}</span>
                  <span className="timeline-time">{formatTimeAgo(comm.createdAt)}</span>
                </div>
                <div className="timeline-subject">{comm.subject}</div>
                {comm.summary && !expandedId && (
                  <div className="timeline-summary">{comm.summary}</div>
                )}

                {/* Expanded content */}
                {expandedId === comm.id && (
                  <div className="timeline-details">
                    {comm.content && (
                      <div className="timeline-full-content">{comm.content}</div>
                    )}
                    <div className="timeline-meta">
                      <span>Dátum: {formatDateTime(comm.createdAt)}</span>
                      {comm.direction === 'OUTBOUND' && comm.emailSentAt && (
                        <span>Odoslané: {formatDateTime(comm.emailSentAt)}</span>
                      )}
                      {comm.emailOpenedAt && (
                        <span className="success">Otvorené: {formatDateTime(comm.emailOpenedAt)}</span>
                      )}
                      {comm.emailClickedAt && (
                        <span className="success">Kliknuté: {formatDateTime(comm.emailClickedAt)}</span>
                      )}
                      {comm.emailBounced && (
                        <span className="error">Email nedoručený</span>
                      )}
                      {comm.callDurationSeconds && (
                        <span>Trvanie: {formatDuration(comm.callDurationSeconds)}</span>
                      )}
                      {comm.callOutcome && (
                        <span>Výsledok: {comm.callOutcome}</span>
                      )}
                      {comm.relatedOrderId && (
                        <a href={`/admin/orders/${comm.relatedOrderId}`}>
                          Objednávka #{comm.relatedOrderId}
                        </a>
                      )}
                      {comm.relatedTicketId && (
                        <a href={`/admin/tickets/${comm.relatedTicketId}`}>
                          Tiket #{comm.relatedTicketId}
                        </a>
                      )}
                      {comm.createdByName && (
                        <span>Vytvoril: {comm.createdByName}</span>
                      )}
                    </div>
                    {comm.communicationType === 'ADMIN_NOTE' && (
                      <div className="timeline-item-actions">
                        <button
                          className="btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(comm.id);
                          }}
                        >
                          Zmazať
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="timeline-direction">
                {comm.direction === 'OUTBOUND' ? '→' : '←'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination (non-compact mode only) */}
      {!compact && totalPages > 1 && (
        <div className="timeline-pagination">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Predch.
          </button>
          <span>
            Strana {page + 1} z {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Ďalšia
          </button>
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNote && (
        <div className="modal-overlay" onClick={() => setShowAddNote(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Pridať poznámku</h3>
            <input
              type="text"
              placeholder="Predmet"
              value={noteSubject}
              onChange={(e) => setNoteSubject(e.target.value)}
              autoFocus
            />
            <textarea
              placeholder="Obsah poznámky..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={5}
            />
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddNote(false)}>
                Zrušiť
              </button>
              <button
                className="btn-primary"
                onClick={handleAddNote}
                disabled={saving || !noteSubject.trim()}
              >
                {saving ? 'Ukladá sa...' : 'Uložiť'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Call Modal */}
      {showAddCall && (
        <div className="modal-overlay" onClick={() => setShowAddCall(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Zaznamenať hovor</h3>
            <input
              type="text"
              placeholder="Predmet hovoru"
              value={noteSubject}
              onChange={(e) => setNoteSubject(e.target.value)}
              autoFocus
            />
            <textarea
              placeholder="Poznámky z hovoru..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
            />
            <div className="form-row">
              <div className="form-group">
                <label>Trvanie (sekundy)</label>
                <input
                  type="number"
                  placeholder="napr. 300"
                  value={callDuration || ''}
                  onChange={(e) => setCallDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
              <div className="form-group">
                <label>Výsledok</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                >
                  <option value="">Vyberte...</option>
                  <option value="Úspešný kontakt">Úspešný kontakt</option>
                  <option value="Nedostupný">Nedostupný</option>
                  <option value="Spätné volanie">Spätné volanie</option>
                  <option value="Vyriešené">Vyriešené</option>
                  <option value="Potrebuje followup">Potrebuje followup</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddCall(false)}>
                Zrušiť
              </button>
              <button
                className="btn-primary"
                onClick={handleAddCall}
                disabled={saving || !noteSubject.trim()}
              >
                {saving ? 'Ukladá sa...' : 'Uložiť'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTimeline;
