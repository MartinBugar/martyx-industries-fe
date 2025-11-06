import { apiClient } from './apiClient';
import { API_BASE_URL } from './apiUtils';
import type { ProductAttachmentDto } from '../types/api';

// ============================================================================
// PUBLIC API (pre všetkých userov)
// ============================================================================

/**
 * Get active attachments for master product
 */
export const getAttachmentsForMasterProduct = async (
  masterProductId: number
): Promise<ProductAttachmentDto[]> => {
  return apiClient.request<ProductAttachmentDto[]>(
    `/api/public/product-attachments/master-product/${masterProductId}`,
    {
      method: 'GET',
      cache: true,
      cacheType: 'api-responses'
    }
  );
};

/**
 * Get active attachments for variant
 */
export const getAttachmentsForVariant = async (
  variantId: number
): Promise<ProductAttachmentDto[]> => {
  return apiClient.request<ProductAttachmentDto[]>(
    `/api/public/product-attachments/variant/${variantId}`,
    {
      method: 'GET',
      cache: true,
      cacheType: 'api-responses'
    }
  );
};

/**
 * Track download (increment counter)
 */
export const trackDownload = async (attachmentId: number): Promise<void> => {
  return apiClient.request<void>(
    `/api/public/product-attachments/${attachmentId}/download`,
    {
      method: 'POST'
    }
  );
};

// ============================================================================
// ADMIN API (pre administrátorov)
// ============================================================================

/**
 * Upload new attachment
 */
export const adminUploadAttachment = async (
  file: File,
  data: {
    masterProductId?: number;
    variantId?: number;
    displayLabel: string;
    description?: string;
    attachmentType?: string;
    iconName?: string;
    displayOrder?: number;
    active?: boolean;
    featured?: boolean;
    locale?: string;
  }
): Promise<ProductAttachmentDto> => {
  const formData = new FormData();
  formData.append('file', file);

  if (data.masterProductId) formData.append('masterProductId', data.masterProductId.toString());
  if (data.variantId) formData.append('variantId', data.variantId.toString());
  formData.append('displayLabel', data.displayLabel);
  if (data.description) formData.append('description', data.description);
  if (data.attachmentType) formData.append('attachmentType', data.attachmentType);
  if (data.iconName) formData.append('iconName', data.iconName);
  if (data.displayOrder !== undefined) formData.append('displayOrder', data.displayOrder.toString());
  if (data.active !== undefined) formData.append('active', data.active.toString());
  if (data.featured !== undefined) formData.append('featured', data.featured.toString());
  if (data.locale) formData.append('locale', data.locale);

  // Use fetch directly for multipart/form-data with auth token
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE_URL}/api/admin/product-attachments`, {
    method: 'POST',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Update attachment metadata (not file)
 */
export const adminUpdateAttachment = async (
  id: number,
  data: {
    displayLabel: string;
    description?: string;
    attachmentType?: string;
    iconName?: string;
    displayOrder?: number;
    active?: boolean;
    featured?: boolean;
    locale?: string;
  }
): Promise<ProductAttachmentDto> => {
  return apiClient.request<ProductAttachmentDto>(
    `/api/admin/product-attachments/${id}`,
    {
      method: 'PUT',
      body: data
    }
  );
};

/**
 * Delete attachment
 */
export const adminDeleteAttachment = async (id: number): Promise<void> => {
  return apiClient.request<void>(
    `/api/admin/product-attachments/${id}`,
    {
      method: 'DELETE'
    }
  );
};

/**
 * Get all attachments for master product (admin - včítane neaktívnych)
 */
export const adminGetAttachmentsForMasterProduct = async (
  masterProductId: number
): Promise<ProductAttachmentDto[]> => {
  return apiClient.request<ProductAttachmentDto[]>(
    `/api/admin/product-attachments/master-product/${masterProductId}`,
    {
      method: 'GET'
    }
  );
};

/**
 * Get all attachments for variant (admin - včítane neaktívnych)
 */
export const adminGetAttachmentsForVariant = async (
  variantId: number
): Promise<ProductAttachmentDto[]> => {
  return apiClient.request<ProductAttachmentDto[]>(
    `/api/admin/product-attachments/variant/${variantId}`,
    {
      method: 'GET'
    }
  );
};

/**
 * Get attachment by ID
 */
export const adminGetAttachmentById = async (
  id: number
): Promise<ProductAttachmentDto> => {
  return apiClient.request<ProductAttachmentDto>(
    `/api/admin/product-attachments/${id}`,
    {
      method: 'GET'
    }
  );
};
