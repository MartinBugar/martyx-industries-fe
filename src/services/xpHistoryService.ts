import { API_BASE_URL, defaultHeaders, handleResponse, withLangHeaders } from './apiUtils';

/**
 * XP Transaction DTO matching backend XpTransaction entity
 */
export interface XpTransactionDto {
    id: number;
    user: {
        id: number;
        username: string;
        email: string;
    };
    xpAmount: number;
    xpSource: string;
    sourceId?: number;
    sourceType?: string;
    description?: string;
    metadataJson?: Record<string, any>;
    createdAt: string;
    createdBy?: {
        id: number;
        username: string;
    };
}

/**
 * XP source enum (matches backend)
 */
export enum XpSource {
    PURCHASE = 'PURCHASE',
    GALLERY_UPLOAD = 'GALLERY_UPLOAD',
    REVIEW = 'REVIEW',
    REFERRAL_FIRST_ORDER = 'REFERRAL_FIRST_ORDER',
    REFERRAL_MILESTONE = 'REFERRAL_MILESTONE',
    CONTEST_ENTRY = 'CONTEST_ENTRY',
    FORUM_POST = 'FORUM_POST',
    PHOTO_LIKE = 'PHOTO_LIKE',
    SOCIAL_SHARE = 'SOCIAL_SHARE',
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    BIRTHDAY_BONUS = 'BIRTHDAY_BONUS',
    TUTORIAL_COMPLETION = 'TUTORIAL_COMPLETION',
    ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
}

/**
 * Query parameters for XP history
 */
export interface XpHistoryParams {
    page?: number;
    size?: number;
}

// =============================================================================
// USER APIs
// =============================================================================

/**
 * User API - Get current user's XP history (paginated)
 */
export const getMyXpHistory = async (params: XpHistoryParams = {}): Promise<XpTransactionDto[]> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    const url = `${API_BASE_URL}/api/gamification/xp-history${queryParams.toString() ? `?${queryParams}` : ''}`;

    const response = await fetch(url, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
    }));
    return handleResponse(response);
};

// =============================================================================
// ADMIN APIs
// =============================================================================

/**
 * Admin API - Get user's XP history by user ID (paginated)
 */
export const getUserXpHistory = async (userId: number, params: XpHistoryParams = {}): Promise<XpTransactionDto[]> => {
    const token = localStorage.getItem('token');
    const headers = { ...defaultHeaders };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const queryParams = new URLSearchParams();
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());

    const url = `${API_BASE_URL}/api/gamification/xp-history/user/${userId}${queryParams.toString() ? `?${queryParams}` : ''}`;

    const response = await fetch(url, withLangHeaders({
        method: 'GET',
        headers: headers as HeadersInit,
    }));
    return handleResponse(response);
};

// Export service object
export const xpHistoryService = {
    // User
    getMyXpHistory,

    // Admin
    getUserXpHistory,
};

export default xpHistoryService;
