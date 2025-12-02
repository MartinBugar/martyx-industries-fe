/**
 * Admin Reports Service
 * Handles API communication for advanced reporting and analytics
 */

import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

// === Types ===

export type ReportType = 'SALES' | 'PRODUCT_PERFORMANCE' | 'CUSTOMER' | 'INVENTORY' | 'TAX';
export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type ExportFormat = 'CSV' | 'XLSX' | 'PDF';

// Sales Report
export interface SalesReportDto {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalShipping: number;
  totalTax: number;
  previousPeriodRevenue: number;
  previousPeriodOrders: number;
  revenueGrowthPercent: number;
  orderGrowthPercent: number;
  periodBreakdown: PeriodSales[];
  categorySales: CategorySales[];
  paymentMethodSales: PaymentMethodSales[];
  countrySales: CountrySales[];
  topProducts: TopProduct[];
  startDate: string;
  endDate: string;
  periodType: PeriodType;
}

export interface PeriodSales {
  label: string;
  startDate: string;
  endDate: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
}

export interface CategorySales {
  categoryId: number;
  categoryName: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface PaymentMethodSales {
  paymentMethod: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface CountrySales {
  countryCode: string;
  countryName: string;
  revenue: number;
  orders: number;
  percentage: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  variantsSold: number;
  revenue: number;
  avgPrice: number;
}

// Product Performance Report
export interface ProductPerformanceReportDto {
  totalProducts: number;
  totalVariants: number;
  productsWithSales: number;
  productsWithNoSales: number;
  topPerformers: ProductPerformance[];
  lowPerformers: ProductPerformance[];
  stockStatus: ProductStock[];
  startDate: string;
  endDate: string;
}

export interface ProductPerformance {
  productId: number;
  productName: string;
  variantId: number | null;
  variantName: string | null;
  quantitySold: number;
  revenue: number;
  avgPrice: number;
  conversionRate: number;
  returnsCount: number;
}

export interface ProductStock {
  productId: number;
  productName: string;
  variantId: number | null;
  variantName: string | null;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

// Customer Report
export interface CustomerReportDto {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageCustomerValue: number;
  averageOrdersPerCustomer: number;
  topCustomers: TopCustomer[];
  rfmSegments: RfmSegment[];
  registrationTrend: RegistrationTrend[];
  startDate: string;
  endDate: string;
}

export interface TopCustomer {
  userId: number;
  email: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate: string;
  xpPoints: number;
}

export interface RfmSegment {
  segment: string;
  description: string;
  customerCount: number;
  percentageOfTotal: number;
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
}

export interface RegistrationTrend {
  date: string;
  label: string;
  registrations: number;
}

// Inventory Report
export interface InventoryReportDto {
  totalProducts: number;
  totalVariants: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  stockByStatus: StockStatusBreakdown[];
  reorderRecommendations: ReorderRecommendation[];
  deadStock: DeadStock[];
}

export interface StockStatusBreakdown {
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  count: number;
  percentage: number;
  totalValue: number;
}

export interface ReorderRecommendation {
  productId: number;
  productName: string;
  variantId: number | null;
  variantName: string | null;
  currentStock: number;
  reorderLevel: number;
  suggestedOrderQuantity: number;
  lastSaleDate: string;
  avgDailySales: number;
  daysUntilStockout: number;
}

export interface DeadStock {
  productId: number;
  productName: string;
  variantId: number | null;
  variantName: string | null;
  currentStock: number;
  stockValue: number;
  daysSinceLastSale: number;
  lastSaleDate: string | null;
}

// Tax Report
export interface TaxReportDto {
  totalRevenue: number;
  totalTaxCollected: number;
  netRevenue: number;
  effectiveTaxRate: number;
  vatByRate: VatRateBreakdown[];
  vatByCountry: CountryVatBreakdown[];
  exemptSales: number;
  startDate: string;
  endDate: string;
}

export interface VatRateBreakdown {
  vatRate: number;
  salesAmount: number;
  vatAmount: number;
  transactionCount: number;
}

export interface CountryVatBreakdown {
  countryCode: string;
  countryName: string;
  salesAmount: number;
  vatAmount: number;
  transactionCount: number;
  vatRates: VatRateBreakdown[];
}

// Date Range Presets
export interface DateRangePreset {
  startDate: string;
  endDate: string;
}

export interface DateRangePresets {
  today: DateRangePreset;
  yesterday: DateRangePreset;
  last7Days: DateRangePreset;
  last30Days: DateRangePreset;
  thisMonth: DateRangePreset;
  lastMonth: DateRangePreset;
  thisQuarter: DateRangePreset;
  thisYear: DateRangePreset;
}

// === API Functions ===

const BASE_URL = `${API_BASE_URL}/api/admin/reports`;
const jsonHeaders = () => defaultHeaders as HeadersInit;

/**
 * Get sales report for date range.
 */
export const getSalesReport = async (
  startDate: string,
  endDate: string,
  periodType: PeriodType = 'DAILY',
  includeComparison = true,
  topProductsLimit = 10
): Promise<SalesReportDto> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    periodType,
    includeComparison: includeComparison.toString(),
    topProductsLimit: topProductsLimit.toString()
  });
  const response = await fetch(`${BASE_URL}/sales?${params.toString()}`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
};

/**
 * Get quick sales summary for dashboard.
 */
export const getSalesSummary = async (
  startDate: string,
  endDate: string
): Promise<SalesReportDto> => {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`${BASE_URL}/sales/summary?${params.toString()}`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
};

/**
 * Get product performance report.
 */
export const getProductPerformanceReport = async (
  startDate: string,
  endDate: string,
  limit = 20
): Promise<ProductPerformanceReportDto> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    limit: limit.toString()
  });
  const response = await fetch(`${BASE_URL}/products?${params.toString()}`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
};

