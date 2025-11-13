/**
 * Referral Program API Service
 *
 * Handles all referral-related API calls:
 * - Referral code management
 * - Click tracking
 * - Statistics
 * - Sharing
 */

import { apiClient } from './apiClient';

// =========================================================================
// TYPE DEFINITIONS
// =========================================================================

export interface ReferralDto {
  id: number;
  referralCode: string;
  referrerId: number;
  referrerEmail: string;
  referredUserId?: number;
  referredEmail?: string;
  status: 'PENDING' | 'REGISTERED' | 'FIRST_ORDER' | 'ACTIVE' | 'BONUS_EARNED' | 'CANCELLED' | 'EXPIRED';
  firstOrderPlaced: boolean;
  referrerRewardAmount?: number;
  referrerRewardPaid: boolean;
  referrerRewardDate?: string;
  bonusRewardEligible: boolean;
  bonusRewardAmount?: number;
  bonusRewardPaid: boolean;
  bonusRewardDate?: string;
  referredDiscountAmount?: number;
  referredDiscountApplied: boolean;
  referredTotalOrders: number;
  referredTotalSpent: number;
  referralSource?: string;
  createdAt: string;
  registeredAt?: string;
  firstOrderAt?: string;
  lastActivityAt?: string;
}

export interface ReferralStatsDto {
  referralCode: string;
  referralLink: string;

  // Click stats
  totalClicks: number;

  // Referral stats
  totalInvitationsSent: number;
  totalRegistrations: number;
  totalFirstOrders: number;
  totalActiveReferrals: number;

  // Earnings
  totalEarned: number;
  pendingEarnings: number;
  availableCredits: number;

  // Conversion rates
  clickToRegistrationRate: number;
  registrationToOrderRate: number;

  // Bonus tracking
  referralsEligibleForBonus: number;
  bonusEarned: number;
}

export interface ReferralCodeResponse {
  referralCode: string;
  referralUrl: string;
  sharingMessage: string;
}

export interface TrackClickRequest {
  referralCode: string;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface ShareReferralRequest {
  emails: string[];
  message?: string;
}

export interface ValidateCodeResponse {
  valid: boolean;
  referrerName?: string;
  discountAmount?: number;
  message?: string;
}

// =========================================================================
// REFERRAL SERVICE
// =========================================================================

class ReferralService {
  private readonly BASE_URL = '/api/referral';
  private readonly PUBLIC_URL = '/api/referral';

  /**
   * Get the current user's referral code
   */
  async getMyReferralCode(): Promise<ReferralCodeResponse> {
    return apiClient.get<ReferralCodeResponse>(`${this.BASE_URL}/my-code`);
  }

  /**
   * Get referral statistics for current user
   */
  async getMyStats(): Promise<ReferralStatsDto> {
    return apiClient.get<ReferralStatsDto>(`${this.BASE_URL}/stats`, {
      cache: true,
      cacheType: 'user-data'
    });
  }

  /**
   * Get all referrals for current user (paginated)
   */
  async getMyReferrals(_page: number = 0, _size: number = 20): Promise<ReferralDto[]> {
    return apiClient.get<ReferralDto[]>(`${this.BASE_URL}/my-referrals`, {
      cache: true,
      cacheType: 'user-data'
    });
  }

  /**
   * Track referral click (PUBLIC - no auth required)
   * Sets a 90-day cookie for attribution
   */
  async trackClick(code: string, source?: string): Promise<void> {
    const params = new URLSearchParams({ code });
    if (source) params.append('source', source);
    return apiClient.post<void>(`${this.PUBLIC_URL}/track-click?${params.toString()}`);
  }

  /**
   * Validate referral code (PUBLIC - no auth required)
   */
  async validateCode(code: string): Promise<ValidateCodeResponse> {
    return apiClient.get<ValidateCodeResponse>(`${this.BASE_URL}/validate/${code}`, {
      cache: true,
      cacheType: 'api-responses'
    });
  }

