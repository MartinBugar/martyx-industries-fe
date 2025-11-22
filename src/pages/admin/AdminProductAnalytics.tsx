import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Eye, ShoppingCart, DollarSign, Target, Calendar, BarChart3 } from 'lucide-react';
import AdminLayout from './AdminLayout';
import './AdminDiscounts.css';
import './AdminButtonOverrides.css';
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

    const color = trend === 'UP' ? '#059669' : trend === 'DOWN' ? '#dc2626' : '#6b7280';
    const Icon = trend === 'UP' ? TrendingUp : trend === 'DOWN' ? TrendingDown : Minus;

    return (
      <span style={{ color, display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
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
          <div className="admin-card" style={{ marginBottom: '24px' }}>
            <h3 className="section-title">Date Range</h3>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'end', flexWrap: 'wrap' }}>
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Total Page Views */}
              <div className="admin-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Eye size={20} style={{ color: '#3b82f6' }} />
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Page Views
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                  {formatNumber(summary.totalPageViews)}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {formatNumber(summary.totalUniqueVisitors)} unique visitors
                </div>
              </div>

              {/* Total Revenue */}
              <div className="admin-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <DollarSign size={20} style={{ color: '#059669' }} />
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Revenue
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669' }}>
                  {formatCurrency(summary.totalRevenue)}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {formatNumber(summary.totalOrders)} orders
                </div>
              </div>

              {/* Total Units Sold */}
              <div className="admin-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <ShoppingCart size={20} style={{ color: '#f59e0b' }} />
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Units Sold
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                  {formatNumber(summary.totalUnitsSold)}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  {formatNumber(summary.totalAddToCart)} add to cart
                </div>
              </div>

              {/* Avg Conversion Rate */}
              <div className="admin-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <Target size={20} style={{ color: '#8b5cf6' }} />
                  <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    Conversion Rate
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111827' }}>
                  {formatPercent(avgConversionRate)}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
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
                          <strong style={{ color: '#059669' }}>{formatCurrency(item.revenue)}</strong>
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
                    <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                      Date {getSortIcon('date')}
                    </th>
                    <th onClick={() => handleSort('product_name')} style={{ cursor: 'pointer' }}>
                      Product {getSortIcon('product_name')}
                    </th>
                    <th onClick={() => handleSort('page_views')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                      Page Views {getSortIcon('page_views')}
                    </th>
                    <th style={{ textAlign: 'right' }}>Unique Visitors</th>
                    <th style={{ textAlign: 'right' }}>Add to Cart</th>
                    <th onClick={() => handleSort('units_sold')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                      Units Sold {getSortIcon('units_sold')}
                    </th>
                    <th onClick={() => handleSort('revenue')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                      Revenue {getSortIcon('revenue')}
                    </th>
                    <th onClick={() => handleSort('conversion_rate')} style={{ cursor: 'pointer', textAlign: 'right' }}>
                      Conv. Rate {getSortIcon('conversion_rate')}
                    </th>
                    <th style={{ textAlign: 'center' }}>Trends</th>
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
                          <Calendar size={14} style={{ marginRight: 4, verticalAlign: 'middle', color: '#6b7280' }} />
                          {formatDate(item.date)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.variant_name || item.product_name || 'Unknown Product'}</div>
                          {item.master_product_id && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {item.master_product_id}</div>
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
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              ({formatPercent(item.cart_add_rate)})
                            </div>
                          )}
                        </td>
                        <td className="text-right">
                          <strong>{formatNumber(item.units_sold)}</strong>
                        </td>
                        <td className="text-right">
                          <strong style={{ color: '#059669' }}>{formatCurrency(item.revenue)}</strong>
                          {item.orders_count > 0 && (
                            <div style={{ fontSize: '11px', color: '#6b7280' }}>
                              {item.orders_count} {item.orders_count === 1 ? 'order' : 'orders'}
                            </div>
                          )}
                        </td>
                        <td className="text-right">
                          <Badge variant={item.conversion_rate >= 3 ? 'success' : item.conversion_rate >= 1 ? 'warning' : 'default'} size="sm">
                            {formatPercent(item.conversion_rate)}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            {item.views_trend && (
                              <div style={{ fontSize: '11px' }}>
                                Views: {getTrendIcon(item.views_trend, item.views_change_percentage)}
                              </div>
                            )}
                            {item.sales_trend && (
                              <div style={{ fontSize: '11px' }}>
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
              <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '6px', fontSize: '13px', color: '#6b7280' }}>
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
