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
import AdminLayout from './AdminLayout';
import { Button, Badge, SkeletonTable } from '../../components/ui';
import { logError } from '../../services/logger';
import './AdminUsers.css';
import './AdminButtonOverrides.css';
import './AdminAuditLog.css';

const AdminAuditLog: React.FC = () => {
  const { t } = useTranslation();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction | ''>('');
  const [selectedEntityType, setSelectedEntityType] = useState('');
  const [selectedSuccess, setSelectedSuccess] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [actions, setActions] = useState<ActionOption[]>([]);

  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetail, setShowDetail] = useState(false);

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
        logError('Failed to load filter options:', error);
      }
    };
    loadOptions();
  }, []);

  const loadLogs = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);

      let response;
      if (searchQuery.trim()) {
        response = await searchAuditLogs(searchQuery, currentPage, pageSize);
      } else {
        const filters: AuditLogFilters = { page: currentPage, size: pageSize };
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
      logError('Failed to load audit logs:', error);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, selectedAction, selectedEntityType, selectedSuccess, startDate, endDate]);

  useEffect(() => {
    const abortController = new AbortController();
    loadLogs(abortController.signal);
    return () => abortController.abort();
  }, [loadLogs]);

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
      logError('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const viewLogDetail = async (log: AuditLog) => {
    try {
      const fullLog = await getAuditLogById(log.id);
      setSelectedLog(fullLog);
      setShowDetail(true);
    } catch (error) {
      logError('Failed to load log detail:', error);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAction('');
    setSelectedEntityType('');
    setSelectedSuccess('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(0);
    loadLogs();
  };

  const hasActiveFilters = selectedAction || selectedEntityType || selectedSuccess !== '' || startDate || endDate;

  return (
    <AdminLayout title="Audit Log">
      <div className="admin-page">
        <div className="admin-container">
          {/* Header */}
          <div className="admin-card admin-audit-card-header">
            <div className="admin-audit-header-flex">
              <div>
                <h2 className="section-title admin-audit-section-title">
                  <Activity size={24} className="admin-audit-section-title-icon" />
                  {t('admin.auditLog.title', 'Audit Log')}
                </h2>
                <p className="admin-audit-section-desc">
                  {t('admin.auditLog.description', 'Track all admin panel operations')}
                </p>
              </div>
              <div className="admin-audit-header-buttons">
                <Button
                  variant={showFilters ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} />
                  Filters
                  {hasActiveFilters && <span className="admin-audit-filter-dot" />}
                </Button>
                <Button variant="outline" size="sm" onClick={loadStats} disabled={loadingStats} loading={loadingStats}>
                  <BarChart3 size={16} />
                  Stats
                </Button>
                <Button variant="outline" size="sm" onClick={() => loadLogs()} disabled={loading}>
                  <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                </Button>
              </div>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="admin-audit-search-form">
            <div className="admin-audit-search-wrapper">
              <Search size={18} className="admin-audit-search-icon" />
              <input
                type="text"
                placeholder={t('admin.auditLog.searchPlaceholder', 'Search by user, entity name...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`form-input ${searchQuery ? 'admin-audit-search-input-with-clear' : 'admin-audit-search-input'}`}
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); setCurrentPage(0); }} className="admin-audit-clear-btn">
                  <X size={16} />
                </button>
              )}
            </div>
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="admin-card admin-audit-card-filters">
              <div className="form-grid admin-audit-filters-grid">
                <div>
                  <label className="form-label">Action</label>
                  <select value={selectedAction} onChange={(e) => { setSelectedAction(e.target.value as AuditAction | ''); setCurrentPage(0); }} className="form-input">
                    <option value="">All actions</option>
                    {actions.map((action) => (
                      <option key={action.value} value={action.value}>{action.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Entity Type</label>
                  <select value={selectedEntityType} onChange={(e) => { setSelectedEntityType(e.target.value); setCurrentPage(0); }} className="form-input">
                    <option value="">All types</option>
                    {entityTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select value={selectedSuccess} onChange={(e) => { setSelectedSuccess(e.target.value); setCurrentPage(0); }} className="form-input">
                    <option value="">All</option>
                    <option value="true">Success</option>
                    <option value="false">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Start Date</label>
                  <input type="datetime-local" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(0); }} className="form-input" />
                </div>
                <div>
                  <label className="form-label">End Date</label>
                  <input type="datetime-local" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(0); }} className="form-input" />
                </div>
              </div>
              {hasActiveFilters && (
                <div className="admin-audit-filters-actions">
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    <X size={14} />
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          <div className="admin-audit-results-count">
            Showing {logs.length} of {totalElements} entries
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="admin-card">
              <SkeletonTable rows={8} columns={4} />
            </div>
          ) : logs.length === 0 ? (
            <div className="admin-card admin-audit-empty-state">
              <Activity size={48} className="admin-audit-empty-icon" />
              <h3 className="admin-audit-empty-title">No audit logs found</h3>
              <p className="admin-audit-empty-desc">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="admin-card admin-audit-logs-card">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => viewLogDetail(log)}
                  className={`admin-audit-log-item ${!log.success ? 'admin-audit-log-item-failed' : ''}`}
                >
                  <div className="admin-audit-log-icon">
                    {log.success ? (
                      <CheckCircle size={20} style={{ color: getActionColor(log.action) }} />
                    ) : (
                      <XCircle size={20} style={{ color: 'var(--admin-error)' }} />
                    )}
                  </div>

                  <div className="admin-audit-log-content">
                    <div className="admin-audit-log-header">
                      <Badge variant="secondary" size="sm" style={{ backgroundColor: `${getActionColor(log.action)}20`, color: getActionColor(log.action), border: 'none' }}>
                        {log.actionDisplayName}
                      </Badge>
                      <span className="admin-audit-log-entity-type">{log.entityType}</span>
                      {log.entityName && (
                        <span className="admin-audit-log-entity-name">"{log.entityName}"</span>
                      )}
                    </div>
                    <div className="admin-audit-log-meta">
                      <span className="admin-audit-log-meta-item">
                        <Clock size={12} />
                        {formatRelativeTime(log.timestamp)}
                      </span>
                      {log.userName && (
                        <span className="admin-audit-log-meta-item">
                          <User size={12} />
                          {log.userName}
                        </span>
                      )}
                    </div>
                    {!log.success && log.errorMessage && (
                      <div className="admin-audit-log-error">
                        <AlertCircle size={12} />
                        {log.errorMessage}
                      </div>
                    )}
                  </div>

                  <Button variant="outline" size="sm">
                    <Eye size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-audit-pagination">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}>
                <ChevronLeft size={16} />
                Previous
              </Button>
              <span className="admin-audit-pagination-text">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>
                Next
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedLog && (
        <div className="admin-audit-modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="admin-card admin-audit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-audit-modal-header">
              <h3 className="admin-audit-modal-title">Log Detail</h3>
              <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>
                <X size={14} />
              </Button>
            </div>

            <div className="admin-audit-detail-grid">
              <div>
                <div className="admin-audit-detail-label">Action</div>
                <Badge variant="secondary" size="sm" style={{ backgroundColor: `${getActionColor(selectedLog.action)}20`, color: getActionColor(selectedLog.action), border: 'none' }}>
                  {selectedLog.actionDisplayName}
                </Badge>
              </div>
              <div>
                <div className="admin-audit-detail-label">Status</div>
                <Badge variant={selectedLog.success ? 'success' : 'danger'} size="sm">
                  {selectedLog.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
              <div>
                <div className="admin-audit-detail-label">Entity Type</div>
                <div className="admin-audit-detail-value">{selectedLog.entityType}</div>
              </div>
              <div>
                <div className="admin-audit-detail-label">Entity ID</div>
                <div className="admin-audit-detail-value">{selectedLog.entityId || '-'}</div>
              </div>
              <div>
                <div className="admin-audit-detail-label">Entity Name</div>
                <div className="admin-audit-detail-value">{selectedLog.entityName || '-'}</div>
              </div>
              <div>
                <div className="admin-audit-detail-label">Timestamp</div>
                <div className="admin-audit-detail-value">{formatTimestamp(selectedLog.timestamp)}</div>
              </div>
              <div>
                <div className="admin-audit-detail-label">User</div>
                <div className="admin-audit-detail-value">{selectedLog.userName || '-'}</div>
              </div>
              <div>
                <div className="admin-audit-detail-label">IP Address</div>
                <div className="admin-audit-detail-value">{selectedLog.ipAddress || '-'}</div>
              </div>
            </div>

            {selectedLog.changesSummary && (
              <div className="admin-audit-changes-summary">
                <div className="admin-audit-detail-label">Changes Summary</div>
                <div>{selectedLog.changesSummary}</div>
              </div>
            )}

            {!selectedLog.success && selectedLog.errorMessage && (
              <div className="admin-audit-error-box">
                <div className="admin-audit-error-label">Error Message</div>
                <div className="admin-audit-error-message">{selectedLog.errorMessage}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && stats && (
        <div className="admin-audit-modal-overlay" onClick={() => setShowStats(false)}>
          <div className="admin-card admin-audit-modal admin-audit-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-audit-modal-header">
              <h3 className="admin-audit-modal-title">Statistics</h3>
              <Button variant="outline" size="sm" onClick={() => setShowStats(false)}>
                <X size={14} />
              </Button>
            </div>

            <div className="admin-audit-stats-grid">
              <div className="admin-audit-stat-card admin-audit-stat-card-default">
                <div className="admin-audit-stat-value">{stats.totalLogs}</div>
                <div className="admin-audit-stat-label">Total Logs</div>
              </div>
              <div className="admin-audit-stat-card admin-audit-stat-card-success">
                <div className="admin-audit-stat-value admin-audit-stat-value-success">{stats.successfulOperations}</div>
                <div className="admin-audit-stat-label admin-audit-stat-label-success">Successful</div>
              </div>
              <div className="admin-audit-stat-card admin-audit-stat-card-error">
                <div className="admin-audit-stat-value admin-audit-stat-value-error">{stats.failedOperations}</div>
                <div className="admin-audit-stat-label admin-audit-stat-label-error">Failed</div>
              </div>
            </div>

            <div className="admin-audit-actions-section">
              <h4 className="admin-audit-actions-title">By Action</h4>
              {Object.entries(stats.actionCounts).map(([action, count]) => (
                <div key={action} className="admin-audit-action-row">
                  <div className="admin-audit-action-label">{action}</div>
                  <div className="admin-audit-action-bar-bg">
                    <div className="admin-audit-action-bar-fill" style={{ width: `${(count / stats.totalLogs) * 100}%`, background: getActionColor(action as AuditAction) }} />
                  </div>
                  <div className="admin-audit-action-count">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAuditLog;
