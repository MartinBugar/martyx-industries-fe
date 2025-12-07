import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Eye, ShoppingCart, DollarSign, Target, Calendar, BarChart3 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminDiscounts.css';
import './AdminButtonOverrides.css';
import './AdminProductAnalytics.css';
import { adminAnalyticsService } from '../../services/adminAnalyticsService';
import type { ProductAnalyticsDailyDto } from '../../types/analytics';
import { Badge, Button, SkeletonTable } from '../../components/ui';

type SortField = 'date' | 'product_name' | 'page_views' | 'revenue' | 'units_sold' | 'conversion_rate';
type SortDirection = 'asc' | 'desc';

const AdminProductAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<ProductAnalyticsDailyDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Date range state
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // Default to last 30 days
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAnalyticsService.getProductPerformance(startDate, endDate);
      setAnalytics(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load product analytics';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAnalytics = [...analytics].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case 'date':
        aVal = new Date(a.date).getTime();
        bVal = new Date(b.date).getTime();
        break;
      case 'product_name':
        aVal = (a.variant_name || a.product_name || '').toLowerCase();
        bVal = (b.variant_name || b.product_name || '').toLowerCase();
        break;
      case 'page_views':
        aVal = a.page_views;
        bVal = b.page_views;
        break;
      case 'revenue':
        aVal = a.revenue;
        bVal = b.revenue;
        break;
      case 'units_sold':
        aVal = a.units_sold;
        bVal = b.units_sold;
        break;
      case 'conversion_rate':
        aVal = a.conversion_rate;
        bVal = b.conversion_rate;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Calculate summary statistics
  const summary = analytics.reduce(
    (acc, item) => ({
      totalPageViews: acc.totalPageViews + item.page_views,
      totalUniqueVisitors: acc.totalUniqueVisitors + item.unique_visitors,
      totalAddToCart: acc.totalAddToCart + item.add_to_cart_count,
      totalUnitsSold: acc.totalUnitsSold + item.units_sold,
      totalRevenue: acc.totalRevenue + item.revenue,
      totalOrders: acc.totalOrders + item.orders_count,
    }),
    {
      totalPageViews: 0,
      totalUniqueVisitors: 0,
      totalAddToCart: 0,
      totalUnitsSold: 0,
      totalRevenue: 0,
      totalOrders: 0,
    }
  );

  const avgConversionRate = analytics.length > 0
    ? analytics.reduce((sum, item) => sum + item.conversion_rate, 0) / analytics.length
    : 0;

  const avgOrderValue = summary.totalOrders > 0
    ? summary.totalRevenue / summary.totalOrders
    : 0;

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return `€${amount.toFixed(2)}`;
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number): string => {
    return value.toLocaleString('sk-SK');
  };

  const getTrendIcon = (trend?: string, changePercentage?: number): React.ReactNode => {
    if (!trend || !changePercentage) return null;

    const trendClass = trend === 'UP' ? 'admin-analytics-trend-up' : trend === 'DOWN' ? 'admin-analytics-trend-down' : 'admin-analytics-trend-neutral';
    const Icon = trend === 'UP' ? TrendingUp : trend === 'DOWN' ? TrendingDown : Minus;

    return (
      <span className={`admin-analytics-trend ${trendClass}`}>
        <Icon size={14} />
        {Math.abs(changePercentage).toFixed(1)}%
      </span>
    );
  };

  const getSortIcon = (field: SortField): React.ReactNode => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const navTabs = (
    <nav className="dashboard-tabs">
      <button className="dashboard-tab active" aria-label="Product Analytics">
        <BarChart3 size={16} />
        Product Analytics
      </button>
    </nav>
  );

  return (
    <AdminLayout title="Product Analytics" navTabs={navTabs}>
      <div className="admin-page">
        <div className="admin-container">
          {error && <div className="alert alert-error">{error}</div>}

          {/* Date Range Picker */}
          <div className="admin-card admin-analytics-date-card">
            <h3 className="section-title">Date Range</h3>
            <div className="admin-analytics-date-row">
              <div>
                <label className="form-label">Start Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button variant="primary" onClick={loadAnalytics} disabled={loading}>
                <Calendar size={16} /> Load Analytics
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          {!loading && analytics.length > 0 && (
            <div className="admin-analytics-summary-grid">
              {/* Total Page Views */}
              <div className="admin-card admin-analytics-summary-card">
                <div className="admin-analytics-summary-header">
                  <Eye size={20} className="admin-analytics-summary-icon-views" />
                  <div className="admin-analytics-summary-label">
                    Page Views
                  </div>
                </div>
                <div className="admin-analytics-summary-value">
                  {formatNumber(summary.totalPageViews)}
                </div>
                <div className="admin-analytics-summary-subtext">
                  {formatNumber(summary.totalUniqueVisitors)} unique visitors
                </div>
              </div>

              {/* Total Revenue */}
              <div className="admin-card admin-analytics-summary-card">
                <div className="admin-analytics-summary-header">
                  <DollarSign size={20} className="admin-analytics-summary-icon-revenue" />
                  <div className="admin-analytics-summary-label">
                    Revenue
                  </div>
                </div>
                <div className="admin-analytics-summary-value admin-analytics-summary-value-revenue">
                  {formatCurrency(summary.totalRevenue)}
                </div>
                <div className="admin-analytics-summary-subtext">
                  {formatNumber(summary.totalOrders)} orders
                </div>
              </div>

              {/* Total Units Sold */}
              <div className="admin-card admin-analytics-summary-card">
                <div className="admin-analytics-summary-header">
                  <ShoppingCart size={20} className="admin-analytics-summary-icon-units" />
                  <div className="admin-analytics-summary-label">
                    Units Sold
                  </div>
                </div>
                <div className="admin-analytics-summary-value">
                  {formatNumber(summary.totalUnitsSold)}
                </div>
                <div className="admin-analytics-summary-subtext">
                  {formatNumber(summary.totalAddToCart)} add to cart
                </div>
              </div>

              {/* Avg Conversion Rate */}
              <div className="admin-card admin-analytics-summary-card">
                <div className="admin-analytics-summary-header">
                  <Target size={20} className="admin-analytics-summary-icon-conversion" />
                  <div className="admin-analytics-summary-label">
                    Conversion Rate
                  </div>
                </div>
                <div className="admin-analytics-summary-value">
                  {formatPercent(avgConversionRate)}
                </div>
                <div className="admin-analytics-summary-subtext">
                  AOV: {formatCurrency(avgOrderValue)}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Table */}
          <div className="admin-card">
            <h3 className="section-title">Product Performance Details</h3>

            {/* Mobile Card Layout */}
            <div className="mobile-table-cards">
              {loading ? (
                <div className="mobile-table-card">
                  <SkeletonTable rows={5} columns={4} />
                </div>
              ) : analytics.length === 0 ? (
                <div className="mobile-table-card">
                  <div className="table-empty">No analytics data found for this date range.</div>
                </div>
              ) : (
                sortedAnalytics.map((item, idx) => (
                  <div key={`mobile-${idx}`} className="mobile-table-card">
                    <div className="mobile-card-header">
                      <div>
                        <h4 className="mobile-card-title">{item.variant_name || item.product_name || 'Unknown Product'}</h4>
                        <p className="mobile-card-subtitle">{formatDate(item.date)}</p>
                      </div>
                    </div>
                    <div className="mobile-card-body">
                      <div className="mobile-field">
                        <span className="mobile-field-label">Page Views:</span>
                        <span className="mobile-field-value">
                          {formatNumber(item.page_views)} {getTrendIcon(item.views_trend, item.views_change_percentage)}
                        </span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Revenue:</span>
                        <span className="mobile-field-value">
                          <strong className="admin-analytics-revenue-value">{formatCurrency(item.revenue)}</strong>
                        </span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Units Sold:</span>
                        <span className="mobile-field-value">
                          {formatNumber(item.units_sold)} {getTrendIcon(item.sales_trend, item.sales_change_percentage)}
                        </span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Conversion:</span>
                        <span className="mobile-field-value">{formatPercent(item.conversion_rate)}</span>
                      </div>
                      <div className="mobile-field">
                        <span className="mobile-field-label">Add to Cart:</span>
                        <span className="mobile-field-value">{formatNumber(item.add_to_cart_count)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table Layout */}
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('date')} className="admin-analytics-th-sortable">
                      Date {getSortIcon('date')}
                    </th>
                    <th onClick={() => handleSort('product_name')} className="admin-analytics-th-sortable">
                      Product {getSortIcon('product_name')}
                    </th>
                    <th onClick={() => handleSort('page_views')} className="admin-analytics-th-sortable admin-analytics-th-right">
                      Page Views {getSortIcon('page_views')}
                    </th>
                    <th className="admin-analytics-th-right">Unique Visitors</th>
                    <th className="admin-analytics-th-right">Add to Cart</th>
                    <th onClick={() => handleSort('units_sold')} className="admin-analytics-th-sortable admin-analytics-th-right">
                      Units Sold {getSortIcon('units_sold')}
                    </th>
                    <th onClick={() => handleSort('revenue')} className="admin-analytics-th-sortable admin-analytics-th-right">
                      Revenue {getSortIcon('revenue')}
                    </th>
                    <th onClick={() => handleSort('conversion_rate')} className="admin-analytics-th-sortable admin-analytics-th-right">
                      Conv. Rate {getSortIcon('conversion_rate')}
                    </th>
                    <th className="admin-analytics-th-center">Trends</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="table-empty">
                      <SkeletonTable rows={5} columns={9} />
                    </td></tr>
                  ) : analytics.length === 0 ? (
                    <tr><td colSpan={9} className="table-empty">No analytics data found for this date range.</td></tr>
                  ) : (
                    sortedAnalytics.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <Calendar size={14} className="admin-analytics-date-icon" />
                          {formatDate(item.date)}
                        </td>
                        <td>
                          <div className="admin-analytics-product-name">{item.variant_name || item.product_name || 'Unknown Product'}</div>
                          {item.master_product_id && (
                            <div className="admin-analytics-product-id">ID: {item.master_product_id}</div>
                          )}
                        </td>
                        <td className="text-right">
                          <strong>{formatNumber(item.page_views)}</strong>
                        </td>
                        <td className="text-right">
                          {formatNumber(item.unique_visitors)}
                        </td>
                        <td className="text-right">
                          {formatNumber(item.add_to_cart_count)}
                          {item.cart_add_rate > 0 && (
                            <div className="admin-analytics-cell-subtext">
                              ({formatPercent(item.cart_add_rate)})
                            </div>
                          )}
                        </td>
                        <td className="text-right">
                          <strong>{formatNumber(item.units_sold)}</strong>
                        </td>
                        <td className="text-right">
                          <strong className="admin-analytics-revenue-value">{formatCurrency(item.revenue)}</strong>
                          {item.orders_count > 0 && (
                            <div className="admin-analytics-cell-subtext">
                              {item.orders_count} {item.orders_count === 1 ? 'order' : 'orders'}
                            </div>
                          )}
                        </td>
                        <td className="text-right">
                          <Badge variant={item.conversion_rate >= 3 ? 'success' : item.conversion_rate >= 1 ? 'warning' : 'default'} size="sm">
                            {formatPercent(item.conversion_rate)}
                          </Badge>
                        </td>
                        <td className="admin-analytics-trends-cell">
                          <div className="admin-analytics-trends-wrap">
                            {item.views_trend && (
                              <div className="admin-analytics-trend-item">
                                Views: {getTrendIcon(item.views_trend, item.views_change_percentage)}
                              </div>
                            )}
                            {item.sales_trend && (
                              <div className="admin-analytics-trend-item">
                                Sales: {getTrendIcon(item.sales_trend, item.sales_change_percentage)}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Info */}
            {!loading && analytics.length > 0 && (
              <div className="admin-analytics-table-info">
                <strong>Total: {analytics.length}</strong> product analytics records
                {' • '}
                Showing data from {formatDate(startDate)} to {formatDate(endDate)}
                {' • '}
                Last calculated: {analytics[0]?.calculated_at ? formatDate(analytics[0].calculated_at) : 'N/A'}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProductAnalytics;
