import { API_BASE_URL } from './apiUtils';
import { logWarn } from '../services/logger';

export interface ReservationResponse {
  reservationId: number;
  expiresAt: string; // ISO timestamp
  items: ReservedItem[];
}

export interface ReservedItem {
  variantId: number;
  quantity: number;
  expiresAt: string;
}

export interface Reservation {
  id: number;
  variantId: number;
  quantity: number;
  expiresAt: string;
  status: 'ACTIVE' | 'RELEASED' | 'FULFILLED' | 'CANCELLED';
}

/**
 * Service for managing stock reservations during checkout
 */
export const stockReservationService = {
  /**
   * Reserve stock for cart items when checkout begins
   * Creates 15-minute reservations to prevent other users from buying
   *
   * @param items Cart items to reserve
   * @param sessionId Guest session ID (optional for authenticated users)
   */
  async reserveCartItems(
    items: Array<{ variantId: number; quantity: number }>,
    sessionId?: string
  ): Promise<ReservationResponse> {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/api/stock/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({
        items,
        sessionId
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to reserve stock' }));
      throw new Error(error.message || 'Insufficient stock available');
    }

    return response.json();
  },

  /**
   * Release all active reservations for current user/session
   * Called when user cancels checkout or leaves page
   *
   * @param sessionId Guest session ID (optional for authenticated users)
   */
  async releaseReservations(sessionId?: string): Promise<void> {
    const token = localStorage.getItem('token');

    const url = new URL(`${API_BASE_URL}/api/stock/release`);
    if (sessionId) {
      url.searchParams.set('sessionId', sessionId);
    }

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      logWarn('Failed to release reservations:', response.statusText);
      // Don't throw - this is best-effort cleanup
    }
  },

  /**
   * Get all active reservations for current user/session
   *
   * @param sessionId Guest session ID (optional for authenticated users)
   */
  async getActiveReservations(sessionId?: string): Promise<Reservation[]> {
    const token = localStorage.getItem('token');

    const url = new URL(`${API_BASE_URL}/api/stock/reservations`);
    if (sessionId) {
      url.searchParams.set('sessionId', sessionId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      logWarn('Failed to fetch reservations:', response.statusText);
      return [];
    }

    return response.json();
  }
};
