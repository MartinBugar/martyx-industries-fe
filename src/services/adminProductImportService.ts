/**
 * Admin Product Import/Export Service
 * Handles API communication for bulk product import and export operations
 */

import api from './api';

// === Types ===

export interface ProductExportRequest {
  format: 'CSV' | 'XLSX';
  categoryIds?: number[];
  productIds?: number[];
  activeOnly?: boolean;
  includeVariants?: boolean;
  columns?: string[];
}

export interface ProductImportResult {
  jobId: string;
  status: ImportStatus;
  startedAt: string | null;
  completedAt: string | null;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  skippedRows: number;
  productsCreated: number;
  variantsCreated: number;
  variantsUpdated: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  progressPercentage: number;
}

export type ImportStatus =
  | 'PENDING'
  | 'VALIDATING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ImportError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportWarning {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ImportStats {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  totalProductsCreated: number;
  totalVariantsCreated: number;
  totalVariantsUpdated: number;
}

// === API Functions ===

const BASE_URL = '/admin/products/import-export';

/**
 * Export products to CSV.
 */
export const exportToCsv = async (
  categoryIds?: number[],
  productIds?: number[],
  activeOnly = false,
  includeVariants = true
): Promise<Blob> => {
  const params = new URLSearchParams();
  if (categoryIds?.length) params.append('categoryIds', categoryIds.join(','));
  if (productIds?.length) params.append('productIds', productIds.join(','));
  params.append('activeOnly', activeOnly.toString());
  params.append('includeVariants', includeVariants.toString());

  const response = await api.get(`${BASE_URL}/export/csv?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Export products to Excel.
 */
export const exportToExcel = async (
  categoryIds?: number[],
  productIds?: number[],
  activeOnly = false,
  includeVariants = true
): Promise<Blob> => {
  const params = new URLSearchParams();
  if (categoryIds?.length) params.append('categoryIds', categoryIds.join(','));
  if (productIds?.length) params.append('productIds', productIds.join(','));
  params.append('activeOnly', activeOnly.toString());
  params.append('includeVariants', includeVariants.toString());

  const response = await api.get(`${BASE_URL}/export/excel?${params.toString()}`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Export with custom options.
 */
export const exportWithOptions = async (request: ProductExportRequest): Promise<Blob> => {
  const response = await api.post(`${BASE_URL}/export`, request, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Download CSV import template.
 */
export const downloadCsvTemplate = async (): Promise<Blob> => {
  const response = await api.get(`${BASE_URL}/template/csv`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Download Excel import template.
 */
export const downloadExcelTemplate = async (): Promise<Blob> => {
  const response = await api.get(`${BASE_URL}/template/excel`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Get column headers for import/export.
 */
export const getColumns = async (): Promise<string[]> => {
  const response = await api.get(`${BASE_URL}/columns`);
  return response.data;
};

/**
 * Start product import from file.
 */
export const startImport = async (
  file: File,
  dryRun = false
): Promise<ProductImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post(
    `${BASE_URL}/import?dryRun=${dryRun}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Validate import file without importing (dry-run).
 */
export const validateImport = async (file: File): Promise<ProductImportResult> => {
  return startImport(file, true);
};

/**
 * Get import job status.
 */
export const getImportStatus = async (jobId: string): Promise<ProductImportResult> => {
  const response = await api.get(`${BASE_URL}/import/status/${jobId}`);
  return response.data;
};

/**
 * Cancel running import job.
 */
export const cancelImport = async (jobId: string): Promise<{ jobId: string; cancelled: boolean }> => {
  const response = await api.post(`${BASE_URL}/import/cancel/${jobId}`);
  return response.data;
};

/**
 * Get import history.
 */
export const getImportHistory = async (
  userId?: number,
  limit = 20
): Promise<ProductImportResult[]> => {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId.toString());
  params.append('limit', limit.toString());

  const response = await api.get(`${BASE_URL}/import/history?${params.toString()}`);
  return response.data;
};

/**
 * Delete old import job records.
 */
export const cleanupHistory = async (daysOld = 30): Promise<{ deleted: number; olderThanDays: number }> => {
  const response = await api.delete(`${BASE_URL}/import/history/cleanup?daysOld=${daysOld}`);
  return response.data;
};

/**
 * Get import/export statistics.
 */
export const getStats = async (): Promise<ImportStats> => {
  const response = await api.get(`${BASE_URL}/stats`);
  return response.data;
};

// === Utility Functions ===

/**
 * Download blob as file.
 */
export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Get status color for display.
 */
export const getStatusColor = (status: ImportStatus): string => {
  const colors: Record<ImportStatus, string> = {
    PENDING: '#f59e0b',
    VALIDATING: '#3b82f6',
    PROCESSING: '#6366f1',
    COMPLETED: '#10b981',
    FAILED: '#ef4444',
    CANCELLED: '#6b7280',
  };
  return colors[status] || '#6b7280';
};

/**
 * Get status label for display.
 */
export const getStatusLabel = (status: ImportStatus): string => {
  const labels: Record<ImportStatus, string> = {
    PENDING: 'Čaká',
    VALIDATING: 'Validácia',
    PROCESSING: 'Spracovanie',
    COMPLETED: 'Dokončené',
    FAILED: 'Zlyhané',
    CANCELLED: 'Zrušené',
  };
  return labels[status] || status;
};

/**
 * Format timestamp for display.
 */
export const formatTimestamp = (timestamp: string | null): string => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('sk-SK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default {
  exportToCsv,
  exportToExcel,
  exportWithOptions,
  downloadCsvTemplate,
  downloadExcelTemplate,
  getColumns,
  startImport,
  validateImport,
  getImportStatus,
  cancelImport,
  getImportHistory,
  cleanupHistory,
  getStats,
  downloadBlob,
  getStatusColor,
  getStatusLabel,
  formatTimestamp,
};
