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
import './AdminUsers.css';
import './AdminButtonOverrides.css';

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
        console.error('Failed to load filter options:', error);
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

  const viewLogDetail = async (log: AuditLog) => {
    try {
      const fullLog = await getAuditLogById(log.id);
      setSelectedLog(fullLog);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to load log detail:', error);
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
          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 className="section-title" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Activity size={24} style={{ color: 'var(--admin-accent)' }} />
                  {t('admin.auditLog.title', 'Audit Log')}
                </h2>
                <p style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '14px' }}>
                  {t('admin.auditLog.description', 'Track all admin panel operations')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant={showFilters ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={16} />
                  Filters
                  {hasActiveFilters && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--admin-error)', marginLeft: 6 }} />}
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
          <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-secondary)' }} />
              <input
                type="text"
                placeholder={t('admin.auditLog.searchPlaceholder', 'Search by user, entity name...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 40, paddingRight: searchQuery ? 40 : 12 }}
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); setCurrentPage(0); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-secondary)' }}>
                  <X size={16} />
                </button>
              )}
            </div>
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="admin-card" style={{ marginBottom: '20px' }}>
              <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
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
                <div style={{ marginTop: '16px' }}>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    <X size={14} />
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--admin-secondary)' }}>
            Showing {logs.length} of {totalElements} entries
          </div>

          {/* Logs List */}
          {loading ? (
            <div className="admin-card">
              <SkeletonTable rows={8} columns={4} />
            </div>
          ) : logs.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Activity size={48} style={{ color: 'var(--admin-secondary)', marginBottom: '16px' }} />
              <h3 style={{ margin: '0 0 8px', color: 'var(--admin-primary)' }}>No audit logs found</h3>
              <p style={{ margin: 0, color: 'var(--admin-secondary)' }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="admin-card" style={{ padding: 0 }}>
              {logs.map((log, index) => (
                <div
                  key={log.id}
                  onClick={() => viewLogDetail(log)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    cursor: 'pointer',
                    borderBottom: index < logs.length - 1 ? '1px solid var(--admin-border)' : 'none',
                    background: !log.success ? 'var(--admin-error-bg)' : 'transparent',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ flexShrink: 0 }}>
                    {log.success ? (
                      <CheckCircle size={20} style={{ color: getActionColor(log.action) }} />
                    ) : (
                      <XCircle size={20} style={{ color: 'var(--admin-error)' }} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <Badge variant="neutral" size="sm" style={{ backgroundColor: `${getActionColor(log.action)}20`, color: getActionColor(log.action), border: 'none' }}>
                        {log.actionDisplayName}
                      </Badge>
                      <span style={{ fontSize: '13px', color: 'var(--admin-primary)', fontWeight: 500 }}>{log.entityType}</span>
                      {log.entityName && (
                        <span style={{ fontSize: '13px', color: 'var(--admin-secondary)' }}>"{log.entityName}"</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--admin-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {formatRelativeTime(log.timestamp)}
                      </span>
                      {log.userName && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} />
                          {log.userName}
                        </span>
                      )}
                    </div>
                    {!log.success && log.errorMessage && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--admin-error)', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '16px', background: 'var(--admin-bg-secondary)', borderRadius: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}>
                <ChevronLeft size={16} />
                Previous
              </Button>
              <span style={{ fontSize: '14px', color: 'var(--admin-secondary)' }}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '20px' }} onClick={() => setShowDetail(false)}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Log Detail</h3>
              <Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>
                <X size={14} />
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '4px' }}>Action</div>
                <Badge variant="neutral" size="sm" style={{ backgroundColor: `${getActionColor(selectedLog.action)}20`, color: getActionColor(selectedLog.action), border: 'none' }}>
                  {selectedLog.actionDisplayName}
                </Badge>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '4px' }}>Status</div>
                <Badge variant={selectedLog.success ? 'success' : 'error'} size="sm">
                  {selectedLog.success ? 'Success' : 'Failed'}
                </Badge>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '4px' }}>Entity Type</div>
                <div style={{ fontWeight: 500 }}>{selectedLog.entityType}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '4px' }}>Entity ID</div>
                <div style={{ fontWeight: 500 }}>{selectedLog.entityId || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '4px' }}>Entity Name</div>
                <div style={{ fontWeight: 500 }}>{selectedLog.entityName || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '4px' }}>Timestamp</div>
                <div style={{ fontWeight: 500 }}>{formatTimestamp(selectedLog.timestamp)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '4px' }}>User</div>
                <div style={{ fontWeight: 500 }}>{selectedLog.userName || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '4px' }}>IP Address</div>
                <div style={{ fontWeight: 500 }}>{selectedLog.ipAddress || '-'}</div>
              </div>
            </div>

            {selectedLog.changesSummary && (
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--admin-bg-secondary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: 'var(--admin-secondary)', marginBottom: '4px' }}>Changes Summary</div>
                <div>{selectedLog.changesSummary}</div>
              </div>
            )}

            {!selectedLog.success && selectedLog.errorMessage && (
              <div style={{ padding: '12px', background: 'var(--admin-error-bg)', borderRadius: '8px', border: '1px solid var(--admin-error)' }}>
                <div style={{ fontSize: '12px', color: 'var(--admin-error)', marginBottom: '4px' }}>Error Message</div>
                <div style={{ color: 'var(--admin-error)' }}>{selectedLog.errorMessage}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStats && stats && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: '20px' }} onClick={() => setShowStats(false)}>
          <div className="admin-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Statistics</h3>
              <Button variant="outline" size="sm" onClick={() => setShowStats(false)}>
                <X size={14} />
              </Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', background: 'var(--admin-bg-secondary)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-primary)' }}>{stats.totalLogs}</div>
                <div style={{ fontSize: '12px', color: 'var(--admin-secondary)' }}>Total Logs</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--admin-success-bg)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-success)' }}>{stats.successfulOperations}</div>
                <div style={{ fontSize: '12px', color: 'var(--admin-success)' }}>Successful</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--admin-error-bg)', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--admin-error)' }}>{stats.failedOperations}</div>
                <div style={{ fontSize: '12px', color: 'var(--admin-error)' }}>Failed</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600 }}>By Action</h4>
              {Object.entries(stats.actionCounts).map(([action, count]) => (
                <div key={action} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ width: 100, fontSize: '13px', color: 'var(--admin-secondary)' }}>{action}</div>
                  <div style={{ flex: 1, height: 8, background: 'var(--admin-bg-tertiary)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(count / stats.totalLogs) * 100}%`, background: getActionColor(action as AuditAction), borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 40, textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>{count}</div>
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
