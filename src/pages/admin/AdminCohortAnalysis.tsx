/**
 * Admin Cohort Analysis Page
 * Analýza zákazníckych kohort - retencia a LTV
 *
 * Modern, minimalist design - 2025 UX best practices
 */

import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import adminCohortService from '../../services/adminCohortService';
import {
  Users,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  DollarSign,
  Repeat,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  Trophy,
  Target
} from 'lucide-react';
import { logError } from '../../services/logger';
import './AdminCohortAnalysis.css';

// Local type definitions
interface RetentionPeriodDto {
  periodIndex: number;
  periodLabel: string;
  activeUsers: number;
  retentionRate: number;
  totalOrders: number;
  periodRevenue: number;
  averageOrderValue: number;
  retentionColor: string;
}

interface CohortDto {
  cohortId: string;
  cohortLabel: string;
  cohortPeriod: string;
  cohortSize: number;
  retentionPeriods: RetentionPeriodDto[];
  totalRevenue: number;
  averageOrderValue: number;
  averageOrdersPerUser: number;
  lifetimeValue: number;
  repeatPurchaseRate: number;
  sizeChangePercent: number | null;
  revenueChangePercent: number | null;
  ltvChangePercent: number | null;
}

interface CohortReportDto {
  cohortType: string;
  granularity: string;
  startDate: string;
  endDate: string;
  cohorts: CohortDto[];
  totalCohorts: number;
  totalUsers: number;
  totalRevenue: number;
  overallAverageLtv: number;
  overallRetentionRate: number;
  periodLabels: string[];
  averageRetentionByPeriod: Record<number, number>;
  bestRetentionCohort: CohortDto | null;
  worstRetentionCohort: CohortDto | null;
  highestLtvCohort: CohortDto | null;
  largestCohort: CohortDto | null;
}

