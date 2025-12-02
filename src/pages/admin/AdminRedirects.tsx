/**
 * Admin Redirects Page
 * Správa URL presmerovaní (301/302)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import {
  getAllRedirects,
  filterRedirects,
  searchRedirects,
  createRedirect,
  updateRedirect,
  deleteRedirect,
  toggleRedirectActive,
  getRedirectStats,
  validateLoop,
  type RedirectDto,
  type RedirectRequest,
  type RedirectStatsDto,
  formatDate,
  getRedirectTypeLabel
} from '../../services/adminSeoService';
import {
  ArrowRight,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Check,
  ExternalLink,
  Filter,
  Activity,
  Link2
} from 'lucide-react';
import './AdminRedirects.css';

const AdminRedirects: React.FC = () => {
  const navigate = useNavigate();
  const [redirects, setRedirects] = useState<RedirectDto[]>([]);
  const [stats, setStats] = useState<RedirectStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<RedirectDto | null>(null);
  const [formData, setFormData] = useState<RedirectRequest>({
    sourceUrl: '',
    targetUrl: '',
    redirectType: 'PERMANENT',
    active: true,
    note: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadRedirects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;

      if (searchQuery) {
        response = await searchRedirects(searchQuery, page, pageSize);
      } else if (activeFilter || typeFilter) {
        const active = activeFilter === 'true' ? true : activeFilter === 'false' ? false : undefined;
        response = await filterRedirects(active, typeFilter || undefined, page, pageSize);
      } else {
        response = await getAllRedirects(page, pageSize);
      }

      setRedirects(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Failed to load redirects:', err);
      setError('Nepodarilo sa načítať presmerovania');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, activeFilter, typeFilter]);

  const loadStats = useCallback(async () => {
    try {
      const data = await getRedirectStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }, []);

  useEffect(() => {
    loadRedirects();
  }, [loadRedirects]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleRefresh = () => {
    loadRedirects();
    loadStats();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadRedirects();
  };

  const handleOpenModal = (redirect?: RedirectDto) => {
    if (redirect) {
      setEditingRedirect(redirect);
      setFormData({
        sourceUrl: redirect.sourceUrl,
        targetUrl: redirect.targetUrl,
        redirectType: redirect.redirectType,
        active: redirect.active,
        note: redirect.note || ''
      });
    } else {
      setEditingRedirect(null);
      setFormData({
        sourceUrl: '',
        targetUrl: '',
        redirectType: 'PERMANENT',
        active: true,
        note: ''
      });
    }
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRedirect(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      // Validate loop
      const loopCheck = await validateLoop(formData.sourceUrl, formData.targetUrl);
      if (!loopCheck.valid) {
        setFormError(loopCheck.error || 'Toto presmerovanie by vytvorilo slučku');
        setFormLoading(false);
        return;
      }

      if (editingRedirect) {
        await updateRedirect(editingRedirect.id, formData);
      } else {
        await createRedirect(formData);
      }

      handleCloseModal();
      handleRefresh();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error.response?.data?.message || 'Nepodarilo sa uložiť presmerovanie');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (redirect: RedirectDto) => {
    setActionLoading(redirect.id);
    try {
      await toggleRedirectActive(redirect.id);
      loadRedirects();
      loadStats();
    } catch (err) {
      console.error('Failed to toggle redirect:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    setActionLoading(id);
    try {
      await deleteRedirect(id);
      setDeleteConfirm(null);
      loadRedirects();
      loadStats();
    } catch (err) {
      console.error('Failed to delete redirect:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.totalRedirects}</div>
          <div className="stat-label">Celkom</div>
        </div>
        <div className="stat-card active">
          <div className="stat-value">{stats.activeRedirects}</div>
          <div className="stat-label">Aktívnych</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.permanentRedirects}</div>
          <div className="stat-label">301 (Trvalých)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.temporaryRedirects}</div>
          <div className="stat-label">302 (Dočasných)</div>
        </div>
        <div className="stat-card hits">
          <div className="stat-value">{stats.totalHits.toLocaleString()}</div>
          <div className="stat-label">Celkových prechodov</div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="admin-redirects">
        <div className="page-header">
          <div className="header-left">
            <Link2 size={28} />
            <div>
              <h1>URL Presmerovania</h1>
              <p>Správa 301/302 presmerovaní</p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="btn-secondary"
              onClick={() => navigate('/admin/seo')}
            >
              <ArrowRight size={20} />
              SEO Audit
            </button>
            <button className="btn-refresh" onClick={handleRefresh} disabled={loading}>
              <RefreshCw size={20} className={loading ? 'spinning' : ''} />
            </button>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={20} />
              Nové presmerovanie
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={20} />
            {error}
            <button onClick={handleRefresh}>Skúsiť znova</button>
          </div>
        )}

        {renderStats()}

        {/* Filters */}
        <div className="filters-bar">
          <form className="search-form" onSubmit={handleSearch}>
            <Search size={20} />
            <input
              type="text"
              placeholder="Hľadať URL alebo poznámku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="clear-btn" onClick={() => { setSearchQuery(''); setPage(0); }}>
                <X size={16} />
              </button>
            )}
          </form>

          <div className="filter-group">
            <Filter size={18} />
            <select
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(0); }}
            >
              <option value="">Všetky stavy</option>
              <option value="true">Aktívne</option>
              <option value="false">Neaktívne</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            >
              <option value="">Všetky typy</option>
              <option value="PERMANENT">301 (Trvalé)</option>
              <option value="TEMPORARY">302 (Dočasné)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={32} className="spinning" />
            <p>Načítavam...</p>
          </div>
        ) : redirects.length === 0 ? (
          <div className="empty-state">
            <Link2 size={48} />
            <h3>Žiadne presmerovania</h3>
            <p>Zatiaľ nemáte vytvorené žiadne URL presmerovania</p>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={20} />
              Vytvoriť prvé presmerovanie
            </button>
          </div>
        ) : (
          <>
            <div className="redirects-table">
              <table>
                <thead>
                  <tr>
                    <th>Stav</th>
                    <th>Zdrojová URL</th>
                    <th>Cieľová URL</th>
                    <th>Typ</th>
                    <th>Prechody</th>
                    <th>Posledný</th>
                    <th>Poznámka</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {redirects.map((redirect) => (
                    <tr key={redirect.id} className={!redirect.active ? 'inactive' : ''}>
                      <td>
                        <button
                          className={`toggle-btn ${redirect.active ? 'active' : ''}`}
                          onClick={() => handleToggleActive(redirect)}
                          disabled={actionLoading === redirect.id}
                          title={redirect.active ? 'Deaktivovať' : 'Aktivovať'}
                        >
                          {redirect.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                      </td>
                      <td className="url-cell">
                        <code>{redirect.sourceUrl}</code>
                      </td>
                      <td className="url-cell">
                        <code>{redirect.targetUrl}</code>
                        {redirect.targetUrl.startsWith('http') && (
                          <a
                            href={redirect.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </td>
                      <td>
                        <span className={`type-badge ${redirect.redirectType.toLowerCase()}`}>
                          {getRedirectTypeLabel(redirect.redirectType)}
                        </span>
                      </td>
                      <td className="hits-cell">
                        <Activity size={14} />
                        {redirect.hitCount.toLocaleString()}
                      </td>
                      <td className="date-cell">
                        {redirect.lastHitAt ? formatDate(redirect.lastHitAt) : '-'}
                      </td>
                      <td className="note-cell">{redirect.note || '-'}</td>
                      <td className="actions-cell">
                        <button
                          className="btn-action"
                          onClick={() => handleOpenModal(redirect)}
                          title="Upraviť"
                        >
                          <Edit size={16} />
                        </button>
                        {deleteConfirm === redirect.id ? (
                          <div className="delete-confirm">
                            <button
                              className="btn-confirm"
                              onClick={() => handleDelete(redirect.id)}
                              disabled={actionLoading === redirect.id}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className="btn-cancel"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn-action delete"
                            onClick={() => setDeleteConfirm(redirect.id)}
                            title="Zmazať"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Zobrazených {redirects.length} z {totalElements} presmerovaní
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="pagination-pages">
                  Strana {page + 1} z {Math.max(1, totalPages)}
                </span>
                <button
                  className="pagination-btn"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingRedirect ? 'Upraviť presmerovanie' : 'Nové presmerovanie'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                {formError && (
                  <div className="form-error">
                    <AlertTriangle size={18} />
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label>Zdrojová URL *</label>
                  <input
                    type="text"
                    value={formData.sourceUrl}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    placeholder="/stara-stranka"
                    required
                  />
                  <span className="help-text">URL cesta, ktorá bude presmerovaná (napr. /stara-url)</span>
                </div>

                <div className="form-group">
                  <label>Cieľová URL *</label>
                  <input
                    type="text"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    placeholder="/nova-stranka alebo https://example.com"
                    required
                  />
                  <span className="help-text">Kam má byť návštevník presmerovaný</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Typ presmerovania</label>
                    <select
                      value={formData.redirectType}
                      onChange={(e) => setFormData({ ...formData, redirectType: e.target.value })}
                    >
                      <option value="PERMANENT">301 - Trvalé presmerovanie</option>
                      <option value="TEMPORARY">302 - Dočasné presmerovanie</option>
                    </select>
                    <span className="help-text">301 pre trvalé zmeny, 302 pre dočasné</span>
                  </div>

                  <div className="form-group">
                    <label>Stav</label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      />
                      <span>Aktívne presmerovanie</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Poznámka</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Interná poznámka pre admina..."
                    rows={3}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                    Zrušiť
                  </button>
                  <button type="submit" className="btn-primary" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <RefreshCw size={18} className="spinning" />
                        Ukladám...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        {editingRedirect ? 'Uložiť zmeny' : 'Vytvoriť'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRedirects;
