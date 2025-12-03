import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Mail, MessageSquare, Check, X, Trash2, Search, Plus } from 'lucide-react';
import AdminLayout from './AdminLayout';
import {
  type TicketDto,
  type TicketStatsDto,
  type TicketCategoryDto,
  type TicketStatus,
  type TicketPriority,
  type Page,
  getTickets,
  getTicketStats,
  getActiveCategories,
  getMyTickets,
  assignTicketToMe,
  changeTicketStatus,
  changeTicketPriority,
  searchTickets,
  getStatusLabel,
  getStatusColor,
  getPriorityLabel,
  getPriorityColor,
  formatTimeAgo,
} from '../../services/adminTicketsService';
import adminContactService, {
  type ContactFormSubmissionDto,
  type ContactFormStatsDto,
} from '../../services/adminContactService';
import { Button, Badge, SkeletonTable, ConfirmDialog, useConfirmDialog } from '../../components/ui';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import './AdminTickets.css';

type MainTabType = 'tickets' | 'contact-forms';
type TicketTabType = 'all' | 'my' | 'unassigned' | 'urgent';

const AdminTickets: React.FC = () => {
  const navigate = useNavigate();

  // Main tabs: tickets vs contact forms
  const [mainTab, setMainTab] = useState<MainTabType>('tickets');
  const [ticketTab, setTicketTab] = useState<TicketTabType>('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ticket Data
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [stats, setStats] = useState<TicketStatsDto | null>(null);
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Contact Form Data
  const [contactForms, setContactForms] = useState<ContactFormSubmissionDto[]>([]);
  const [contactStats, setContactStats] = useState<ContactFormStatsDto | null>(null);
  const [contactTotalElements, setContactTotalElements] = useState(0);
  const [contactTotalPages, setContactTotalPages] = useState(0);
  const [contactProcessedFilter, setContactProcessedFilter] = useState<boolean | undefined>(undefined);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  // Selected tickets for bulk operations
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set());

  // Accessible confirm dialog
  const { confirm, dialogProps } = useConfirmDialog({
    title: 'Potvrdiť odstránenie',
    variant: 'danger',
    confirmText: 'Odstrániť',
    cancelText: 'Zrušiť',
  });

  // Load categories on mount
  useEffect(() => {
    getActiveCategories().then(setCategories).catch(console.error);
  }, []);

  // Load ticket stats
  useEffect(() => {
    getTicketStats().then(setStats).catch(console.error);
  }, []);

  // Load contact form stats
  useEffect(() => {
    adminContactService.getStats().then(setContactStats).catch(console.error);
  }, []);

  // Load contact forms
  const loadContactForms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminContactService.getSubmissions(page, pageSize, contactProcessedFilter);
      setContactForms(result.content);
      setContactTotalElements(result.totalElements);
      setContactTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to load contact forms:', err);
      setError('Nepodarilo sa načítať kontaktné formuláre');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, contactProcessedFilter]);

  // Load contact forms when on that tab
  useEffect(() => {
    if (mainTab === 'contact-forms') {
      loadContactForms();
    }
  }, [mainTab, loadContactForms]);

  // Load tickets based on filters
  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let result: Page<TicketDto>;

      if (searchQuery.trim()) {
        result = await searchTickets(searchQuery, page, pageSize);
      } else {
        const params: Parameters<typeof getTickets>[0] = {
          page,
          size: pageSize,
          sort: 'createdAt,desc',
        };

        if (statusFilter) params.status = statusFilter;
        if (priorityFilter) params.priority = priorityFilter;
        if (categoryFilter) params.categoryId = categoryFilter;

        // Tab-specific filters
        if (ticketTab === 'my') {
          // Use my-tickets endpoint instead
          result = await getMyTickets(page, pageSize);
        } else {
          if (ticketTab === 'unassigned') {
            params.unassigned = true;
          } else if (ticketTab === 'urgent') {
            params.priority = 'URGENT';
          }

          result = await getTickets(params);
        }
      }

      setTickets(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Nepodarilo sa načítať tikety');
    } finally {
      setLoading(false);
    }
  }, [ticketTab, statusFilter, priorityFilter, categoryFilter, searchQuery, page, pageSize]);

  // Load tickets when on tickets tab
  useEffect(() => {
    if (mainTab === 'tickets') {
      loadTickets();
    }
  }, [mainTab, loadTickets]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [mainTab, ticketTab, statusFilter, priorityFilter, categoryFilter, searchQuery, contactProcessedFilter]);

  // Handlers
  const handleTicketClick = (ticket: TicketDto) => {
    navigate(`/admin/tickets/${ticket.id}`);
  };

  const handleAssignToMe = async (e: React.MouseEvent, ticketId: number) => {
    e.stopPropagation();
    try {
      await assignTicketToMe(ticketId);
      await loadTickets();
      if (stats) {
        getTicketStats().then(setStats);
      }
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, ticketId: number) => {
    e.stopPropagation();
    const newStatus = e.target.value as TicketStatus;
    try {
      await changeTicketStatus(ticketId, newStatus);
      await loadTickets();
      if (stats) {
        getTicketStats().then(setStats);
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>, ticketId: number) => {
    e.stopPropagation();
    const newPriority = e.target.value as TicketPriority;
    try {
      await changeTicketPriority(ticketId, newPriority);
      await loadTickets();
      if (stats) {
        getTicketStats().then(setStats);
      }
    } catch (err) {
      console.error('Failed to change priority:', err);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTickets(new Set(tickets.map(t => t.id)));
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleSelectTicket = (e: React.ChangeEvent<HTMLInputElement>, ticketId: number) => {
    e.stopPropagation();
    const newSelected = new Set(selectedTickets);
    if (e.target.checked) {
      newSelected.add(ticketId);
    } else {
      newSelected.delete(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  // Contact form handlers
  const handleMarkAsProcessed = async (id: number) => {
    try {
      await adminContactService.markAsProcessed(id);
      await loadContactForms();
      adminContactService.getStats().then(setContactStats);
    } catch (err) {
      console.error('Failed to mark as processed:', err);
    }
  };

  const handleMarkAsUnprocessed = async (id: number) => {
    try {
      await adminContactService.markAsUnprocessed(id);
      await loadContactForms();
      adminContactService.getStats().then(setContactStats);
    } catch (err) {
      console.error('Failed to mark as unprocessed:', err);
    }
  };

  const handleDeleteContactForm = async (id: number) => {
    const confirmed = await confirm({
      title: 'Potvrdiť odstránenie',
      message: 'Naozaj chcete odstrániť tento kontaktný formulár?',
    });
    if (!confirmed) return;
    try {
      await adminContactService.deleteSubmission(id);
      await loadContactForms();
      adminContactService.getStats().then(setContactStats);
    } catch (err) {
      console.error('Failed to delete contact form:', err);
    }
  };

  // Main Navigation Tabs (Tickets vs Contact Forms)
  const navTabs = (
    <nav className="dashboard-tabs">
      <button
        className={`dashboard-tab ${mainTab === 'tickets' ? 'active' : ''}`}
        data-tab="tickets"
        onClick={() => setMainTab('tickets')}
        aria-label="View user tickets"
      >
        <MessageSquare size={16} style={{ marginRight: 6 }} />
        Tikety od používateľov
        {stats && <Badge variant="default" size="sm" style={{ marginLeft: 8 }}>{stats.totalTickets}</Badge>}
      </button>
      <button
        className={`dashboard-tab ${mainTab === 'contact-forms' ? 'active' : ''}`}
        data-tab="contact-forms"
        onClick={() => setMainTab('contact-forms')}
        aria-label="View contact form submissions"
      >
        <Mail size={16} style={{ marginRight: 6 }} />
        Kontaktné formuláre
        {contactStats && contactStats.unprocessed > 0 && (
          <Badge variant="warning" size="sm" style={{ marginLeft: 8 }}>{contactStats.unprocessed}</Badge>
        )}
      </button>
    </nav>
  );

  // Ticket Sub-Navigation Tabs
  const TicketSubTabs = (
    <nav className="dashboard-tabs" style={{ marginBottom: '1rem' }}>
      <button
        className={`dashboard-tab ${ticketTab === 'all' ? 'active' : ''}`}
        onClick={() => setTicketTab('all')}
      >
        Všetky
        {stats && <Badge variant="default" size="sm" style={{ marginLeft: 8 }}>{stats.totalTickets}</Badge>}
      </button>
      <button
        className={`dashboard-tab ${ticketTab === 'my' ? 'active' : ''}`}
        onClick={() => setTicketTab('my')}
      >
        Moje tikety
      </button>
      <button
        className={`dashboard-tab ${ticketTab === 'unassigned' ? 'active' : ''}`}
        onClick={() => setTicketTab('unassigned')}
      >
        Nepriradené
        {stats && stats.unassignedTickets > 0 && (
          <Badge variant="warning" size="sm" style={{ marginLeft: 8 }}>{stats.unassignedTickets}</Badge>
        )}
      </button>
      <button
        className={`dashboard-tab ${ticketTab === 'urgent' ? 'active' : ''}`}
        onClick={() => setTicketTab('urgent')}
      >
        Urgentné
        {stats && stats.urgentCount > 0 && (
          <Badge variant="danger" size="sm" style={{ marginLeft: 8 }}>{stats.urgentCount}</Badge>
        )}
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Podpora" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}

          {/* TICKETS TAB */}
          {mainTab === 'tickets' && (
          <>
            {/* Sub-navigation for tickets */}
            {TicketSubTabs}

            {/* Stats Cards */}
            {stats && (
              <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                  <div className="stat-value">{stats.openTickets}</div>
                  <div className="stat-label">Otvorené</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.inProgressTickets}</div>
                  <div className="stat-label">V riešení</div>
                </div>
                <div className="stat-card" style={{ borderColor: '#f59e0b' }}>
                  <div className="stat-value" style={{ color: '#f59e0b' }}>{stats.slaAtRiskCount}</div>
                  <div className="stat-label">SLA v ohrození</div>
                </div>
                <div className="stat-card" style={{ borderColor: '#ef4444' }}>
                  <div className="stat-value" style={{ color: '#ef4444' }}>{stats.slaBreachedCount}</div>
                  <div className="stat-label">SLA porušené</div>
                </div>
                <div className="stat-card" style={{ borderColor: '#10b981' }}>
                  <div className="stat-value" style={{ color: '#10b981' }}>{stats.ticketsResolvedToday}</div>
                  <div className="stat-label">Vyriešené dnes</div>
                </div>
                {stats.averageSatisfactionRating && (
                  <div className="stat-card">
                    <div className="stat-value">{stats.averageSatisfactionRating.toFixed(1)}</div>
                    <div className="stat-label">Spokojnosť</div>
                  </div>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="admin-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Hľadať tikety..."
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
                onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="">Všetky stavy</option>
                <option value="OPEN">Otvorený</option>
                <option value="IN_PROGRESS">V riešení</option>
                <option value="WAITING_CUSTOMER">Čaká na zákazníka</option>
                <option value="WAITING_INTERNAL">Čaká interne</option>
                <option value="RESOLVED">Vyriešený</option>
                <option value="CLOSED">Uzavretý</option>
              </select>
              <select
                className="form-input"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | '')}
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="">Všetky priority</option>
                <option value="URGENT">Urgentná</option>
                <option value="HIGH">Vysoká</option>
                <option value="NORMAL">Normálna</option>
                <option value="LOW">Nízka</option>
              </select>
              <select
                className="form-input"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}
                style={{ width: 'auto', minWidth: '150px' }}
              >
                <option value="">Všetky kategórie</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <Button variant="primary" onClick={() => navigate('/admin/tickets/new')}>
                <Plus size={16} style={{ marginRight: 4 }} />
                Nový tiket
              </Button>
            </div>

            {/* Mobile Card Layout */}
            <div className="mobile-table-cards">
              {loading ? (
                <div className="mobile-table-card">
                  <SkeletonTable rows={5} columns={4} />
                </div>
              ) : tickets.length === 0 ? (
                <div className="mobile-table-card">
                  <div className="table-empty">Žiadne tikety na zobrazenie</div>
                </div>
              ) : (
                tickets.map(ticket => (
                  <div key={`mobile-${ticket.id}`} className="mobile-table-card" onClick={() => handleTicketClick(ticket)}>
                    <div className="mobile-card-header">
                      <div>
                        <h4 className="mobile-card-title">{ticket.ticketNumber}</h4>
                        <p className="mobile-card-subtitle">{ticket.subject}</p>
                      </div>
                      <div className="mobile-card-actions" onClick={e => e.stopPropagation()}>
                        <Button variant="outline" size="sm" onClick={() => handleTicketClick(ticket)} title="Detail">
                          <Eye size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-field">
                        <span className="mobile-field-label">Zákazník:</span>
                        <span className="mobile-field-value">{ticket.customerName || ticket.customerEmail}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Priorita:</span>
                        <span className="mobile-field-value">
                          <Badge variant={ticket.priority === 'URGENT' ? 'danger' : ticket.priority === 'HIGH' ? 'warning' : 'default'} size="sm">
                            {getPriorityLabel(ticket.priority)}
                          </Badge>
                        </span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Stav:</span>
                        <span className="mobile-field-value">
                          <Badge variant={ticket.status === 'CLOSED' ? 'default' : ticket.status === 'RESOLVED' ? 'success' : 'info'} size="sm">
                            {getStatusLabel(ticket.status)}
                          </Badge>
                        </span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Vytvorené:</span>
                        <span className="mobile-field-value">{formatTimeAgo(ticket.createdAt)}</span>
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
                    <th style={{ width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedTickets.size === tickets.length && tickets.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Tiket</th>
                    <th>Zákazník</th>
                    <th>Kategória</th>
                    <th>Priorita</th>
                    <th>Stav</th>
                    <th>Priradené</th>
                    <th>Vytvorené</th>
                    <th style={{ width: 80 }} className="text-right">Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="table-empty">
                      <SkeletonTable rows={5} columns={9} />
                    </td></tr>
                  ) : tickets.length === 0 ? (
                    <tr><td colSpan={9} className="table-empty">Žiadne tikety na zobrazenie</td></tr>
                  ) : (
                    tickets.map(ticket => (
                      <tr
                        key={ticket.id}
                        onClick={() => handleTicketClick(ticket)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTickets.has(ticket.id)}
                            onChange={(e) => handleSelectTicket(e, ticket.id)}
                          />
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 500, color: '#6366f1' }}>{ticket.ticketNumber}</div>
                            <div style={{ fontSize: '13px', color: '#374151' }}>{ticket.subject}</div>
                            {ticket.messageCount > 0 && (
                              <Badge variant="default" size="sm" style={{ marginTop: 4 }}>{ticket.messageCount} správ</Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 500 }}>{ticket.customerName || 'Neznámy'}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{ticket.customerEmail}</div>
                          </div>
                        </td>
                        <td>
                          {ticket.categoryName && (
                            <Badge variant="default" size="sm">{ticket.categoryName}</Badge>
                          )}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className="form-input"
                            value={ticket.priority}
                            onChange={(e) => handlePriorityChange(e, ticket.id)}
                            style={{ width: 'auto', minWidth: '100px', padding: '4px 8px', fontSize: '13px', borderColor: getPriorityColor(ticket.priority) }}
                          >
                            <option value="LOW">{getPriorityLabel('LOW')}</option>
                            <option value="NORMAL">{getPriorityLabel('NORMAL')}</option>
                            <option value="HIGH">{getPriorityLabel('HIGH')}</option>
                            <option value="URGENT">{getPriorityLabel('URGENT')}</option>
                          </select>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className="form-input"
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(e, ticket.id)}
                            style={{ width: 'auto', minWidth: '120px', padding: '4px 8px', fontSize: '13px', borderColor: getStatusColor(ticket.status) }}
                          >
                            <option value="OPEN">{getStatusLabel('OPEN')}</option>
                            <option value="IN_PROGRESS">{getStatusLabel('IN_PROGRESS')}</option>
                            <option value="WAITING_CUSTOMER">{getStatusLabel('WAITING_CUSTOMER')}</option>
                            <option value="WAITING_INTERNAL">{getStatusLabel('WAITING_INTERNAL')}</option>
                            <option value="RESOLVED">{getStatusLabel('RESOLVED')}</option>
                            <option value="CLOSED">{getStatusLabel('CLOSED')}</option>
                          </select>
                        </td>
                        <td>
                          {ticket.assignedToName ? (
                            <span style={{ fontSize: '13px' }}>{ticket.assignedToName}</span>
                          ) : (
                            <Button variant="outline" size="sm" onClick={(e) => handleAssignToMe(e, ticket.id)}>
                              Priradiť mne
                            </Button>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>{formatTimeAgo(ticket.createdAt)}</span>
                        </td>
                        <td className="text-right" onClick={e => e.stopPropagation()}>
                          <div className="action-buttons">
                            <Button variant="outline" size="sm" onClick={() => handleTicketClick(ticket)} title="Detail">
                              <Eye size={14} />
                            </Button>
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
                  Zobrazené {tickets.length > 0 ? (page * pageSize + 1) : 0} - {Math.min((page + 1) * pageSize, totalElements)} z {totalElements} tiketov
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
          </>
          )}

          {/* CONTACT FORMS TAB */}
          {mainTab === 'contact-forms' && (
          <>
            {/* Stats Cards */}
            {contactStats && (
              <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                  <div className="stat-value">{contactStats.total}</div>
                  <div className="stat-label">Celkom</div>
                </div>
                <div className="stat-card" style={{ borderColor: '#f59e0b' }}>
                  <div className="stat-value" style={{ color: '#f59e0b' }}>{contactStats.unprocessed}</div>
                  <div className="stat-label">Nespracované</div>
                </div>
                <div className="stat-card" style={{ borderColor: '#10b981' }}>
                  <div className="stat-value" style={{ color: '#10b981' }}>{contactStats.processed}</div>
                  <div className="stat-label">Spracované</div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="admin-header-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
              <select
                className="form-input"
                value={contactProcessedFilter === undefined ? '' : contactProcessedFilter.toString()}
                onChange={(e) => setContactProcessedFilter(
                  e.target.value === '' ? undefined : e.target.value === 'true'
                )}
                style={{ width: 'auto', minWidth: '180px' }}
              >
                <option value="">Všetky</option>
                <option value="false">Nespracované</option>
                <option value="true">Spracované</option>
              </select>
            </div>

            {/* Mobile Card Layout */}
            <div className="mobile-table-cards">
              {loading ? (
                <div className="mobile-table-card">
                  <SkeletonTable rows={5} columns={4} />
                </div>
              ) : contactForms.length === 0 ? (
                <div className="mobile-table-card">
                  <div className="table-empty">Žiadne kontaktné formuláre na zobrazenie</div>
                </div>
              ) : (
                contactForms.map(form => (
                  <div key={`mobile-cf-${form.id}`} className="mobile-table-card">
                    <div className="mobile-card-header">
                      <div>
                        <h4 className="mobile-card-title">{form.subject}</h4>
                        <p className="mobile-card-subtitle">{form.email}</p>
                      </div>
                      <div className="mobile-card-actions">
                        {form.processed ? (
                          <Button variant="outline" size="sm" onClick={() => handleMarkAsUnprocessed(form.id)} title="Označiť ako nespracované">
                            <X size={14} />
                          </Button>
                        ) : (
                          <Button variant="primary" size="sm" onClick={() => handleMarkAsProcessed(form.id)} title="Označiť ako spracované">
                            <Check size={14} />
                          </Button>
                        )}
                        <Button variant="danger" size="sm" onClick={() => handleDeleteContactForm(form.id)} title="Odstrániť">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-field">
                        <span className="mobile-field-label">Správa:</span>
                        <span className="mobile-field-value">{form.text.length > 80 ? form.text.substring(0, 80) + '...' : form.text}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Dátum:</span>
                        <span className="mobile-field-value">{adminContactService.formatTimeAgo(form.createdAt)}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Stav:</span>
                        <span className="mobile-field-value">
                          <Badge variant={form.processed ? 'success' : 'warning'} size="sm">
                            {form.processed ? 'Spracované' : 'Nespracované'}
                          </Badge>
                        </span>
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
                    <th>Email</th>
                    <th>Predmet</th>
                    <th>Správa</th>
                    <th>Dátum</th>
                    <th>Stav</th>
                    <th style={{ width: 120 }} className="text-right">Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="table-empty">
                      <SkeletonTable rows={5} columns={6} />
                    </td></tr>
                  ) : contactForms.length === 0 ? (
                    <tr><td colSpan={6} className="table-empty">Žiadne kontaktné formuláre na zobrazenie</td></tr>
                  ) : (
                    contactForms.map(form => (
                      <tr key={form.id}>
                        <td>
                          <a href={`mailto:${form.email}`} style={{ color: '#6366f1', textDecoration: 'none' }}>{form.email}</a>
                        </td>
                        <td style={{ fontWeight: 500 }}>{form.subject}</td>
                        <td>
                          <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={form.text}>
                            {form.text.length > 100 ? form.text.substring(0, 100) + '...' : form.text}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>{adminContactService.formatTimeAgo(form.createdAt)}</span>
                        </td>
                        <td>
                          <Badge variant={form.processed ? 'success' : 'warning'} size="sm">
                            {form.processed ? 'Spracované' : 'Nespracované'}
                          </Badge>
                        </td>
                        <td className="text-right">
                          <div className="action-buttons">
                            {form.processed ? (
                              <Button variant="outline" size="sm" onClick={() => handleMarkAsUnprocessed(form.id)} title="Označiť ako nespracované">
                                <X size={14} />
                              </Button>
                            ) : (
                              <Button variant="primary" size="sm" onClick={() => handleMarkAsProcessed(form.id)} title="Označiť ako spracované">
                                <Check size={14} />
                              </Button>
                            )}
                            <Button variant="danger" size="sm" onClick={() => handleDeleteContactForm(form.id)} title="Odstrániť">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {contactTotalPages > 1 && (
              <div className="pagination-controls" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Zobrazené {contactForms.length > 0 ? (page * pageSize + 1) : 0} - {Math.min((page + 1) * pageSize, contactTotalElements)} z {contactTotalElements} formulárov
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
                    Strana {page + 1} z {contactTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= contactTotalPages - 1 || loading}
                  >
                    Ďalšia
                  </Button>
                </div>
              </div>
            )}
          </>
          )}
        </div>
      </div>

      {/* Accessible confirmation dialog */}
      <ConfirmDialog {...dialogProps} />
    </AdminLayout>
  );
};

export default AdminTickets;
