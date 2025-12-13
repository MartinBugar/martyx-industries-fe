import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import type {
  Model3DUploadResponse,
  Model3DInfoResponse,
  ModelDeleteResponse
} from '../types/product3DModel';

/**
 * Service for managing 3D model (.glb) files for products
 */
export class Product3DModelService {
  // Store active XHR for cancellation
  private activeXhr: XMLHttpRequest | null = null;

  /**
   * Upload a 3D model (.glb) file for a master product
   *
   * @param masterProductId The ID of the master product
   * @param file The GLB file to upload
   * @param onProgress Optional callback for upload progress
   * @returns Upload response with CDN URL and metadata
   */
  async uploadModel(
    masterProductId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Model3DUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Get auth token from defaultHeaders (same as other admin services)
    const authHeader = defaultHeaders['Authorization'];
    if (!authHeader) {
      throw new Error('Authentication required. Please log in.');
    }
    const token = authHeader.replace('Bearer ', '');

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      this.activeXhr = xhr; // Store for cancellation

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress(percentComplete);
          }
        });
      }

      xhr.addEventListener('load', () => {
        this.activeXhr = null; // Clear active XHR
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(errorResponse.message || 'Upload failed'));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        this.activeXhr = null; // Clear active XHR
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        this.activeXhr = null; // Clear active XHR
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${API_BASE_URL}/api/master-products/${masterProductId}/3d-model/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(): void {
    if (this.activeXhr) {
      this.activeXhr.abort();
      this.activeXhr = null;
    }
  }

  /**
   * Delete the 3D model associated with a master product
   *
   * @param masterProductId The ID of the master product
   * @returns Deletion response
   */
  async deleteModel(masterProductId: number): Promise<ModelDeleteResponse> {
    // Check authentication via defaultHeaders (same as other admin services)
    if (!defaultHeaders['Authorization']) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(
      `${API_BASE_URL}/api/master-products/${masterProductId}/3d-model`,
      {
        method: 'DELETE',
        headers: defaultHeaders as HeadersInit
      }
    );

    return handleResponse(response) as Promise<ModelDeleteResponse>;
  }

  /**
   * Get information about the 3D model for a master product
   *
   * @param masterProductId The ID of the master product
   * @returns Model information or empty if no model exists
   */
  async getModelInfo(masterProductId: number): Promise<Model3DInfoResponse> {
    const response = await fetch(
      `${API_BASE_URL}/api/master-products/${masterProductId}/3d-model`,
      {
        method: 'GET',
        headers: defaultHeaders as HeadersInit
      }
    );

    return handleResponse(response) as Promise<Model3DInfoResponse>;
  }

  /**
   * Validate if a file is a valid GLB file
   *
   * @param file The file to validate
   * @param maxSizeMB Maximum file size in MB (default: 200)
   * @returns Validation result with error message if invalid
   */
  validateGLBFile(file: File, maxSizeMB: number = 200): { valid: boolean; error?: string } {
    // Check file exists
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'glb') {
      return { valid: false, error: 'File must be .glb format' };
    }

    // Check file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }

    // Check MIME type (if available)
    if (file.type && !['model/gltf-binary', 'application/octet-stream', ''].includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Must be a GLB file.' };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   *
   * @param bytes File size in bytes
   * @returns Formatted string (e.g., "12.4 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const product3DModelService = new Product3DModelService();
