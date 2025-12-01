import {API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders} from './apiUtils';
import {logInfo} from './logger';
import type {MasterProductDto, PaginatedResponse, ProductVariantDto, VariantComponentDto} from '../types/api';

/**
 * Service for product-related API calls with i18n support
 * NEW variant architecture: MasterProduct + ProductVariant system
 */
export class ProductService {

  // ============================================================================
  // NEW VARIANT ARCHITECTURE API METHODS
  // ============================================================================

  /**
   * Get list of master products with optional category filter
   * @param category - Optional category filter
   * @param language - Optional language override (defaults to current i18n language)
   * @returns Promise<MasterProductDto[]>
   */
  async getMasterProducts(category?: string, language?: string): Promise<MasterProductDto[] | PaginatedResponse<MasterProductDto>> {
    const url = new URL(`${API_BASE_URL}/api/master-products`);

    if (category) {
      url.searchParams.set('category', category);
    }

    if (language) {
      url.searchParams.set('lang', language);
    }

    const requestOptions = withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });

    if (import.meta.env.VITE_DEBUG_API) {
      logInfo('ProductService.getMasterProducts:', { url: url.toString(), category, language });
    }

    const response = await fetch(url.toString(), requestOptions);
    return handleResponse(response);
  }

  /**
   * Get single master product by ID with localized content
   * @param id - Master Product ID
   * @param language - Optional language override (defaults to current i18n language)
   * @returns Promise<MasterProductDto>
   */
  async getMasterProduct(id: number, language?: string): Promise<MasterProductDto> {
    const url = new URL(`${API_BASE_URL}/api/master-products/${id}`);

    if (language) {
      url.searchParams.set('lang', language);
    }

    const requestOptions = withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });

    if (import.meta.env.VITE_DEBUG_API) {
      logInfo('ProductService.getMasterProduct:', { url: url.toString(), masterProductId: id, language });
    }

    const response = await fetch(url.toString(), requestOptions);
    return handleResponse(response);
  }

  /**
   * Get all variants for a master product
   * @param masterProductId - Master Product ID
   * @param language - Optional language override
   * @returns Promise<ProductVariantDto[]>
   */
  async getVariantsForMasterProduct(masterProductId: number, language?: string): Promise<ProductVariantDto[]> {
    const url = new URL(`${API_BASE_URL}/api/master-products/${masterProductId}/variants`);

    if (language) {
      url.searchParams.set('lang', language);
    }

    const requestOptions = withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });

    if (import.meta.env.VITE_DEBUG_API) {
      logInfo('ProductService.getVariantsForMasterProduct:', { url: url.toString(), masterProductId, language });
    }

    const response = await fetch(url.toString(), requestOptions);
    return handleResponse(response);
  }

  /**
   * Get single product variant by ID
   * @param variantId - Variant ID
   * @param language - Optional language override
   * @returns Promise<ProductVariantDto>
   */
  async getVariant(variantId: number, language?: string): Promise<ProductVariantDto> {
    const url = new URL(`${API_BASE_URL}/api/variants/${variantId}`);

    if (language) {
      url.searchParams.set('lang', language);
    }

    const requestOptions = withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });

    if (import.meta.env.VITE_DEBUG_API) {
      logInfo('ProductService.getVariant:', { url: url.toString(), variantId, language });
    }

    const response = await fetch(url.toString(), requestOptions);
    return handleResponse(response);
  }

  /**
   * Get components (bill of materials) for a variant
   * @param variantId - Variant ID
   * @param language - Optional language override
   * @returns Promise<VariantComponentDto[]>
   */
  async getVariantComponents(variantId: number, language?: string): Promise<VariantComponentDto[]> {
    const url = new URL(`${API_BASE_URL}/api/variants/${variantId}/components`);

    if (language) {
      url.searchParams.set('lang', language);
    }

    const requestOptions = withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });

    if (import.meta.env.VITE_DEBUG_API) {
      logInfo('ProductService.getVariantComponents:', { url: url.toString(), variantId, language });
    }

    const response = await fetch(url.toString(), requestOptions);
    return handleResponse(response);
  }

  // ============================================================================
  // ADMIN API METHODS (require authentication)
  // ============================================================================

  /**
   * Get master product for admin panel (no publishing check, loads all data)
   * @param id - Master Product ID
   * @returns Promise<MasterProductDto>
   */
  async adminGetMasterProduct(id: number): Promise<MasterProductDto> {
    const url = `${API_BASE_URL}/api/admin/products/${id}`;

    const requestOptions = {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    };

    if (import.meta.env.VITE_DEBUG_API) {
      logInfo('ProductService.adminGetMasterProduct:', { url, masterProductId: id });
    }

    const response = await fetch(url, requestOptions);
    return handleResponse(response);
  }

  /**
   * Update master product (admin only)
   * @param id - Master Product ID
   * @param data - Updated master product data
   * @returns Promise<MasterProductDto>
   */
  async adminUpdateMasterProduct(id: number, data: MasterProductDto): Promise<MasterProductDto> {
    const url = `${API_BASE_URL}/api/admin/products/${id}`;

    const requestOptions = {
      method: 'PUT',
      headers: {
        ...defaultHeaders,
        'Content-Type': 'application/json',
      } as HeadersInit,
      body: JSON.stringify(data),
    };

    if (import.meta.env.VITE_DEBUG_API) {
      logInfo('ProductService.adminUpdateMasterProduct:', { url, masterProductId: id, data });
    }

    const response = await fetch(url, requestOptions);
    return handleResponse(response);
  }

}

/**
 * Search suggestion result type (lightweight)
 */
export interface ProductSearchSuggestion {
  id: number;
  name: string;
  slug: string;
  shortDescription?: string;
  featuredImageUrl?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  onSale?: boolean;
  inStock?: boolean;
}

/**
 * Search products by name for autocomplete suggestions
 * @param query - Search query (min 2 characters)
 * @param limit - Maximum results (default 5, max 10)
 * @param signal - Optional AbortSignal for cancelling the request
 * @returns Promise<ProductSearchSuggestion[]>
 */
export async function searchProductSuggestions(
  query: string,
  limit: number = 5,
  signal?: AbortSignal
): Promise<ProductSearchSuggestion[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const url = new URL(`${API_BASE_URL}/api/master-products/search`);
  url.searchParams.set('q', query.trim());
  url.searchParams.set('limit', String(Math.min(limit, 10)));

  const requestOptions = withLangHeaders({
    method: 'GET',
    headers: defaultHeaders as HeadersInit,
    signal, // Pass abort signal to fetch
  });

  const response = await fetch(url.toString(), requestOptions);
  return handleResponse(response);
}

export const productService = new ProductService();