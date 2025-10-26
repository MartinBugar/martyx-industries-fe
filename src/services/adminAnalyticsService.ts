import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type {
  AnalyticsEventDto,
  ConversionFunnelDto,
  FunnelAnalyticsDto,
  ProductAnalyticsDailyDto
} from '../types/analytics';

/**
 * Service for admin analytics and reporting operations
 */

// Spring Data Page response interface
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const adminAnalyticsService = {
  /**
   * Get analytics events with pagination and optional filters
   * @param page - Page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Sort field (default: 'eventTimestamp')
   * @param sortDir - Sort direction (default: 'DESC')
   * @param eventType - Optional event type filter
   * @param userId - Optional user ID filter
   * @param productId - Optional product ID filter
   * @param startDate - Optional start date filter (YYYY-MM-DD)
   * @param endDate - Optional end date filter (YYYY-MM-DD)
   * @returns Paginated list of analytics events
   */
  async getAnalyticsEvents(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'eventTimestamp',
    sortDir: string = 'DESC',
    eventType?: string,
    userId?: number,
    productId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<PageResponse<AnalyticsEventDto>> {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    });

    if (eventType) {
      params.append('eventType', eventType);
    }

    if (userId) {
      params.append('userId', userId.toString());
    }

    if (productId) {
      params.append('productId', productId.toString());
    }

    if (startDate) {
      params.append('startDate', startDate);
    }

    if (endDate) {
      params.append('endDate', endDate);
    }

    const resp = await fetch(`${API_BASE_URL}/api/admin/analytics/events?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as PageResponse<AnalyticsEventDto>;
  },

  /**
   * Get all conversion funnels
   * @returns List of all conversion funnels
   */
  async getAllFunnels(): Promise<ConversionFunnelDto[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/analytics/funnels`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ConversionFunnelDto[];
  },

  /**
   * Get analytics for a specific conversion funnel
   * @param id - Funnel ID
   * @param startDate - Start date for analytics period (YYYY-MM-DD)
   * @param endDate - End date for analytics period (YYYY-MM-DD)
   * @returns Funnel analytics data
   */
  async getFunnelAnalytics(
    id: number,
    startDate: string,
    endDate: string
  ): Promise<FunnelAnalyticsDto> {
    const params = new URLSearchParams({
      startDate,
      endDate
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/analytics/funnels/${id}/analytics?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as FunnelAnalyticsDto;
  },

  /**
   * Get product performance metrics for a date range
   * @param startDate - Start date for metrics period (YYYY-MM-DD)
   * @param endDate - End date for metrics period (YYYY-MM-DD)
   * @returns Product performance metrics
   */
  async getProductPerformance(
    startDate: string,
    endDate: string
  ): Promise<ProductAnalyticsDailyDto[]> {
    const params = new URLSearchParams({
      startDate,
      endDate
    });

    const resp = await fetch(`${API_BASE_URL}/api/admin/analytics/products/performance?${params}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as ProductAnalyticsDailyDto[];
  },

  /**
   * Trigger daily metrics aggregation for a specific date
   * @param date - Date to aggregate metrics for (YYYY-MM-DD)
   * @returns Aggregation result
   */
  async aggregateDailyMetrics(date: string): Promise<Record<string, any>> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/analytics/aggregate/${date}`, {
      method: 'POST',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp);
  },
};
