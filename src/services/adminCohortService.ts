/**
 * Admin Cohort Analytics Service
 * API communication for customer cohort analysis
 */

import api from './api';

// === Types ===

export interface RetentionPeriodDto {
  periodIndex: number;
  periodLabel: string;
  activeUsers: number;
  retentionRate: number;
  totalOrders: number;
  periodRevenue: number;
  averageOrderValue: number;
  retentionColor: string;
}

export interface CohortDto {
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

export interface CohortReportDto {
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

export interface CohortSummaryDto {
  totalCohorts: number;
  totalCustomers: number;
  totalLifetimeRevenue: number;
  averageLtv: number;
  averageRetention30Day: number;
  averageRetention60Day: number;
  averageRetention90Day: number;
  averageOrdersPerCustomer: number;
  averageOrderValue: number;
  ltvTrend: number | null;
  retentionTrend: number | null;
  cohortSizeTrend: number | null;
  bestCohortId: string | null;
  bestCohortLabel: string | null;
  bestCohortLtv: number | null;
  bestCohortRetention: number;
}

export interface RetentionComparisonDto {
  periodIndex: number;
  periodLabel: string;
  cohort1Retention: number;
  cohort2Retention: number;
  retentionDifference: number;
}

export interface CohortComparisonDto {
  cohort1Id: string;
  cohort1Label: string;
  cohort2Id: string;
  cohort2Label: string;
  cohort1Size: number;
  cohort2Size: number;
  sizeChange: number;
  cohort1Revenue: number;
  cohort2Revenue: number;
  revenueChange: number;
  cohort1Ltv: number;
  cohort2Ltv: number;
  ltvChange: number;
  retentionComparison: RetentionComparisonDto[];
  insights: string[];
}

export interface CohortTypeOption {
  code: string;
  name: string;
  description: string;
}

export interface GranularityOption {
  code: string;
  name: string;
  description: string;
}

// === API Functions ===

const BASE_PATH = '/api/admin/cohort';

/**
 * Get complete cohort report.
 */
export const getCohortReport = async (
  type: string,
  granularity: string,
  startDate: string,
  endDate: string,
  maxPeriods = 6
): Promise<CohortReportDto> => {
  const response = await api.get(`${BASE_PATH}/report`, {
    params: { type, granularity, startDate, endDate, maxPeriods }
  });
  return response.data;
};

/**
 * Get acquisition cohorts.
 */
export const getAcquisitionCohorts = async (
  startDate: string,
  endDate: string,
  granularity = 'MONTHLY',
  maxPeriods = 6
): Promise<CohortDto[]> => {
  const response = await api.get(`${BASE_PATH}/acquisition`, {
    params: { startDate, endDate, granularity, maxPeriods }
  });
  return response.data;
};

/**
 * Get behavioral cohorts.
 */
export const getBehavioralCohorts = async (
  startDate: string,
  endDate: string,
  maxPeriods = 6
): Promise<CohortDto[]> => {
  const response = await api.get(`${BASE_PATH}/behavioral`, {
    params: { startDate, endDate, maxPeriods }
  });
  return response.data;
};

/**
 * Get value cohorts.
 */
export const getValueCohorts = async (
  startDate: string,
  endDate: string,
  maxPeriods = 6
): Promise<CohortDto[]> => {
  const response = await api.get(`${BASE_PATH}/value`, {
    params: { startDate, endDate, maxPeriods }
  });
  return response.data;
};

/**
 * Get cohort summary.
 */
export const getCohortSummary = async (
  type: string,
  startDate: string,
  endDate: string
): Promise<CohortSummaryDto> => {
  const response = await api.get(`${BASE_PATH}/summary`, {
    params: { type, startDate, endDate }
  });
  return response.data;
};

/**
 * Compare two cohorts.
 */
export const compareCohorts = async (
  cohort1Id: string,
  cohort2Id: string
): Promise<CohortComparisonDto> => {
  const response = await api.get(`${BASE_PATH}/compare`, {
    params: { cohort1Id, cohort2Id }
  });
  return response.data;
};

/**
 * Get retention curve for a cohort.
 */
export const getRetentionCurve = async (
  cohortId: string,
  maxPeriods = 12
): Promise<RetentionPeriodDto[]> => {
  const response = await api.get(`${BASE_PATH}/retention/${cohortId}`, {
    params: { maxPeriods }
  });
  return response.data;
};

/**
 * Get cohort type options.
 */
export const getCohortTypeOptions = async (): Promise<CohortTypeOption[]> => {
  const response = await api.get(`${BASE_PATH}/types`);
  return response.data;
};

/**
 * Get granularity options.
 */
export const getGranularityOptions = async (): Promise<GranularityOption[]> => {
  const response = await api.get(`${BASE_PATH}/granularities`);
  return response.data;
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
  return `${value.toFixed(1)}%`;
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
 * Get retention color class based on rate.
 */
export const getRetentionColorClass = (rate: number): string => {
  if (rate >= 80) return 'excellent';
  if (rate >= 60) return 'good';
  if (rate >= 40) return 'average';
  if (rate >= 20) return 'poor';
  return 'critical';
};

export default {
  getCohortReport,
  getAcquisitionCohorts,
  getBehavioralCohorts,
  getValueCohorts,
  getCohortSummary,
  compareCohorts,
  getRetentionCurve,
  getCohortTypeOptions,
  getGranularityOptions,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatChange,
  getRetentionColorClass
};
