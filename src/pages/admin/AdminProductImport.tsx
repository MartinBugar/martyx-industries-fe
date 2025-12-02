/**
 * Admin Product Import/Export Page
 * Bulk import and export products via CSV/Excel
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  History,
  Trash2,
  Play,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import {
  exportToCsv,
  exportToExcel,
  downloadCsvTemplate,
  downloadExcelTemplate,
  startImport,
  validateImport,
  getImportStatus,
  cancelImport,
  getImportHistory,
  getStats,
  downloadBlob,
  getStatusColor,
  getStatusLabel,
  formatTimestamp,
  ProductImportResult,
  ImportStatus,
  ImportStats,
} from '../../services/adminProductImportService';
import './AdminProductImport.css';

const AdminProductImport: React.FC = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'import' | 'export' | 'history'>('import');

  // Import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDryRun, setIsDryRun] = useState(true);
  const [importing, setImporting] = useState(false);
  const [currentJob, setCurrentJob] = useState<ProductImportResult | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [activeOnly, setActiveOnly] = useState(false);
  const [includeVariants, setIncludeVariants] = useState(true);

  // History state
  const [history, setHistory] = useState<ProductImportResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [stats, setStats] = useState<ImportStats | null>(null);

  // UI state
  const [showErrors, setShowErrors] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);

  // Load history and stats
  const loadHistoryAndStats = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const [historyData, statsData] = await Promise.all([
        getImportHistory(undefined, 20),
        getStats(),
      ]);
      setHistory(historyData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadHistoryAndStats();
  }, [loadHistoryAndStats]);

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const status = await getImportStatus(jobId);
      setCurrentJob(status);

      if (status.status === 'COMPLETED' || status.status === 'FAILED' || status.status === 'CANCELLED') {
        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setImporting(false);
        loadHistoryAndStats();
      }
    } catch (error) {
      console.error('Failed to get job status:', error);
    }
  }, [pollingInterval, loadHistoryAndStats]);

  // Start polling when job starts
  useEffect(() => {
    if (currentJob && !currentJob.completedAt && importing) {
      const interval = setInterval(() => {
        pollJobStatus(currentJob.jobId);
      }, 2000);
      setPollingInterval(interval);

      return () => clearInterval(interval);
    }
  }, [currentJob?.jobId, importing, pollJobStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.toLowerCase();
      if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx')) {
        alert('Podporované sú len CSV a XLSX súbory');
        return;
      }
      setSelectedFile(file);
      setCurrentJob(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const ext = file.name.toLowerCase();
      if (!ext.endsWith('.csv') && !ext.endsWith('.xlsx')) {
        alert('Podporované sú len CSV a XLSX súbory');
        return;
      }
      setSelectedFile(file);
      setCurrentJob(null);
    }
  };

  // Import actions
  const handleStartImport = async () => {
    if (!selectedFile) return;

    try {
      setImporting(true);
      const result = await startImport(selectedFile, isDryRun);
      setCurrentJob(result);

      if (result.status === 'COMPLETED' || result.status === 'FAILED') {
        setImporting(false);
        loadHistoryAndStats();
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImporting(false);
      alert('Import zlyhal. Skontrolujte formát súboru.');
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) return;

    try {
      setImporting(true);
      const result = await validateImport(selectedFile);
      setCurrentJob(result);
      setImporting(false);
    } catch (error) {
      console.error('Validation failed:', error);
      setImporting(false);
      alert('Validácia zlyhala. Skontrolujte formát súboru.');
    }
  };

  const handleCancel = async () => {
    if (!currentJob) return;

    try {
      await cancelImport(currentJob.jobId);
      setImporting(false);
      loadHistoryAndStats();
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  };

  // Export actions
  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = exportFormat === 'xlsx'
        ? await exportToExcel(undefined, undefined, activeOnly, includeVariants)
        : await exportToCsv(undefined, undefined, activeOnly, includeVariants);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `products_${timestamp}.${exportFormat}`;
      downloadBlob(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export zlyhal');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = format === 'xlsx'
        ? await downloadExcelTemplate()
        : await downloadCsvTemplate();

      downloadBlob(blob, `product_import_template.${format}`);
    } catch (error) {
      console.error('Template download failed:', error);
      alert('Stiahnutie šablóny zlyhalo');
    }
  };

  // Render helpers
  const renderStatusIcon = (status: ImportStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="status-icon success" />;
      case 'FAILED':
        return <XCircle className="status-icon error" />;
      case 'CANCELLED':
        return <XCircle className="status-icon cancelled" />;
      case 'PROCESSING':
      case 'VALIDATING':
        return <RefreshCw className="status-icon processing spinning" />;
      default:
        return <Clock className="status-icon pending" />;
    }
  };

  return (
    <AdminLayout>
      <div className="admin-product-import">
        <div className="page-header">
          <h1>Import / Export produktov</h1>
          <p className="page-description">
            Hromadný import a export produktov cez CSV alebo Excel súbory
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <Upload size={18} />
            Import
          </button>
          <button
            className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            <Download size={18} />
            Export
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={18} />
            História
          </button>
        </div>

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="import-section">
            {/* Templates */}
            <div className="templates-card">
              <h3>Šablóny pre import</h3>
              <p>Stiahnite si šablónu pre správny formát importu</p>
              <div className="template-buttons">
                <button
                  className="template-btn"
                  onClick={() => handleDownloadTemplate('xlsx')}
                >
                  <FileSpreadsheet size={20} />
                  Excel šablóna (.xlsx)
                </button>
                <button
                  className="template-btn"
                  onClick={() => handleDownloadTemplate('csv')}
                >
                  <FileText size={20} />
                  CSV šablóna (.csv)
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="upload-card">
              <h3>Nahrať súbor</h3>
              <div
                className={`drop-zone ${selectedFile ? 'has-file' : ''}`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                {selectedFile ? (
                  <div className="selected-file">
                    <FileSpreadsheet size={40} />
                    <span className="file-name">{selectedFile.name}</span>
                    <span className="file-size">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      className="remove-file"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setCurrentJob(null);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="drop-placeholder">
                    <Upload size={40} />
                    <span>Pretiahnite súbor sem alebo kliknite pre výber</span>
                    <span className="file-types">Podporované: CSV, XLSX (max 10MB)</span>
                  </div>
                )}
              </div>

              {/* Import Options */}
              <div className="import-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isDryRun}
                    onChange={(e) => setIsDryRun(e.target.checked)}
                  />
                  <span>Iba validácia (bez uloženia)</span>
                </label>
              </div>

              {/* Import Actions */}
              <div className="import-actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleValidate}
                  disabled={!selectedFile || importing}
                >
                  <CheckCircle size={18} />
                  Validovať
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleStartImport}
                  disabled={!selectedFile || importing}
                >
                  {importing ? (
                    <>
                      <RefreshCw size={18} className="spinning" />
                      Spracovanie...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      {isDryRun ? 'Spustiť validáciu' : 'Spustiť import'}
                    </>
                  )}
                </button>
                {importing && currentJob && (
                  <button className="btn btn-danger" onClick={handleCancel}>
                    <X size={18} />
                    Zrušiť
                  </button>
                )}
              </div>
            </div>

            {/* Import Result */}
            {currentJob && (
              <div className="result-card">
                <div className="result-header">
                  <div className="result-status">
                    {renderStatusIcon(currentJob.status)}
                    <span
                      className="status-label"
                      style={{ color: getStatusColor(currentJob.status) }}
                    >
                      {getStatusLabel(currentJob.status)}
                    </span>
                  </div>
                  {currentJob.status === 'PROCESSING' && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${currentJob.progressPercentage}%` }}
                      />
                      <span className="progress-text">
                        {currentJob.progressPercentage}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="result-stats">
                  <div className="stat">
                    <span className="stat-label">Celkom riadkov</span>
                    <span className="stat-value">{currentJob.totalRows}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Spracovaných</span>
                    <span className="stat-value">{currentJob.processedRows}</span>
                  </div>
                  <div className="stat success">
                    <span className="stat-label">Úspešných</span>
                    <span className="stat-value">{currentJob.successfulRows}</span>
                  </div>
                  <div className="stat error">
                    <span className="stat-label">Chybných</span>
                    <span className="stat-value">{currentJob.failedRows}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Vytvorených produktov</span>
                    <span className="stat-value">{currentJob.productsCreated}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Vytvorených variantov</span>
                    <span className="stat-value">{currentJob.variantsCreated}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Aktualizovaných</span>
                    <span className="stat-value">{currentJob.variantsUpdated}</span>
                  </div>
                </div>

                {/* Errors */}
                {currentJob.errors.length > 0 && (
                  <div className="result-errors">
                    <button
                      className="toggle-btn"
                      onClick={() => setShowErrors(!showErrors)}
                    >
                      <AlertCircle size={18} className="error-icon" />
                      <span>Chyby ({currentJob.errors.length})</span>
                      {showErrors ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {showErrors && (
                      <div className="error-list">
                        {currentJob.errors.slice(0, 50).map((error, idx) => (
                          <div key={idx} className="error-item">
                            <span className="row-number">Riadok {error.rowNumber}</span>
                            <span className="field">{error.field}</span>
                            <span className="message">{error.message}</span>
                          </div>
                        ))}
                        {currentJob.errors.length > 50 && (
                          <div className="more-errors">
                            ... a {currentJob.errors.length - 50} ďalších chýb
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Warnings */}
                {currentJob.warnings.length > 0 && (
                  <div className="result-warnings">
                    <button
                      className="toggle-btn"
                      onClick={() => setShowWarnings(!showWarnings)}
                    >
                      <AlertCircle size={18} className="warning-icon" />
                      <span>Upozornenia ({currentJob.warnings.length})</span>
                      {showWarnings ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    {showWarnings && (
                      <div className="warning-list">
                        {currentJob.warnings.slice(0, 20).map((warning, idx) => (
                          <div key={idx} className="warning-item">
                            <span className="row-number">Riadok {warning.rowNumber}</span>
                            <span className="field">{warning.field}</span>
                            <span className="message">{warning.message}</span>
                          </div>
                        ))}
                        {currentJob.warnings.length > 20 && (
                          <div className="more-warnings">
                            ... a {currentJob.warnings.length - 20} ďalších upozornení
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="export-section">
            <div className="export-card">
              <h3>Export produktov</h3>
              <p>Exportujte všetky produkty do CSV alebo Excel súboru</p>

              <div className="export-options">
                <div className="option-group">
                  <label>Formát</label>
                  <div className="format-buttons">
                    <button
                      className={`format-btn ${exportFormat === 'xlsx' ? 'active' : ''}`}
                      onClick={() => setExportFormat('xlsx')}
                    >
                      <FileSpreadsheet size={18} />
                      Excel (.xlsx)
                    </button>
                    <button
                      className={`format-btn ${exportFormat === 'csv' ? 'active' : ''}`}
                      onClick={() => setExportFormat('csv')}
                    >
                      <FileText size={18} />
                      CSV (.csv)
                    </button>
                  </div>
                </div>

                <div className="option-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={activeOnly}
                      onChange={(e) => setActiveOnly(e.target.checked)}
                    />
                    <span>Len aktívne produkty</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={includeVariants}
                      onChange={(e) => setIncludeVariants(e.target.checked)}
                    />
                    <span>Zahrnúť všetky varianty</span>
                  </label>
                </div>
              </div>

              <button
                className="btn btn-primary export-btn"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <RefreshCw size={18} className="spinning" />
                    Exportovanie...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Exportovať produkty
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="history-section">
            {/* Stats */}
            {stats && (
              <div className="stats-card">
                <h3>Štatistiky importov</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-value">{stats.totalImports}</span>
                    <span className="stat-label">Celkom importov</span>
                  </div>
                  <div className="stat-item success">
                    <span className="stat-value">{stats.successfulImports}</span>
                    <span className="stat-label">Úspešných</span>
                  </div>
                  <div className="stat-item error">
                    <span className="stat-value">{stats.failedImports}</span>
                    <span className="stat-label">Zlyhaných</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{stats.totalProductsCreated}</span>
                    <span className="stat-label">Vytvorených produktov</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{stats.totalVariantsCreated}</span>
                    <span className="stat-label">Vytvorených variantov</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{stats.totalVariantsUpdated}</span>
                    <span className="stat-label">Aktualizovaných</span>
                  </div>
                </div>
              </div>
            )}

            {/* History List */}
            <div className="history-card">
              <div className="history-header">
                <h3>História importov</h3>
                <button
                  className="btn btn-secondary"
                  onClick={loadHistoryAndStats}
                  disabled={loadingHistory}
                >
                  <RefreshCw size={16} className={loadingHistory ? 'spinning' : ''} />
                  Obnoviť
                </button>
              </div>

              {loadingHistory ? (
                <div className="loading-spinner">
                  <RefreshCw size={24} className="spinning" />
                </div>
              ) : history.length === 0 ? (
                <div className="empty-state">
                  <History size={48} />
                  <p>Zatiaľ neboli vykonané žiadne importy</p>
                </div>
              ) : (
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Čas</th>
                      <th>Stav</th>
                      <th>Riadkov</th>
                      <th>Úspešných</th>
                      <th>Chybných</th>
                      <th>Vytvorených</th>
                      <th>Aktualizovaných</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((job) => (
                      <tr key={job.jobId}>
                        <td>{formatTimestamp(job.startedAt)}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(job.status) }}
                          >
                            {getStatusLabel(job.status)}
                          </span>
                        </td>
                        <td>{job.totalRows}</td>
                        <td className="success">{job.successfulRows}</td>
                        <td className="error">{job.failedRows}</td>
                        <td>{job.productsCreated + job.variantsCreated}</td>
                        <td>{job.variantsUpdated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProductImport;
