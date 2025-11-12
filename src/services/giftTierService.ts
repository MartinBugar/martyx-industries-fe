import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';

/**
 * Gift Tier DTO
 */
export interface GiftTierDTO {
  id: number;
  name: string;
  thresholdAmount: number;
  tierOrder: number;
  imageUrl?: string;
  imageKey?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create/Update Gift Tier Request
 */
export interface GiftTierRequest {
  name: string;
  thresholdAmount: number;
  tierOrder: number;
  isActive: boolean;
}

const jsonHeaders = () => defaultHeaders as HeadersInit;

/**
 * Public Gift Tier Service
 * For customer-facing gift progress bars
 */
export const giftTierService = {
  /**
   * Get all active gift tiers (public endpoint)
   * Used for displaying gift progress bars to customers
   * @returns List of active gift tiers sorted by tier order
   */
  async getActiveGiftTiers(): Promise<GiftTierDTO[]> {
    const resp = await fetch(`${API_BASE_URL}/api/gift-tiers/active`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as GiftTierDTO[];
  },

  /**
   * Get the applicable gift tier for a given cart amount
   * Returns the highest tier that the cart amount qualifies for
   * @param cartAmount - Total cart value in EUR
   * @returns Applicable gift tier or null if no tier matches
   */
  async getApplicableGift(cartAmount: number): Promise<GiftTierDTO | null> {
    if (cartAmount <= 0) {
      return null;
    }

    const resp = await fetch(`${API_BASE_URL}/api/gift-tiers/applicable?amount=${cartAmount}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    if (resp.status === 204) {
      return null; // No applicable tier
    }

    return await handleResponse(resp) as GiftTierDTO;
  },

  /**
   * Get the next gift tier above the given cart amount (next goal to unlock)
   * @param cartAmount - Total cart value in EUR
   * @returns Next gift tier or null if no higher tier exists
   */
  async getNextGift(cartAmount: number): Promise<GiftTierDTO | null> {
    const resp = await fetch(`${API_BASE_URL}/api/gift-tiers/next?amount=${cartAmount}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    if (resp.status === 204) {
      return null; // No next tier
    }

    return await handleResponse(resp) as GiftTierDTO;
  },
};

/**
 * Admin Gift Tier Service
 * For admin panel CRUD operations
 */
export const adminGiftTierService = {
  /**
   * Get all gift tiers (including inactive) for admin panel
   * @returns List of all gift tiers sorted by tier order
   */
  async getAllGiftTiers(): Promise<GiftTierDTO[]> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/gift-tiers`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as GiftTierDTO[];
  },

  /**
   * Get a specific gift tier by ID
   * @param id - Gift tier ID
   * @returns Gift tier details
   */
  async getGiftTierById(id: number): Promise<GiftTierDTO> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/gift-tiers/${id}`, {
      method: 'GET',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as GiftTierDTO;
  },

  /**
   * Create a new gift tier
   * @param giftTier - Gift tier data to create
   * @returns Created gift tier with generated ID
   */
  async createGiftTier(giftTier: GiftTierRequest): Promise<GiftTierDTO> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/gift-tiers`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(giftTier),
    });

    return await handleResponse(resp) as GiftTierDTO;
  },

  /**
   * Update an existing gift tier
   * @param id - Gift tier ID
   * @param giftTier - Updated gift tier data
   * @returns Updated gift tier
   */
  async updateGiftTier(id: number, giftTier: GiftTierRequest): Promise<GiftTierDTO> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/gift-tiers/${id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(giftTier),
    });

    return await handleResponse(resp) as GiftTierDTO;
  },

  /**
   * Soft delete a gift tier (sets is_active = false)
   * @param id - Gift tier ID
   */
  async deleteGiftTier(id: number): Promise<void> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/gift-tiers/${id}`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });

    await handleResponse(resp);
  },

  /**
   * Upload a gift image for a tier
   * @param id - Gift tier ID
   * @param file - Image file (JPEG, PNG, WebP, GIF, max 5MB)
   * @returns Updated gift tier with new image URL
   */
  async uploadGiftImage(id: number, file: File): Promise<GiftTierDTO> {
    const formData = new FormData();
    formData.append('file', file);

    // Don't use defaultHeaders for multipart/form-data
    // Let the browser set the Content-Type with boundary
    const headers: HeadersInit = {
      'Authorization': localStorage.getItem('token') || '',
    };

    const resp = await fetch(`${API_BASE_URL}/api/admin/gift-tiers/${id}/image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return await handleResponse(resp) as GiftTierDTO;
  },

  /**
   * Delete the gift image for a tier
   * @param id - Gift tier ID
   * @returns Updated gift tier with cleared image fields
   */
  async deleteGiftImage(id: number): Promise<GiftTierDTO> {
    const resp = await fetch(`${API_BASE_URL}/api/admin/gift-tiers/${id}/image`, {
      method: 'DELETE',
      headers: jsonHeaders(),
    });

    return await handleResponse(resp) as GiftTierDTO;
  },
};
