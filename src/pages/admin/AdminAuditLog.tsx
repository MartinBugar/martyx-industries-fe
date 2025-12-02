/**
 * Admin Audit Log Page
 * Displays and filters admin operation audit logs
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  X,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  getAuditLogs,
  searchAuditLogs,
  getAuditLogById,
  getAuditStats,
  getEntityTypes,
  getActions,
  getActionColor,
  formatTimestamp,
  formatRelativeTime,
} from '../../services/adminAuditService';
import type {
  AuditLog,
  AuditAction,
  AuditStats,
  ActionOption,
  AuditLogFilters,
} from '../../services/adminAuditService';
import './AdminAuditLog.css';

const AdminAuditLog: React.FC = () => {
  const { t } = useTranslation();

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction | ''>('');
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [selectedSuccess, setSelectedSuccess] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Options
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [actions, setActions] = useState<ActionOption[]>([]);

  // Stats modal
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [entityTypesData, actionsData] = await Promise.all([
          getEntityTypes(),
          getActions(),
        ]);
        setEntityTypes(entityTypesData);
        setActions(actionsData);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadOptions();
  }, []);

  // Load logs
  const loadLogs = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);

      let response;
      if (searchQuery.trim()) {
        response = await searchAuditLogs(searchQuery, currentPage, pageSize);
      } else {
        const filters: AuditLogFilters = {
          page: currentPage,
          size: pageSize,
        };
        if (selectedAction) filters.action = selectedAction;
        if (selectedEntityType) filters.entityType = selectedEntityType;
        if (selectedSuccess !== '') filters.success = selectedSuccess === 'true';
        if (startDate) filters.startDate = new Date(startDate).toISOString();
        if (endDate) filters.endDate = new Date(endDate).toISOString();

        response = await getAuditLogs(filters);
      }

      if (signal?.aborted) return;

      setLogs(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      if (signal?.aborted) return;
      console.error('Failed to load audit logs:', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, selectedAction, selectedEntityType, selectedSuccess, startDate, endDate]);

  useEffect(() => {
    const abortController = new AbortController();
    loadLogs(abortController.signal);
    return () => abortController.abort();
  }, [loadLogs]);

  // Load stats
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const statsData = await getAuditStats(
        startDate ? new Date(startDate).toISOString() : undefined,
        endDate ? new Date(endDate).toISOString() : undefined
      );
      setStats(statsData);
      setShowStats(true);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // View log detail
  const viewLogDetail = async (log: AuditLog) => {
    try {
      const fullLog = await getAuditLogById(log.id);
      setSelectedLog(fullLog);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to load log detail:', error);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAction('');
    setSelectedEntityType('');
    setSelectedSuccess('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(0);
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadLogs();
  };

  const hasActiveFilters = selectedAction || selectedEntityType || selectedSuccess !== '' || startDate || endDate;

  return (
    <div className="admin-audit-log">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>{t('admin.auditLog.title', 'Audit Log')}</h1>
          <p>{t('admin.auditLog.description', 'Track all admin panel operations')}</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            {t('admin.auditLog.filters', 'Filters')}
            {hasActiveFilters && <span className="filter-badge" />}
          </button>
          <button
            className="btn btn-secondary"
            onClick={loadStats}
            disabled={loadingStats}
          >
            <BarChart3 size={18} />
            {t('admin.auditLog.stats', 'Statistics')}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => loadLogs()}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form className="search-bar" onSubmit={handleSearch}>
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            placeholder={t('admin.auditLog.searchPlaceholder', 'Search by user, entity name...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(0);
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>{t('admin.auditLog.action', 'Action')}</label>
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value as AuditAction | '');
                  setCurrentPage(0);
                }}
              >
                <option value="">{t('admin.auditLog.allActions', 'All actions')}</option>
                {actions.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{t('admin.auditLog.entityType', 'Entity Type')}</label>
              <select
                value={selectedEntityType}
                onChange={(e) => {
                  setSelectedEntityType(e.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="">{t('admin.auditLog.allTypes', 'All types')}</option>
                {entityTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>{t('admin.auditLog.status', 'Status')}</label>
              <select
                value={selectedSuccess}
                onChange={(e) => {
                  setSelectedSuccess(e.target.value);
                  setCurrentPage(0);
                }}
              >
                <option value="">{t('admin.auditLog.allStatus', 'All')}</option>
                <option value="true">{t('admin.auditLog.success', 'Success')}</option>
                <option value="false">{t('admin.auditLog.failed', 'Failed')}</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t('admin.auditLog.startDate', 'Start Date')}</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>

            <div className="filter-group">
              <label>{t('admin.auditLog.endDate', 'End Date')}</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(0);
                }}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button className="btn btn-secondary btn-sm" onClick={resetFilters}>
              <X size={16} />
              {t('admin.auditLog.clearFilters', 'Clear filters')}
            </button>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="results-summary">
        <span>
          {t('admin.auditLog.showing', 'Showing')} {logs.length} {t('admin.auditLog.of', 'of')} {totalElements} {t('admin.auditLog.entries', 'entries')}
        </span>
      </div>

      {/* Log List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <p>{t('admin.auditLog.loading', 'Loading audit logs...')}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <Activity size={48} />
          <h3>{t('admin.auditLog.noLogs', 'No audit logs found')}</h3>
          <p>{t('admin.auditLog.noLogsDescription', 'Try adjusting your filters')}</p>
        </div>
      ) : (
        <div className="logs-list">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`log-item ${!log.success ? 'failed' : ''}`}
              onClick={() => viewLogDetail(log)}
            >
              <div className="log-icon">
                {log.success ? (
                  <CheckCircle size={20} style={{ color: getActionColor(log.action) }} />
                ) : (
                  <XCircle size={20} style={{ color: '#ef4444' }} />
                )}
              </div>

              <div className="log-content">
                <div className="log-header">
                  <span
                    className="action-badge"
                    style={{ backgroundColor: `${getActionColor(log.action)}20`, color: getActionColor(log.action) }}
                  >
                    {log.actionDisplayName}
                  </span>
                  <span className="entity-type">{log.entityType}</span>
                  {log.entityName && (
                    <span className="entity-name">"{log.entityName}"</span>
                  )}
                </div>

                <div className="log-meta">
                  <span className="meta-item">
                    <Clock size={14} />
                    {formatRelativeTime(log.timestamp)}
                  </span>
                  {log.userName && (
                    <span className="meta-item">
                      <User size={14} />
                      {log.userName}
                    </span>
                  )}
                  {log.changesSummary && (
                    <span className="meta-item summary">
                      {log.changesSummary}
                    </span>
                  )}
                </div>

                {!log.success && log.errorMessage && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {log.errorMessage}
                  </div>
                )}
              </div>

              <button className="btn-icon view-btn">
                <Eye size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft size={18} />
            {t('admin.auditLog.previous', 'Previous')}
          </button>
          <span className="page-info">
            {t('admin.auditLog.page', 'Page')} {currentPage + 1} {t('admin.auditLog.of', 'of')} {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            {t('admin.auditLog.next', 'Next')}
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedLog && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.auditLog.logDetail', 'Log Detail')}</h3>
              <button className="btn-icon" onClick={() => setShowDetail(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="detail-content">
              <div className="detail-section">
                <h4>{t('admin.auditLog.basicInfo', 'Basic Information')}</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('admin.auditLog.action', 'Action')}</label>
                    <span
                      className="action-badge"
                      style={{ backgroundColor: `${getActionColor(selectedLog.action)}20`, color: getActionColor(selectedLog.action) }}
                    >
                      {selectedLog.actionDisplayName}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.auditLog.entityType', 'Entity Type')}</label>
                    <span>{selectedLog.entityType}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.auditLog.entityId', 'Entity ID')}</label>
                    <span>{selectedLog.entityId || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.auditLog.entityName', 'Entity Name')}</label>
                    <span>{selectedLog.entityName || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.auditLog.timestamp', 'Timestamp')}</label>
                    <span>{formatTimestamp(selectedLog.timestamp)}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.auditLog.status', 'Status')}</label>
                    <span className={selectedLog.success ? 'status-success' : 'status-failed'}>
                      {selectedLog.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>{t('admin.auditLog.userInfo', 'User Information')}</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('admin.auditLog.userName', 'Name')}</label>
                    <span>{selectedLog.userName || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.auditLog.userEmail', 'Email')}</label>
                    <span>{selectedLog.userEmail || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.auditLog.ipAddress', 'IP Address')}</label>
                    <span>{selectedLog.ipAddress || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>{t('admin.auditLog.requestInfo', 'Request Information')}</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>{t('admin.auditLog.method', 'Method')}</label>
                    <span>{selectedLog.requestMethod || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.auditLog.path', 'Path')}</label>
                    <span>{selectedLog.requestPath || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>{t('admin.auditLog.duration', 'Duration')}</label>
                    <span>{selectedLog.durationMs ? `${selectedLog.durationMs}ms` : '-'}</span>
                  </div>
                </div>
              </div>

              {selectedLog.changesSummary && (
                <div className="detail-section">
                  <h4>{t('admin.auditLog.changesSummary', 'Changes Summary')}</h4>
                  <p className="changes-summary">{selectedLog.changesSummary}</p>
                </div>
              )}

              {selectedLog.oldValue && (
                <div className="detail-section">
                  <h4>{t('admin.auditLog.oldValue', 'Previous Value')}</h4>
                  <pre className="json-display">{JSON.stringify(selectedLog.oldValue, null, 2)}</pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div className="detail-section">
                  <h4>{t('admin.auditLog.newValue', 'New Value')}</h4>
                  <pre className="json-display">{JSON.stringify(selectedLog.newValue, null, 2)}</pre>
                </div>
              )}

              {!selectedLog.success && selectedLog.errorMessage && (
                <div className="detail-section error">
                  <h4>{t('admin.auditLog.errorMessage', 'Error Message')}</h4>
                  <p className="error-text">{selectedLog.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && stats && (
        <div className="modal-overlay" onClick={() => setShowStats(false)}>
          <div className="modal-content stats-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.auditLog.statistics', 'Statistics')}</h3>
              <button className="btn-icon" onClick={() => setShowStats(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="stats-content">
              <div className="stats-summary">
                <div className="stat-card">
                  <div className="stat-value">{stats.totalLogs}</div>
                  <div className="stat-label">{t('admin.auditLog.totalLogs', 'Total Logs')}</div>
                </div>
                <div className="stat-card success">
                  <div className="stat-value">{stats.successfulOperations}</div>
                  <div className="stat-label">{t('admin.auditLog.successful', 'Successful')}</div>
                </div>
                <div className="stat-card failed">
                  <div className="stat-value">{stats.failedOperations}</div>
                  <div className="stat-label">{t('admin.auditLog.failedOps', 'Failed')}</div>
                </div>
              </div>

              <div className="stats-section">
                <h4>{t('admin.auditLog.byAction', 'By Action')}</h4>
                <div className="stats-bars">
                  {Object.entries(stats.actionCounts).map(([action, count]) => (
                    <div key={action} className="stat-bar">
                      <div className="bar-label">{action}</div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(count / stats.totalLogs) * 100}%`,
                            backgroundColor: getActionColor(action as AuditAction),
                          }}
                        />
                      </div>
                      <div className="bar-value">{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stats-section">
                <h4>{t('admin.auditLog.byEntityType', 'By Entity Type')}</h4>
                <div className="stats-bars">
                  {Object.entries(stats.entityTypeCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([type, count]) => (
                      <div key={type} className="stat-bar">
                        <div className="bar-label">{type}</div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ width: `${(count / stats.totalLogs) * 100}%` }}
                          />
                        </div>
                        <div className="bar-value">{count}</div>
                      </div>
                    ))}
                </div>
              </div>

              {stats.topUsers.length > 0 && (
                <div className="stats-section">
                  <h4>{t('admin.auditLog.topUsers', 'Top Users')}</h4>
                  <div className="top-users">
                    {stats.topUsers.map((user, index) => (
                      <div key={user.userId} className="top-user">
                        <span className="rank">#{index + 1}</span>
                        <span className="name">{user.userName || user.userEmail}</span>
                        <span className="count">{user.activityCount} actions</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLog;
