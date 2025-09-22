import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import { uploadImageToSpaces } from './digitalOceanUpload';
import AWS from 'aws-sdk';

// Configure DigitalOcean Spaces (S3-compatible) 
// Use the full bucket endpoint to avoid incorrect URL construction
const bucket = import.meta.env.VITE_DO_SPACES_BUCKET || 'mi-gallery';
const baseEndpoint = import.meta.env.VITE_DO_SPACES_ENDPOINT || 'fra1.digitaloceanspaces.com';
const spacesEndpoint = new AWS.Endpoint(`https://${bucket}.${baseEndpoint}`);

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: import.meta.env.VITE_DO_SPACES_ACCESS_KEY,
  secretAccessKey: import.meta.env.VITE_DO_SPACES_SECRET_KEY,
  region: 'fra1',
  signatureVersion: 'v4',
  s3ForcePathStyle: false, // Use virtual hosted style for DigitalOcean Spaces
  s3BucketEndpoint: true, // Important for DigitalOcean Spaces
  httpOptions: {
    timeout: 5000, // Reduced timeout to 5 seconds
    connectTimeout: 3000 // Reduced connection timeout to 3 seconds
  }
});

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
  async uploadImageJson(request: UploadImageRequest): Promise<UploadImageResponse> {
    try {
      // Step 1: Upload image directly to DigitalOcean Spaces
      console.log('🚀 Step 1: Uploading image to DigitalOcean Spaces...');
      
      // Generate unique filename to avoid conflicts
      const timestamp = Date.now();
      const extension = request.file.name.split('.').pop() || 'png';
      const baseName = request.file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      const generatedFileName = `${timestamp}_${baseName}.${extension}`;
      const folderName = request.productId.toUpperCase();
      
      // Upload to DigitalOcean Spaces using existing service
      const spacesResult = await uploadImageToSpaces({
        productId: request.productId,
        file: request.file,
        preserveOriginalName: false, // Use generated filename
        customFileName: generatedFileName
      });

      if (!spacesResult.success) {
        throw new Error(`DigitalOcean Spaces upload failed: ${spacesResult.error}`);
      }

      console.log('✅ Step 1 complete: Image uploaded to Spaces:', spacesResult.url);

      // Step 2: Send metadata to backend database
      console.log('🗃️ Step 2: Saving metadata to backend database...');
      
      const metadata: UploadImageJsonRequest = {
        fileName: generatedFileName,
        originalName: request.file.name,
        mimeType: request.file.type,
        fileSize: request.file.size,
        order: request.order,
        folderName: folderName
      };

      console.log('📤 Sending metadata to backend:', {
        url: `${API_BASE_URL}/api/products/${request.productId}/gallery/metadata`,
        metadata: metadata,
        spacesUrl: spacesResult.url
      });

      const headers = { ...defaultHeaders };
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Send metadata + Spaces URL to backend
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
        // If metadata save fails, we should ideally clean up the Spaces upload
        console.warn('⚠️ Metadata save failed, but image is already in Spaces:', spacesResult.url);
        
        let errorDetails;
        try {
          const errorText = await response.text();
          errorDetails = JSON.parse(errorText);
          console.error('❌ Backend metadata save failed:', {
            status: response.status,
            statusText: response.statusText,
            errorDetails: errorDetails
          });
        } catch (parseError) {
          console.error('❌ Failed to parse error response:', parseError);
          errorDetails = { message: 'Failed to parse error response' };
        }
        
        throw new Error(`Backend metadata save failed (${response.status}): ${errorDetails.args?.message || errorDetails.message || 'Unknown error'}`);
      }

      const result = await handleResponse(response);
      console.log('✅ Step 2 complete: Metadata saved to database');
      
      return result;

    } catch (error) {
      console.error('❌ Frontend-first upload error:', error);
      throw error;
    }
  }

  /**
   * Upload a new image for a product (legacy multipart approach)
   */
  async uploadImage(request: UploadImageRequest): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    // Don't send productId in FormData - backend gets it from path parameter
    if (request.order !== undefined) {
      formData.append('order', request.order.toString());
    }

    // For FormData, don't set Content-Type header - browser will set it with boundary
    const headers = { ...defaultHeaders };
    delete (headers as any)['Content-Type'];
    
    // Add authorization if available
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${API_BASE_URL}/api/products/${request.productId}/gallery/upload`;
    
    console.log('📤 Uploading to backend:', {
      fullUrl: fullUrl,
      method: 'POST',
      fileName: request.file.name,
      fileSize: request.file.size,
      fileType: request.file.type,
      order: request.order,
      headers: headers,
      API_BASE_URL: API_BASE_URL
    });

    // Log FormData contents
    console.log('📦 FormData contents:');
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    const response = await fetch(fullUrl, withLangHeaders({
      method: 'POST',
      headers: headers as HeadersInit,
      body: formData,
    }));

    if (!response.ok) {
      let errorDetails;
      try {
        const errorText = await response.text();
        errorDetails = JSON.parse(errorText);
        console.error('❌ Backend upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorDetails: errorDetails
        });
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
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
   * Get CDN URL for product gallery (for frontend-only use)
   */
  generateCDNUrl(productId: string, fileName: string): string {
    const cdnBase = import.meta.env.VITE_CDN_BASE;
    if (!cdnBase) {
      throw new Error('CDN base URL not configured');
    }

    // Use product ID or name as folder
    const folderName = productId.toUpperCase();
    return `${cdnBase}/${folderName}/${fileName}`;
  }

  /**
   * Generate filename with timestamp to avoid conflicts
   */
  generateFileName(_productId: string, originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension
    return `${timestamp}_${baseName}.${extension}`;
  }

  /**
   * Load images from database for a product (sorted by order)
   */
  async loadProductImagesFromSpaces(productId: string): Promise<string[]> {

    console.log(`🔍 Loading gallery images from database for product: ${productId}`);

    try {
      // Use the existing database-based getProductImages method
      const galleryImages = await this.getProductImages(productId);
      
      if (galleryImages.length === 0) {
        console.log(`📁 No gallery images found in database for product: ${productId}`);
        return [];
      }
      
      // Sort by order and extract URLs (prefer CDN URLs)
      const sortedImages = galleryImages.sort((a, b) => (a.order || 0) - (b.order || 0));
      const imageUrls = sortedImages.map(img => img.cdnUrl || img.url).filter(Boolean);
      
      console.log(`📸 Loaded ${imageUrls.length} images from database (sorted by order):`, {
        totalImages: imageUrls.length,
        imageUrls: imageUrls,
        orderInfo: sortedImages.map(img => ({ 
          fileName: img.fileName, 
          order: img.order,
          url: img.cdnUrl || img.url 
        }))
      });
      
      return imageUrls;
    } catch (error) {
      console.warn('⚠️ Failed to load images from database:', error);
      return [];
    }

    /* AWS SDK approach commented out due to CSP and infinite loading issues:
    try {
      const listParams: AWS.S3.ListObjectsV2Request = {
        Bucket: bucket,
        Prefix: `${folderName}/`,
        MaxKeys: 50
      };

      console.log('🔄 Attempting AWS SDK listObjectsV2...', listParams);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 5 seconds')), 5000);
      });

      const result = await Promise.race([
        s3.listObjectsV2(listParams).promise(),
        timeoutPromise
      ]);

      if (!result.Contents || result.Contents.length === 0) {
        console.log(`📁 No images found in folder: ${folderName}`);
        return [];
      }

      const imageUrls = result.Contents
        .filter(obj => {
          const fileName = obj.Key?.split('/').pop();
          if (!fileName) return false;
          const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
          const extension = fileName.split('.').pop()?.toLowerCase();
          return extension && imageExtensions.includes(extension);
        })
        .sort((a, b) => {
          const dateA = a.LastModified?.getTime() || 0;
          const dateB = b.LastModified?.getTime() || 0;
          if (dateA !== dateB) return dateA - dateB;
          const fileNameA = a.Key?.split('/').pop() || '';
          const fileNameB = b.Key?.split('/').pop() || '';
          return fileNameA.localeCompare(fileNameB);
        })
        .map(obj => `https://${bucket}.${baseEndpoint}/${obj.Key}`);

      console.log(`📸 Loaded ${imageUrls.length} images for product ${productId} from Spaces:`, imageUrls);
      return imageUrls;

    } catch (error) {
      console.warn(`⚠️ Failed to load images for folder "${folderName}" from Spaces:`, error instanceof Error ? error.message : error);
      return [];
    }
    */
  }




  /**
   * Delete image from DigitalOcean Spaces by URL
   */
  async deleteImageFromSpaces(imageUrl: string): Promise<boolean> {
    try {
      // Extract key from URL
      // URL format: https://bucket.endpoint/folder/filename
      const url = new URL(imageUrl);
      const key = url.pathname.substring(1); // Remove leading slash

      const bucket = import.meta.env.VITE_DO_SPACES_BUCKET || 'mi-gallery';

      const deleteParams: AWS.S3.DeleteObjectRequest = {
        Bucket: bucket,
        Key: key
      };

      await s3.deleteObject(deleteParams).promise();
      console.log('✅ Deleted image from Spaces:', key);
      return true;

    } catch (error) {
      console.error('❌ Failed to delete image from Spaces:', error);
      return false;
    }
  }

  /**
   * Check if DigitalOcean Spaces is properly configured
   */
  isSpacesConfigured(): boolean {
    const accessKey = import.meta.env.VITE_DO_SPACES_ACCESS_KEY;
    const secretKey = import.meta.env.VITE_DO_SPACES_SECRET_KEY;
    const bucket = import.meta.env.VITE_DO_SPACES_BUCKET;

    return !!(
      accessKey && secretKey && bucket &&
      accessKey !== 'YOUR_ACCESS_KEY_HERE' &&
      secretKey !== 'YOUR_SECRET_KEY_HERE'
    );
  }
}

export const productGalleryService = new ProductGalleryService();