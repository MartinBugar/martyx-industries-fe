import { SelectedConfiguration } from '../types/configurator';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface SharedConfigurationResponse {
  id: number;
  shareToken: string;
  shareUrl: string;
  masterProductId: number;
  title: string | null;
  configurationJson: string;
  priceModifier: number;
  createdAt: string;
  expiresAt: string | null;
  viewCount: number;
  expired: boolean;
}

export interface CreateShareRequest {
  masterProductId: number;
  title?: string;
  configurationJson: string;
  priceModifier: number;
  expiresInDays?: number;
}

/**
 * Create a shareable configuration.
 */
export async function createShare(
  masterProductId: number,
  configuration: SelectedConfiguration,
  priceModifier: number,
  title?: string,
  expiresInDays?: number
): Promise<SharedConfigurationResponse> {
  const request: CreateShareRequest = {
    masterProductId,
    title,
    configurationJson: JSON.stringify(configuration),
    priceModifier,
    expiresInDays
  };

  const response = await fetch(`${API_BASE}/api/public/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error('Failed to create share');
  }

  return response.json();
}

/**
 * Get a shared configuration by token.
 */
export async function getSharedConfiguration(
  shareToken: string
): Promise<SharedConfigurationResponse | null> {
  const response = await fetch(`${API_BASE}/api/public/share/${shareToken}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (response.status === 404 || response.status === 410) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch shared configuration');
  }

  return response.json();
}

/**
 * Get user's shares for a product.
 */
export async function getMyShares(
  masterProductId: number
): Promise<SharedConfigurationResponse[]> {
  const response = await fetch(`${API_BASE}/api/share/my/${masterProductId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include'
  });

  if (response.status === 401) {
    return [];
  }

  if (!response.ok) {
    throw new Error('Failed to fetch shares');
  }

  return response.json();
}

/**
 * Delete a share.
 */
export async function deleteShare(shareToken: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/share/${shareToken}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  return response.ok;
}

/**
 * Parse configuration JSON from share response.
 */
export function parseSharedConfiguration(
  response: SharedConfigurationResponse
): SelectedConfiguration {
  try {
    return JSON.parse(response.configurationJson);
  } catch {
    return {};
  }
}

/**
 * Copy share URL to clipboard.
 */
export async function copyShareUrl(shareUrl: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(shareUrl);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}