/**
 * Get best selling products.
 */
export const getBestSellers = async (
  startDate: string,
  endDate: string,
  limit = 10
): Promise<ProductPerformance[]> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    limit: limit.toString()
  });
  const response = await fetch(`${BASE_URL}/products/best-sellers?${params.toString()}`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
};

/**
 * Get customer analytics report.
 */
export const getCustomerReport = async (
  startDate: string,
  endDate: string,
  topCustomersLimit = 10
): Promise<CustomerReportDto> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    topCustomersLimit: topCustomersLimit.toString()
  });
  const response = await fetch(`${BASE_URL}/customers?${params.toString()}`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
};

/**
 * Get top customers by revenue.
 */
export const getTopCustomers = async (
  startDate: string,
  endDate: string,
  limit = 10
): Promise<TopCustomer[]> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
    limit: limit.toString()
  });
  const response = await fetch(`${BASE_URL}/customers/top?${params.toString()}`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
};

/**
 * Get inventory report.
 */
export const getInventoryReport = async (): Promise<InventoryReportDto> => {
  const response = await fetch(`${BASE_URL}/inventory`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
};

/**
 * Get products needing reorder.
 */
export const getReorderRecommendations = async (): Promise<ReorderRecommendation[]> => {
  const response = await fetch(`${BASE_URL}/inventory/reorder`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
};

/**
 * Get tax report.
 */
export const getTaxReport = async (
  startDate: string,
  endDate: string
): Promise<TaxReportDto> => {
  const params = new URLSearchParams({ startDate, endDate });
  const response = await fetch(`${BASE_URL}/tax?${params.toString()}`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
};

/**
 * Export report to CSV.
 */
export const exportToCsv = async (
  reportType: ReportType,
  startDate: string,
  endDate: string,
  periodType?: PeriodType
): Promise<Blob> => {
  const params = new URLSearchParams({
    reportType,
    startDate,
    endDate
  });
  if (periodType) params.append('periodType', periodType);

  const response = await fetch(`${BASE_URL}/export/csv?${params.toString()}`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }
  return response.blob();
};

/**
 * Export report to Excel.
 */
export const exportToExcel = async (
  reportType: ReportType,
  startDate: string,
  endDate: string,
  periodType?: PeriodType
): Promise<Blob> => {
  const params = new URLSearchParams({
    reportType,
    startDate,
    endDate
  });
  if (periodType) params.append('periodType', periodType);

  const response = await fetch(`${BASE_URL}/export/excel?${params.toString()}`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }
  return response.blob();
};

/**
 * Get available report types.
 */
export const getReportTypes = async (): Promise<string[]> => {
  const response = await fetch(`${BASE_URL}/types`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
};

/**
 * Get available period types.
 */
export const getPeriodTypes = async (): Promise<string[]> => {
  const response = await fetch(`${BASE_URL}/periods`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
};

/**
 * Get date range presets.
 */
export const getDatePresets = async (): Promise<DateRangePresets> => {
  const response = await fetch(`${BASE_URL}/presets`, withLangHeaders({
    method: 'GET',
    headers: jsonHeaders()
  }));
  return handleResponse(response);
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
 * Format currency.
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
};

/**
 * Format percentage.
 */
export const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};

/**
 * Format date for display.
 */
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('sk-SK', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Get report type label.
 */
export const getReportTypeLabel = (type: ReportType): string => {
  const labels: Record<ReportType, string> = {
    SALES: 'Predaj',
    PRODUCT_PERFORMANCE: 'Produkty',
    CUSTOMER: 'Zákazníci',
    INVENTORY: 'Sklad',
    TAX: 'Dane'
  };
  return labels[type] || type;
};

/**
 * Get period type label.
 */
export const getPeriodTypeLabel = (type: PeriodType): string => {
  const labels: Record<PeriodType, string> = {
    DAILY: 'Denne',
    WEEKLY: 'Týždenne',
    MONTHLY: 'Mesačne',
    QUARTERLY: 'Kvartálne',
    YEARLY: 'Ročne'
  };
  return labels[type] || type;
};

/**
 * Get stock status label.
 */
export const getStockStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    IN_STOCK: 'Na sklade',
    LOW_STOCK: 'Nízky stav',
    OUT_OF_STOCK: 'Vypredané',
    OVERSTOCK: 'Prebytok'
  };
  return labels[status] || status;
};

/**
 * Get stock status color.
 */
export const getStockStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    IN_STOCK: '#10b981',
    LOW_STOCK: '#f59e0b',
    OUT_OF_STOCK: '#ef4444',
    OVERSTOCK: '#3b82f6'
  };
  return colors[status] || '#6b7280';
};

export default {
  getSalesReport,
  getSalesSummary,
  getProductPerformanceReport,
  getBestSellers,
  getCustomerReport,
  getTopCustomers,
  getInventoryReport,
  getReorderRecommendations,
  getTaxReport,
  exportToCsv,
  exportToExcel,
  getReportTypes,
  getPeriodTypes,
  getDatePresets,
  downloadBlob,
  formatCurrency,
  formatPercent,
  formatDate,
  getReportTypeLabel,
  getPeriodTypeLabel,
  getStockStatusLabel,
  getStockStatusColor
};
