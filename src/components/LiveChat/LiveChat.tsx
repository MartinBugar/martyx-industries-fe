import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import userTicketsService, {
  TicketDto,
  TicketMessageDto,
  TicketStatus,
  CreateTicketRequest
} from '../../services/userTicketsService';
import './LiveChat.css';

/**
 * LiveChat Component
 *
 * Floating chat widget that creates support tickets.
 * - Shows chat bubble in bottom-right corner
 * - Opens chat window with message history
 * - Creates new tickets or continues existing ones
 */
const LiveChat: React.FC = () => {
  const { t } = useTranslation('common');
  const { isAuthenticated } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mountedRef = useRef(true);

  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  // Data State
  const [activeTicket, setActiveTicket] = useState<TicketDto | null>(null);
  const [messages, setMessages] = useState<TicketMessageDto[]>([]);
  const [recentTickets, setRecentTickets] = useState<TicketDto[]>([]);

  // Form State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Loading State
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Poll interval
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track mounted state for cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized, activeTicket, showNewTicketForm]);

  const loadRecentTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await userTicketsService.getMyTickets(0, 5);
      if (!mountedRef.current) return;

      setRecentTickets(response.content);

      // Auto-select most recent open ticket
      const openTicket = response.content.find(
        t => t.status === TicketStatus.OPEN ||
             t.status === TicketStatus.IN_PROGRESS ||
             t.status === TicketStatus.WAITING_CUSTOMER
      );
      if (openTicket) {
        setActiveTicket(openTicket);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const loadMessages = useCallback(async (ticketId: number) => {
    try {
      const msgs = await userTicketsService.getTicketMessages(ticketId);
      if (mountedRef.current) {
        setMessages(msgs);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, []);

  // Load user's tickets when authenticated
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadRecentTickets();
    }
  }, [isAuthenticated, isOpen, loadRecentTickets]);

  // Poll for new messages when a ticket is active
  useEffect(() => {
    if (activeTicket && isOpen && !isMinimized) {
      loadMessages(activeTicket.id);

      pollIntervalRef.current = setInterval(() => {
        loadMessages(activeTicket.id);
      }, 10000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [activeTicket, isOpen, isMinimized, loadMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSending(true);
    try {
      const request: CreateTicketRequest = {
        subject: subject.trim(),
        message: message.trim(),
      };

      const ticket = await userTicketsService.createTicket(request);
      if (!mountedRef.current) return;

      setActiveTicket(ticket);
      setShowNewTicketForm(false);
      setSubject('');
      setMessage('');
      loadMessages(ticket.id);
      loadRecentTickets();
      toast.success(t('chat.ticketCreated', 'Your message has been sent!'));
    } catch (err) {
      console.error('Failed to create ticket:', err);
      toast.error(t('chat.createError', 'Failed to send message. Please try again.'));
    } finally {
      if (mountedRef.current) {
        setIsSending(false);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeTicket) return;

    setIsSending(true);
    try {
      await userTicketsService.addMessage(activeTicket.id, message.trim());
      if (!mountedRef.current) return;

      setMessage('');
      loadMessages(activeTicket.id);
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error(t('chat.sendError', 'Failed to send message. Please try again.'));
    } finally {
      if (mountedRef.current) {
        setIsSending(false);
      }
    }
  };

  const handleSelectTicket = useCallback((ticket: TicketDto) => {
    setActiveTicket(ticket);
    setShowNewTicketForm(false);
  }, []);

  const handleTicketKeyDown = useCallback((e: React.KeyboardEvent, ticket: TicketDto) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectTicket(ticket);
    }
  }, [handleSelectTicket]);

  const handleStartNewTicket = () => {
    setActiveTicket(null);
    setMessages([]);
    setShowNewTicketForm(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showNewTicketForm) {
        handleCreateTicket(e as unknown as React.FormEvent);
      } else {
        handleSendMessage(e as unknown as React.FormEvent);
      }
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Don't render for non-authenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="live-chat-container">
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`live-chat-window ${isMinimized ? 'minimized' : ''}`}
          role="dialog"
          aria-label={t('chat.title', 'Support Chat')}
          aria-modal="false"
        >
          {/* Header */}
          <div className="live-chat-header">
            <div className="header-info">
              <MessageCircle size={20} aria-hidden="true" />
              <span>{t('chat.title', 'Support Chat')}</span>
            </div>
            <div className="header-actions">
              <button
                onClick={toggleMinimize}
                aria-label={isMinimized ? t('chat.maximize', 'Maximize') : t('chat.minimize', 'Minimize')}
              >
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
              <button onClick={toggleChat} aria-label={t('chat.close', 'Close')}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="live-chat-content">
              {/* Ticket Selection / New Ticket Form */}
              {showNewTicketForm ? (
                <form className="new-ticket-form" onSubmit={handleCreateTicket}>
                  <h4>{t('chat.newTicket', 'New Conversation')}</h4>
                  <label htmlFor="chat-subject" className="sr-only">
                    {t('chat.subjectPlaceholder', 'Subject')}
                  </label>
                  <input
                    id="chat-subject"
                    type="text"
                    placeholder={t('chat.subjectPlaceholder', 'Subject')}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    maxLength={255}
                    required
                    autoFocus
                  />
                  <label htmlFor="chat-message" className="sr-only">
                    {t('chat.messagePlaceholder', 'How can we help you?')}
                  </label>
                  <textarea
                    id="chat-message"
                    ref={inputRef}
                    placeholder={t('chat.messagePlaceholder', 'How can we help you?')}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={5000}
                    rows={4}
                    required
                  />
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowNewTicketForm(false)}
                    >
                      {t('chat.cancel', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSending || !subject.trim() || !message.trim()}
                    >
                      {isSending ? t('chat.sending', 'Sending...') : t('chat.send', 'Start Chat')}
                    </button>
                  </div>
                </form>
              ) : activeTicket ? (
                <>
                  {/* Active Ticket Header */}
                  <div className="ticket-header">
                    <div className="ticket-info">
                      <span className="ticket-number">#{activeTicket.ticketNumber}</span>
                      <span className="ticket-subject">{activeTicket.subject}</span>
                    </div>
                    <button className="btn-new" onClick={handleStartNewTicket}>
                      {t('chat.newConversation', '+ New')}
                    </button>
                  </div>

                  {/* Messages */}
                  <div
                    className="messages-container"
                    role="log"
                    aria-live="polite"
                    aria-label={t('chat.messageHistory', 'Message history')}
                  >
                    {messages.length === 0 ? (
                      <div className="no-messages">
                        {t('chat.noMessages', 'No messages yet')}
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`message ${msg.isStaffReply ? 'staff' : 'customer'}`}
                        >
                          <div className="message-content">{msg.content}</div>
                          <div className="message-meta">
                            <span className="sender">{msg.senderName || (msg.isStaffReply ? 'Support' : 'You')}</span>
                            <span className="time">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form className="message-input" onSubmit={handleSendMessage}>
                    <label htmlFor="chat-reply" className="sr-only">
                      {t('chat.replyPlaceholder', 'Type your message...')}
                    </label>
                    <textarea
                      id="chat-reply"
                      ref={inputRef}
                      placeholder={t('chat.replyPlaceholder', 'Type your message...')}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      maxLength={5000}
                      rows={2}
                    />
                    <button
                      type="submit"
                      disabled={isSending || !message.trim()}
                      aria-label={t('chat.sendMessage', 'Send message')}
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </>
              ) : (
                /* Ticket List */
                <div className="ticket-list">
                  <div className="ticket-list-header">
                    <h4>{t('chat.recentConversations', 'Recent Conversations')}</h4>
                    <button className="btn-new" onClick={handleStartNewTicket}>
                      {t('chat.startNew', '+ New')}
                    </button>
                  </div>
                  {isLoading ? (
                    <div className="loading">{t('chat.loading', 'Loading...')}</div>
                  ) : recentTickets.length === 0 ? (
                    <div className="no-tickets">
                      <p>{t('chat.noTickets', 'No conversations yet')}</p>
                      <button className="btn-primary" onClick={handleStartNewTicket}>
                        {t('chat.startConversation', 'Start a Conversation')}
                      </button>
                    </div>
                  ) : (
                    <ul role="listbox" aria-label={t('chat.recentConversations', 'Recent Conversations')}>
                      {recentTickets.map((ticket) => (
                        <li
                          key={ticket.id}
                          role="option"
                          tabIndex={0}
                          onClick={() => handleSelectTicket(ticket)}
                          onKeyDown={(e) => handleTicketKeyDown(e, ticket)}
                          className={`ticket-item ${ticket.status === TicketStatus.WAITING_CUSTOMER ? 'has-reply' : ''}`}
                          aria-label={`${ticket.subject}, ${userTicketsService.getStatusLabel(ticket.status)}`}
                        >
                          <div className="ticket-item-subject">{ticket.subject}</div>
                          <div className="ticket-item-meta">
                            <span className={`status status-${ticket.status.toLowerCase().replace('_', '-')}`}>
                              {userTicketsService.getStatusLabel(ticket.status)}
                            </span>
                            <span className="date">
                              {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chat Bubble */}
      <button
        className={`live-chat-bubble ${isOpen ? 'active' : ''}`}
        onClick={toggleChat}
        aria-label={isOpen ? t('chat.close', 'Close chat') : t('chat.open', 'Open chat')}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X size={24} aria-hidden="true" />
        ) : (
          <MessageCircle size={24} aria-hidden="true" />
        )}
      </button>
    </div>
  );
};

export default LiveChat;
