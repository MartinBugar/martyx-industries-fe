import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
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
import './AdminTickets.css';

type TabType = 'all' | 'my' | 'unassigned' | 'urgent';

const AdminTickets: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [stats, setStats] = useState<TicketStatsDto | null>(null);
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  // Selected tickets for bulk operations
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set());

  // Load categories on mount
  useEffect(() => {
    getActiveCategories().then(setCategories).catch(console.error);
  }, []);

  // Load stats
  useEffect(() => {
    getTicketStats().then(setStats).catch(console.error);
  }, []);

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
        if (activeTab === 'my') {
          // Use my-tickets endpoint instead
          result = await getMyTickets(page, pageSize);
        } else {
          if (activeTab === 'unassigned') {
            params.unassigned = true;
          } else if (activeTab === 'urgent') {
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
  }, [activeTab, statusFilter, priorityFilter, categoryFilter, searchQuery, page, pageSize]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [activeTab, statusFilter, priorityFilter, categoryFilter, searchQuery]);

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

  // Navigation Tabs
  const NavTabs = (
    <nav className="tickets-nav-tabs">
      <button
        className={`nav-tab ${activeTab === 'all' ? 'active' : ''}`}
        onClick={() => setActiveTab('all')}
      >
        Všetky
        {stats && <span className="tab-count">{stats.totalTickets}</span>}
      </button>
      <button
        className={`nav-tab ${activeTab === 'my' ? 'active' : ''}`}
        onClick={() => setActiveTab('my')}
      >
        Moje tikety
      </button>
      <button
        className={`nav-tab ${activeTab === 'unassigned' ? 'active' : ''}`}
        onClick={() => setActiveTab('unassigned')}
      >
        Nepriradené
        {stats && stats.unassignedTickets > 0 && (
          <span className="tab-count warning">{stats.unassignedTickets}</span>
        )}
      </button>
      <button
        className={`nav-tab ${activeTab === 'urgent' ? 'active' : ''}`}
        onClick={() => setActiveTab('urgent')}
      >
        Urgentné
        {stats && stats.urgentCount > 0 && (
          <span className="tab-count danger">{stats.urgentCount}</span>
        )}
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Tikety" navTabs={NavTabs}>
      <div className="admin-tickets">
        {/* Stats Cards */}
        {stats && (
          <div className="tickets-stats">
            <div className="stat-card">
              <div className="stat-value">{stats.openTickets}</div>
              <div className="stat-label">Otvorené</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.inProgressTickets}</div>
              <div className="stat-label">V riešení</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-value">{stats.slaAtRiskCount}</div>
              <div className="stat-label">SLA v ohrození</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-value">{stats.slaBreachedCount}</div>
              <div className="stat-label">SLA porušené</div>
            </div>
            <div className="stat-card success">
              <div className="stat-value">{stats.ticketsResolvedToday}</div>
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
        <div className="tickets-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Hľadať tikety..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatus | '')}
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
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | '')}
            >
              <option value="">Všetky priority</option>
              <option value="URGENT">Urgentná</option>
              <option value="HIGH">Vysoká</option>
              <option value="NORMAL">Normálna</option>
              <option value="LOW">Nízka</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Všetky kategórie</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/admin/tickets/new')}
          >
            + Nový tiket
          </button>
        </div>

        {/* Error */}
        {error && <div className="tickets-error">{error}</div>}

        {/* Loading */}
        {loading && <div className="tickets-loading">Načítava sa...</div>}

        {/* Tickets Table */}
        {!loading && (
          <>
            <div className="tickets-table-wrapper">
              <table className="tickets-table">
                <thead>
                  <tr>
                    <th className="checkbox-col">
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
                    <th>Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-row">
                        Žiadne tikety na zobrazenie
                      </td>
                    </tr>
                  ) : (
                    tickets.map(ticket => (
                      <tr
                        key={ticket.id}
                        onClick={() => handleTicketClick(ticket)}
                        className="ticket-row"
                      >
                        <td className="checkbox-col" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedTickets.has(ticket.id)}
                            onChange={(e) => handleSelectTicket(e, ticket.id)}
                          />
                        </td>
                        <td className="ticket-info">
                          <div className="ticket-number">{ticket.ticketNumber}</div>
                          <div className="ticket-subject">{ticket.subject}</div>
                          {ticket.messageCount > 0 && (
                            <span className="message-count">{ticket.messageCount} správ</span>
                          )}
                        </td>
                        <td className="customer-info">
                          <div className="customer-name">
                            {ticket.customerName || 'Neznámy'}
                          </div>
                          <div className="customer-email">
                            {ticket.customerEmail}
                          </div>
                        </td>
                        <td>
                          {ticket.categoryName && (
                            <span className="category-badge">{ticket.categoryName}</span>
                          )}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className="priority-select"
                            value={ticket.priority}
                            onChange={(e) => handlePriorityChange(e, ticket.id)}
                            style={{ borderColor: getPriorityColor(ticket.priority) }}
                          >
                            <option value="LOW">{getPriorityLabel('LOW')}</option>
                            <option value="NORMAL">{getPriorityLabel('NORMAL')}</option>
                            <option value="HIGH">{getPriorityLabel('HIGH')}</option>
                            <option value="URGENT">{getPriorityLabel('URGENT')}</option>
                          </select>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className="status-select"
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(e, ticket.id)}
                            style={{ borderColor: getStatusColor(ticket.status) }}
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
                            <span className="assigned-name">{ticket.assignedToName}</span>
                          ) : (
                            <button
                              className="btn-assign"
                              onClick={(e) => handleAssignToMe(e, ticket.id)}
                            >
                              Priradiť mne
                            </button>
                          )}
                        </td>
                        <td className="date-col">
                          <div className="time-ago">{formatTimeAgo(ticket.createdAt)}</div>
                        </td>
                        <td className="actions-col" onClick={e => e.stopPropagation()}>
                          <button
                            className="btn-icon"
                            title="Otvoriť detail"
                            onClick={() => handleTicketClick(ticket)}
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="tickets-pagination">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  Predch.
                </button>
                <span>
                  Strana {page + 1} z {totalPages} ({totalElements} tiketov)
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
      </div>
    </AdminLayout>
  );
};

export default AdminTickets;
