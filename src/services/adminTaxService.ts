import { API_BASE_URL, defaultHeaders, handleResponse, withAuthHeaders } from './apiUtils';
import { logInfo, logError } from './logger';

// ==================== TYPES ====================

export interface TaxZone {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  countryCodes: string[];
  priority: number;
  active: boolean;
  reverseChargeEligible: boolean;
  taxRates?: TaxRate[];
  createdAt: string;
  updatedAt: string;
}

export interface TaxRate {
  id: number;
  taxZoneId: number;
  taxZoneName: string | null;
  name: string;
  rateType: TaxRateType;
  rate: number;
  isDefault: boolean;
  active: boolean;
  description: string | null;
  applicableCategories: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaxRateType = 'STANDARD' | 'REDUCED' | 'SUPER_REDUCED' | 'ZERO' | 'EXEMPT';

export interface TaxZoneRequest {
  name: string;
  code?: string;
  description?: string;
  countryCodes?: string[];
  priority?: number;
  active?: boolean;
  reverseChargeEligible?: boolean;
}

export interface TaxRateRequest {
  taxZoneId: number;
  name: string;
  rateType: TaxRateType;
  rate: number;
  isDefault?: boolean;
  active?: boolean;
  description?: string;
  applicableCategories?: string;
}

export interface TaxCalculationResult {
  amountExcludingTax: number;
  taxAmount: number;
  amountIncludingTax: number;
  taxRate: number;
  taxZoneName: string | null;
  taxRateName: string;
  reverseChargeApplied: boolean;
}

export interface RateTypeOption {
  value: TaxRateType;
  label: string;
  description: string;
}

// ==================== SERVICE ====================

class AdminTaxService {
  // ==================== TAX ZONES ====================

  async getAllTaxZones(): Promise<TaxZone[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/zones`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getActiveTaxZones(): Promise<TaxZone[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/zones/active`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getTaxZoneById(id: number): Promise<TaxZone> {
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/zones/${id}`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async createTaxZone(request: TaxZoneRequest): Promise<TaxZone> {
    logInfo('Creating tax zone:', request.name);
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/zones`, withAuthHeaders({
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(request),
    }));
    return handleResponse(response);
  }

  async updateTaxZone(id: number, request: TaxZoneRequest): Promise<TaxZone> {
    logInfo('Updating tax zone:', id);
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/zones/${id}`, withAuthHeaders({
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify(request),
    }));
    return handleResponse(response);
  }

  async deleteTaxZone(id: number): Promise<void> {
    logInfo('Deleting tax zone:', id);
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/zones/${id}`, withAuthHeaders({
      method: 'DELETE',
      headers: defaultHeaders,
    }));
    if (!response.ok) {
      throw new Error(`Failed to delete tax zone: ${response.statusText}`);
    }
  }

  async findTaxZoneForCountry(countryCode: string): Promise<TaxZone | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/tax/zones/country/${countryCode}`,
        withAuthHeaders({
          method: 'GET',
          headers: defaultHeaders,
        })
      );
      if (response.status === 404) {
        return null;
      }
      return handleResponse(response);
    } catch (error) {
      logError('Error finding tax zone for country:', error);
      return null;
    }
  }

  // ==================== TAX RATES ====================

  async getAllTaxRates(): Promise<TaxRate[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/rates`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getTaxRatesForZone(zoneId: number): Promise<TaxRate[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/rates/zone/${zoneId}`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getTaxRateById(id: number): Promise<TaxRate> {
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/rates/${id}`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async createTaxRate(request: TaxRateRequest): Promise<TaxRate> {
    logInfo('Creating tax rate:', request.name, `${request.rate}%`);
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/rates`, withAuthHeaders({
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(request),
    }));
    return handleResponse(response);
  }

  async updateTaxRate(id: number, request: TaxRateRequest): Promise<TaxRate> {
    logInfo('Updating tax rate:', id);
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/rates/${id}`, withAuthHeaders({
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify(request),
    }));
    return handleResponse(response);
  }

  async deleteTaxRate(id: number): Promise<void> {
    logInfo('Deleting tax rate:', id);
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/rates/${id}`, withAuthHeaders({
      method: 'DELETE',
      headers: defaultHeaders,
    }));
    if (!response.ok) {
      throw new Error(`Failed to delete tax rate: ${response.statusText}`);
    }
  }

  // ==================== TAX CALCULATION ====================

  async calculateTax(
    countryCode: string,
    amount: number,
    isB2B: boolean = false,
    vatNumber?: string
  ): Promise<TaxCalculationResult> {
    const params = new URLSearchParams({
      countryCode,
      amount: amount.toString(),
      isB2B: isB2B.toString(),
    });
    if (vatNumber) {
      params.append('vatNumber', vatNumber);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/admin/tax/calculate?${params}`,
      withAuthHeaders({
        method: 'GET',
        headers: defaultHeaders,
      })
    );
    return handleResponse(response);
  }

  async checkReverseCharge(
    buyerCountry: string,
    isB2B: boolean,
    vatNumber?: string
  ): Promise<{ buyerCountry: string; isB2B: boolean; vatNumber: string; reverseChargeApplicable: boolean }> {
    const params = new URLSearchParams({
      buyerCountry,
      isB2B: isB2B.toString(),
    });
    if (vatNumber) {
      params.append('vatNumber', vatNumber);
    }

    const response = await fetch(
      `${API_BASE_URL}/api/admin/tax/reverse-charge/check?${params}`,
      withAuthHeaders({
        method: 'GET',
        headers: defaultHeaders,
      })
    );
    return handleResponse(response);
  }

  // ==================== UTILITIES ====================

  async getEuCountries(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/eu-countries`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }

  async getRateTypes(): Promise<RateTypeOption[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/tax/rate-types`, withAuthHeaders({
      method: 'GET',
      headers: defaultHeaders,
    }));
    return handleResponse(response);
  }
}

export const adminTaxService = new AdminTaxService();
export default adminTaxService;
