import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

/**
 * XP Configuration DTO matching backend XpConfig entity
 */
export interface XpConfigDto {
    id: number;
    sourceCode: string;
    sourceName: string;
    sourceNameEn?: string;
    sourceNameDe?: string;
    xpAmount: number;
    isEnabled: boolean;
    frequencyLimit?: string;
    maxPerDay?: number;
    maxTotal?: number;
    description?: string;
    descriptionEn?: string;
    descriptionDe?: string;
    displayOrder: number;
    icon?: string;
    createdAt: string;
    updatedAt: string;
    updatedBy?: {
        id: number;
        username: string;
    };
}

/**
 * Request body for updating XP configuration
 */
export interface UpdateXpConfigRequest {
    sourceName: string;
    sourceNameEn?: string;
    sourceNameDe?: string;
    xpAmount: number;
    isEnabled: boolean;
    frequencyLimit?: string;
    maxPerDay?: number;
    maxTotal?: number;
    description?: string;
    descriptionEn?: string;
    descriptionDe?: string;
    displayOrder: number;
    icon?: string;
}

/**
 * Request body for creating new XP configuration
 */
export interface CreateXpConfigRequest extends UpdateXpConfigRequest {
    sourceCode: string;
}

// =============================================================================
// ADMIN APIs
// =============================================================================

/**
 * Admin API - Get all XP configurations (ordered by display order)
 */
export const getAllXpConfigs = async (): Promise<XpConfigDto[]> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/xp-config`, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
    }));
    return handleResponse(response);
};

/**
 * Admin API - Get XP configuration by ID
 */
export const getXpConfigById = async (id: number): Promise<XpConfigDto> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/xp-config/${id}`, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
    }));
    return handleResponse(response);
};

/**
 * Admin API - Get XP configuration by source code
 */
export const getXpConfigBySource = async (sourceCode: string): Promise<XpConfigDto> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/xp-config/source/${sourceCode}`, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
    }));
    return handleResponse(response);
};

/**
 * Admin API - Update XP configuration
 */
export const updateXpConfig = async (id: number, config: UpdateXpConfigRequest): Promise<XpConfigDto> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/xp-config/${id}`, withLangHeaders({
        method: 'PUT',
        headers: headers as HeadersInit,
        body: JSON.stringify(config),
    }));
    return handleResponse(response);
};

/**
 * Admin API - Create new XP configuration
 */
export const createXpConfig = async (config: CreateXpConfigRequest): Promise<XpConfigDto> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/xp-config`, withLangHeaders({
        method: 'POST',
        headers: headers as HeadersInit,
        body: JSON.stringify(config),
    }));
    return handleResponse(response);
};

/**
 * Admin API - Delete XP configuration
 */
export const deleteXpConfig = async (id: number): Promise<void> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/xp-config/${id}`, withLangHeaders({
        method: 'DELETE',
        headers: headers as HeadersInit,
    }));

    if (!response.ok) {
        throw new Error(`Failed to delete XP config: ${response.status}`);
    }
};

/**
 * Admin API - Enable/disable XP source
 */
export const toggleXpSource = async (id: number, enabled: boolean): Promise<XpConfigDto> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/admin/xp-config/${id}/toggle?enabled=${enabled}`, withLangHeaders({
        method: 'PATCH',
        headers: headers as HeadersInit,
    }));
    return handleResponse(response);
};

// Export service object
export const xpConfigService = {
    getAllXpConfigs,
    getXpConfigById,
    getXpConfigBySource,
    updateXpConfig,
    createXpConfig,
    deleteXpConfig,
    toggleXpSource,
};

export default xpConfigService;
