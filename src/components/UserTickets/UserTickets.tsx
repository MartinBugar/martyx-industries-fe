import React, { useState, useEffect, useCallback } from 'react';
import userTicketsService, {
  TicketStatus,
  TicketPriority,
} from '../../services/userTicketsService';
import type {
  TicketDto,
  TicketDetailDto,
  TicketCategoryDto,
  CreateTicketRequest
} from '../../services/userTicketsService';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import { logError, logInfo } from '../../services/logger';
import './UserTickets.css';

const UserTickets: React.FC = () => {
  // List state
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // View state
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'create'>('list');
  const [selectedTicket, setSelectedTicket] = useState<TicketDetailDto | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Create ticket state
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [newTicket, setNewTicket] = useState<CreateTicketRequest>({
    subject: '',
    message: '',
    categoryId: undefined,
    priority: TicketPriority.NORMAL
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Reply state
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Action states for loading indicators
  const [isClosing, setIsClosing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);

  // Load tickets
  const loadTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await userTicketsService.getMyTickets(currentPage, 10);
      setTickets(response.content);
      setTotalPages(response.totalPages);
      logInfo('Loaded user tickets:', response.content.length);
    } catch (err) {
      logError('Failed to load tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const cats = await userTicketsService.getCategories();
      setCategories(cats);
    } catch (err) {
      logError('Failed to load categories:', err);
    }
  }, []);

  // Initial load - only on mount and page change
  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Load categories once on mount
  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // View ticket detail
  const viewTicket = async (ticketId: number) => {
    try {
      setIsLoadingDetail(true);
      const detail = await userTicketsService.getTicketDetail(ticketId);
      setSelectedTicket(detail);
      setViewMode('detail');
    } catch (err) {
      logError('Failed to load ticket detail:', err);
      setError('Failed to load ticket details.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Create ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      setSubmitError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await userTicketsService.createTicket(newTicket);
      setSubmitSuccess(true);
      setNewTicket({
        subject: '',
        message: '',
        categoryId: undefined,
        priority: TicketPriority.NORMAL
      });
      // Reload tickets and go back to list after short delay
      setTimeout(() => {
        setSubmitSuccess(false);
        setViewMode('list');
        loadTickets();
      }, 2000);
    } catch (err) {
      logError('Failed to create ticket:', err);
      setSubmitError('Failed to create ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add reply
  const handleAddReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;

    try {
      setIsReplying(true);
      setError(null);
      await userTicketsService.addMessage(selectedTicket.ticket.id, replyContent);
      setReplyContent('');
      // Reload ticket detail
      const detail = await userTicketsService.getTicketDetail(selectedTicket.ticket.id);
      setSelectedTicket(detail);
    } catch (err) {
      logError('Failed to add reply:', err);
      setError('Failed to send reply. Please try again.');
    } finally {
      setIsReplying(false);
    }
  };

  // Close ticket
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    try {
      setIsClosing(true);
      setError(null);
      await userTicketsService.closeTicket(selectedTicket.ticket.id);
      const detail = await userTicketsService.getTicketDetail(selectedTicket.ticket.id);
      setSelectedTicket(detail);
      loadTickets();
    } catch (err) {
      logError('Failed to close ticket:', err);
      setError('Failed to close ticket. Please try again.');
    } finally {
      setIsClosing(false);
    }
  };

  // Reopen ticket
  const handleReopenTicket = async () => {
    if (!selectedTicket) return;

    try {
      setIsReopening(true);
      setError(null);
      await userTicketsService.reopenTicket(selectedTicket.ticket.id);
      const detail = await userTicketsService.getTicketDetail(selectedTicket.ticket.id);
      setSelectedTicket(detail);
      loadTickets();
    } catch (err) {
      logError('Failed to reopen ticket:', err);
      setError('Failed to reopen ticket. Please try again.');
    } finally {
      setIsReopening(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // =========================================================================
  // RENDER: CREATE TICKET FORM
  // =========================================================================
  if (viewMode === 'create') {
    return (
      <div className="user-tickets">
        <div className="tickets-header">
          <button className="back-button" onClick={() => setViewMode('list')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Tickets
          </button>
          <h2>Create New Ticket</h2>
        </div>

        {submitSuccess && (
          <div className="success-message">
            Ticket created successfully! Redirecting...
          </div>
        )}

        {submitError && (
          <div className="error-message">{submitError}</div>
        )}

        <form className="create-ticket-form" onSubmit={handleCreateTicket}>
          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <input
              type="text"
              id="subject"
              value={newTicket.subject}
              onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              placeholder="Brief description of your issue"
              maxLength={255}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={newTicket.categoryId || ''}
                onChange={(e) => setNewTicket({ ...newTicket, categoryId: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Select category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as TicketPriority })}
              >
                <option value={TicketPriority.LOW}>Low</option>
                <option value={TicketPriority.NORMAL}>Normal</option>
                <option value={TicketPriority.HIGH}>High</option>
                <option value={TicketPriority.URGENT}>Urgent</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="message">Message * ({newTicket.message.length}/10000)</label>
            <textarea
              id="message"
              value={newTicket.message}
              onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
              placeholder="Describe your issue in detail..."
              rows={8}
              maxLength={10000}
              required
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={() => setViewMode('list')}>
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // =========================================================================
  // RENDER: TICKET DETAIL
  // =========================================================================
  if (viewMode === 'detail' && selectedTicket) {
    const ticket = selectedTicket.ticket; // Extract the nested ticket
    const canReply = ticket.status !== TicketStatus.CLOSED;
    const canClose = ticket.status !== TicketStatus.CLOSED && ticket.status !== TicketStatus.RESOLVED;
    const canReopen = ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.RESOLVED;

    return (
      <div className="user-tickets">
        <div className="tickets-header">
          <button className="back-button" onClick={() => { setViewMode('list'); setSelectedTicket(null); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Tickets
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="ticket-detail">
          <div className="ticket-detail-header">
            <div className="ticket-meta">
              <span className="ticket-number">#{ticket.ticketNumber}</span>
              <span
                className="ticket-status"
                style={{ backgroundColor: userTicketsService.getStatusColor(ticket.status) }}
              >
                {userTicketsService.getStatusLabel(ticket.status)}
              </span>
              <span
                className="ticket-priority"
                style={{ color: userTicketsService.getPriorityColor(ticket.priority) }}
              >
                {userTicketsService.getPriorityLabel(ticket.priority)}
              </span>
            </div>
            <h2 className="ticket-subject">{ticket.subject}</h2>
            <div className="ticket-info">
              <span>Created: {formatDate(ticket.createdAt)}</span>
              {ticket.categoryName && <span>Category: {ticket.categoryName}</span>}
            </div>
          </div>

          <div className="ticket-messages">
            {selectedTicket.messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`message ${msg.isStaffReply ? 'staff-message' : 'user-message'}`}
              >
                <div className="message-header">
                  <span className="message-sender">
                    {msg.isStaffReply ? 'Support Team' : 'You'}
                  </span>
                  <span className="message-date">{formatDate(msg.createdAt)}</span>
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
          </div>

          {canReply && (
            <div className="reply-section">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
                maxLength={10000}
              />
              <div className="reply-char-count">{replyContent.length}/10000</div>
              <div className="reply-actions">
                <button
                  className="reply-button"
                  onClick={handleAddReply}
                  disabled={!replyContent.trim() || isReplying}
                >
                  {isReplying ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          )}

          <div className="ticket-actions">
            {canClose && (
              <button
                className="close-ticket-button"
                onClick={handleCloseTicket}
                disabled={isClosing}
              >
                {isClosing ? 'Closing...' : 'Close Ticket'}
              </button>
            )}
            {canReopen && (
              <button
                className="reopen-ticket-button"
                onClick={handleReopenTicket}
                disabled={isReopening}
              >
                {isReopening ? 'Reopening...' : 'Reopen Ticket'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: TICKET LIST
  // =========================================================================
  return (
    <div className="user-tickets">
      <div className="tickets-header">
        <h2>My Support Tickets</h2>
        <button className="create-ticket-button" onClick={() => setViewMode('create')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Ticket
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading || isLoadingDetail ? (
        <div className="loading-container">
          <LoadingSpinner size="medium" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>No tickets yet</h3>
          <p>Need help? Create a support ticket and we'll get back to you.</p>
          <button className="create-ticket-button" onClick={() => setViewMode('create')}>
            Create Your First Ticket
          </button>
        </div>
      ) : (
        <>
          <div className="tickets-list">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className="ticket-card"
                onClick={() => viewTicket(ticket.id)}
              >
                <div className="ticket-card-header">
                  <span className="ticket-number">#{ticket.ticketNumber}</span>
                  <span
                    className="ticket-status"
                    style={{ backgroundColor: userTicketsService.getStatusColor(ticket.status) }}
                  >
                    {userTicketsService.getStatusLabel(ticket.status)}
                  </span>
                </div>
                <h3 className="ticket-subject">{ticket.subject}</h3>
                <div className="ticket-card-footer">
                  <span className="ticket-date">{formatDate(ticket.createdAt)}</span>
                  {ticket.categoryName && (
                    <span className="ticket-category">{ticket.categoryName}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </button>
              <span>Page {currentPage + 1} of {totalPages}</span>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserTickets;
