import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  type TicketDetailDto,
  type TicketCategoryDto,
  type CannedResponseDto,
  type TicketStatus,
  type TicketPriority,
  getTicketDetail,
  getActiveCategories,
  getAllCannedResponses,
  addMessage,
  addInternalNote,
  changeTicketStatus,
  changeTicketPriority,
  assignTicketToMe,
  unassignTicket,
  resolveTicket,
  closeTicket,
  reopenTicket,
  updateTicket,
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  getSourceLabel,
  formatTimeAgo,
} from '../../services/adminTicketsService';
import './AdminTicketDetail.css';

const AdminTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [detail, setDetail] = useState<TicketDetailDto | null>(null);
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponseDto[]>([]);

  // Reply form
  const [replyContent, setReplyContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);

  // Resolution modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionMessage, setResolutionMessage] = useState('');

  // Load ticket detail
  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTicketDetail(Number(id));
      setDetail(data);
    } catch (err) {
      console.error('Failed to load ticket:', err);
      setError('Nepodarilo sa načítať tiket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
    getActiveCategories().then(setCategories).catch(console.error);
    getAllCannedResponses().then(setCannedResponses).catch(console.error);
  }, [loadDetail]);

  // Handlers
  const handleSendReply = async () => {
    if (!id || !replyContent.trim()) return;
    setSending(true);
    try {
      await addMessage(Number(id), {
        content: replyContent,
        internal: isInternal,
        sendEmail: !isInternal && sendEmail,
      });
      setReplyContent('');
      setIsInternal(false);
      await loadDetail();
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Nepodarilo sa odoslať správu');
    } finally {
      setSending(false);
    }
  };

  const handleAddInternalNote = async () => {
    if (!id || !replyContent.trim()) return;
    setSending(true);
    try {
      await addInternalNote(Number(id), replyContent);
      setReplyContent('');
      await loadDetail();
    } catch (err) {
      console.error('Failed to add note:', err);
      setError('Nepodarilo sa pridať poznámku');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: TicketStatus) => {
    if (!id) return;
    try {
      await changeTicketStatus(Number(id), status);
      await loadDetail();
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handlePriorityChange = async (priority: TicketPriority) => {
    if (!id) return;
    try {
      await changeTicketPriority(Number(id), priority);
      await loadDetail();
    } catch (err) {
      console.error('Failed to change priority:', err);
    }
  };

  const handleCategoryChange = async (categoryId: number) => {
    if (!id) return;
    try {
      await updateTicket(Number(id), { categoryId });
      await loadDetail();
    } catch (err) {
      console.error('Failed to change category:', err);
    }
  };

  const handleAssignToMe = async () => {
    if (!id) return;
    try {
      await assignTicketToMe(Number(id));
      await loadDetail();
    } catch (err) {
      console.error('Failed to assign:', err);
    }
  };

  const handleUnassign = async () => {
    if (!id) return;
    try {
      await unassignTicket(Number(id));
      await loadDetail();
    } catch (err) {
      console.error('Failed to unassign:', err);
    }
  };

  const handleResolve = async () => {
    if (!id) return;
    try {
      await resolveTicket(Number(id), resolutionMessage);
      setShowResolveModal(false);
      setResolutionMessage('');
      await loadDetail();
    } catch (err) {
      console.error('Failed to resolve:', err);
    }
  };

  const handleClose = async () => {
    if (!id) return;
    try {
      await closeTicket(Number(id));
      await loadDetail();
    } catch (err) {
      console.error('Failed to close:', err);
    }
  };

  const handleReopen = async () => {
    if (!id) return;
    try {
      await reopenTicket(Number(id));
      await loadDetail();
    } catch (err) {
      console.error('Failed to reopen:', err);
    }
  };

  const handleCannedResponse = (response: CannedResponseDto) => {
    setReplyContent(response.content);
  };

  if (loading) {
    return (
      <AdminLayout title="Načítava sa...">
        <div className="ticket-loading">Načítava sa tiket...</div>
      </AdminLayout>
    );
  }

  if (error || !detail) {
    return (
      <AdminLayout title="Chyba">
        <div className="ticket-error">{error || 'Tiket nebol nájdený'}</div>
        <button onClick={() => navigate('/admin/tickets')}>Späť na tikety</button>
      </AdminLayout>
    );
  }

  const { ticket, messages } = detail;

  return (
    <AdminLayout title={`Tiket ${ticket.ticketNumber}`}>
      <div className="admin-ticket-detail">
        {/* Header */}
        <div className="ticket-header">
          <div className="ticket-header-left">
            <button className="btn-back" onClick={() => navigate('/admin/tickets')}>
              ← Späť
            </button>
            <div className="ticket-title">
              <span className="ticket-number">{ticket.ticketNumber}</span>
              <h1>{ticket.subject}</h1>
            </div>
          </div>
          <div className="ticket-header-actions">
            {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') ? (
              <button className="btn-reopen" onClick={handleReopen}>
                Znovu otvoriť
              </button>
            ) : (
              <>
                <button className="btn-resolve" onClick={() => setShowResolveModal(true)}>
                  Vyriešiť
                </button>
                <button className="btn-close" onClick={handleClose}>
                  Uzavrieť
                </button>
              </>
            )}
          </div>
        </div>

        <div className="ticket-content">
          {/* Messages */}
          <div className="ticket-messages-section">
            <div className="messages-list">
              {/* Original description */}
              <div className="message original-message">
                <div className="message-header">
                  <span className="message-author">
                    {ticket.customerName || 'Zákazník'}
                  </span>
                  <span className="message-time">
                    {new Date(ticket.createdAt).toLocaleString('sk-SK')}
                  </span>
                  <span className="message-source">{getSourceLabel(ticket.source)}</span>
                </div>
                <div className="message-content">
                  {ticket.lastMessagePreview || '(Žiadny popis)'}
                </div>
              </div>

              {/* Messages */}
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`message ${msg.internal ? 'internal' : ''} ${!msg.isStaffReply ? 'customer' : 'staff'}`}
                >
                  <div className="message-header">
                    {msg.internal && <span className="internal-badge">Interná poznámka</span>}
                    <span className="message-author">
                      {!msg.isStaffReply
                        ? (ticket.customerName || 'Zákazník')
                        : (msg.senderName || 'Podpora')}
                    </span>
                    <span className="message-time">
                      {formatTimeAgo(msg.createdAt)}
                    </span>
                  </div>
                  <div className="message-content">{msg.content}</div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="message-attachments">
                      {msg.attachments.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                          Príloha {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reply form */}
            <div className="reply-form">
              <div className="reply-tabs">
                <button
                  className={!isInternal ? 'active' : ''}
                  onClick={() => setIsInternal(false)}
                >
                  Odpoveď zákazníkovi
                </button>
                <button
                  className={isInternal ? 'active' : ''}
                  onClick={() => setIsInternal(true)}
                >
                  Interná poznámka
                </button>
              </div>

              {/* Canned responses */}
              {cannedResponses.length > 0 && (
                <div className="canned-responses">
                  <span>Rýchle odpovede:</span>
                  <div className="canned-list">
                    {cannedResponses.slice(0, 5).map(cr => (
                      <button
                        key={cr.id}
                        onClick={() => handleCannedResponse(cr)}
                        title={cr.content}
                      >
                        {cr.shortcut || cr.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={isInternal ? 'Napíšte internú poznámku...' : 'Napíšte odpoveď...'}
                rows={4}
              />

              <div className="reply-actions">
                {!isInternal && (
                  <label className="send-email-toggle">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                    />
                    Odoslať email
                  </label>
                )}
                <button
                  className="btn-send"
                  onClick={isInternal ? handleAddInternalNote : handleSendReply}
                  disabled={sending || !replyContent.trim()}
                >
                  {sending ? 'Odosiela sa...' : (isInternal ? 'Pridať poznámku' : 'Odoslať')}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="ticket-sidebar">
            {/* Status */}
            <div className="sidebar-section">
              <h3>Stav</h3>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                style={{ borderColor: getStatusColor(ticket.status) }}
              >
                <option value="OPEN">{getStatusLabel('OPEN')}</option>
                <option value="IN_PROGRESS">{getStatusLabel('IN_PROGRESS')}</option>
                <option value="WAITING_CUSTOMER">{getStatusLabel('WAITING_CUSTOMER')}</option>
                <option value="WAITING_INTERNAL">{getStatusLabel('WAITING_INTERNAL')}</option>
                <option value="RESOLVED">{getStatusLabel('RESOLVED')}</option>
                <option value="CLOSED">{getStatusLabel('CLOSED')}</option>
              </select>
            </div>

            {/* Priority */}
            <div className="sidebar-section">
              <h3>Priorita</h3>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                style={{ borderColor: getPriorityColor(ticket.priority) }}
              >
                <option value="LOW">{getPriorityLabel('LOW')}</option>
                <option value="NORMAL">{getPriorityLabel('NORMAL')}</option>
                <option value="HIGH">{getPriorityLabel('HIGH')}</option>
                <option value="URGENT">{getPriorityLabel('URGENT')}</option>
              </select>
            </div>

            {/* Category */}
            <div className="sidebar-section">
              <h3>Kategória</h3>
              <select
                value={ticket.categoryId || ''}
                onChange={(e) => handleCategoryChange(Number(e.target.value))}
              >
                <option value="">-- Bez kategórie --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Assignment */}
            <div className="sidebar-section">
              <h3>Priradené</h3>
              {ticket.assignedToName ? (
                <div className="assigned-info">
                  <span>{ticket.assignedToName}</span>
                  <button onClick={handleUnassign}>Zrušiť</button>
                </div>
              ) : (
                <button className="btn-assign" onClick={handleAssignToMe}>
                  Priradiť mne
                </button>
              )}
            </div>

            {/* Customer */}
            <div className="sidebar-section">
              <h3>Zákazník</h3>
              <div className="customer-info">
                <div className="customer-name">
                  {ticket.customerName || 'Neznámy'}
                </div>
                <div className="customer-email">
                  {ticket.customerEmail}
                </div>
                {ticket.userId && (
                  <a href={`/admin/users/${ticket.userId}`} className="customer-link">
                    Zobraziť profil
                  </a>
                )}
              </div>
            </div>

            {/* Order */}
            {ticket.relatedOrderId && (
              <div className="sidebar-section">
                <h3>Objednávka</h3>
                <a href={`/admin/orders/${ticket.relatedOrderId}`} className="order-link">
                  {ticket.relatedOrderNumber || `#${ticket.relatedOrderId}`}
                </a>
              </div>
            )}

            {/* Response Time Stats */}
            {(ticket.responseTimeMinutes || ticket.resolutionTimeMinutes) && (
              <div className="sidebar-section">
                <h3>Štatistiky</h3>
                {ticket.responseTimeMinutes && (
                  <div className="sla-item">
                    <span>Čas odpovede:</span>
                    <span>{Math.round(ticket.responseTimeMinutes / 60)} hod</span>
                  </div>
                )}
                {ticket.resolutionTimeMinutes && (
                  <div className="sla-item">
                    <span>Čas vyriešenia:</span>
                    <span>{Math.round(ticket.resolutionTimeMinutes / 60)} hod</span>
                  </div>
                )}
              </div>
            )}

            {/* Satisfaction */}
            {ticket.satisfactionRating && (
              <div className="sidebar-section">
                <h3>Hodnotenie</h3>
                <div className="satisfaction">
                  <span className="rating">{ticket.satisfactionRating}/5</span>
                  {ticket.satisfactionFeedback && (
                    <p className="feedback">{ticket.satisfactionFeedback}</p>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="sidebar-section timestamps">
              <div>
                <span>Vytvorené:</span>
                <span>{new Date(ticket.createdAt).toLocaleString('sk-SK')}</span>
              </div>
              {ticket.firstResponseAt && (
                <div>
                  <span>Prvá odpoveď:</span>
                  <span>{new Date(ticket.firstResponseAt).toLocaleString('sk-SK')}</span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div>
                  <span>Vyriešené:</span>
                  <span>{new Date(ticket.resolvedAt).toLocaleString('sk-SK')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resolve Modal */}
        {showResolveModal && (
          <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Vyriešiť tiket</h2>
              <textarea
                value={resolutionMessage}
                onChange={(e) => setResolutionMessage(e.target.value)}
                placeholder="Správa o vyriešení (voliteľné)..."
                rows={4}
              />
              <div className="modal-actions">
                <button onClick={() => setShowResolveModal(false)}>Zrušiť</button>
                <button className="btn-primary" onClick={handleResolve}>
                  Vyriešiť tiket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminTicketDetail;
