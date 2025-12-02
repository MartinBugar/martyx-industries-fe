import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import {
  type SalesReportDto,
  type ProductPerformanceReportDto,
  type CustomerReportDto,
  type InventoryReportDto,
  type TaxReportDto,
  type PeriodType,
  type ReportType,
  getSalesReport,
  getProductPerformanceReport,
  getCustomerReport,
  getInventoryReport,
  getTaxReport,
  exportToCsv,
  exportToExcel,
  downloadBlob,
  formatCurrency,
  formatPercent,
  getStockStatusLabel,
  getStockStatusColor
} from '../../services/adminReportsService';
import './AdminReports.css';

type ReportTab = 'sales' | 'products' | 'customers' | 'inventory' | 'tax';

const AdminReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [periodType, setPeriodType] = useState<PeriodType>('DAILY');

  // Report data
  const [salesReport, setSalesReport] = useState<SalesReportDto | null>(null);
  const [productReport, setProductReport] = useState<ProductPerformanceReportDto | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerReportDto | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReportDto | null>(null);
  const [taxReport, setTaxReport] = useState<TaxReportDto | null>(null);

  // Load report data based on active tab
  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'sales':
          const sales = await getSalesReport(startDate, endDate, periodType);
          setSalesReport(sales);
          break;
        case 'products':
          const products = await getProductPerformanceReport(startDate, endDate);
          setProductReport(products);
          break;
        case 'customers':
          const customers = await getCustomerReport(startDate, endDate);
          setCustomerReport(customers);
          break;
        case 'inventory':
          const inventory = await getInventoryReport();
          setInventoryReport(inventory);
          break;
        case 'tax':
          const tax = await getTaxReport(startDate, endDate);
          setTaxReport(tax);
          break;
      }
    } catch (err) {
      console.error('Failed to load report:', err);
      setError('Nepodarilo sa načítať report. Skúste to znova.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, periodType]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Export handlers
  const handleExport = async (format: 'csv' | 'excel') => {
    setLoading(true);
    try {
      const reportTypeMap: Record<ReportTab, ReportType> = {
        sales: 'SALES',
        products: 'PRODUCT_PERFORMANCE',
        customers: 'CUSTOMER',
        inventory: 'INVENTORY',
        tax: 'TAX'
      };
      const reportType = reportTypeMap[activeTab];
      const blob = format === 'csv'
        ? await exportToCsv(reportType, startDate, endDate, periodType)
        : await exportToExcel(reportType, startDate, endDate, periodType);

      const ext = format === 'csv' ? 'csv' : 'xlsx';
      const filename = `${activeTab}_report_${startDate}_${endDate}.${ext}`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export sa nepodaril. Skúste to znova.');
    } finally {
      setLoading(false);
    }
  };

  // Date preset handlers
  const setDatePreset = (preset: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start = today;
        end = today;
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'last7':
        start.setDate(today.getDate() - 6);
        break;
      case 'last30':
        start.setDate(today.getDate() - 29);
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        break;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Navigation tabs
  const NavTabs = (
    <nav className="report-tabs">
      {(['sales', 'products', 'customers', 'inventory', 'tax'] as ReportTab[]).map(tab => (
        <button
          key={tab}
          className={`report-tab ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab === 'sales' && 'Predaj'}
          {tab === 'products' && 'Produkty'}
          {tab === 'customers' && 'Zákazníci'}
          {tab === 'inventory' && 'Sklad'}
          {tab === 'tax' && 'Dane'}
        </button>
      ))}
    </nav>
  );

  return (
    <AdminLayout title="Reporty" navTabs={NavTabs}>
      <div className="admin-reports">
        {/* Controls Bar */}
        <div className="reports-controls">
          <div className="date-controls">
            <div className="date-presets">
              <button onClick={() => setDatePreset('today')}>Dnes</button>
              <button onClick={() => setDatePreset('yesterday')}>Včera</button>
              <button onClick={() => setDatePreset('last7')}>7 dní</button>
              <button onClick={() => setDatePreset('last30')}>30 dní</button>
              <button onClick={() => setDatePreset('thisMonth')}>Tento mesiac</button>
              <button onClick={() => setDatePreset('lastMonth')}>Minulý mesiac</button>
              <button onClick={() => setDatePreset('thisYear')}>Tento rok</button>
            </div>
            <div className="date-inputs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span>—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {activeTab === 'sales' && (
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                className="period-select"
              >
                <option value="DAILY">Denne</option>
                <option value="WEEKLY">Týždenne</option>
                <option value="MONTHLY">Mesačne</option>
                <option value="QUARTERLY">Kvartálne</option>
              </select>
            )}
          </div>
          <div className="export-controls">
            <button onClick={() => handleExport('csv')} disabled={loading}>
              Export CSV
            </button>
            <button onClick={() => handleExport('excel')} disabled={loading}>
              Export Excel
            </button>
            <button onClick={loadReport} disabled={loading} className="refresh-btn">
              {loading ? 'Načítava sa...' : 'Obnoviť'}
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && <div className="reports-error">{error}</div>}

        {/* Loading state */}
        {loading && <div className="reports-loading">Načítava sa report...</div>}

        {/* Report Content */}
        {!loading && (
          <div className="reports-content">
            {activeTab === 'sales' && salesReport && (
              <SalesReportView report={salesReport} />
            )}
            {activeTab === 'products' && productReport && (
              <ProductReportView report={productReport} />
            )}
            {activeTab === 'customers' && customerReport && (
              <CustomerReportView report={customerReport} />
            )}
            {activeTab === 'inventory' && inventoryReport && (
              <InventoryReportView report={inventoryReport} />
            )}
            {activeTab === 'tax' && taxReport && (
              <TaxReportView report={taxReport} />
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

// === Report Views ===

const SalesReportView: React.FC<{ report: SalesReportDto }> = ({ report }) => {
  return (
    <div className="sales-report">
      {/* KPIs */}
      <div className="report-kpis">
        <div className="kpi-card">
          <div className="kpi-label">Celkové tržby</div>
          <div className="kpi-value">{formatCurrency(report.totalRevenue)}</div>
          {report.revenueChange !== null && (
            <div className={`kpi-change ${report.revenueChange >= 0 ? 'positive' : 'negative'}`}>
              {formatPercent(report.revenueChange)} vs. predch. obdobie
            </div>
          )}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Celkom objednávok</div>
          <div className="kpi-value">{report.totalOrders}</div>
          {report.ordersChange !== null && (
            <div className={`kpi-change ${report.ordersChange >= 0 ? 'positive' : 'negative'}`}>
              {formatPercent(report.ordersChange)} vs. predch. obdobie
            </div>
          )}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Priemerná objednávka</div>
          <div className="kpi-value">{formatCurrency(report.averageOrderValue)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Doprava</div>
          <div className="kpi-value">{formatCurrency(report.shippingRevenue || 0)}</div>
        </div>
      </div>

      {/* Period Breakdown */}
      {report.periodBreakdown && report.periodBreakdown.length > 0 && (
        <div className="report-section">
          <h3>Tržby podľa obdobia</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Obdobie</th>
                <th>Tržby</th>
                <th>Objednávky</th>
                <th>Priem. hodnota</th>
              </tr>
            </thead>
            <tbody>
              {report.periodBreakdown.map((period, index) => (
                <tr key={index}>
                  <td>{period.label}</td>
                  <td>{formatCurrency(period.revenue)}</td>
                  <td>{period.orders}</td>
                  <td>{formatCurrency(period.averageOrderValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Products */}
      {report.topProducts && report.topProducts.length > 0 && (
        <div className="report-section">
          <h3>Top produkty</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Predaných ks</th>
                <th>Tržby</th>
              </tr>
            </thead>
            <tbody>
              {report.topProducts.map((product) => (
                <tr key={`${product.productId}-${product.variantId}`}>
                  <td>{product.productName}{product.variantName ? ` - ${product.variantName}` : ''}</td>
                  <td>{product.quantitySold}</td>
                  <td>{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sales by Category */}
      {report.categoryBreakdown && report.categoryBreakdown.length > 0 && (
        <div className="report-section">
          <h3>Predaj podľa kategórie</h3>
          <div className="category-bars">
            {report.categoryBreakdown.map((cat, index) => (
              <div key={cat.categoryId || index} className="category-bar-row">
                <div className="category-name">{cat.categoryName}</div>
                <div className="category-bar-container">
                  <div
                    className="category-bar"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
                <div className="category-stats">
                  {formatCurrency(cat.revenue)} ({cat.percentage.toFixed(1)}%)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales by Country */}
      {report.countryBreakdown && report.countryBreakdown.length > 0 && (
        <div className="report-section">
          <h3>Predaj podľa krajiny</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Krajina</th>
                <th>Tržby</th>
                <th>Objednávky</th>
                <th>Podiel</th>
              </tr>
            </thead>
            <tbody>
              {report.countryBreakdown.map((country) => (
                <tr key={country.countryCode}>
                  <td>{country.countryName || country.countryCode}</td>
                  <td>{formatCurrency(country.revenue)}</td>
                  <td>{country.orders}</td>
                  <td>{country.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Methods */}
      {report.paymentBreakdown && report.paymentBreakdown.length > 0 && (
        <div className="report-section">
          <h3>Platobné metódy</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Metóda</th>
                <th>Tržby</th>
                <th>Objednávky</th>
                <th>Podiel</th>
              </tr>
            </thead>
            <tbody>
              {report.paymentBreakdown.map((method) => (
                <tr key={method.paymentMethod}>
                  <td>{method.paymentMethod}</td>
                  <td>{formatCurrency(method.revenue)}</td>
                  <td>{method.orders}</td>
                  <td>{method.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ProductReportView: React.FC<{ report: ProductPerformanceReportDto }> = ({ report }) => {
  return (
    <div className="product-report">
      {/* KPIs */}
      <div className="report-kpis">
        <div className="kpi-card">
          <div className="kpi-label">Celkom produktov</div>
          <div className="kpi-value">{report.totalProducts}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Aktívnych</div>
          <div className="kpi-value">{report.activeProducts}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">S predajom</div>
          <div className="kpi-value">{report.productsWithSales}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Celkové tržby</div>
          <div className="kpi-value">{formatCurrency(report.totalRevenue)}</div>
        </div>
      </div>

      {/* Best Sellers */}
      {report.bestSellers && report.bestSellers.length > 0 && (
        <div className="report-section">
          <h3>Najlepšie produkty</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Variant</th>
                <th>Predaných ks</th>
                <th>Tržby</th>
                <th>Marža</th>
              </tr>
            </thead>
            <tbody>
              {report.bestSellers.map((product, index) => (
                <tr key={`${product.productId}-${product.variantId || index}`}>
                  <td>{product.productName}</td>
                  <td>{product.variantName || '-'}</td>
                  <td>{product.quantitySold}</td>
                  <td>{formatCurrency(product.revenue)}</td>
                  <td>{product.profitMargin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slow Moving */}
      {report.slowMoving && report.slowMoving.length > 0 && (
        <div className="report-section">
          <h3>Pomaly predávané</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Variant</th>
                <th>Predaných ks</th>
                <th>Tržby</th>
              </tr>
            </thead>
            <tbody>
              {report.slowMoving.map((product, index) => (
                <tr key={`${product.productId}-${product.variantId || index}`}>
                  <td>{product.productName}</td>
                  <td>{product.variantName || '-'}</td>
                  <td>{product.quantitySold}</td>
                  <td>{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Out of Stock */}
      {report.outOfStock && report.outOfStock.length > 0 && (
        <div className="report-section">
          <h3>Vypredané produkty</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Variant</th>
                <th>SKU</th>
                <th>Dní zásob</th>
              </tr>
            </thead>
            <tbody>
              {report.outOfStock.map((item, index) => (
                <tr key={`${item.productId}-${item.variantId || index}`}>
                  <td>{item.productName}</td>
                  <td>{item.variantName || '-'}</td>
                  <td>{item.sku}</td>
                  <td>{item.daysOfStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Low Stock */}
      {report.lowStock && report.lowStock.length > 0 && (
        <div className="report-section">
          <h3>Nízky stav skladu</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Variant</th>
                <th>Na sklade</th>
                <th>Minimum</th>
                <th>Dní zásob</th>
              </tr>
            </thead>
            <tbody>
              {report.lowStock.map((item, index) => (
                <tr key={`${item.productId}-${item.variantId || index}`}>
                  <td>{item.productName}</td>
                  <td>{item.variantName || '-'}</td>
                  <td>{item.currentStock}</td>
                  <td>{item.lowStockThreshold}</td>
                  <td className={item.daysOfStock <= 7 ? 'danger' : ''}>{item.daysOfStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const CustomerReportView: React.FC<{ report: CustomerReportDto }> = ({ report }) => {
  return (
    <div className="customer-report">
      {/* KPIs */}
      <div className="report-kpis">
        <div className="kpi-card">
          <div className="kpi-label">Celkom zákazníkov</div>
          <div className="kpi-value">{report.totalCustomers}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Noví zákazníci</div>
          <div className="kpi-value">{report.newCustomers}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Vracajúci sa</div>
          <div className="kpi-value">{report.returningCustomers}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Priem. hodnota zákazníka</div>
          <div className="kpi-value">{formatCurrency(report.averageCustomerValue)}</div>
        </div>
      </div>

      {/* Top Customers */}
      {report.topCustomers && report.topCustomers.length > 0 && (
        <div className="report-section">
          <h3>Top zákazníci</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Meno</th>
                <th>Email</th>
                <th>Objednávky</th>
                <th>Utratené</th>
                <th>Rank</th>
                <th>Posledná obj.</th>
              </tr>
            </thead>
            <tbody>
              {report.topCustomers.map((customer) => (
                <tr key={customer.userId}>
                  <td>{customer.name || '-'}</td>
                  <td>{customer.email}</td>
                  <td>{customer.orderCount}</td>
                  <td>{formatCurrency(customer.totalSpent)}</td>
                  <td>{customer.cassandraRank || '-'}</td>
                  <td>{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('sk-SK') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RFM Segments */}
      {report.rfmSegments && report.rfmSegments.length > 0 && (
        <div className="report-section">
          <h3>RFM Segmenty</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Segment</th>
                <th>Popis</th>
                <th>Zákazníci</th>
                <th>Podiel</th>
              </tr>
            </thead>
            <tbody>
              {report.rfmSegments.map((segment) => (
                <tr key={segment.segment}>
                  <td>{segment.segment}</td>
                  <td>{segment.description}</td>
                  <td>{segment.customerCount}</td>
                  <td>{segment.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Registration Trend */}
      {report.registrationTrend && report.registrationTrend.length > 0 && (
        <div className="report-section">
          <h3>Trend registrácií</h3>
          <div className="registration-chart">
            {report.registrationTrend.map((day) => (
              <div key={day.date} className="registration-bar">
                <div
                  className="registration-bar-fill"
                  style={{
                    height: `${Math.min(100, (day.registrations / Math.max(...report.registrationTrend.map(d => d.registrations), 1)) * 100)}%`
                  }}
                  title={`${day.label}: ${day.registrations} registrácií`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const InventoryReportView: React.FC<{ report: InventoryReportDto }> = ({ report }) => {
  return (
    <div className="inventory-report">
      {/* KPIs */}
      <div className="report-kpis">
        <div className="kpi-card">
          <div className="kpi-label">Celkom SKU</div>
          <div className="kpi-value">{report.totalSkus}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Hodnota skladu</div>
          <div className="kpi-value">{formatCurrency(report.totalInventoryRetailValue || 0)}</div>
        </div>
        <div className="kpi-card warning">
          <div className="kpi-label">Nízky stav</div>
          <div className="kpi-value">{report.lowStockSkus}</div>
        </div>
        <div className="kpi-card danger">
          <div className="kpi-label">Vypredané</div>
          <div className="kpi-value">{report.outOfStockSkus}</div>
        </div>
      </div>

      {/* Stock Status Breakdown */}
      {report.stockStatusBreakdown && report.stockStatusBreakdown.length > 0 && (
        <div className="report-section">
          <h3>Rozdelenie podľa stavu</h3>
          <div className="stock-status-grid">
            {report.stockStatusBreakdown.map((status) => (
              <div
                key={status.status}
                className="stock-status-card"
                style={{ borderLeftColor: getStockStatusColor(status.status) }}
              >
                <div className="stock-status-label">{getStockStatusLabel(status.status)}</div>
                <div className="stock-status-count">{status.skuCount} SKU</div>
                <div className="stock-status-value">{status.totalUnits} ks</div>
                <div className="stock-status-percent">{status.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reorder Recommendations */}
      {report.reorderRecommendations && report.reorderRecommendations.length > 0 && (
        <div className="report-section">
          <h3>Odporúčania na doobjednanie</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Na sklade</th>
                <th>Min. úroveň</th>
                <th>Odporúčané množstvo</th>
                <th>Dní do vypredania</th>
                <th>Urgencia</th>
              </tr>
            </thead>
            <tbody>
              {report.reorderRecommendations.map((item, index) => (
                <tr key={`${item.productId}-${item.variantId || index}`}>
                  <td>{item.productName}{item.variantName ? ` - ${item.variantName}` : ''}</td>
                  <td>{item.currentStock}</td>
                  <td>{item.reorderPoint}</td>
                  <td className="highlight">{item.suggestedOrderQuantity}</td>
                  <td className={item.daysUntilStockout <= 7 ? 'danger' : ''}>
                    {item.daysUntilStockout}
                  </td>
                  <td>
                    <span className={`urgency-badge ${item.urgency.toLowerCase()}`}>
                      {item.urgency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dead Stock */}
      {report.deadStock && report.deadStock.length > 0 && (
        <div className="report-section">
          <h3>Mŕtvy tovar</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Na sklade</th>
                <th>Hodnota</th>
                <th>Dní od predaja</th>
              </tr>
            </thead>
            <tbody>
              {report.deadStock.map((item, index) => (
                <tr key={`${item.productId}-${item.variantId || index}`}>
                  <td>{item.productName}{item.variantName ? ` - ${item.variantName}` : ''}</td>
                  <td>{item.currentStock}</td>
                  <td>{formatCurrency(item.inventoryValue)}</td>
                  <td>{item.daysSinceLastSale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const TaxReportView: React.FC<{ report: TaxReportDto }> = ({ report }) => {
  // Calculate effective tax rate
  const effectiveTaxRate = report.totalSalesNet > 0
    ? (report.totalVatCollected / report.totalSalesNet) * 100
    : 0;

  return (
    <div className="tax-report">
      {/* KPIs */}
      <div className="report-kpis">
        <div className="kpi-card">
          <div className="kpi-label">Celkové tržby (s DPH)</div>
          <div className="kpi-value">{formatCurrency(report.totalSalesGross)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Vybraná DPH</div>
          <div className="kpi-value">{formatCurrency(report.totalVatCollected)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Čisté tržby (bez DPH)</div>
          <div className="kpi-value">{formatCurrency(report.totalSalesNet)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Efektívna sadzba DPH</div>
          <div className="kpi-value">{effectiveTaxRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* VAT by Rate */}
      {report.vatRateBreakdown && report.vatRateBreakdown.length > 0 && (
        <div className="report-section">
          <h3>DPH podľa sadzby</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Sadzba</th>
                <th>Typ</th>
                <th>Základ</th>
                <th>DPH</th>
                <th>Transakcií</th>
              </tr>
            </thead>
            <tbody>
              {report.vatRateBreakdown.map((rate) => (
                <tr key={`${rate.vatRate}-${rate.rateType}`}>
                  <td>{rate.vatRate}%</td>
                  <td>{rate.rateType}</td>
                  <td>{formatCurrency(rate.salesNet)}</td>
                  <td>{formatCurrency(rate.vatAmount)}</td>
                  <td>{rate.transactionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VAT by Country */}
      {report.countryBreakdown && report.countryBreakdown.length > 0 && (
        <div className="report-section">
          <h3>DPH podľa krajiny</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Krajina</th>
                <th>EU</th>
                <th>Základ</th>
                <th>DPH</th>
                <th>Objednávky</th>
              </tr>
            </thead>
            <tbody>
              {report.countryBreakdown.map((country) => (
                <tr key={country.countryCode}>
                  <td>{country.countryName || country.countryCode}</td>
                  <td>{country.isEu ? '✓' : '-'}</td>
                  <td>{formatCurrency(country.salesNet)}</td>
                  <td>{formatCurrency(country.vatCollected)}</td>
                  <td>{country.orderCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reverse Charge */}
      {report.reverseChargeTotal && report.reverseChargeTotal > 0 && (
        <div className="report-section">
          <h3>Reverse Charge (B2B)</h3>
          <div className="exempt-sales-card">
            <div className="exempt-sales-value">{formatCurrency(report.reverseChargeTotal)}</div>
            <div className="exempt-sales-label">Celková hodnota B2B transakcií s reverse charge</div>
          </div>
        </div>
      )}

      {/* Monthly Breakdown */}
      {report.monthlyBreakdown && report.monthlyBreakdown.length > 0 && (
        <div className="report-section">
          <h3>Mesačný prehľad</h3>
          <table className="report-table">
            <thead>
              <tr>
                <th>Mesiac</th>
                <th>Tržby (s DPH)</th>
                <th>Základ</th>
                <th>DPH</th>
              </tr>
            </thead>
            <tbody>
              {report.monthlyBreakdown.map((month) => (
                <tr key={`${month.year}-${month.month}`}>
                  <td>{month.monthLabel}</td>
                  <td>{formatCurrency(month.salesGross)}</td>
                  <td>{formatCurrency(month.salesNet)}</td>
                  <td>{formatCurrency(month.vatCollected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
