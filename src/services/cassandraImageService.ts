import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import { logInfo, logWarn, logError } from '../services/logger';

export interface CassandraImageDto {
    id?: number;
    imageUrl: string;
    thumbnailUrl?: string;
    name: string;
    description?: string;
    displayOrder?: number;
    active?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Public API - Get all active Cassandra images
 */
export const getActiveImages = async (): Promise<CassandraImageDto[]> => {
    const response = await fetch(`${API_BASE_URL}/api/cassandra/images`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
    }));
    return handleResponse(response);
};

/**
 * Public API - Get Cassandra image by ID
 */
export const getImageById = async (id: number): Promise<CassandraImageDto> => {
    const response = await fetch(`${API_BASE_URL}/api/cassandra/images/${id}`, withLangHeaders({
        method: 'GET',
        headers: defaultHeaders as HeadersInit,
    }));
    return handleResponse(response);
};

/**
 * Admin API - Get all Cassandra images (including inactive)
 */
export const getAllImages = async (): Promise<CassandraImageDto[]> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/cassandra/images`, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
    }));
    return handleResponse(response);
};

/**
 * Admin API - Create new Cassandra image
 */
export const createImage = async (image: CassandraImageDto): Promise<CassandraImageDto> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/cassandra/images`, withLangHeaders({
        method: 'POST',
        headers: headers as HeadersInit,
        body: JSON.stringify(image),
    }));
    return handleResponse(response);
};

/**
 * Admin API - Update existing Cassandra image
 */
export const updateImage = async (id: number, image: CassandraImageDto): Promise<CassandraImageDto> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/cassandra/images/${id}`, withLangHeaders({
        method: 'PUT',
        headers: headers as HeadersInit,
        body: JSON.stringify(image),
    }));
    return handleResponse(response);
};

/**
 * Admin API - Delete Cassandra image
 */
export const deleteImage = async (id: number): Promise<void> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/cassandra/images/${id}`, withLangHeaders({
        method: 'DELETE',
        headers: headers as HeadersInit,
    }));

    if (!response.ok) {
        throw new Error(`Failed to delete image: ${response.status}`);
    }
};

/**
 * Admin API - Toggle image active status
 */
export const toggleActiveStatus = async (id: number): Promise<CassandraImageDto> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/cassandra/images/${id}/toggle-active`, withLangHeaders({
        method: 'PATCH',
        headers: headers as HeadersInit,
    }));
    return handleResponse(response);
};

/**
 * Convert file to base64 string
 */
const fileToBase64 = async (file: File): Promise<string> => {
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
};

export interface UploadImageJsonRequest {
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    order?: number;
    folderName: string;
    fileData: string; // Base64 encoded image data
}

export interface UploadImageResponse {
    success: boolean;
    image: CassandraImageDto;
    cdnUrl: string;
    message?: string;
}

/**
 * Admin API - Upload Cassandra image via JSON with base64 data
 */
export const uploadImageJson = async (file: File, order?: number): Promise<UploadImageResponse> => {
    try {
        // Convert file to base64
        const base64Data = await fileToBase64(file);

        // Generate filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || 'png';
        const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
        const generatedFileName = `${timestamp}_${baseName}.${extension}`;

        // Prepare JSON request
        const jsonRequest: UploadImageJsonRequest = {
            fileName: generatedFileName,
            originalName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            order: order || 0,
            folderName: 'CASSANDRA',
            fileData: base64Data
        };

        const token = localStorage.getItem('token');
        const headers = { ...defaultHeaders };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/cassandra/images/upload-json`, withLangHeaders({
            method: 'POST',
            headers: headers as HeadersInit,
            body: JSON.stringify(jsonRequest),
        }));

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }

        return handleResponse(response);
    } catch (error) {
        logError('Upload failed:', error);
        throw error;
    }
};

export const cassandraImageService = {
    getActiveImages,
    getImageById,
    getAllImages,
    createImage,
    updateImage,
    deleteImage,
    toggleActiveStatus,
    uploadImageJson,
};

export default cassandraImageService;