// Helper functions
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('sk-SK').format(value);
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const formatChange = (value: number | null | undefined): string => {
  if (value == null) return '';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

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
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCohort, setExpandedCohort] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminCohortService.getCohortReport(cohortType, granularity, startDate, endDate, maxPeriods);
      setReport(data);
    } catch (err) {
      logError('Failed to load cohort report:', err);
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

  const getCohortTypeLabel = (type: CohortType): string => {
    const labels: Record<CohortType, string> = {
      'ACQUISITION': 'Akvizičná',
      'BEHAVIORAL': 'Behaviorálna',
      'VALUE': 'Hodnotová'
    };
    return labels[type];
  };

  return (
    <AdminLayout title="Analýza kohort">
      <div className="cohort-page">
        {/* Compact Header */}
        <header className="cohort-header">
          <div className="cohort-header__left">
            <h1>Kohorty</h1>
            <span className="cohort-header__badge">{getCohortTypeLabel(cohortType)}</span>
          </div>
          <div className="cohort-header__actions">
            <button
              className={`cohort-btn cohort-btn--ghost ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              Filtre
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <button
              className="cohort-btn cohort-btn--primary"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              Obnoviť
            </button>
          </div>
        </header>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="cohort-filters">
            <div className="cohort-filters__row">
              <div className="cohort-filter">
                <label>Typ kohorty</label>
                <select
                  value={cohortType}
                  onChange={(e) => setCohortType(e.target.value as CohortType)}
                >
                  <option value="ACQUISITION">Akvizičná (mesiac registrácie)</option>
                  <option value="BEHAVIORAL">Behaviorálna (prvá kategória)</option>
                  <option value="VALUE">Hodnotová (suma prvej obj.)</option>
                </select>
              </div>

              <div className="cohort-filter">
                <label>Granularita</label>
                <select
                  value={granularity}
                  onChange={(e) => setGranularity(e.target.value as Granularity)}
                >
                  <option value="MONTHLY">Mesačne</option>
                  <option value="QUARTERLY">Štvrťročne</option>
                </select>
              </div>

              <div className="cohort-filter">
                <label>Od</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="cohort-filter">
                <label>Do</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="cohort-filter">
                <label>Obdobia</label>
                <select
                  value={maxPeriods}
                  onChange={(e) => setMaxPeriods(parseInt(e.target.value))}
                >
                  <option value="3">3</option>
                  <option value="6">6</option>
                  <option value="9">9</option>
                  <option value="12">12</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="cohort-error">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="cohort-loading">
            <RefreshCw size={24} className="spinning" />
            <span>Načítavam dáta...</span>
          </div>
        )}

        {/* Main Content */}
        {!loading && report && (
          <>
            {/* Metrics Grid - Clean 4-column layout */}
            <div className="cohort-metrics">
              <div className="metric-card">
                <div className="metric-card__icon metric-card__icon--blue">
                  <Users size={20} />
                </div>
                <div className="metric-card__content">
                  <span className="metric-card__value">{formatNumber(report.totalUsers)}</span>
                  <span className="metric-card__label">Zákazníkov</span>
                </div>
                <div className="metric-card__footer">
                  {report.totalCohorts} kohort
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-card__icon metric-card__icon--green">
                  <DollarSign size={20} />
                </div>
                <div className="metric-card__content">
                  <span className="metric-card__value">{formatCurrency(report.totalRevenue)}</span>
                  <span className="metric-card__label">Celkové tržby</span>
                </div>
                {report.highestLtvCohort && (
                  <div className="metric-card__footer metric-card__footer--highlight">
                    <Trophy size={12} />
                    {report.highestLtvCohort.cohortLabel}
                  </div>
                )}
              </div>

              <div className="metric-card">
                <div className="metric-card__icon metric-card__icon--purple">
                  <TrendingUp size={20} />
                </div>
                <div className="metric-card__content">
                  <span className="metric-card__value">{formatCurrency(report.overallAverageLtv)}</span>
                  <span className="metric-card__label">Priemerné LTV</span>
                </div>
                <div className="metric-card__footer">
                  na zákazníka
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-card__icon metric-card__icon--amber">
                  <Repeat size={20} />
                </div>
                <div className="metric-card__content">
                  <span className="metric-card__value">{formatPercent(report.overallRetentionRate)}</span>
                  <span className="metric-card__label">Retencia</span>
                </div>
                {report.bestRetentionCohort && (
                  <div className="metric-card__footer metric-card__footer--highlight">
                    <Target size={12} />
                    {report.bestRetentionCohort.cohortLabel}
                  </div>
                )}
              </div>
            </div>

            {/* Retention Matrix - Clean Table */}
            <section className="cohort-section">
              <div className="cohort-section__header">
                <h2>Matica retencie</h2>
                <span className="cohort-section__subtitle">
                  Kliknutím na riadok zobrazíte detail
                </span>
              </div>

              {report.cohorts.length === 0 ? (
                <div className="cohort-empty">
                  <p>Pre zvolené obdobie nie sú dostupné žiadne dáta.</p>
                </div>
              ) : (
                <div className="cohort-matrix-wrapper">
                  <table className="cohort-matrix">
                    <thead>
                      <tr>
                        <th className="cohort-matrix__sticky">Kohorta</th>
                        <th>Veľkosť</th>
                        {report.periodLabels.map((label, i) => (
                          <th key={i} className="cohort-matrix__period">{label}</th>
                        ))}
                        <th>LTV</th>
                        <th>AOV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.cohorts.map((cohort) => (
                        <React.Fragment key={cohort.cohortId}>
                          <tr
                            className={`cohort-matrix__row ${expandedCohort === cohort.cohortId ? 'expanded' : ''}`}
                            onClick={() => toggleCohortExpand(cohort.cohortId)}
                          >
                            <td className="cohort-matrix__sticky">
                              <span className="cohort-matrix__expand">
                                {expandedCohort === cohort.cohortId ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </span>
                              <span className="cohort-matrix__name">{cohort.cohortLabel}</span>
                            </td>
                            <td className="cohort-matrix__size">
                              <span>{formatNumber(cohort.cohortSize)}</span>
                              {cohort.sizeChangePercent !== null && cohort.sizeChangePercent !== 0 && (
                                <span className={`cohort-matrix__change ${cohort.sizeChangePercent >= 0 ? 'positive' : 'negative'}`}>
                                  {formatChange(cohort.sizeChangePercent)}
                                </span>
                              )}
                            </td>
                            {cohort.retentionPeriods.map((period, i) => (
                              <td
                                key={i}
                                className="cohort-matrix__cell"
                                style={{
                                  '--cell-color': period.retentionColor
                                } as React.CSSProperties}
                              >
                                {formatPercent(period.retentionRate)}
                              </td>
                            ))}
                            {Array.from({ length: report.periodLabels.length - cohort.retentionPeriods.length }).map((_, i) => (
                              <td key={`empty-${i}`} className="cohort-matrix__cell cohort-matrix__cell--empty">—</td>
                            ))}
                            <td className="cohort-matrix__ltv">
                              <span>{formatCurrency(cohort.lifetimeValue)}</span>
                              {cohort.ltvChangePercent !== null && cohort.ltvChangePercent !== 0 && (
                                <span className={`cohort-matrix__trend ${cohort.ltvChangePercent >= 0 ? 'positive' : 'negative'}`}>
                                  {cohort.ltvChangePercent >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                </span>
                              )}
                            </td>
                            <td className="cohort-matrix__aov">{formatCurrency(cohort.averageOrderValue)}</td>
                          </tr>

                          {/* Expanded Details */}
                          {expandedCohort === cohort.cohortId && (
                            <tr className="cohort-matrix__details">
                              <td colSpan={report.periodLabels.length + 4}>
                                <CohortDetails cohort={cohort} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}

                      {/* Average Row */}
                      <tr className="cohort-matrix__average">
                        <td className="cohort-matrix__sticky">Priemer</td>
                        <td>—</td>
                        {report.periodLabels.map((_, i) => (
                          <td key={i} className="cohort-matrix__cell">
                            {report.averageRetentionByPeriod[i] !== undefined
                              ? formatPercent(report.averageRetentionByPeriod[i])
                              : '—'}
                          </td>
                        ))}
                        <td className="cohort-matrix__ltv">{formatCurrency(report.overallAverageLtv)}</td>
                        <td>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Retention Trend - Minimalist Bar Chart */}
            <section className="cohort-section">
              <div className="cohort-section__header">
                <h2>Trend retencie</h2>
                <span className="cohort-section__subtitle">
                  Priemerná retencia podľa obdobia
                </span>
              </div>
              <div className="cohort-trend">
                {report.periodLabels.map((label, i) => {
                  const rate = report.averageRetentionByPeriod[i] || 0;
                  return (
                    <div key={i} className="cohort-trend__item">
                      <div className="cohort-trend__bar-wrapper">
                        <div
                          className="cohort-trend__bar"
                          style={{
                            height: `${Math.max(rate, 2)}%`,
                            backgroundColor: getRetentionColor(rate)
                          }}
                        />
                      </div>
                      <span className="cohort-trend__value">{formatPercent(rate)}</span>
                      <span className="cohort-trend__label">{label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

// Cohort Details Component - Cleaner Layout
const CohortDetails: React.FC<{ cohort: CohortDto }> = ({ cohort }) => {
  return (
    <div className="cohort-detail">
      <div className="cohort-detail__summary">
        <div className="cohort-detail__stat">
          <span className="cohort-detail__stat-value">{formatCurrency(cohort.totalRevenue)}</span>
          <span className="cohort-detail__stat-label">Celkové tržby</span>
        </div>
        <div className="cohort-detail__stat">
          <span className="cohort-detail__stat-value">{cohort.averageOrdersPerUser.toFixed(1)}</span>
          <span className="cohort-detail__stat-label">Obj./zákazník</span>
        </div>
        <div className="cohort-detail__stat">
          <span className="cohort-detail__stat-value">{formatPercent(cohort.repeatPurchaseRate)}</span>
          <span className="cohort-detail__stat-label">Opakované nákupy</span>
        </div>
        <div className="cohort-detail__stat">
          <span className="cohort-detail__stat-value">{cohort.cohortPeriod}</span>
          <span className="cohort-detail__stat-label">Obdobie</span>
        </div>
      </div>

      {cohort.retentionPeriods.length > 0 && (
        <div className="cohort-detail__table">
          <table>
            <thead>
              <tr>
                <th>Obdobie</th>
                <th>Aktívni</th>
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
                  <td style={{ color: period.retentionColor, fontWeight: 600 }}>
                    {formatPercent(period.retentionRate)}
                  </td>
                  <td>{formatNumber(period.totalOrders)}</td>
                  <td>{formatCurrency(period.periodRevenue)}</td>
                  <td>{formatCurrency(period.averageOrderValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
