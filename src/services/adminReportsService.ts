/**
 * Admin Reports Service
 * Handles API communication for advanced reporting and analytics
 */

import { apiClient } from './apiClient';

// === Types ===

export type ReportType = 'SALES' | 'PRODUCT_PERFORMANCE' | 'CUSTOMER' | 'INVENTORY' | 'TAX';
export type PeriodType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
export type ExportFormat = 'CSV' | 'XLSX' | 'PDF';

// Sales Report (matches BE SalesReportDto)
export interface SalesReportDto {
  startDate: string;
  endDate: string;
  periodType: string;
  // Summary
  totalRevenue: number;
  totalCost: number | null;
  grossProfit: number | null;
  netRevenue: number | null;
  totalOrders: number;
  totalItems: number;
  averageOrderValue: number;
  // Refunds
  refundCount: number;
  refundTotal: number | null;
  refundRate: number;
  // Taxes & Shipping
  taxCollected: number | null;
  shippingRevenue: number | null;
  shippingCost: number | null;
  // Breakdowns
  periodBreakdown: PeriodSales[];
  categoryBreakdown: CategorySales[];
  paymentBreakdown: PaymentMethodSales[];
  countryBreakdown: CountrySales[];
  topProducts: TopProduct[];
  // Comparison with previous period (percentages)
  revenueChange: number | null;
  ordersChange: number | null;
  aovChange: number | null;
}

export interface PeriodSales {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface CategorySales {
  categoryId: number | null;
  categoryName: string;
  revenue: number;
  itemsSold: number;
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
  variantId: number | null;
  productName: string;
  variantName: string | null;
  sku: string;
  quantitySold: number;
  revenue: number;
}

// Product Performance Report (matches BE ProductPerformanceReportDto)
export interface ProductPerformanceReportDto {
  startDate: string;
  endDate: string;
  // Summary
  totalProducts: number;
  activeProducts: number;
  productsWithSales: number;
  totalRevenue: number;
  totalUnitsSold: number;
  // Lists
  products: ProductPerformance[];
  bestSellers: ProductPerformance[];
  slowMoving: ProductPerformance[];
  outOfStock: ProductStock[];
  lowStock: ProductStock[];
}

export interface ProductPerformance {
  productId: number;
  variantId: number | null;
  productName: string;
  variantName: string | null;
  sku: string;
  categoryName: string | null;
  // Sales metrics
  quantitySold: number;
  revenue: number;
  costOfGoods: number | null;
  grossProfit: number | null;
  profitMargin: number;
  // Velocity
  salesVelocity: number;
  daysToSellOut: number;
  // Rank
  revenueRank: number;
  quantityRank: number;
}

export interface ProductStock {
  productId: number;
  variantId: number | null;
  productName: string;
  variantName: string | null;
  sku: string;
  currentStock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  salesVelocity: number;
  daysOfStock: number;
}

// Customer Report (matches BE CustomerReportDto)
export interface CustomerReportDto {
  startDate: string;
  endDate: string;
  // Summary
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  retentionRate: number;
  averageCustomerValue: number;
  // CLV
  averageCLV: number | null;
  totalCLV: number | null;
  // Orders
  averageOrdersPerCustomer: number;
  repeatPurchaseRate: number;
  // Breakdowns
  acquisitionSources: AcquisitionSource[];
  segments: SegmentStats[];
  topCustomers: TopCustomer[];
  rfmSegments: RfmSegment[];
  registrationTrend: RegistrationTrend[];
}

export interface AcquisitionSource {
  source: string;
  customers: number;
  percentage: number;
  revenue: number;
}

export interface SegmentStats {
  segmentId: number | null;
  segmentName: string;
  customerCount: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface TopCustomer {
  userId: number;
  email: string;
  name: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  cassandraRank: string | null;
  xpPoints: number;
}

export interface RfmSegment {
  segment: string;
  customerCount: number;
  percentage: number;
  averageRevenue: number;
  description: string;
}

export interface RegistrationTrend {
  date: string;
  label: string;
  registrations: number;
  firstPurchases: number;
  conversionRate: number;
}

// Inventory Report (matches BE InventoryReportDto)
export interface InventoryReportDto {
  reportDate: string;
  // Summary
  totalSkus: number;
  inStockSkus: number;
  outOfStockSkus: number;
  lowStockSkus: number;
  totalInventoryValue: number | null;
  totalInventoryRetailValue: number | null;
  // Breakdowns
  stockStatusBreakdown: StockStatusBreakdown[];
  categoryBreakdown: CategoryInventory[];
  stockMovements: StockMovement[];
  deadStock: DeadStock[];
  reorderRecommendations: ReorderRecommendation[];
  // Turnover
  averageTurnoverRate: number;
  averageDaysToSell: number;
}

export interface StockStatusBreakdown {
  status: string;
  skuCount: number;
  totalUnits: number;
  percentage: number;
}

export interface CategoryInventory {
  categoryId: number | null;
  categoryName: string;
  skuCount: number;
  totalUnits: number;
  inventoryValue: number;
  turnoverRate: number;
}

export interface StockMovement {
  date: string;
  period: string;
  unitsReceived: number;
  unitsSold: number;
  unitsAdjusted: number;
  netChange: number;
}

export interface ReorderRecommendation {
  productId: number;
  variantId: number | null;
  productName: string;
  variantName: string | null;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  suggestedOrderQuantity: number;
  dailySalesVelocity: number;
  daysUntilStockout: number;
  urgency: string;
}

export interface DeadStock {
  productId: number;
  variantId: number | null;
  productName: string;
  variantName: string | null;
  sku: string;
  currentStock: number;
  inventoryValue: number;
  daysSinceLastSale: number;
  lastSaleDate: string | null;
}

// Tax Report (matches BE TaxReportDto)
export interface TaxReportDto {
  startDate: string;
  endDate: string;
  // Summary
  totalSalesGross: number;
  totalSalesNet: number;
  totalVatCollected: number;
  totalRefundedVat: number | null;
  netVatLiability: number | null;
  // Breakdowns
  vatRateBreakdown: VatRateBreakdown[];
  countryBreakdown: CountryVatBreakdown[];
  reverseChargeTransactions: ReverseChargeTransaction[];
  reverseChargeTotal: number | null;
  monthlyBreakdown: MonthlyTax[];
  // Digital goods (EU VAT MOSS)
  digitalGoodsSales: number | null;
  digitalGoodsVat: number | null;
}

export interface VatRateBreakdown {
  vatRate: number;
  rateType: string;
  salesNet: number;
  vatAmount: number;
  transactionCount: number;
}

export interface CountryVatBreakdown {
  countryCode: string;
  countryName: string;
  salesGross: number;
  salesNet: number;
  vatCollected: number;
  orderCount: number;
  isEu: boolean;
}

export interface ReverseChargeTransaction {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  vatNumber: string;
  countryCode: string;
  netAmount: number;
  description: string;
}

export interface MonthlyTax {
  year: number;
  month: number;
  monthLabel: string;
  salesGross: number;
  salesNet: number;
  vatCollected: number;
  refundedVat: number;
  netVat: number;
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

const BASE_PATH = '/api/admin/reports';

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
    includeComparison: String(includeComparison),
    topProductsLimit: String(topProductsLimit)
  });
  return apiClient.get<SalesReportDto>(`${BASE_PATH}/sales?${params}`);
};

