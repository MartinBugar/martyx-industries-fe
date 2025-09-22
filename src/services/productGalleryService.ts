import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import AWS from 'aws-sdk';

// Configure DigitalOcean Spaces (S3-compatible) - same as digitalOceanUpload service
const spacesEndpoint = new AWS.Endpoint(import.meta.env.VITE_DO_SPACES_ENDPOINT || 'fra1.digitaloceanspaces.com');

const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: import.meta.env.VITE_DO_SPACES_ACCESS_KEY,
  secretAccessKey: import.meta.env.VITE_DO_SPACES_SECRET_KEY,
  region: 'fra1',
  signatureVersion: 'v4',
  s3ForcePathStyle: false, // Use virtual hosted style for DigitalOcean Spaces
  s3BucketEndpoint: true, // Important for DigitalOcean Spaces
  httpOptions: {
    timeout: 10000, // 10 second timeout
    connectTimeout: 5000 // 5 second connection timeout
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
  createdAt: string;
}

export interface UploadImageRequest {
  productId: string;
  file: File;
  order?: number;
}

export interface UploadImageResponse {
  success: boolean;
  image: GalleryImage;
  cdnUrl: string;
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
   * Get all images for a product
   */
  async getProductImages(productId: string): Promise<GalleryImage[]> {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}/gallery`, withLangHeaders({
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    }));

    return handleResponse(response);
  }

  /**
   * Upload a new image for a product
   */
  async uploadImage(request: UploadImageRequest): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('productId', request.productId);
    if (request.order !== undefined) {
      formData.append('order', request.order.toString());
    }

    const headers = { ...defaultHeaders };
    // Remove Content-Type to let browser set it with boundary for FormData
    delete (headers as any)['Content-Type'];

    const response = await fetch(`${API_BASE_URL}/api/products/${request.productId}/gallery/upload`, withLangHeaders({
      method: 'POST',
      headers: headers as HeadersInit,
      body: formData,
    }));

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
   * Load images from DigitalOcean Spaces folder for a product
   */
  async loadProductImagesFromSpaces(productId: string): Promise<string[]> {

    const folderName = productId.toUpperCase();

    console.log(`🔍 Looking for images in folder: ${folderName}`);

    // Try simpler approach first - attempt to list via HTTP
    try {
      const result = await this.loadImagesViaHttp(folderName);
      if (result.length > 0) {
        console.log(`📸 Loaded ${result.length} images via HTTP:`, result);
        return result;
      }
    } catch (error) {
      console.log('HTTP approach failed, trying AWS SDK:', error);
    }

    // Use AWS SDK approach
    try {
      const bucket = import.meta.env.VITE_DO_SPACES_BUCKET || 'mi-gallery';

      // List objects in the product folder
      const listParams: AWS.S3.ListObjectsV2Request = {
        Bucket: bucket,
        Prefix: `${folderName}/`,
        MaxKeys: 50 // Reduce limit to 50 images per product
      };

      console.log('🔄 Attempting AWS SDK listObjectsV2...', listParams);

      // Direct call without timeout race condition
      const result = await s3.listObjectsV2(listParams).promise();

      if (!result.Contents || result.Contents.length === 0) {
        console.log(`📁 No images found in folder: ${folderName}`);
        return [];
      }

      console.log(`📁 Found ${result.Contents.length} objects in folder: ${folderName}`);

      // Filter for image files and sort by last modified date or filename
      const imageUrls = result.Contents
        .filter(obj => {
          const fileName = obj.Key?.split('/').pop();
          if (!fileName) return false;

          // Check if it's an image file (by extension)
          const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
          const extension = fileName.split('.').pop()?.toLowerCase();
          return extension && imageExtensions.includes(extension);
        })
        .sort((a, b) => {
          // Sort by last modified date (newest first) or by filename if dates are same
          const dateA = a.LastModified?.getTime() || 0;
          const dateB = b.LastModified?.getTime() || 0;

          if (dateA !== dateB) {
            return dateA - dateB; // Oldest first (upload order)
          }

          // If dates are same, sort by filename alphabetically
          const fileNameA = a.Key?.split('/').pop() || '';
          const fileNameB = b.Key?.split('/').pop() || '';
          return fileNameA.localeCompare(fileNameB);
        })
        .map(obj => {
          // Construct the public URL for the image
          const endpoint = import.meta.env.VITE_DO_SPACES_ENDPOINT || 'fra1.digitaloceanspaces.com';
          return `https://${bucket}.${endpoint}/${obj.Key}`;
        });

      console.log(`📸 Loaded ${imageUrls.length} images for product ${productId} from Spaces:`, imageUrls);
      return imageUrls;

    } catch (error) {
      console.warn(`⚠️ Failed to load images for folder "${folderName}" from Spaces:`, error instanceof Error ? error.message : error);

      // If it's a timeout, the folder probably doesn't exist - this is normal
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log(`📁 Folder "${folderName}" doesn't exist or is empty - this is normal for new products`);
      }

      return [];
    }
  }

  /**
   * Try to load images using direct HTTP request (simpler approach)
   */
  private async loadImagesViaHttp(folderName: string): Promise<string[]> {
    try {
      const bucket = import.meta.env.VITE_DO_SPACES_BUCKET || 'mi-gallery';
      const endpoint = import.meta.env.VITE_DO_SPACES_ENDPOINT || 'fra1.digitaloceanspaces.com';

      // Try to list bucket contents via HTTP XML API
      const url = `https://${bucket}.${endpoint}/?list-type=2&prefix=${folderName}/&max-keys=50`;

      console.log('🌐 Trying HTTP XML API:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log('📄 XML Response received:', xmlText.substring(0, 200) + '...');

      // Parse XML to extract image URLs
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Look for <Contents> elements which contain <Key> elements
      const contents = xmlDoc.getElementsByTagName('Contents');
      const imageUrls: string[] = [];

      for (let i = 0; i < contents.length; i++) {
        const keyElement = contents[i].getElementsByTagName('Key')[0];
        if (keyElement) {
          const key = keyElement.textContent;
          if (key && key.startsWith(`${folderName}/`)) {
            const fileName = key.split('/').pop();
            if (fileName) {
              // Check if it's an image file
              const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
              const extension = fileName.split('.').pop()?.toLowerCase();
              if (extension && imageExtensions.includes(extension)) {
                const imageUrl = `https://${bucket}.${endpoint}/${key}`;
                imageUrls.push(imageUrl);
              }
            }
          }
        }
      }

      console.log(`📸 Found ${imageUrls.length} images via HTTP:`, imageUrls);
      return imageUrls;

    } catch (error) {
      console.warn('⚠️ HTTP approach failed:', error);
      return [];
    }
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