  /**
   * Share referral via email
   */
  async shareViaEmail(request: ShareReferralRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.BASE_URL}/share`, {
      recipientEmails: request.emails,
      personalMessage: request.message
    });
  }

  /**
   * Get referral by ID (for admin)
   */
  async getReferralById(id: number): Promise<ReferralDto> {
    return apiClient.get<ReferralDto>(`${this.BASE_URL}/${id}`);
  }
}

// =========================================================================
// USER CREDITS SERVICE
// =========================================================================

export interface UserCreditDto {
  id: number;
  userId: number;
  creditBalance: number;
  pendingBalance: number;
  totalEarned: number;
  totalSpent: number;
  lastEarnedAt?: string;
  lastSpentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransactionDto {
  id: number;
  userId: number;
  transactionType: 'REFERRAL_REWARD' | 'REFERRAL_BONUS' | 'ORDER_CREDIT_APPLIED' | 'ADMIN_ADJUSTMENT' | 'REFUND' | 'EXPIRY';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  orderId?: number;
  referralId?: number;
  description?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  ipAddress?: string;
}

export interface ApplyCreditRequest {
  orderId: number;
  amount: number;
}

export interface ApplyCreditResponse {
  appliedAmount: number;
  newBalance: number;
  orderTotal: number;
  message: string;
}

class UserCreditsService {
  private readonly BASE_URL = '/api/credits';

  /**
   * Get current user's credit balance
   */
  async getBalance(): Promise<UserCreditDto> {
    return apiClient.get<UserCreditDto>(`${this.BASE_URL}/balance`, {
      cache: true,
      cacheType: 'user-data',
      staleWhileRevalidate: true // Always show cached, update in background
    });
  }

  /**
   * Get credit transaction history
   */
  async getTransactions(page: number = 0, size: number = 50): Promise<CreditTransactionDto[]> {
    return apiClient.get<CreditTransactionDto[]>(`${this.BASE_URL}/transactions?page=${page}&size=${size}`, {
      cache: true,
      cacheType: 'user-data'
    });
  }

  /**
   * Apply credits to an order during checkout
   */
  async applyCredits(request: ApplyCreditRequest): Promise<ApplyCreditResponse> {
    return apiClient.post<ApplyCreditResponse>(`${this.BASE_URL}/apply`, {
      orderId: request.orderId,
      creditAmount: request.amount
    });
  }
}

// =========================================================================
// ADMIN REFERRAL SERVICE
// =========================================================================

export interface CreditSystemStatsDto {
  totalUsersWithCredits: number;
  totalCreditBalance: number;
  totalPendingBalance: number;
  totalLifetimeEarned: number;
  totalLifetimeSpent: number;
  totalActiveReferrals: number;
  totalSuccessfulReferrals: number;
  averageCreditPerUser: number;
  totalReferralRewardsPaid: number;
}

class AdminReferralService {
  private readonly BASE_URL = '/api/admin/referrals';

  /**
   * Get all referrals (paginated)
   */
  async getAllReferrals(page: number = 0, size: number = 50): Promise<ReferralDto[]> {
    return apiClient.get<ReferralDto[]>(`${this.BASE_URL}?page=${page}&size=${size}`);
  }

  /**
   * Search referrals
   */
  async searchReferrals(query: string, page: number = 0, size: number = 50): Promise<ReferralDto[]> {
    return apiClient.get<ReferralDto[]>(`${this.BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  }

  /**
   * Manually approve reward
   */
  async approveReward(referralId: number): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.BASE_URL}/${referralId}/approve-reward`);
  }

  /**
   * Cancel referral
   */
  async cancelReferral(referralId: number, reason: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.BASE_URL}/${referralId}/cancel`, { reason });
  }

  /**
   * Process pending rewards (manual trigger)
   */
  async processPendingRewards(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.BASE_URL}/process-rewards`);
  }

  /**
   * Expire old referrals (manual trigger)
   */
  async expireOldReferrals(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.BASE_URL}/expire-old`);
  }

  /**
   * Get system credit statistics
   */
  async getCreditStats(): Promise<CreditSystemStatsDto> {
    return apiClient.get<CreditSystemStatsDto>(`${this.BASE_URL}/credits/stats`);
  }

  /**
   * Add credits manually to user
   */
  async addCredits(userId: number, amount: number, reason: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.BASE_URL}/credits/${userId}/add`, {
      amount,
      reason
    });
  }

  /**
   * Deduct credits manually from user
   */
  async deductCredits(userId: number, amount: number, reason: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.BASE_URL}/credits/${userId}/deduct`, {
      amount,
      reason
    });
  }
}

// =========================================================================
// EXPORTS
// =========================================================================

export const referralService = new ReferralService();
export const userCreditsService = new UserCreditsService();
export const adminReferralService = new AdminReferralService();
