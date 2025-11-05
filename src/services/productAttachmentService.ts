import axios from 'axios';
import type { ProductAttachmentDto } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ============================================================================
// PUBLIC API (pre všetkých userov)
// ============================================================================

/**
 * Get active attachments for master product
 */
export const getAttachmentsForMasterProduct = async (
  masterProductId: number
): Promise<ProductAttachmentDto[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/public/product-attachments/master-product/${masterProductId}`
  );
  return response.data;
};

/**
 * Get active attachments for variant
 */
export const getAttachmentsForVariant = async (
  variantId: number
): Promise<ProductAttachmentDto[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/public/product-attachments/variant/${variantId}`
  );
  return response.data;
};

/**
 * Track download (increment counter)
 */
export const trackDownload = async (attachmentId: number): Promise<void> => {
  await axios.post(
    `${API_BASE_URL}/api/public/product-attachments/${attachmentId}/download`
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

  const response = await axios.post(
    `${API_BASE_URL}/api/admin/product-attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
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
  const response = await axios.put(
    `${API_BASE_URL}/api/admin/product-attachments/${id}`,
    data
  );
  return response.data;
};

/**
 * Delete attachment
 */
export const adminDeleteAttachment = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/api/admin/product-attachments/${id}`);
};

/**
 * Get all attachments for master product (admin - včítane neaktívnych)
 */
export const adminGetAttachmentsForMasterProduct = async (
  masterProductId: number
): Promise<ProductAttachmentDto[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/admin/product-attachments/master-product/${masterProductId}`
  );
  return response.data;
};

/**
 * Get all attachments for variant (admin - včítane neaktívnych)
 */
export const adminGetAttachmentsForVariant = async (
  variantId: number
): Promise<ProductAttachmentDto[]> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/admin/product-attachments/variant/${variantId}`
  );
  return response.data;
};

/**
 * Get attachment by ID
 */
export const adminGetAttachmentById = async (
  id: number
): Promise<ProductAttachmentDto> => {
  const response = await axios.get(
    `${API_BASE_URL}/api/admin/product-attachments/${id}`
  );
  return response.data;
};
