/**
 * Product Tab Service
 *
 * Handles API calls for product tabs - both public (read-only) and admin (CRUD)
 */

import { apiClient } from './apiClient';
import type { ProductTabDto, ProductTabCreateRequest, ProductTabTemplate } from '../types/api';

// ============================================================================
// PUBLIC ENDPOINTS (No auth required)
// ============================================================================

/**
 * Get all active tabs for a master product
 *
 * @param masterProductId - The master product ID
 * @param locale - Language code (default: 'en')
 * @returns Promise<ProductTabDto[]>
 */
export async function getTabsForMasterProduct(
  masterProductId: number,
  locale: string = 'en'
): Promise<ProductTabDto[]> {
  return apiClient.request<ProductTabDto[]>(
    `/api/public/product-tabs/product/${masterProductId}?locale=${locale}`,
    {
      method: 'GET',
      cache: true,
      cacheType: 'api-responses'
    }
  );
}

/**
 * Get all active tabs for a product variant
 *
 * @param variantId - The product variant ID
 * @param locale - Language code (default: 'en')
 * @returns Promise<ProductTabDto[]>
 */
export async function getTabsForVariant(
  variantId: number,
  locale: string = 'en'
): Promise<ProductTabDto[]> {
  return apiClient.request<ProductTabDto[]>(
    `/api/public/product-tabs/variant/${variantId}?locale=${locale}`,
    {
      method: 'GET',
      cache: true,
      cacheType: 'api-responses'
    }
  );
}

// ============================================================================
// ADMIN ENDPOINTS (Auth required)
// ============================================================================

/**
 * Get all tabs for a master product (admin view - includes inactive)
 *
 * @param masterProductId - The master product ID
 * @param locale - Language code (default: 'en')
 * @returns Promise<ProductTabDto[]>
 */
export async function adminGetTabsForMasterProduct(
  masterProductId: number,
  locale: string = 'en'
): Promise<ProductTabDto[]> {
  return apiClient.request<ProductTabDto[]>(
    `/api/admin/product-tabs/product/${masterProductId}?locale=${locale}`,
    {
      method: 'GET'
    }
  );
}

/**
 * Get all tabs for a product variant (admin view)
 *
 * @param variantId - The product variant ID
 * @param locale - Language code (default: 'en')
 * @returns Promise<ProductTabDto[]>
 */
export async function adminGetTabsForVariant(
  variantId: number,
  locale: string = 'en'
): Promise<ProductTabDto[]> {
  return apiClient.request<ProductTabDto[]>(
    `/api/admin/product-tabs/variant/${variantId}?locale=${locale}`,
    {
      method: 'GET'
    }
  );
}

/**
 * Get a single tab by ID (admin)
 *
 * @param id - The tab ID
 * @returns Promise<ProductTabDto>
 */
export async function adminGetTabById(id: number): Promise<ProductTabDto> {
  return apiClient.request<ProductTabDto>(
    `/api/admin/product-tabs/${id}`,
    {
      method: 'GET'
    }
  );
}

/**
 * Create a new product tab (admin)
 *
 * @param request - Tab creation request
 * @returns Promise<ProductTabDto>
 */
export async function adminCreateTab(
  request: ProductTabCreateRequest
): Promise<ProductTabDto> {
  return apiClient.request<ProductTabDto>(
    `/api/admin/product-tabs`,
    {
      method: 'POST',
      body: request
    }
  );
}

/**
 * Update an existing product tab (admin)
 *
 * @param id - The tab ID
 * @param request - Tab update request
 * @returns Promise<ProductTabDto>
 */
export async function adminUpdateTab(
  id: number,
  request: ProductTabCreateRequest
): Promise<ProductTabDto> {
  return apiClient.request<ProductTabDto>(
    `/api/admin/product-tabs/${id}`,
    {
      method: 'PUT',
      body: request
    }
  );
}

/**
 * Delete a product tab (soft delete) (admin)
 *
 * @param id - The tab ID
 * @returns Promise<{message: string}>
 */
export async function adminDeleteTab(id: number): Promise<{message: string}> {
  return apiClient.request<{message: string}>(
    `/api/admin/product-tabs/${id}`,
    {
      method: 'DELETE'
    }
  );
}

/**
 * Duplicate a product tab (admin)
 *
 * @param id - The tab ID to duplicate
 * @returns Promise<ProductTabDto>
 */
export async function adminDuplicateTab(id: number): Promise<ProductTabDto> {
  return apiClient.request<ProductTabDto>(
    `/api/admin/product-tabs/${id}/duplicate`,
    {
      method: 'POST'
    }
  );
}

/**
 * Reorder tabs (admin)
 *
 * @param tabIds - Array of tab IDs in the desired order
 * @returns Promise<{message: string}>
 */
export async function adminReorderTabs(
  tabIds: number[]
): Promise<{message: string}> {
  return apiClient.request<{message: string}>(
    `/api/admin/product-tabs/reorder`,
    {
      method: 'PUT',
      body: { tabIds }
    }
  );
}

/**
 * Get all active tab templates (admin)
 *
 * @returns Promise<ProductTabTemplate[]>
 */
export async function adminGetTabTemplates(): Promise<ProductTabTemplate[]> {
  return apiClient.request<ProductTabTemplate[]>(
    `/api/admin/product-tabs/templates`,
    {
      method: 'GET'
    }
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Render tab content based on content type
 *
 * @param tab - The product tab DTO
 * @returns Rendered content or component identifier
 */
export function renderTabContent(tab: ProductTabDto): {
  type: 'html' | 'markdown' | 'json' | 'component';
  content: string | object;
} {
  switch (tab.contentType) {
    case 'HTML':
      return {
        type: 'html',
        content: tab.contentHtml || ''
      };
    case 'MARKDOWN':
      return {
        type: 'markdown',
        content: tab.contentMarkdown || ''
      };
    case 'JSON':
      return {
        type: 'json',
        content: tab.contentJson ? JSON.parse(tab.contentJson) : {}
      };
    case 'COMPONENT':
      return {
        type: 'component',
        content: tab.componentName || ''
      };
    default:
      return {
        type: 'html',
        content: ''
      };
  }
}

/**
 * Check if user has permission to view tab
 *
 * @param tab - The product tab DTO
 * @param isAuthenticated - Whether user is logged in
 * @returns boolean
 */
export function canViewTab(tab: ProductTabDto, isAuthenticated: boolean): boolean {
  if (!tab.isActive) {
    return false;
  }

  if (tab.requiresAuthentication && !isAuthenticated) {
    return false;
  }

  return true;
}
