/**
 * Types for Product Configurator
 */

// Mount point for Three.js positioning
export interface MountPoint {
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

/**
 * Configurator option (e.g., "Heavy Turret")
 * Represents a selectable option within a configurator slot.
 */
export interface ConfiguratorOption {
  id: number;
  slotId: number;
  /** Unique key for this option (e.g., "turret_heavy") */
  optionKey: string;
  /** Display name shown to users */
  displayName: string;
  description?: string;
  /** URL to GLB 3D model file for preview */
  glbUrl: string;
  glbFileName?: string;
  glbFileSize?: number;
  /** Thumbnail image URL for option card */
  thumbnailUrl?: string;
  /**
   * Digital file (ZIP) for download.
   * When customer selects this option, they receive this ZIP as part of modular downloads.
   * Only used when configurator is enabled.
   */
  digitalFileUrl?: string;
  digitalFileName?: string;
  digitalFileSize?: number;
  /** Price modifier applied when this option is selected (can be negative) */
  priceModifier: number;
  /** Formatted price modifier with currency symbol */
  formattedPriceModifier: string;
  /** Whether this is the default option for the slot */
  isDefault: boolean;
  /** Whether this option is active and available */
  isActive: boolean;
  sortOrder: number;
}

// Configurator slot (e.g., "Turret")
export interface ConfiguratorSlot {
  id: number;
  configuratorId: number;
  slotKey: string;
  displayName: string;
  description?: string;
  icon?: string;
  mountPointsJson: string;
  mountPoints: MountPoint[];
  options: ConfiguratorOption[];
  sortOrder: number;
}

// Readiness info for admin UI
export interface ReadinessInfo {
  ready: boolean;
  hasBaseModel: boolean;
  hasSlots: boolean;
  hasOptionsWithGlb: boolean;
  totalSlots: number;
  slotsWithGlb: number;
  totalOptions: number;
  optionsWithGlb: number;
  missingItems: string[];
}

/**
 * Main configurator entity.
 * Represents a 3D product configurator with slots and options.
 *
 * When enabled:
 * - Customers can configure products by selecting options for each slot
 * - Digital downloads are modular (base ZIP + selected option ZIPs)
 *
 * When disabled:
 * - Product uses legacy single ZIP download from MasterProduct.digitalFileUrl
 */
export interface Configurator {
  id: number;
  masterProductId: number;
  masterProductName?: string;
  masterProductSlug?: string;
  /** Whether this configurator is active. When false, falls back to legacy download. */
  enabled: boolean;
  /** URL to base 3D model GLB file for preview */
  baseModelUrl?: string;
  baseModelFileName?: string;
  baseModelFileSize?: number;
  /** Raw configuration JSON from Mount Point Tool (for reference) */
  configurationJson?: string;
  /**
   * Base digital file (ZIP) for download.
   * Included in all modular downloads regardless of selected options.
   * Only used when configurator is enabled.
   */
  baseDigitalFileUrl?: string;
  baseDigitalFileName?: string;
  baseDigitalFileSize?: number;
  /** Configuration slots (e.g., Turret, Wheels) */
  slots: ConfiguratorSlot[];
  /** Readiness information for admin UI */
  readiness?: ReadinessInfo;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Request types for API
export interface CreateConfiguratorRequest {
  masterProductId: number;
  configurationJson?: string;
  enabled?: boolean;
}

export interface UpdateConfiguratorRequest {
  enabled?: boolean;
  configurationJson?: string;
}

export interface ImportConfigurationRequest {
  masterProductId: number;
  configurationJson: string;
  slotMetadata?: Record<string, SlotMetadata>;
  optionMetadata?: Record<string, OptionMetadata>;
}

export interface SlotMetadata {
  displayName?: string;
  description?: string;
  icon?: string;
}

export interface OptionMetadata {
  displayName?: string;
  description?: string;
  priceModifier?: number;
  isDefault?: boolean;
}

export interface CreateSlotRequest {
  slotKey: string;
  displayName: string;
  description?: string;
  icon?: string;
  mountPointsJson?: string;
  sortOrder?: number;
}

export interface UpdateSlotRequest {
  displayName?: string;
  description?: string;
  icon?: string;
  mountPointsJson?: string;
  sortOrder?: number;
}

export interface CreateOptionRequest {
  optionKey: string;
  displayName: string;
  description?: string;
  priceModifier?: number;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface UpdateOptionRequest {
  displayName?: string;
  description?: string;
  priceModifier?: number;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

// Configuration JSON from Mount Point Tool
export interface MountPointToolConfig {
  baseModel: string;
  slots: Record<string, {
    mountPoints: MountPoint[];
    options: string[];
  }>;
}

// Selected configuration for cart
export interface SelectedConfiguration {
  [slotKey: string]: {
    optionId: number;
    optionKey: string;
    displayName: string;
    priceModifier: number;
  };
}

// Upload state
export interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}
