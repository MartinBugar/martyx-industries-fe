import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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
    const response = await axios.get(`${API_URL}/cassandra/images`);
    return response.data;
};

/**
 * Public API - Get Cassandra image by ID
 */
export const getImageById = async (id: number): Promise<CassandraImageDto> => {
    const response = await axios.get(`${API_URL}/cassandra/images/${id}`);
    return response.data;
};

/**
 * Admin API - Get all Cassandra images (including inactive)
 */
export const getAllImages = async (): Promise<CassandraImageDto[]> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/admin/cassandra/images`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

/**
 * Admin API - Create new Cassandra image
 */
export const createImage = async (image: CassandraImageDto): Promise<CassandraImageDto> => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/admin/cassandra/images`, image, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

/**
 * Admin API - Update existing Cassandra image
 */
export const updateImage = async (id: number, image: CassandraImageDto): Promise<CassandraImageDto> => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${API_URL}/admin/cassandra/images/${id}`, image, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

/**
 * Admin API - Delete Cassandra image
 */
export const deleteImage = async (id: number): Promise<void> => {
    const token = localStorage.getItem('token');
    await axios.delete(`${API_URL}/admin/cassandra/images/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

/**
 * Admin API - Toggle image active status
 */
export const toggleActiveStatus = async (id: number): Promise<CassandraImageDto> => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(`${API_URL}/admin/cassandra/images/${id}/toggle-active`, {}, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const cassandraImageService = {
    getActiveImages,
    getImageById,
    getAllImages,
    createImage,
    updateImage,
    deleteImage,
    toggleActiveStatus,
};

export default cassandraImageService;
