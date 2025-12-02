/**
 * Admin Funnel Analytics Service
 * API communication for conversion funnel analysis
 */

import { apiClient } from './apiClient';

// === Types ===

export interface FunnelStageDto {
  stage: string;
  stageName: string;
  order: number;
  count: number;
  conversionRate: number;
  dropOffRate: number;
  dropOffCount: number;
  overallConversionRate: number;
  avgTimeAtStage: number | null;
  revenue: number | null;
}

export interface FunnelBreakdownDto {
  dimension: string;
  label: string;
  visitors: number;
  purchases: number;
  conversionRate: number;
  revenue: number;
  visitorShare: number;
  revenueShare: number;
  addToCartRate: number | null;
  checkoutRate: number | null;
}

export interface DailyFunnelDto {
  date: string;
  dateLabel: string;
  visitors: number;
  productViews: number;
  addToCarts: number;
  checkoutStarts: number;
  purchases: number;
  conversionRate: number;
  revenue: number;
  averageOrderValue: number;
  viewToCartRate: number;
  cartToCheckoutRate: number;
  checkoutToPurchaseRate: number;
}

export interface DropOffInsightDto {
  fromStage: string;
  fromStageName: string;
  toStage: string;
  toStageName: string;
  dropOffRate: number;
  dropOffCount: number;
  potentialRevenueLoss: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendation: string;
  benchmarkRate: number | null;
  benchmarkDifference: number | null;
}

export interface ConversionPathDto {
  path: string[];
  pathDescription: string;
  userCount: number;
  percentage: number;
  avgDuration: number | null;
  avgRevenue: number | null;
  totalRevenue: number | null;
  touchpoints: number;
  directPath: boolean;
}

export interface FunnelReportDto {
  startDate: string;
  endDate: string;
  stages: FunnelStageDto[];
  totalVisitors: number;
  totalPurchases: number;
  overallConversionRate: number;
  totalRevenue: number;
  averageOrderValue: number;
  avgTimeToConversion: number | null;
  medianTimeToConversion: number | null;
  visitorsChange: number | null;
  purchasesChange: number | null;
  conversionRateChange: number | null;
  revenueChange: number | null;
  byDevice: Record<string, FunnelBreakdownDto>;
  bySource: Record<string, FunnelBreakdownDto>;
  dailyTrend: DailyFunnelDto[];
  dropOffInsights: DropOffInsightDto[];
}

export interface StageComparisonDto {
  stage: string;
  stageName: string;
  period1Count: number;
  period1Rate: number;
  period2Count: number;
  period2Rate: number;
  countChange: number;
  rateChange: number | null;
}

export interface FunnelComparisonDto {
  period1Start: string;
  period1End: string;
  period1Label: string;
  period2Start: string;
  period2End: string;
  period2Label: string;
  period1Visitors: number;
  period1Purchases: number;
  period1ConversionRate: number;
  period1Revenue: number;
  period2Visitors: number;
  period2Purchases: number;
  period2ConversionRate: number;
  period2Revenue: number;
  visitorsChange: number;
  purchasesChange: number;
  conversionRateChange: number;
  revenueChange: number;
  stageComparisons: StageComparisonDto[];
}

export interface FunnelStageDefinition {
  code: string;
  name: string;
  description: string;
  order: number;
}

// === API Functions ===

const BASE_PATH = '/api/admin/funnel';

/**
 * Get complete funnel report.
 */
export const getFunnelReport = async (
  startDate: string,
  endDate: string,
  includeComparison = true
): Promise<FunnelReportDto> => {
  const params = new URLSearchParams({ startDate, endDate, includeComparison: String(includeComparison) });
  return apiClient.get<FunnelReportDto>(`${BASE_PATH}/report?${params}`);
};

/**
 * Get funnel stages.
 */
export const getFunnelStages = async (
  startDate: string,
  endDate: string
): Promise<FunnelStageDto[]> => {
  const params = new URLSearchParams({ startDate, endDate });
  return apiClient.get<FunnelStageDto[]>(`${BASE_PATH}/stages?${params}`);
};

/**
 * Get daily funnel trend.
 */
export const getDailyTrend = async (
  startDate: string,
  endDate: string
): Promise<DailyFunnelDto[]> => {
  const params = new URLSearchParams({ startDate, endDate });
  return apiClient.get<DailyFunnelDto[]>(`${BASE_PATH}/daily-trend?${params}`);
};

/**
 * Get funnel breakdown by device.
 */
export const getBreakdownByDevice = async (
  startDate: string,
  endDate: string
): Promise<FunnelBreakdownDto[]> => {
  const params = new URLSearchParams({ startDate, endDate });
  return apiClient.get<FunnelBreakdownDto[]>(`${BASE_PATH}/breakdown/device?${params}`);
};

/**
 * Get funnel breakdown by traffic source.
 */
export const getBreakdownBySource = async (
  startDate: string,
  endDate: string
): Promise<FunnelBreakdownDto[]> => {
  const params = new URLSearchParams({ startDate, endDate });
  return apiClient.get<FunnelBreakdownDto[]>(`${BASE_PATH}/breakdown/source?${params}`);
};

/**
 * Get drop-off insights.
 */
export const getDropOffInsights = async (
  startDate: string,
  endDate: string
): Promise<DropOffInsightDto[]> => {
  const params = new URLSearchParams({ startDate, endDate });
  return apiClient.get<DropOffInsightDto[]>(`${BASE_PATH}/drop-off?${params}`);
};

/**
 * Get conversion paths.
 */
export const getConversionPaths = async (
  startDate: string,
  endDate: string,
  limit = 10
): Promise<ConversionPathDto[]> => {
  const params = new URLSearchParams({ startDate, endDate, limit: String(limit) });
  return apiClient.get<ConversionPathDto[]>(`${BASE_PATH}/paths?${params}`);
};

/**
 * Compare two periods.
 */
export const comparePeriods = async (
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string
): Promise<FunnelComparisonDto> => {
  const params = new URLSearchParams({ period1Start, period1End, period2Start, period2End });
  return apiClient.get<FunnelComparisonDto>(`${BASE_PATH}/compare?${params}`);
};

/**
 * Get stage definitions.
 */
export const getStageDefinitions = async (): Promise<FunnelStageDefinition[]> => {
  return apiClient.get<FunnelStageDefinition[]>(`${BASE_PATH}/stages/definitions`);
};

// === Utility Functions ===

/**
 * Format number with thousands separator.
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('sk-SK').format(value);
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
  return `${value.toFixed(2)}%`;
};

/**
 * Format percentage change with sign.
 */
export const formatChange = (value: number | null): string => {
  if (value === null) return '-';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

/**
 * Get severity color.
 */
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH': return '#f97316';
    case 'MEDIUM': return '#eab308';
    case 'LOW': return '#22c55e';
    default: return '#6b7280';
  }
};

/**
 * Get stage color.
 */
export const getStageColor = (index: number): string => {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e'];
  return colors[index % colors.length];
};

/**
 * Format duration from seconds.
 */
export const formatDuration = (seconds: number | null): string => {
  if (seconds === null) return '-';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

export default {
  getFunnelReport,
  getFunnelStages,
  getDailyTrend,
  getBreakdownByDevice,
  getBreakdownBySource,
  getDropOffInsights,
  getConversionPaths,
  comparePeriods,
  getStageDefinitions,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatChange,
  getSeverityColor,
  getStageColor,
  formatDuration
};
