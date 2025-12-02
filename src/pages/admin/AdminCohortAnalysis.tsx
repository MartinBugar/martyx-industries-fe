/**
 * Admin Cohort Analysis Page
 * Analýza zákazníckych kohort - retencia a LTV
 */

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import {
  getCohortReport,
  CohortReportDto,
  CohortDto,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatChange
} from '../../services/adminCohortService';
import {
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  DollarSign,
  Repeat,
  Award,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import './AdminCohortAnalysis.css';

type CohortType = 'ACQUISITION' | 'BEHAVIORAL' | 'VALUE';
type Granularity = 'MONTHLY' | 'QUARTERLY';

const AdminCohortAnalysis: React.FC = () => {
  const [report, setReport] = useState<CohortReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [cohortType, setCohortType] = useState<CohortType>('ACQUISITION');
  const [granularity, setGranularity] = useState<Granularity>('MONTHLY');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 12);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [maxPeriods, setMaxPeriods] = useState(6);

  // UI state
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCohortReport(cohortType, granularity, startDate, endDate, maxPeriods);
      setReport(data);
    } catch (err) {
      console.error('Failed to load cohort report:', err);
      setError('Nepodarilo sa načítať dáta kohort. Skúste to znova.');
    } finally {
      setLoading(false);
    }
  }, [cohortType, granularity, startDate, endDate, maxPeriods]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleRefresh = () => {
    loadReport();
  };

  const toggleCohortExpand = (cohortId: string) => {
    setExpandedCohort(prev => prev === cohortId ? null : cohortId);
  };

  return (
    <AdminLayout title="Analýza kohort">
      <div className="admin-cohort-analysis">
        {/* Page Header */}
        <div className="page-header">
          <h1>Analýza zákazníckych kohort</h1>
          <button className="btn-refresh" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Obnoviť
          </button>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div className="filter-group">
            <label>Typ kohorty</label>
            <select
              value={cohortType}
              onChange={(e) => setCohortType(e.target.value as CohortType)}
            >
              <option value="ACQUISITION">Akvizičná (podľa mesiaca registrácie)</option>
              <option value="BEHAVIORAL">Behaviorálna (podľa prvej kategórie)</option>
              <option value="VALUE">Hodnotová (podľa sumy prvej objednávky)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Granularita</label>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as Granularity)}
            >
              <option value="MONTHLY">Mesačne</option>
              <option value="QUARTERLY">Štvrťročne</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Od</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Do</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Obdobia</label>
            <select
              value={maxPeriods}
              onChange={(e) => setMaxPeriods(parseInt(e.target.value))}
            >
              <option value="3">3 mesiace</option>
              <option value="6">6 mesiacov</option>
              <option value="9">9 mesiacov</option>
              <option value="12">12 mesiacov</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <RefreshCw size={32} className="spinning" />
            <span>Načítavam dáta kohort...</span>
          </div>
        )}

        {/* Main Content */}
        {!loading && report && (
          <>
            {/* KPI Cards */}
            <div className="kpi-cards">
              <div className="kpi-card">
                <div className="kpi-icon customers">
                  <Users size={24} />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value">{formatNumber(report.totalUsers)}</div>
                  <div className="kpi-label">Celkom zákazníkov</div>
                  <div className="kpi-sub">{report.totalCohorts} kohort</div>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon revenue">
                  <DollarSign size={24} />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value">{formatCurrency(report.totalRevenue)}</div>
                  <div className="kpi-label">Celkové tržby</div>
                  <div className="kpi-sub">Celoživotná hodnota</div>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon ltv">
                  <TrendingUp size={24} />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value">{formatCurrency(report.overallAverageLtv)}</div>
                  <div className="kpi-label">Priemerné LTV</div>
                  <div className="kpi-sub">Na zákazníka</div>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon retention">
                  <Repeat size={24} />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value">{formatPercent(report.overallRetentionRate)}</div>
                  <div className="kpi-label">Priem. retencia</div>
                  <div className="kpi-sub">Celková miera</div>
                </div>
              </div>
            </div>

            {/* Highlights */}
            {(report.highestLtvCohort || report.bestRetentionCohort) && (
              <div className="highlights">
                {report.highestLtvCohort && (
                  <div className="highlight-card best-ltv">
                    <Award size={20} />
                    <div className="highlight-content">
                      <span className="highlight-label">Najvyššie LTV kohorta</span>
                      <span className="highlight-value">
                        {report.highestLtvCohort.cohortLabel} - {formatCurrency(report.highestLtvCohort.lifetimeValue)}
                      </span>
                    </div>
                  </div>
                )}

                {report.bestRetentionCohort && (
                  <div className="highlight-card best-retention">
                    <TrendingUp size={20} />
                    <div className="highlight-content">
                      <span className="highlight-label">Najlepšia retencia</span>
                      <span className="highlight-value">
                        {report.bestRetentionCohort.cohortLabel}
                      </span>
                    </div>
                  </div>
                )}

                {report.largestCohort && (
                  <div className="highlight-card largest">
                    <Users size={20} />
                    <div className="highlight-content">
                      <span className="highlight-label">Najväčšia kohorta</span>
                      <span className="highlight-value">
                        {report.largestCohort.cohortLabel} - {formatNumber(report.largestCohort.cohortSize)} zákazníkov
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Retention Matrix */}
            <div className="retention-matrix-section">
              <h2>
                <Calendar size={20} />
                Matica retencie
              </h2>

              {report.cohorts.length === 0 ? (
                <div className="empty-state">
                  <p>Pre zvolené obdobie nie sú dostupné žiadne dáta kohort.</p>
                </div>
              ) : (
                <div className="retention-matrix-wrapper">
                  <table className="retention-matrix">
                    <thead>
                      <tr>
                        <th className="cohort-header">Kohorta</th>
                        <th className="size-header">Veľkosť</th>
                        {report.periodLabels.map((label, i) => (
                          <th key={i} className="period-header">{label}</th>
                        ))}
                        <th className="ltv-header">LTV</th>
                        <th className="aov-header">AOV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.cohorts.map((cohort) => (
                        <React.Fragment key={cohort.cohortId}>
                          <tr
                            className="cohort-row"
                            onClick={() => toggleCohortExpand(cohort.cohortId)}
                          >
                            <td className="cohort-label">
                              <span className="expand-icon">
                                {expandedCohort === cohort.cohortId ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </span>
                              {cohort.cohortLabel}
                            </td>
                            <td className="cohort-size">
                              {formatNumber(cohort.cohortSize)}
                              {cohort.sizeChangePercent !== null && (
                                <span className={`change ${cohort.sizeChangePercent >= 0 ? 'positive' : 'negative'}`}>
                                  {formatChange(cohort.sizeChangePercent)}
                                </span>
                              )}
                            </td>
                            {cohort.retentionPeriods.map((period, i) => (
                              <td
                                key={i}
                                className="retention-cell"
                                style={{ backgroundColor: period.retentionColor + '30' }}
                              >
                                <span
                                  className="retention-value"
                                  style={{ color: period.retentionColor }}
                                >
                                  {formatPercent(period.retentionRate)}
                                </span>
                              </td>
                            ))}
                            {/* Fill empty cells if needed */}
                            {Array.from({ length: report.periodLabels.length - cohort.retentionPeriods.length }).map((_, i) => (
                              <td key={`empty-${i}`} className="retention-cell empty">-</td>
                            ))}
                            <td className="ltv-cell">
                              {formatCurrency(cohort.lifetimeValue)}
                              {cohort.ltvChangePercent !== null && (
                                <span className={`change ${cohort.ltvChangePercent >= 0 ? 'positive' : 'negative'}`}>
                                  {cohort.ltvChangePercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                </span>
                              )}
                            </td>
                            <td className="aov-cell">{formatCurrency(cohort.averageOrderValue)}</td>
                          </tr>

                          {/* Expanded Details */}
                          {expandedCohort === cohort.cohortId && (
                            <tr className="cohort-details-row">
                              <td colSpan={report.periodLabels.length + 4}>
                                <CohortDetails cohort={cohort} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}

                      {/* Average Row */}
                      <tr className="average-row">
                        <td className="cohort-label">Priemer</td>
                        <td className="cohort-size">-</td>
                        {report.periodLabels.map((_, i) => (
                          <td key={i} className="retention-cell average">
                            {report.averageRetentionByPeriod[i] !== undefined
                              ? formatPercent(report.averageRetentionByPeriod[i])
                              : '-'}
                          </td>
                        ))}
                        <td className="ltv-cell">{formatCurrency(report.overallAverageLtv)}</td>
                        <td className="aov-cell">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Retention Trend Chart */}
            <div className="retention-trend-section">
              <h2>
                <TrendingUp size={20} />
                Trend retencie podľa obdobia
              </h2>
              <div className="retention-trend-chart">
                {report.periodLabels.map((label, i) => {
                  const rate = report.averageRetentionByPeriod[i] || 0;
                  return (
                    <div key={i} className="trend-bar-container">
                      <div
                        className="trend-bar"
                        style={{
                          height: `${Math.min(rate, 100)}%`,
                          backgroundColor: getRetentionColor(rate)
                        }}
                      >
                        <span className="trend-value">{formatPercent(rate)}</span>
                      </div>
                      <span className="trend-label">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

// Cohort Details Component
const CohortDetails: React.FC<{ cohort: CohortDto }> = ({ cohort }) => {
  return (
    <div className="cohort-details">
      <div className="detail-cards">
        <div className="detail-card">
          <span className="detail-label">Celkové tržby</span>
          <span className="detail-value">{formatCurrency(cohort.totalRevenue)}</span>
        </div>
        <div className="detail-card">
          <span className="detail-label">Priem. obj./používateľ</span>
          <span className="detail-value">{cohort.averageOrdersPerUser.toFixed(2)}</span>
        </div>
        <div className="detail-card">
          <span className="detail-label">Miera opak. nákupov</span>
          <span className="detail-value">{formatPercent(cohort.repeatPurchaseRate)}</span>
        </div>
        <div className="detail-card">
          <span className="detail-label">Obdobie kohorty</span>
          <span className="detail-value">{cohort.cohortPeriod}</span>
        </div>
      </div>

      {/* Period Details Table */}
      <div className="period-details">
        <h4>Rozpad podľa období</h4>
        <table className="period-table">
          <thead>
            <tr>
              <th>Obdobie</th>
              <th>Aktívni užív.</th>
              <th>Retencia</th>
              <th>Objednávky</th>
              <th>Tržby</th>
              <th>AOV</th>
            </tr>
          </thead>
          <tbody>
            {cohort.retentionPeriods.map((period) => (
              <tr key={period.periodIndex}>
                <td>{period.periodLabel}</td>
                <td>{formatNumber(period.activeUsers)}</td>
                <td style={{ color: period.retentionColor }}>{formatPercent(period.retentionRate)}</td>
                <td>{formatNumber(period.totalOrders)}</td>
                <td>{formatCurrency(period.periodRevenue)}</td>
                <td>{formatCurrency(period.averageOrderValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper function
const getRetentionColor = (rate: number): string => {
  if (rate >= 80) return '#22c55e';
  if (rate >= 60) return '#84cc16';
  if (rate >= 40) return '#eab308';
  if (rate >= 20) return '#f97316';
  return '#ef4444';
};

export default AdminCohortAnalysis;
