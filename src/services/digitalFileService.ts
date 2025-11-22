/**
 * Service for uploading and managing digital files (ZIP, PDF, STL) for master products
 */

import { apiClient } from './apiClient';
import { logInfo, logWarn, logError } from '../services/logger';

export interface DigitalFileInfo {
  hasFile: boolean;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  fileFormat?: string;
  uploadedAt?: string;
}

export interface DigitalFileUploadResponse {
  success: boolean;
  message: string;
  digitalFileUrl?: string;
  fileName?: string;
  fileSizeBytes?: number;
  fileFormat?: string;
  masterProductId?: number;
  masterProductName?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

export interface DigitalFileUploadRequest {
  fileName: string;
  mimeType: string;
  fileSize: number;
  fileData: string; // base64 encoded
}

class DigitalFileService {
  private uploadAbortController: AbortController | null = null;

  /**
   * Get current digital file info for a master product
   */
  async getFileInfo(masterProductId: number): Promise<DigitalFileInfo> {
    try {
      const product = await apiClient.get<any>(`/api/admin/products/${masterProductId}`);

      return {
        hasFile: !!product.digitalFileUrl,
        fileName: product.digitalFileUrl?.split('/').pop() || undefined,
        fileUrl: product.digitalFileUrl,
        fileSize: product.digitalFileSizeBytes,
        fileFormat: product.digitalFileFormat,
      };
    } catch (error) {
      logError('Failed to get digital file info:', error);
      return { hasFile: false };
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 500 * 1024 * 1024; // 500MB

    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: `File too large. Max size: ${this.formatFileSize(maxSize)}` };
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['zip', 'pdf', 'stl', 'sla'].includes(extension)) {
      return { valid: false, error: 'Invalid file type. Allowed: ZIP, PDF, STL' };
    }

    return { valid: true };
  }

  /**
   * Upload digital file for a master product
   */
  async uploadFile(
    masterProductId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<DigitalFileUploadResponse> {
    // Validate file first
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Create abort controller for cancellation
    this.uploadAbortController = new AbortController();

    try {
      // Convert file to base64
      const base64Data = await this.fileToBase64(file);

      // Prepare request
      const request: DigitalFileUploadRequest = {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileData: base64Data
      };

      // Simulate progress for base64 conversion (0-30%)
      if (onProgress) {
        onProgress(30);
      }

      // Upload to backend
      const response = await apiClient.post<DigitalFileUploadResponse>(
        `/api/admin/products/${masterProductId}/digital-file/upload`,
        request
      );

      if (onProgress) {
        onProgress(100);
      }

      return response;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'canceled') {
        throw new Error('Upload cancelled');
      }
      throw error;
    } finally {
      this.uploadAbortController = null;
    }
  }

  /**
   * Delete digital file for a master product
   */
  async deleteFile(masterProductId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/api/admin/products/${masterProductId}/digital-file`
    );
    return {
      success: true,
      message: response.message || 'Digital file deleted successfully'
    };
  }

  /**
   * Cancel ongoing upload
   */
  cancelUpload(): void {
    if (this.uploadAbortController) {
      this.uploadAbortController.abort();
      this.uploadAbortController = null;
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (data:...;base64,)
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Format file size to human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const digitalFileService = new DigitalFileService();
