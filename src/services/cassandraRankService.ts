import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';
import { logError } from '../services/logger';

// Rank type matching backend
export type Rank = 'PRIVATE' | 'CORPORAL' | 'SERGEANT' | 'LIEUTENANT' | 'CAPTAIN' | 'MAJOR' | 'COLONEL' | 'GENERAL' | 'FIELD_MARSHAL';

// DTO matching backend CassandraRankImageDto
export interface CassandraRankImageDto {
    id: number;
    rank: Rank;
    rankName: string;
    rankLevel: number;
    requiredXp: number;
    description: string;
    imageUrl?: string;
    thumbnailUrl?: string;
    fileName?: string;
    originalFilename?: string;
    fileSize?: number;
    mimeType?: string;
    hasImage: boolean;
    createdByUsername?: string;
    createdById?: number;
}

// DTO matching backend UserCassandraDto
export interface UserCassandraDto {
    userId: number;
    totalXp: number;

    // Current rank
    currentRank: Rank;
    currentRankName: string;
    currentRankLevel: number;
    currentRankRequiredXp: number;
    currentRankDescription: string;
    currentRankImageUrl?: string;
    currentRankThumbnailUrl?: string;

    // Progress
    xpInCurrentRank: number;
    xpNeededForNextRank?: number;
    progressPercentage?: number;

    // Next rank (null if max rank)
    nextRank?: Rank;
    nextRankName?: string;
    nextRankLevel?: number;
    nextRankRequiredXp?: number;
    nextRankDescription?: string;
    nextRankThumbnailUrl?: string;

    isMaxRank: boolean;
}

export interface UploadImageJsonRequest {
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    order?: number;
    folderName: string;
    fileData: string; // Base64 encoded image data
}

/**
 * Convert file to base64 string
 */
const fileToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
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

// =============================================================================
// ADMIN APIs
// =============================================================================

/**
 * Admin API - Get all 9 rank images
 */
export const getAllRankImages = async (): Promise<CassandraRankImageDto[]> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/cassandra-ranks`, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
    }));
    return handleResponse(response);
};

/**
 * Admin API - Get specific rank image
 */
export const getRankImage = async (rank: Rank): Promise<CassandraRankImageDto> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/cassandra-ranks/${rank}`, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
    }));
    return handleResponse(response);
};

/**
 * Admin API - Upload image for specific rank
 */
export const uploadRankImage = async (rank: Rank, file: File): Promise<CassandraRankImageDto> => {
    try {
        // Convert file to base64
        const base64Data = await fileToBase64(file);

        // Generate filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || 'png';
        const generatedFileName = `${rank}_${timestamp}.${extension}`;

        // Prepare JSON request
        const jsonRequest: UploadImageJsonRequest = {
            fileName: generatedFileName,
            originalName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            order: 0,
            folderName: 'CASSANDRA_RANKS',
            fileData: base64Data
        };

        const token = localStorage.getItem('token');
        const headers = { ...defaultHeaders };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/admin/cassandra-ranks/${rank}/upload`, withLangHeaders({
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

/**
 * Admin API - Update rank description
 */
export const updateRankDescription = async (rank: Rank, description: string): Promise<CassandraRankImageDto> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/cassandra-ranks/${rank}/description`, withLangHeaders({
        method: 'PUT',
        headers: headers as HeadersInit,
        body: JSON.stringify({ description }),
    }));
    return handleResponse(response);
};

/**
 * Admin API - Delete rank image (keeps rank record, removes image)
 */
export const deleteRankImage = async (rank: Rank): Promise<void> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/cassandra-ranks/${rank}/image`, withLangHeaders({
        method: 'DELETE',
        headers: headers as HeadersInit,
    }));

    if (!response.ok) {
        throw new Error(`Failed to delete rank image: ${response.status}`);
    }
};

// =============================================================================
// USER APIs
// =============================================================================

/**
 * User API - Get current user's Cassandra rank info
 */
export const getUserCassandraInfo = async (): Promise<UserCassandraDto> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/gamification/cassandra`, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
    }));
    return handleResponse(response);
};

// Export service object
export const cassandraRankService = {
    // Admin
    getAllRankImages,
    getRankImage,
    uploadRankImage,
    updateRankDescription,
    deleteRankImage,

    // User
    getUserCassandraInfo,
};

export default cassandraRankService;
