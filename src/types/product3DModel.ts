/**
 * Type definitions for 3D model (.glb file) management
 */

/**
 * Response from uploading a 3D model
 */
export interface Model3DUploadResponse {
  success: boolean;
  cdnUrl: string;
  directUrl: string;
  fileSize: number;
  fileName: string;
  message: string;
  uploadedAt: string;
}

/**
 * Response with 3D model information
 */
export interface Model3DInfoResponse {
  hasModel: boolean;
  cdnUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt?: string;
}

/**
 * Response from deleting a 3D model
 */
export interface ModelDeleteResponse {
  success: boolean;
  message: string;
}

/**
 * Upload state for tracking upload progress
 */
export interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}
