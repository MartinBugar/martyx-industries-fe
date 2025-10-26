import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import type {
  PaginatedResponse,
  MasterProductDto,
  ProductVariantDto,
  VariantComponentDto
} from '../types/api';

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
      console.log('ProductService.getMasterProducts:', { url: url.toString(), category, language });
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
      console.log('ProductService.getMasterProduct:', { url: url.toString(), masterProductId: id, language });
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
      console.log('ProductService.getVariantsForMasterProduct:', { url: url.toString(), masterProductId, language });
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
      console.log('ProductService.getVariant:', { url: url.toString(), variantId, language });
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
      console.log('ProductService.getVariantComponents:', { url: url.toString(), variantId, language });
    }

    const response = await fetch(url.toString(), requestOptions);
    return handleResponse(response);
  }

}

export const productService = new ProductService();