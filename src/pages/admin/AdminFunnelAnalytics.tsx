import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
  Info,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Mail,
  Share2,
  Search,
  MousePointer
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import {
  getFunnelReport,
  type FunnelReportDto,
  type FunnelStageDto,
  type DropOffInsightDto,
  type FunnelBreakdownDto,
  type DailyFunnelDto,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatChange,
  getSeverityColor,
  getStageColor
} from '../../services/adminFunnelService';
import { logError } from '../../services/logger';
import './AdminFunnelAnalytics.css';

type DatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';

const AdminFunnelAnalytics: React.FC = () => {
  // State
  const [report, setReport] = useState<FunnelReportDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('last30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'insights' | 'trend'>('overview');
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Date preset handler
  const handlePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'yesterday':
        start = new Date(today);
        start.setDate(start.getDate() - 1);
        end = start;
        break;
      case 'last7days':
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        end = today;
        break;
      case 'last30days':
        start = new Date(today);
        start.setDate(start.getDate() - 30);
        end = today;
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = today;
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'custom':
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Load data
  const loadReport = useCallback(async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);

    try {
      const data = await getFunnelReport(startDate, endDate, true);
      setReport(data);
    } catch (err) {
      logError('Error loading funnel report:', err);
      setError('Nepodarilo sa načítať dáta funnelu');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Render funnel visualization
  const renderFunnel = (stages: FunnelStageDto[]) => {
    const maxCount = stages.length > 0 ? stages[0].count : 1;

    return (
      <div className="funnel-visualization">
        {stages.map((stage, index) => {
          const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const color = getStageColor(index);

          return (
            <div key={stage.stage} className="funnel-stage">
              <div className="funnel-stage-label">
                <span className="stage-name">{stage.stageName}</span>
                <span className="stage-count">{formatNumber(stage.count)}</span>
              </div>
              <div className="funnel-bar-container">
                <div
                  className="funnel-bar"
                  style={{ width: `${width}%`, backgroundColor: color }}
                >
                  <span className="funnel-bar-label">{formatPercent(stage.overallConversionRate)}</span>
                </div>
              </div>
              {index < stages.length - 1 && (
                <div className="funnel-drop-off">
                  <TrendingDown size={14} />
                  <span>{formatPercent(stage.dropOffRate)} odpad ({formatNumber(stage.dropOffCount)})</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render KPI cards
  const renderKPICards = () => {
    if (!report) return null;

    return (
      <div className="kpi-cards">
        <div className="kpi-card">
          <div className="kpi-icon visitors">
            <Users size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{formatNumber(report.totalVisitors)}</span>
            <span className="kpi-label">Návštevníci</span>
            {report.visitorsChange != null && (
              <span className={`kpi-change ${report.visitorsChange >= 0 ? 'positive' : 'negative'}`}>
                {report.visitorsChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {formatChange(report.visitorsChange)}
              </span>
            )}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purchases">
            <ShoppingCart size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{formatNumber(report.totalPurchases)}</span>
            <span className="kpi-label">Nákupy</span>
            {report.purchasesChange != null && (
              <span className={`kpi-change ${report.purchasesChange >= 0 ? 'positive' : 'negative'}`}>
                {report.purchasesChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {formatChange(report.purchasesChange)}
              </span>
            )}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon conversion">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{formatPercent(report.overallConversionRate)}</span>
            <span className="kpi-label">Konverzia</span>
            {report.conversionRateChange != null && (
              <span className={`kpi-change ${report.conversionRateChange >= 0 ? 'positive' : 'negative'}`}>
                {report.conversionRateChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {report.conversionRateChange >= 0 ? '+' : ''}{report.conversionRateChange.toFixed(2)}pp
              </span>
            )}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon revenue">
            <CreditCard size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-value">{formatCurrency(report.totalRevenue)}</span>
            <span className="kpi-label">Tržby</span>
            {report.revenueChange != null && (
              <span className={`kpi-change ${report.revenueChange >= 0 ? 'positive' : 'negative'}`}>
                {report.revenueChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {formatChange(report.revenueChange)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render drop-off insights
  const renderInsights = (insights: DropOffInsightDto[]) => {
    return (
      <div className="insights-list">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`insight-card severity-${insight.severity.toLowerCase()}`}
            onClick={() => setExpandedInsight(expandedInsight === index ? null : index)}
          >
            <div className="insight-header">
              <div className="insight-severity" style={{ backgroundColor: getSeverityColor(insight.severity) }}>
                <AlertTriangle size={16} />
                <span>{insight.severity}</span>
              </div>
              <div className="insight-stages">
                {insight.fromStageName} → {insight.toStageName}
              </div>
              <div className="insight-toggle">
                {expandedInsight === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            <div className="insight-metrics">
              <div className="insight-metric">
                <span className="metric-value">{formatPercent(insight.dropOffRate)}</span>
                <span className="metric-label">Odpad</span>
              </div>
              <div className="insight-metric">
                <span className="metric-value">{formatNumber(insight.dropOffCount)}</span>
                <span className="metric-label">Stratení</span>
              </div>
              <div className="insight-metric">
                <span className="metric-value">{formatCurrency(insight.potentialRevenueLoss)}</span>
                <span className="metric-label">Potenciálna strata</span>
              </div>
            </div>

            {expandedInsight === index && (
              <div className="insight-details">
                <div className="insight-recommendation">
                  <Info size={16} />
                  <p>{insight.recommendation}</p>
                </div>
                {insight.benchmarkRate !== null && (
                  <div className="insight-benchmark">
                    <span>Benchmark: {formatPercent(insight.benchmarkRate)}</span>
                    {insight.benchmarkDifference !== null && (
                      <span className={insight.benchmarkDifference > 0 ? 'negative' : 'positive'}>
                        ({insight.benchmarkDifference > 0 ? '+' : ''}{insight.benchmarkDifference.toFixed(1)}pp)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render breakdown table
  const renderBreakdown = (breakdowns: FunnelBreakdownDto[], title: string, icon: React.ReactNode) => {
    return (
      <div className="breakdown-section">
        <h3 className="breakdown-title">
          {icon}
          {title}
        </h3>
        <table className="breakdown-table">
          <thead>
            <tr>
              <th>Zdroj</th>
              <th>Návštevníci</th>
              <th>Nákupy</th>
              <th>Konverzia</th>
              <th>Tržby</th>
              <th>Podiel</th>
            </tr>
          </thead>
          <tbody>
            {breakdowns.map((item) => (
              <tr key={item.dimension}>
                <td>
                  {getSourceIcon(item.dimension)}
                  {item.label}
                </td>
                <td>{formatNumber(item.visitors)}</td>
                <td>{formatNumber(item.purchases)}</td>
                <td>{formatPercent(item.conversionRate)}</td>
                <td>{formatCurrency(item.revenue)}</td>
                <td>
                  <div className="share-bar">
                    <div
                      className="share-fill"
                      style={{ width: `${item.visitorShare}%` }}
                    />
                    <span>{formatPercent(item.visitorShare)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Get icon for source/device
  const getSourceIcon = (dimension: string) => {
    switch (dimension) {
      case 'DESKTOP': return <Monitor size={16} />;
      case 'MOBILE': return <Smartphone size={16} />;
      case 'TABLET': return <Tablet size={16} />;
      case 'DIRECT': return <MousePointer size={16} />;
      case 'ORGANIC': return <Search size={16} />;
      case 'SOCIAL': return <Share2 size={16} />;
      case 'PAID': return <CreditCard size={16} />;
      case 'EMAIL': return <Mail size={16} />;
      case 'REFERRAL': return <Globe size={16} />;
      default: return null;
    }
  };

  // Render trend chart (simple bars)
  const renderTrend = (trend: DailyFunnelDto[]) => {
    const maxVisitors = Math.max(...trend.map(d => d.visitors), 1);

    return (
      <div className="trend-chart">
        <div className="trend-bars">
          {trend.map((day) => (
            <div key={day.date} className="trend-day">
              <div className="trend-bar-stack">
                <div
                  className="trend-bar visitors-bar"
                  style={{ height: `${(day.visitors / maxVisitors) * 100}%` }}
                  title={`Návštevníci: ${formatNumber(day.visitors)}`}
                />
                <div
                  className="trend-bar purchases-bar"
                  style={{ height: `${(day.purchases / maxVisitors) * 100}%` }}
                  title={`Nákupy: ${formatNumber(day.purchases)}`}
                />
              </div>
              <span className="trend-label">{day.dateLabel}</span>
            </div>
          ))}
        </div>
        <div className="trend-legend">
          <span className="legend-item visitors"><span className="legend-dot" /> Návštevníci</span>
          <span className="legend-item purchases"><span className="legend-dot" /> Nákupy</span>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="admin-funnel-analytics">
        <div className="page-header">
          <h1>Analýza konverzného funnelu</h1>
          <button className="btn-refresh" onClick={loadReport} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            Obnoviť
          </button>
        </div>

        {/* Date filters */}
        <div className="filters-bar">
          <div className="date-presets">
            {[
              { key: 'today', label: 'Dnes' },
              { key: 'yesterday', label: 'Včera' },
              { key: 'last7days', label: '7 dní' },
              { key: 'last30days', label: '30 dní' },
              { key: 'thisMonth', label: 'Tento mesiac' },
              { key: 'lastMonth', label: 'Minulý mesiac' },
              { key: 'custom', label: 'Vlastné' }
            ].map((preset) => (
              <button
                key={preset.key}
                className={`preset-btn ${datePreset === preset.key ? 'active' : ''}`}
                onClick={() => handlePresetChange(preset.key as DatePreset)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {datePreset === 'custom' && (
            <div className="custom-dates">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span>-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div className="error-message">
            <AlertTriangle size={20} />
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="loading-state">
            <RefreshCw size={32} className="spinning" />
            <span>Načítavam dáta...</span>
          </div>
        )}

        {/* Content */}
        {!loading && report && (
          <>
            {/* KPI Cards */}
            {renderKPICards()}

            {/* Tabs */}
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Prehľad funnelu
              </button>
              <button
                className={`tab ${activeTab === 'breakdown' ? 'active' : ''}`}
                onClick={() => setActiveTab('breakdown')}
              >
                Rozpad
              </button>
              <button
                className={`tab ${activeTab === 'insights' ? 'active' : ''}`}
                onClick={() => setActiveTab('insights')}
              >
                Odporúčania ({report.dropOffInsights.length})
              </button>
              <button
                className={`tab ${activeTab === 'trend' ? 'active' : ''}`}
                onClick={() => setActiveTab('trend')}
              >
                Trend
              </button>
            </div>

            {/* Tab content */}
            <div className="tab-content">
              {activeTab === 'overview' && (
                <div className="overview-tab">
                  <div className="funnel-container">
                    <h2>Konverzný funnel</h2>
                    {renderFunnel(report.stages)}
                  </div>

                  <div className="summary-stats">
                    <div className="stat-item">
                      <span className="stat-label">Priemerná hodnota objednávky</span>
                      <span className="stat-value">{formatCurrency(report.averageOrderValue)}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'breakdown' && (
                <div className="breakdown-tab">
                  {report.byDevice && Object.keys(report.byDevice).length > 0 && (
                    renderBreakdown(
                      Object.values(report.byDevice),
                      'Podľa zariadenia',
                      <Monitor size={20} />
                    )
                  )}
                  {report.bySource && Object.keys(report.bySource).length > 0 && (
                    renderBreakdown(
                      Object.values(report.bySource),
                      'Podľa zdroja návštevnosti',
                      <Globe size={20} />
                    )
                  )}
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="insights-tab">
                  <h2>Analýza odpadov a odporúčania</h2>
                  {report.dropOffInsights.length > 0 ? (
                    renderInsights(report.dropOffInsights)
                  ) : (
                    <div className="empty-state">
                      <Info size={48} />
                      <p>Žiadne významné odpady v sledovanom období</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'trend' && (
                <div className="trend-tab">
                  <h2>Denný trend</h2>
                  {report.dailyTrend && report.dailyTrend.length > 0 ? (
                    renderTrend(report.dailyTrend)
                  ) : (
                    <div className="empty-state">
                      <Info size={48} />
                      <p>Nedostatok dát pre zobrazenie trendu</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFunnelAnalytics;
