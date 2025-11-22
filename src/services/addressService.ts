import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import { logInfo, logWarn, logError } from '../services/logger';

/**
 * Address interface matching backend User.Address embeddable
 */
export interface SavedAddress {
  id?: string; // Local ID for localStorage addresses
  label?: string; // e.g., "Home", "Work", "Previous order"
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean; // Mark default address
  isPrimary?: boolean; // Mark as user's profile address
}

const STORAGE_KEY = 'martyx_saved_addresses_v1';
const MAX_SAVED_ADDRESSES = 5; // Limit to 5 saved addresses

/**
 * Address Service for managing saved addresses
 * Uses localStorage for multiple addresses + user profile for primary address
 */
export const addressService = {
  /**
   * Get user's primary address from profile
   */
  async getPrimaryAddress(): Promise<SavedAddress | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return null;
      }

      const parsedToken = typeof token === 'string' && token.startsWith('"')
        ? JSON.parse(token)
        : token;

      const headers = {
        ...defaultHeaders,
        'Authorization': `Bearer ${parsedToken}`,
      };

      const response = await fetch(`${API_BASE_URL}/api/users/me`, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
      }));

      const userData = await handleResponse(response);

      if (userData.address) {
        return {
          ...userData.address,
          id: 'primary',
          label: 'Primary Address',
          isPrimary: true,
          isDefault: true,
        };
      }

      return null;
    } catch (error) {
      logError('[AddressService] Failed to fetch primary address:', error);
      return null;
    }
  },

  /**
   * Get all saved addresses (localStorage + primary)
   */
  async getAllSavedAddresses(): Promise<SavedAddress[]> {
    const addresses: SavedAddress[] = [];

    // Get primary address from profile
    const primaryAddress = await this.getPrimaryAddress();
    if (primaryAddress) {
      addresses.push(primaryAddress);
    }

    // Get localStorage addresses
    const localAddresses = this.getLocalAddresses();
    addresses.push(...localAddresses);

    return addresses;
  },

  /**
   * Get addresses from localStorage only
   */
  getLocalAddresses(): SavedAddress[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed.filter((addr: any) =>
        addr &&
        typeof addr === 'object' &&
        addr.street &&
        addr.city &&
        addr.zipCode &&
        addr.country
      );
    } catch (error) {
      logWarn('[AddressService] Failed to load saved addresses:', error);
      return [];
    }
  },

  /**
   * Save a new address to localStorage
   */
  saveAddress(address: Omit<SavedAddress, 'id'>, label?: string): SavedAddress {
    try {
      const addresses = this.getLocalAddresses();

      // Check if address already exists
      const existingIndex = addresses.findIndex(addr =>
        addr.street === address.street &&
        addr.city === address.city &&
        addr.zipCode === address.zipCode &&
        addr.country === address.country
      );

      if (existingIndex >= 0) {
        // Address already exists, update label if provided
        if (label) {
          addresses[existingIndex].label = label;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
        }
        return addresses[existingIndex];
      }

      // Add new address
      const newAddress: SavedAddress = {
        ...address,
        id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        label: label || `Address ${addresses.length + 1}`,
        isDefault: addresses.length === 0, // First saved address is default
      };

      addresses.unshift(newAddress); // Add to beginning

      // Limit to MAX_SAVED_ADDRESSES
      if (addresses.length > MAX_SAVED_ADDRESSES) {
        addresses.splice(MAX_SAVED_ADDRESSES);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
      logInfo('[AddressService] Saved new address:', newAddress.label);

      return newAddress;
    } catch (error) {
      logError('[AddressService] Failed to save address:', error);
      throw error;
    }
  },

  /**
   * Remove address from localStorage by ID
   */
  removeAddress(addressId: string): void {
    try {
      if (addressId === 'primary') {
        logWarn('[AddressService] Cannot remove primary address');
        return;
      }

      const addresses = this.getLocalAddresses();
      const filtered = addresses.filter(addr => addr.id !== addressId);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      logInfo('[AddressService] Removed address:', addressId);
    } catch (error) {
      logError('[AddressService] Failed to remove address:', error);
    }
  },

  /**
   * Set default address
   */
  setDefaultAddress(addressId: string): void {
    try {
      const addresses = this.getLocalAddresses();

      addresses.forEach(addr => {
        addr.isDefault = addr.id === addressId;
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
      logInfo('[AddressService] Set default address:', addressId);
    } catch (error) {
      logError('[AddressService] Failed to set default address:', error);
    }
  },

  /**
   * Clear all saved addresses from localStorage
   */
  clearAllAddresses(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      logInfo('[AddressService] Cleared all saved addresses');
    } catch (error) {
      logError('[AddressService] Failed to clear addresses:', error);
    }
  },

  /**
   * Update user's primary address in profile
   */
  async updatePrimaryAddress(address: Omit<SavedAddress, 'id' | 'label' | 'isPrimary'>): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const parsedToken = typeof token === 'string' && token.startsWith('"')
        ? JSON.parse(token)
        : token;

      // Get user ID from current user data
      const userResponse = await fetch(`${API_BASE_URL}/api/users/me`, withLangHeaders({
        method: 'GET',
        headers: {
          ...defaultHeaders,
          'Authorization': `Bearer ${parsedToken}`,
        } as HeadersInit,
      }));

      const userData = await handleResponse(userResponse);

      if (!userData.id) {
        throw new Error('User ID not found');
      }

      // Update user profile with new address
      const updateResponse = await fetch(`${API_BASE_URL}/api/users/${userData.id}`, withLangHeaders({
        method: 'PUT',
        headers: {
          ...defaultHeaders,
          'Authorization': `Bearer ${parsedToken}`,
        } as HeadersInit,
        body: JSON.stringify({
          address: {
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.zipCode,
            country: address.country,
          }
        }),
      }));

      await handleResponse(updateResponse);
      logInfo('[AddressService] Updated primary address');
    } catch (error) {
      logError('[AddressService] Failed to update primary address:', error);
      throw error;
    }
  },

  /**
   * Format address as single line string
   */
  formatAddress(address: SavedAddress): string {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(part => part && part.trim().length > 0);

    return parts.join(', ');
  }
};
