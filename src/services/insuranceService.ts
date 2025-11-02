/**
 * Insurance Service
 * Handles shipping insurance quote calculations and management
 */

import { apiClient } from './apiClient';

// ===== TYPE DEFINITIONS =====

export interface InsuranceQuoteRequest {
  orderValue: number;
  shippingCountry: string;
}

export interface InsuranceQuote {
  insuranceCost: number;
  coverageAmount: number;
  provider: string;
  terms: string;
}

export interface AddInsuranceRequest {
  insuranceEnabled: boolean;
}

export interface AddInsuranceResponse {
  success: boolean;
  updatedTotal: number;
  message?: string;
}

export const insuranceService = {
  /**
   * Get insurance quote for an order
   * @param orderValue - Total order value in EUR
   * @param shippingCountry - Destination country code (e.g., 'SK', 'CZ')
   * @returns Insurance quote with cost and coverage details
   */
  getInsuranceQuote: async (orderValue: number, shippingCountry: string): Promise<InsuranceQuote> => {
    const params = new URLSearchParams({
      orderValue: orderValue.toString(),
      shippingCountry
    });
    return await apiClient.get<InsuranceQuote>(`/api/shipping/insurance-quote?${params}`);
  },

  /**
   * Add or remove insurance from an existing order
   * @param orderId - Order ID
   * @param insuranceEnabled - Whether to enable insurance
   * @returns Updated order total
   */
  addInsuranceToOrder: async (orderId: number, insuranceEnabled: boolean): Promise<AddInsuranceResponse> => {
    return await apiClient.post<AddInsuranceResponse>(`/api/orders/${orderId}/add-insurance`, {
      insuranceEnabled
    });
  },

  /**
   * Calculate insurance cost locally (fallback if backend not available)
   * Formula: 2% of order value, min �2.99, max �50
   * @param orderValue - Total order value in EUR
   * @returns Estimated insurance cost
   */
  calculateInsuranceCostLocally: (orderValue: number): number => {
    const percentage = 0.02; // 2%
    const minCost = 2.99;
    const maxCost = 50;

    let cost = orderValue * percentage;
    cost = Math.max(cost, minCost); // Apply minimum
    cost = Math.min(cost, maxCost); // Apply maximum

    return parseFloat(cost.toFixed(2));
  },

  /**
   * Get insurance coverage amount (usually equal to order value)
   * @param orderValue - Total order value in EUR
   * @returns Coverage amount
   */
  getCoverageAmount: (orderValue: number): number => {
    return orderValue;
  },

  /**
   * Format insurance terms for display
   * @returns Insurance terms text
   */
  getInsuranceTerms: (): string => {
    return `
Shipping insurance covers loss, damage, or theft during transit.
Coverage is provided by our shipping partner.
Claims must be filed within 30 days of expected delivery.
Coverage amount is equal to the order value.
Insurance cost is 2% of order value (min �2.99, max �50).
    `.trim();
  },

  /**
   * Check if insurance is recommended for this order
   * Recommendation logic: Orders > �100 should consider insurance
   * @param orderValue - Total order value in EUR
   * @returns Whether insurance is recommended
   */
  isInsuranceRecommended: (orderValue: number): boolean => {
    return orderValue >= 100;
  },

  /**
   * Get insurance provider name
   * @returns Provider name
   */
  getProviderName: (): string => {
    return 'Martyx Insurance Partners';
  }
};

export default insuranceService;
