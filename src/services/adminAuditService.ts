/**
 * Admin Audit Log Service
 * Handles API communication for audit log management
 */

import api from './api';

// === Types ===

export interface AuditLog {
  id: number;
  timestamp: string;
  userId: number | null;
  userEmail: string | null;
  userName: string | null;
  action: AuditAction;
  actionDisplayName: string;
  entityType: string;
  entityId: number | null;
  entityName: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  changesSummary: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string | null;
  requestPath: string | null;
  durationMs: number | null;
  success: boolean;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
}

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'IMPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'BULK_UPDATE'
  | 'BULK_DELETE'
  | 'STATUS_CHANGE'
  | 'SETTINGS_CHANGE'
  | 'PERMISSION_CHANGE';

export interface AuditStats {
  totalLogs: number;
  successfulOperations: number;
  failedOperations: number;
  actionCounts: Record<string, number>;
  entityTypeCounts: Record<string, number>;
  topUsers: UserActivity[];
}

export interface UserActivity {
  userId: number;
  userName: string;
  userEmail: string;
  activityCount: number;
}

export interface ActionOption {
  value: string;
  label: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface AuditLogFilters {
  userId?: number;
  action?: AuditAction;
  entityType?: string;
  entityId?: number;
  success?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

// === API Functions ===

const BASE_URL = '/admin/audit';

/**
 * Get paginated audit logs with filters.
 */
export const getAuditLogs = async (filters: AuditLogFilters = {}): Promise<PaginatedResponse<AuditLog>> => {
  const params = new URLSearchParams();

  if (filters.userId) params.append('userId', filters.userId.toString());
  if (filters.action) params.append('action', filters.action);
  if (filters.entityType) params.append('entityType', filters.entityType);
  if (filters.entityId) params.append('entityId', filters.entityId.toString());
  if (filters.success !== undefined) params.append('success', filters.success.toString());
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.page !== undefined) params.append('page', filters.page.toString());
  if (filters.size) params.append('size', filters.size.toString());

  const response = await api.get(`${BASE_URL}?${params.toString()}`);
  return response.data;
};

/**
 * Search audit logs by text.
 */
export const searchAuditLogs = async (
  query: string,
  page = 0,
  size = 20
): Promise<PaginatedResponse<AuditLog>> => {
  const response = await api.get(`${BASE_URL}/search`, {
    params: { q: query, page, size },
  });
  return response.data;
};

/**
 * Get audit log by ID.
 */
export const getAuditLogById = async (id: number): Promise<AuditLog> => {
  const response = await api.get(`${BASE_URL}/${id}`);
  return response.data;
};

/**
 * Get audit history for a specific entity.
 */
export const getEntityHistory = async (
  entityType: string,
  entityId: number,
  page = 0,
  size = 20
): Promise<PaginatedResponse<AuditLog>> => {
  const response = await api.get(`${BASE_URL}/entity/${entityType}/${entityId}`, {
    params: { page, size },
  });
  return response.data;
};

/**
 * Get audit history for a specific user.
 */
export const getUserHistory = async (
  userId: number,
  page = 0,
  size = 20
): Promise<PaginatedResponse<AuditLog>> => {
  const response = await api.get(`${BASE_URL}/user/${userId}`, {
    params: { page, size },
  });
  return response.data;
};

/**
 * Get failed operations.
 */
export const getFailedOperations = async (
  page = 0,
  size = 20
): Promise<PaginatedResponse<AuditLog>> => {
  const response = await api.get(`${BASE_URL}/failed`, {
    params: { page, size },
  });
  return response.data;
};

/**
 * Get audit statistics for a date range.
 */
export const getAuditStats = async (
  startDate?: string,
  endDate?: string
): Promise<AuditStats> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await api.get(`${BASE_URL}/stats?${params.toString()}`);
  return response.data;
};

/**
 * Get available entity types.
 */
export const getEntityTypes = async (): Promise<string[]> => {
  const response = await api.get(`${BASE_URL}/entity-types`);
  return response.data;
};

/**
 * Get available action types.
 */
export const getActions = async (): Promise<ActionOption[]> => {
  const response = await api.get(`${BASE_URL}/actions`);
  return response.data;
};

/**
 * Delete old audit logs (retention policy).
 */
export const deleteOldLogs = async (before: string): Promise<{ deleted: number; before: string }> => {
  const response = await api.delete(`${BASE_URL}/retention`, {
    params: { before },
  });
  return response.data;
};

/**
 * Count logs older than specified date.
 */
export const countOldLogs = async (before: string): Promise<{ count: number; before: string }> => {
  const response = await api.get(`${BASE_URL}/retention/count`, {
    params: { before },
  });
  return response.data;
};

// === Utility Functions ===

/**
 * Get color for action type.
 */
export const getActionColor = (action: AuditAction): string => {
  const colors: Record<AuditAction, string> = {
    CREATE: '#10b981',
    READ: '#6b7280',
    UPDATE: '#3b82f6',
    DELETE: '#ef4444',
    EXPORT: '#8b5cf6',
    IMPORT: '#14b8a6',
    LOGIN: '#22c55e',
    LOGOUT: '#f59e0b',
    BULK_UPDATE: '#6366f1',
    BULK_DELETE: '#dc2626',
    STATUS_CHANGE: '#0ea5e9',
    SETTINGS_CHANGE: '#f97316',
    PERMISSION_CHANGE: '#ec4899',
  };
  return colors[action] || '#6b7280';
};

/**
 * Format timestamp for display.
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('sk-SK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Format relative time.
 */
export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatTimestamp(timestamp);
};

export default {
  getAuditLogs,
  searchAuditLogs,
  getAuditLogById,
  getEntityHistory,
  getUserHistory,
  getFailedOperations,
  getAuditStats,
  getEntityTypes,
  getActions,
  deleteOldLogs,
  countOldLogs,
  getActionColor,
  formatTimestamp,
  formatRelativeTime,
};
