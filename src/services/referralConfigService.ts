/**
 * Referral Configuration API Service
 *
 * Admin-only service for managing referral program settings.
 */

import { apiClient } from './apiClient';

// =========================================================================
// TYPE DEFINITIONS
// =========================================================================

export interface ReferralConfigDto {
  id: number; // Always 1 (singleton)

  // Reward Amounts
  firstOrderReward: number;
  bonusReward: number;
  welcomeDiscountAmount: number;

  // Thresholds
  bonusOrderThreshold: number;
  minOrderForDiscount: number;
  maxReferralsPerMonth: number;

  // Settings
  pendingPeriodDays: number;

  // Audit
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface UpdateReferralConfigRequest {
  firstOrderReward: number;
  bonusReward: number;
  welcomeDiscountAmount: number;
  bonusOrderThreshold: number;
  minOrderForDiscount: number;
  maxReferralsPerMonth: number;
  pendingPeriodDays: number;
}

// =========================================================================
// REFERRAL CONFIG SERVICE (ADMIN ONLY)
// =========================================================================

class ReferralConfigService {
  private readonly BASE_URL = '/api/admin/referral-config';

  /**
   * Get current referral configuration
   * ADMIN ONLY
   */
  async getConfig(): Promise<ReferralConfigDto> {
    return apiClient.get<ReferralConfigDto>(this.BASE_URL, {
      cache: true,
      cacheType: 'user-data'
    });
  }

  /**
   * Update referral configuration
   * ADMIN ONLY
   */
  async updateConfig(config: UpdateReferralConfigRequest): Promise<ReferralConfigDto> {
    return apiClient.put<ReferralConfigDto>(this.BASE_URL, config);
  }
}

// =========================================================================
// EXPORTS
// =========================================================================

export const referralConfigService = new ReferralConfigService();
