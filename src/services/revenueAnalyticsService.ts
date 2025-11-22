import { API_BASE_URL, defaultHeaders, withLangHeaders } from './apiUtils';
import { logInfo, logError } from '../services/logger';

// Response interfaces for revenue analytics
export interface RevenueSummary {
  totalRevenue: number;
  avgDailyRevenue: number;
  periodDays: number;
  currency: string;
}

export interface DailyRevenue {
  date: string; // YYYY-MM-DD format
  amount: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  revenue: number;
  orderCount: number;
  percentage: number;
}

export interface RevenueAnalyticsResponse {
  success: boolean;
  data: {
    summary: RevenueSummary;
    dailyRevenue: DailyRevenue[];
    topProducts: TopProduct[];
    lastUpdated: string;
  };
}

export interface RevenueAnalyticsError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export const revenueAnalyticsService = {
  // Get complete revenue analytics from optimized backend endpoint
  async getRevenueAnalytics(days: number = 30): Promise<RevenueAnalyticsResponse['data']> {
    try {
      logInfo(`🔄 Loading revenue analytics for ${days} days from backend...`);

      const resp = await fetch(`${API_BASE_URL}/api/admin/dashboard/revenue-analytics?days=${days}`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
      }));

      if (!resp.ok) {
        throw new Error(`Revenue analytics API failed: ${resp.status} ${resp.statusText}`);
      }

      const response = await resp.json() as RevenueAnalyticsResponse | RevenueAnalyticsError;

      if (!response.success) {
        const errorResponse = response as RevenueAnalyticsError;
        throw new Error(errorResponse.error.message);
      }

      const successResponse = response as RevenueAnalyticsResponse;
      logInfo('✅ Revenue analytics loaded successfully:', successResponse.data);

      return successResponse.data;
    } catch (err) {
      logError('❌ Failed to fetch revenue analytics:', err);

      // Return fallback data structure to prevent UI crashes
      const fallbackData: RevenueAnalyticsResponse['data'] = {
        summary: {
          totalRevenue: 0,
          avgDailyRevenue: 0,
          periodDays: days,
          currency: 'EUR'
        },
        dailyRevenue: this.generateEmptyDailyRevenue(days),
        topProducts: [],
        lastUpdated: new Date().toISOString()
      };

      logInfo('📦 Using fallback revenue data');
      return fallbackData;
    }
  },

  // Generate empty daily revenue structure for fallback
  generateEmptyDailyRevenue(days: number): DailyRevenue[] {
    const now = new Date();
    const emptyData: DailyRevenue[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      emptyData.push({
        date: dateStr,
        amount: 0,
        orderCount: 0
      });
    }

    return emptyData;
  },

  // Format currency values
  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('sk-SK', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  // Calculate percentage change between periods
  calculateGrowth(current: number, previous: number): { percentage: number; trend: 'up' | 'down' | 'stable' } {
    if (previous === 0) {
      return { percentage: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'stable' };
    }

    const percentage = ((current - previous) / previous) * 100;

    return {
      percentage: Math.abs(percentage),
      trend: percentage > 5 ? 'up' : percentage < -5 ? 'down' : 'stable'
    };
  }
};