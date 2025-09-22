import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import { uploadImageToSpaces } from './digitalOceanUpload';
import AWS from 'aws-sdk';

// DigitalOcean Spaces configuration for S3-compatible operations
const SPACES_CONFIG = {
  bucket: import.meta.env.VITE_DO_SPACES_BUCKET || 'mi-gallery',
  endpoint: import.meta.env.VITE_DO_SPACES_ENDPOINT || 'fra1.digitaloceanspaces.com',
  region: 'fra1'
} as const;

// Lazy initialization of S3 client to avoid unnecessary setup
let s3Client: AWS.S3 | null = null;

const getS3Client = (): AWS.S3 => {
  if (!s3Client) {
    // Validate configuration before creating client
    const accessKey = import.meta.env.VITE_DO_SPACES_ACCESS_KEY;
    const secretKey = import.meta.env.VITE_DO_SPACES_SECRET_KEY;
    
    if (!accessKey || !secretKey || !SPACES_CONFIG.bucket || !SPACES_CONFIG.endpoint) {
      throw new Error('DigitalOcean Spaces configuration is incomplete');
    }

    try {
      const spacesEndpoint = new AWS.Endpoint(`https://${SPACES_CONFIG.bucket}.${SPACES_CONFIG.endpoint}`);
      
      s3Client = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: SPACES_CONFIG.region,
        signatureVersion: 'v4',
        s3ForcePathStyle: false,
        s3BucketEndpoint: true,
        httpOptions: {
          timeout: 5000,
          connectTimeout: 3000
        }
      });
    } catch (error) {
      throw new Error(`Failed to initialize S3 client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return s3Client;
};

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
   * Upload image using frontend-first approach with optimized logging
   */
  async uploadImageJson(request: UploadImageRequest): Promise<UploadImageResponse> {
    try {
      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const extension = request.file.name.split('.').pop() || 'png';
      const baseName = request.file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      const generatedFileName = `${timestamp}_${baseName}.${extension}`;
      const folderName = request.productId.toUpperCase();
      
      // Step 1: Upload to DigitalOcean Spaces
      const spacesResult = await uploadImageToSpaces({
        productId: request.productId,
        file: request.file,
        preserveOriginalName: false,
        customFileName: generatedFileName
      });

      if (!spacesResult.success) {
        throw new Error(`DigitalOcean Spaces upload failed: ${spacesResult.error}`);
      }

      // Step 2: Send metadata to backend
      const metadata: UploadImageJsonRequest = {
        fileName: generatedFileName,
        originalName: request.file.name,
        mimeType: request.file.type,
        fileSize: request.file.size,
        order: request.order,
        folderName: folderName
      };

      const headers = { ...defaultHeaders };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const metadataPayload = {
        ...metadata,
        url: spacesResult.url,
        cdnUrl: spacesResult.url
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
        
        throw new Error(`Backend metadata save failed (${response.status}): ${errorDetails.args?.message || errorDetails.message || 'Unknown error'}`);
      }

      const result = await handleResponse(response);
      
      if (import.meta.env.DEV) {
        console.log('✅ Image upload completed successfully');
      }
      
      return result;

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Image upload failed:', error);
      }
      throw error;
    }
  }

  /**
   * Upload a new image for a product (legacy multipart approach)
   */
  /**
   * Upload image using legacy multipart approach (optimized logging)
   */
  async uploadImage(request: UploadImageRequest): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    
    if (request.order !== undefined) {
      formData.append('order', request.order.toString());
    }

    const headers = { ...defaultHeaders };
    delete (headers as any)['Content-Type']; // Browser sets boundary for FormData
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/products/${request.productId}/gallery/upload`, withLangHeaders({
      method: 'POST',
      headers: headers as HeadersInit,
      body: formData,
    }));

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

    return handleResponse(response);
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
    const cdnBase = import.meta.env.VITE_CDN_BASE;
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
      
      if (import.meta.env.DEV && imageUrls.length > 0) {
        console.log(`📸 Loaded ${imageUrls.length} images for product ${productId}`);
      }
      
      return imageUrls;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn(`Failed to load images for product ${productId}:`, error);
      }
      return [];
    }
  }




  /**
   * Delete image from DigitalOcean Spaces by URL with improved error handling
   */
  async deleteImageFromSpaces(imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      // Check if Spaces is properly configured before attempting operation
      if (!this.isSpacesConfigured()) {
        if (import.meta.env.DEV) {
          console.warn('DigitalOcean Spaces not configured, skipping delete operation');
        }
        return false;
      }

      const url = new URL(imageUrl);
      const key = url.pathname.substring(1); // Remove leading slash
      
      if (!key) {
        throw new Error('Invalid image URL - no key found');
      }

      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: SPACES_CONFIG.bucket,
        Key: key
      };

      await getS3Client().deleteObject(deleteParams).promise();
      
      if (import.meta.env.DEV) {
        console.log('✅ Deleted image from Spaces:', key);
      }
      
      return true;

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Failed to delete image from Spaces:', error);
      }
      return false;
    }
  }

  /**
   * Check if DigitalOcean Spaces is properly configured with enhanced validation
   */
  isSpacesConfigured(): boolean {
    const accessKey = import.meta.env.VITE_DO_SPACES_ACCESS_KEY;
    const secretKey = import.meta.env.VITE_DO_SPACES_SECRET_KEY;
    const bucket = import.meta.env.VITE_DO_SPACES_BUCKET;

    return !!(
      accessKey && 
      secretKey && 
      bucket &&
      accessKey.length > 10 && // Basic length validation
      secretKey.length > 20 && // Basic length validation
      accessKey !== 'YOUR_ACCESS_KEY_HERE' &&
      secretKey !== 'YOUR_SECRET_KEY_HERE' &&
      !accessKey.includes('example') &&
      !secretKey.includes('example')
    );
  }

  /**
   * Get configuration status for debugging
   */
  getConfigurationStatus(): { configured: boolean; details: Record<string, boolean> } {
    const accessKey = import.meta.env.VITE_DO_SPACES_ACCESS_KEY;
    const secretKey = import.meta.env.VITE_DO_SPACES_SECRET_KEY;
    const bucket = import.meta.env.VITE_DO_SPACES_BUCKET;
    const endpoint = import.meta.env.VITE_DO_SPACES_ENDPOINT;

    return {
      configured: this.isSpacesConfigured(),
      details: {
        hasAccessKey: !!accessKey,
        hasSecretKey: !!secretKey,
        hasBucket: !!bucket,
        hasEndpoint: !!endpoint,
        validAccessKeyLength: !!(accessKey && accessKey.length > 10),
        validSecretKeyLength: !!(secretKey && secretKey.length > 20)
      }
    };
  }
}

export const productGalleryService = new ProductGalleryService();