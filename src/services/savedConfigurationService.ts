import type { SelectedConfiguration } from '../types/configurator';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export interface SavedConfigurationResponse {
  id: number;
  masterProductId: number;
  name: string;
  configurationJson: string;
  priceModifier: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveConfigurationRequest {
  masterProductId: number;
  name: string;
  configurationJson: string;
  priceModifier: number;
}

/**
 * Get all saved configurations for the current user.
 */
export async function getMyConfigurations(): Promise<SavedConfigurationResponse[]> {
  const response = await fetch(`${API_BASE}/api/configurations`, {
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
    throw new Error('Failed to fetch configurations');
  }

  return response.json();
}

/**
 * Get saved configurations for a specific product.
 */
export async function getConfigurationsForProduct(
  masterProductId: number
): Promise<SavedConfigurationResponse[]> {
  const response = await fetch(`${API_BASE}/api/configurations/product/${masterProductId}`, {
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
    throw new Error('Failed to fetch configurations');
  }

  return response.json();
}

/**
 * Save a new configuration.
 */
export async function saveConfiguration(
  masterProductId: number,
  name: string,
  configuration: SelectedConfiguration,
  priceModifier: number
): Promise<SavedConfigurationResponse> {
  const request: SaveConfigurationRequest = {
    masterProductId,
    name,
    configurationJson: JSON.stringify(configuration),
    priceModifier
  };

  const response = await fetch(`${API_BASE}/api/configurations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to save configuration');
  }

  return response.json();
}

/**
 * Update a saved configuration.
 */
export async function updateConfiguration(
  id: number,
  masterProductId: number,
  name: string,
  configuration: SelectedConfiguration,
  priceModifier: number
): Promise<SavedConfigurationResponse> {
  const request: SaveConfigurationRequest = {
    masterProductId,
    name,
    configurationJson: JSON.stringify(configuration),
    priceModifier
  };

  const response = await fetch(`${API_BASE}/api/configurations/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update configuration');
  }

  return response.json();
}

/**
 * Delete a saved configuration.
 */
export async function deleteConfiguration(id: number): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/configurations/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  return response.ok;
}

/**
 * Parse configuration JSON from saved configuration.
 */
export function parseSavedConfiguration(
  response: SavedConfigurationResponse
): SelectedConfiguration {
  try {
    return JSON.parse(response.configurationJson);
  } catch {
    return {};
  }
}