/**
 * Get quick sales summary for dashboard.
 */
export const getSalesSummary = async (
  startDate: string,
  endDate: string
): Promise<SalesReportDto> => {
  const params = new URLSearchParams({ startDate, endDate });
  return apiClient.get<SalesReportDto>(`${BASE_PATH}/sales/summary?${params}`);
};

/**
 * Get product performance report.
 */
export const getProductPerformanceReport = async (
  startDate: string,
  endDate: string,
  limit = 20
): Promise<ProductPerformanceReportDto> => {
  const params = new URLSearchParams({ startDate, endDate, limit: String(limit) });
  return apiClient.get<ProductPerformanceReportDto>(`${BASE_PATH}/products?${params}`);
};

/**
 * Get best selling products.
 */
export const getBestSellers = async (
  startDate: string,
  endDate: string,
  limit = 10
): Promise<ProductPerformance[]> => {
  const params = new URLSearchParams({ startDate, endDate, limit: String(limit) });
  return apiClient.get<ProductPerformance[]>(`${BASE_PATH}/products/best-sellers?${params}`);
};

/**
 * Get customer analytics report.
 */
export const getCustomerReport = async (
  startDate: string,
  endDate: string,
  topCustomersLimit = 10
): Promise<CustomerReportDto> => {
  const params = new URLSearchParams({ startDate, endDate, topCustomersLimit: String(topCustomersLimit) });
  return apiClient.get<CustomerReportDto>(`${BASE_PATH}/customers?${params}`);
};

/**
 * Get top customers by revenue.
 */
export const getTopCustomers = async (
  startDate: string,
  endDate: string,
  limit = 10
): Promise<TopCustomer[]> => {
  const params = new URLSearchParams({ startDate, endDate, limit: String(limit) });
  return apiClient.get<TopCustomer[]>(`${BASE_PATH}/customers/top?${params}`);
};

/**
 * Get inventory report.
 */
export const getInventoryReport = async (): Promise<InventoryReportDto> => {
  return apiClient.get<InventoryReportDto>(`${BASE_PATH}/inventory`);
};

/**
 * Get products needing reorder.
 */
export const getReorderRecommendations = async (): Promise<ReorderRecommendation[]> => {
  return apiClient.get<ReorderRecommendation[]>(`${BASE_PATH}/inventory/reorder`);
};

/**
 * Get tax report.
 */
export const getTaxReport = async (
  startDate: string,
  endDate: string
): Promise<TaxReportDto> => {
  const params = new URLSearchParams({ startDate, endDate });
  return apiClient.get<TaxReportDto>(`${BASE_PATH}/tax?${params}`);
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
  const params = new URLSearchParams({ reportType, startDate, endDate });
  if (periodType) params.append('periodType', periodType);
  const response = await fetch(`${BASE_PATH}/export/csv?${params}`, {
    method: 'GET',
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Export failed');
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
  const params = new URLSearchParams({ reportType, startDate, endDate });
  if (periodType) params.append('periodType', periodType);
  const response = await fetch(`${BASE_PATH}/export/excel?${params}`, {
    method: 'GET',
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Export failed');
  return response.blob();
};

/**
 * Get available report types.
 */
export const getReportTypes = async (): Promise<string[]> => {
  return apiClient.get<string[]>(`${BASE_PATH}/types`);
};

/**
 * Get available period types.
 */
export const getPeriodTypes = async (): Promise<string[]> => {
  return apiClient.get<string[]>(`${BASE_PATH}/periods`);
};

/**
 * Get date range presets.
 */
export const getDatePresets = async (): Promise<DateRangePresets> => {
  return apiClient.get<DateRangePresets>(`${BASE_PATH}/presets`);
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
