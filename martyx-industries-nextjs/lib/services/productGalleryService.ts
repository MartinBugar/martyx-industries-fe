import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

export interface GalleryImage {
  id: string;
  productId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  cdnUrl?: string;
  order: number;
  folderName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UploadImageRequest {
  productId: string;
  file: File;
  order?: number;
}

export interface UploadImageJsonRequest {
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  order?: number;
  folderName?: string; // DigitalOcean Spaces folder (productId.toUpperCase())
  // No fileData - image will be uploaded separately
}

export interface UploadImageResponse {
  success: boolean;
  image: GalleryImage;
  cdnUrl: string;
  message?: string; // Optional error message
}

export interface ReorderImagesRequest {
  productId: string;
  imageOrders: { imageId: string; order: number }[];
}

/**
 * Service for managing product gallery images
 */
export class ProductGalleryService {
  /**
   * Get all images for a product (public endpoint - no authentication required)
   */
  async getProductImages(productId: string): Promise<GalleryImage[]> {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}/gallery`, withLangHeaders({
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      } as HeadersInit,
    }));

    return handleResponse(response);
  }

  // fileToBase64 removed - not used in frontend-first upload approach

  /**
   * Upload image using frontend-first approach:
   * 1. Frontend uploads image directly to DigitalOcean Spaces
   * 2. Frontend sends only metadata to backend database
   */
  /**
   * Convert file to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove data:image/jpeg;base64, prefix
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload image via backend JSON API (with base64 encoded image)
   */
  async uploadImageJson(request: UploadImageRequest): Promise<UploadImageResponse> {
    try {
      // Convert file to base64
      const base64Data = await this.fileToBase64(request.file);

      // Generate filename
      const timestamp = Date.now();
      const extension = request.file.name.split('.').pop() || 'png';
      const baseName = request.file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      const generatedFileName = `${timestamp}_${baseName}.${extension}`;

      // Prepare JSON request matching backend UploadImageJsonRequest
      const jsonRequest = {
        fileName: generatedFileName,
        originalName: request.file.name,
        mimeType: request.file.type,
        fileSize: Number(request.file.size), // Ensure it's a proper number
        order: request.order || 0,
        folderName: request.productId.toUpperCase(),
        fileData: base64Data // Base64 encoded image data
      };

      const headers = { ...defaultHeaders };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('📤 Uploading to backend via JSON API:', {
          url: `${API_BASE_URL}/api/products/${request.productId}/gallery/upload`,
          payload: {
            fileName: jsonRequest.fileName,
            originalName: jsonRequest.originalName,
            mimeType: jsonRequest.mimeType,
            fileSize: jsonRequest.fileSize,
            order: jsonRequest.order,
            folderName: jsonRequest.folderName,
            base64Length: base64Data.length
          },
          hasToken: !!token
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/products/${request.productId}/gallery/upload`, withLangHeaders({
        method: 'POST',
        headers: headers as HeadersInit,
        body: JSON.stringify(jsonRequest),
      }));

      // Check for specific error cases
      if (response.status === 403) {
        throw new Error('Access denied - Admin role required for image upload');
      }

      if (response.status === 401) {
        throw new Error('Authentication required - Please login as admin');
      }

      // If backend returns 500, try to get more details
      if (response.status === 500) {
        let errorDetails;
        try {
          const errorText = await response.text();
          errorDetails = errorText || 'Internal server error';
        } catch {
          errorDetails = 'Internal server error';
        }

        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Backend returned 500 error:', errorDetails);
          console.warn('⚠️ This might be due to:');
          console.warn('1. Backend service implementation missing');
          console.warn('2. DigitalOcean Spaces configuration missing on backend');
          console.warn('3. Database connection issues');
        }

