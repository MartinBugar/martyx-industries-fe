/**
 * GDPR Compliance Type Definitions
 * Corresponds to backend DTOs for GDPR consent management and data export requests
 */

/**
 * Consent Type enum
 */
export const ConsentType = {
  MARKETING: 'MARKETING',
  ANALYTICS: 'ANALYTICS',
  NECESSARY: 'NECESSARY',
  PREFERENCES: 'PREFERENCES'
} as const;
export type ConsentType = typeof ConsentType[keyof typeof ConsentType];

/**
 * Export Type enum
 */
export const ExportType = {
  DATA_EXPORT: 'DATA_EXPORT',
  RIGHT_TO_BE_FORGOTTEN: 'RIGHT_TO_BE_FORGOTTEN'
} as const;
export type ExportType = typeof ExportType[keyof typeof ExportType];

/**
 * Export Status enum
 */
export const ExportStatus = {
  REQUESTED: 'REQUESTED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
} as const;
export type ExportStatus = typeof ExportStatus[keyof typeof ExportStatus];

/**
 * GDPR Consent data
 * Used for recording and managing user consents for marketing, analytics, and preferences
 */
export interface GdprConsentDto {
  id: number;
  user_id?: number;
  session_id?: string;
  consent_type: string; // ConsentType enum value
  consent_given: boolean;
  ip_address?: string;
  user_agent?: string;
  consent_text?: string;
  consent_version?: string;
  consented_at: string; // ISO date string
  expires_at?: string; // ISO date string
  withdrawn_at?: string; // ISO date string
  is_active: boolean;
}

/**
 * GDPR Data Export and Deletion Request data
 * Used for managing user data export requests and right to be forgotten requests
 */
export interface GdprDataExportDto {
  id: number;
  user_id: number;
  export_type: string; // ExportType enum value
  export_status: string; // ExportStatus enum value
  requested_at: string; // ISO date string
  processed_at?: string; // ISO date string
  completed_at?: string; // ISO date string
  export_file_url?: string;
  export_expires_at?: string; // ISO date string
  ip_address?: string;
  notes?: string;
}
