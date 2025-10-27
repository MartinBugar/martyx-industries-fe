import { apiClient } from './apiClient';

export interface CartItem {
  id: number;
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface ShoppingCartDto {
  id: number;
  userId: number | null;
  sessionId: string;
  subtotal: number;
  total: number;
  lastActivityAt: string;
  isAbandoned: boolean;
  createdAt: string;
  updatedAt: string;
  items?: CartItem[];
}

export interface AbandonmentStatsDto {
  startDate: string;
  endDate: string;
  totalAbandoned: number;
  totalRecovered: number;
  totalConverted: number;
  totalAbandonedValue: number;
  totalRecoveredValue: number;
  averageCartValue: number;
  recoveryRate: number;
  conversionRate: number;
  abandonmentRate: number;
  recoveryEmailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errorCode?: string;
}

class AdminAbandonedCartService {
  private baseUrl = '/api/admin/abandoned-carts';

  /**
   * Gets the shopping cart for a specific user.
   */
  async getUserCart(userId: number): Promise<ShoppingCartDto> {
    const response = await apiClient.get<ApiResponse<ShoppingCartDto>>(`${this.baseUrl}/user/${userId}`);
    return response.data!;
  }

  /**
   * Sends a recovery email for a specific abandoned cart.
   */
  async sendRecoveryEmail(cartId: number, discountCode?: string): Promise<void> {
    const url = discountCode
      ? `${this.baseUrl}/${cartId}/send-recovery-email?discountCode=${discountCode}`
      : `${this.baseUrl}/${cartId}/send-recovery-email`;
    await apiClient.post<ApiResponse<void>>(url, {});
  }

  /**
   * Detects and marks carts as abandoned.
   */
  async detectAbandonedCarts(): Promise<ShoppingCartDto[]> {
    const response = await apiClient.post<ApiResponse<ShoppingCartDto[]>>(`${this.baseUrl}/detect`);
    return response.data!;
  }

  /**
   * Gets all carts ready for recovery emails.
   */
  async getCartsForRecovery(): Promise<ShoppingCartDto[]> {
    const response = await apiClient.get<ApiResponse<ShoppingCartDto[]>>(`${this.baseUrl}/ready-for-recovery`);
    return response.data!;
  }

  /**
   * Gets abandonment statistics for a date range.
   */
  async getAbandonmentStats(startDate: string, endDate: string): Promise<AbandonmentStatsDto> {
    const url = `${this.baseUrl}/stats?startDate=${startDate}&endDate=${endDate}`;
    const response = await apiClient.get<ApiResponse<AbandonmentStatsDto>>(url);
    return response.data!;
  }

  /**
   * Marks a cart as recovered.
   */
  async markCartAsRecovered(cartId: number): Promise<ShoppingCartDto> {
    const response = await apiClient.post<ApiResponse<ShoppingCartDto>>(`${this.baseUrl}/${cartId}/mark-recovered`);
    return response.data!;
  }

  /**
   * Marks a cart as converted.
   */
  async markCartAsConverted(cartId: number, orderId: number): Promise<ShoppingCartDto> {
    const response = await apiClient.post<ApiResponse<ShoppingCartDto>>(`${this.baseUrl}/${cartId}/mark-converted`, { orderId });
    return response.data!;
  }
}

export const adminAbandonedCartService = new AdminAbandonedCartService();