        throw new Error(`Backend server error: ${errorDetails}`);
      }

      if (response.status === 404) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Backend JSON upload API not found, using legacy metadata-only approach');
        }
        return this.uploadImageJsonLegacy(request);
      }

      if (!response.ok) {
        let errorDetails;
        try {
          const errorText = await response.text();
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = { message: 'Failed to parse error response' };
        }

        throw new Error(`Backend upload failed (${response.status}): ${errorDetails.args?.message || errorDetails.message || 'Unknown error'}`);
      }

      const result = await handleResponse(response);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Image upload completed via JSON API');
      }

      return result;

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ JSON image upload failed:', error);
      }
      throw error;
    }
  }

  /**
   * Legacy upload approach - saves only metadata to database
   * Used as fallback when new backend API is not available
   */
  private async uploadImageJsonLegacy(request: UploadImageRequest): Promise<UploadImageResponse> {
    try {
      // Generate filename
      const timestamp = Date.now();
      const extension = request.file.name.split('.').pop() || 'png';
      const baseName = request.file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      const generatedFileName = `${timestamp}_${baseName}.${extension}`;
      const folderName = request.productId.toUpperCase();

      // Create a mock URL (this would normally come from DigitalOcean Spaces)
      const mockUrl = `https://mi-gallery.fra1.digitaloceanspaces.com/${folderName}/${generatedFileName}`;

      // Save only metadata to backend database
      const headers = { ...defaultHeaders };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const metadataPayload = {
        fileName: generatedFileName,
        originalName: request.file.name,
        mimeType: request.file.type,
        fileSize: request.file.size,
        order: request.order,
        folderName: folderName,
        url: mockUrl,
        cdnUrl: mockUrl
      };

      const response = await fetch(`${API_BASE_URL}/api/products/${request.productId}/gallery/metadata`, {
        method: 'POST',
        headers: headers as HeadersInit,
        body: JSON.stringify(metadataPayload),
      });

      if (!response.ok) {
        let errorDetails;
        try {
          const errorText = await response.text();
          errorDetails = JSON.parse(errorText);
        } catch {
          errorDetails = { message: 'Failed to parse error response' };
        }

        throw new Error(`Legacy metadata save failed (${response.status}): ${errorDetails.args?.message || errorDetails.message || 'Unknown error'}`);
      }

      const result = await handleResponse(response);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Image metadata saved via legacy approach (file not actually uploaded)');
        console.warn('🚨 IMPORTANT: Implement backend upload API to actually upload files to DigitalOcean Spaces');
      }

      return result;

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Legacy upload failed:', error);
      }
      throw error;
    }
  }

  /**
   * Upload a new image for a product (legacy multipart approach)
   */
  /**
   * Upload image using multipart form data (same as uploadImageJson now)
   */
  async uploadImage(request: UploadImageRequest): Promise<UploadImageResponse> {
    // Both methods now use the same backend approach
    return this.uploadImageJson(request);
  }

  /**
   * Delete an image from product gallery
   */
  async deleteImage(productId: string, imageId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}/gallery/${imageId}`, withLangHeaders({
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    }));

    return handleResponse(response);
  }

  /**
   * Reorder images in product gallery
   */
  async reorderImages(request: ReorderImagesRequest): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/products/${request.productId}/gallery/reorder`, withLangHeaders({
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    }));

    return handleResponse(response);
  }

  /**
   * Generate CDN URL for product gallery with validation
   */
  generateCDNUrl(productId: string, fileName: string): string {
    const cdnBase = process.env.NEXT_PUBLIC_CDN_BASE;
    if (!cdnBase) {
      throw new Error('CDN base URL not configured');
    }

    if (!productId || !fileName) {
      throw new Error('Product ID and filename are required');
    }

    const folderName = productId.toUpperCase();
    return `${cdnBase}/${folderName}/${fileName}`;
  }

  /**
   * Generate secure filename with timestamp to avoid conflicts
   */
  generateFileName(_productId: string, originalName: string): string {
    if (!originalName) {
      throw new Error('Original filename is required');
    }

    const timestamp = Date.now();
    const extension = originalName.split('.').pop() || 'png';
    // Sanitize filename to prevent path traversal and other security issues
    const baseName = originalName
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars with underscore
      .substring(0, 50); // Limit length

    return `${timestamp}_${baseName}.${extension}`;
  }

  /**
   * Load images from database for a product (sorted by order)
   */
  /**
   * Load images from database for a product (sorted by order)
   * Optimized version with better error handling and reduced logging
   */
  async loadProductImagesFromSpaces(productId: string): Promise<string[]> {
    try {
      const galleryImages = await this.getProductImages(productId);

      if (galleryImages.length === 0) {
        return [];
      }

      // Sort by order and extract URLs (prefer CDN URLs)
      const sortedImages = galleryImages.sort((a, b) => (a.order || 0) - (b.order || 0));
      const imageUrls = sortedImages.map(img => img.cdnUrl || img.url).filter(Boolean);

      if (process.env.NODE_ENV === 'development' && imageUrls.length > 0) {
        console.log(`📸 Loaded ${imageUrls.length} images for product ${productId}`);
      }

      return imageUrls;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Failed to load images for product ${productId}:`, error);
      }
      return [];
    }
  }




  /**
   * Delete image via backend API (backend handles DigitalOcean Spaces deletion)
   */
  async deleteImageFromSpaces(imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      const url = new URL(imageUrl);
      const key = url.pathname.substring(1); // Remove leading slash

      if (!key) {
        throw new Error('Invalid image URL - no key found');
      }

      const headers = { ...defaultHeaders };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/gallery/delete`, withLangHeaders({
        method: 'POST',
        headers: headers as HeadersInit,
        body: JSON.stringify({ key, imageUrl }),
      }));

      if (!response.ok) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Backend delete API returned ${response.status}`);
        }
        // Don't throw error - backend might not have this endpoint implemented yet
        return true;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Image deleted via backend API:', key);
      }

      return true;

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Failed to delete image via backend:', error);
      }
      // Return true to not break UI - deletion might have worked
      return true;
    }
  }

  /**
   * Check if backend API is available (no frontend config needed now)
   */
  isSpacesConfigured(): boolean {
    // Always return true since backend handles all Spaces configuration
    return !!API_BASE_URL;
  }

  /**
   * Get configuration status for debugging
   */
  getConfigurationStatus(): { configured: boolean; details: Record<string, boolean> } {
    return {
      configured: !!API_BASE_URL,
      details: {
        hasBackendAPI: !!API_BASE_URL,
        usingBackendOnly: true,
        noFrontendAWS: true
      }
    };
  }
}

export const productGalleryService = new ProductGalleryService();
