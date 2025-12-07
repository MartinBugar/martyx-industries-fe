import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import type { ShoppingCartDto } from '../types/customer';

/**
 * Service for public shopping cart operations
 * Supports both guest (session-based) and authenticated user carts
 */

const jsonHeaders = () => defaultHeaders as HeadersInit;

export const cartService = {
  /**
   * Retrieves the shopping cart for the current user or session
   * @param sessionId - Session ID for guest users (optional)
   * @returns Shopping cart
   */
  async getCart(sessionId?: string): Promise<ShoppingCartDto> {
    const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';

    const resp = await fetch(`${API_BASE_URL}/api/cart/${params}`,
      withLangHeaders({
        method: 'GET',
        headers: jsonHeaders(),
      })
    );

    return await handleResponse(resp) as ShoppingCartDto;
  },

  /**
   * Adds an item to the shopping cart
   * @param variantId - Product variant ID
   * @param quantity - Quantity to add
   * @param sessionId - Session ID for guest users (optional)
   * @param configurationJson - Optional configuration JSON from 3D configurator
   * @param configurationPriceModifier - Optional price modifier from configuration
   * @returns Updated cart
   */
  async addItem(
    variantId: number,
    quantity: number,
    sessionId?: string,
    configurationJson?: string,
    configurationPriceModifier?: number
  ): Promise<ShoppingCartDto> {
    const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';

    const body: {
      variantId: number;
      quantity: number;
      configurationJson?: string;
      configurationPriceModifier?: number;
    } = { variantId, quantity };

    // Add configuration if provided
    if (configurationJson) {
      body.configurationJson = configurationJson;
      body.configurationPriceModifier = configurationPriceModifier || 0;
    }

    const resp = await fetch(`${API_BASE_URL}/api/cart/items${params}`,
      withLangHeaders({
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(body),
      })
    );

    return await handleResponse(resp) as ShoppingCartDto;
  },

  /**
   * Updates the quantity of an item in the cart
   * @param variantId - Product variant ID
   * @param quantity - New quantity
   * @param sessionId - Session ID for guest users (optional)
   * @returns Updated cart
   */
  async updateQuantity(
    variantId: number,
    quantity: number,
    sessionId?: string
  ): Promise<ShoppingCartDto> {
    const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';

    const resp = await fetch(`${API_BASE_URL}/api/cart/items/${variantId}${params}`,
      withLangHeaders({
        method: 'PUT',
        headers: jsonHeaders(),
        body: JSON.stringify({ quantity }),
      })
    );

    return await handleResponse(resp) as ShoppingCartDto;
  },

  /**
   * Removes an item from the cart
   * @param variantId - Product variant ID
   * @param sessionId - Session ID for guest users (optional)
   * @returns Updated cart
   */
  async removeItem(variantId: number, sessionId?: string): Promise<ShoppingCartDto> {
    const params = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';

    const resp = await fetch(`${API_BASE_URL}/api/cart/items/${variantId}${params}`,
      withLangHeaders({
        method: 'DELETE',
        headers: jsonHeaders(),
      })
    );

    return await handleResponse(resp) as ShoppingCartDto;
  },

  /**
   * Merges a guest cart into the user's cart after login
   * @param guestSessionId - Guest session ID
   * @returns Merged cart
   *
   * IMPORTANT: Uses withLangHeaders() to ensure:
   * - Authorization header is included (from defaultHeaders)
   * - CSRF token is included (X-XSRF-TOKEN header)
   * - Credentials (cookies) are sent with request
   */
  async mergeCart(guestSessionId: string): Promise<ShoppingCartDto> {
    const resp = await fetch(
      `${API_BASE_URL}/api/cart/merge?guestSessionId=${encodeURIComponent(guestSessionId)}`,
      withLangHeaders({
        method: 'POST',
        headers: defaultHeaders as HeadersInit,
      })
    );

    return await handleResponse(resp) as ShoppingCartDto;
  },
};
