import { API_BASE_URL, defaultHeaders, handleResponse } from './apiUtils';
import { logError } from './logger';
import type {
  Configurator,
  ConfiguratorSlot,
  ConfiguratorOption,
  CreateConfiguratorRequest,
  UpdateConfiguratorRequest,
  ImportConfigurationRequest,
  CreateSlotRequest,
  UpdateSlotRequest,
  CreateOptionRequest,
  UpdateOptionRequest,
  MountPointToolConfig,
} from '../types/configurator';

const ADMIN_API = `${API_BASE_URL}/api/admin/configurator`;
const PUBLIC_API = `${API_BASE_URL}/api/public/configurator`;

// =========================================================================
// FILE VALIDATION TYPES AND CONSTANTS
// =========================================================================

interface FileValidationResult {
  valid: boolean;
  error?: string;
}

interface FileValidationConfig {
  extensions: string[];
  maxSizeMB: number;
  magicBytes?: number[][];
  mimeTypes?: string[];
  mimePrefix?: string;
}

// Magic bytes for file type validation
const MAGIC_BYTES = {
  GLB: [0x67, 0x6C, 0x54, 0x46],           // "glTF"
  ZIP: [0x50, 0x4B, 0x03, 0x04],           // PK
  JPEG: [0xFF, 0xD8, 0xFF],
  PNG: [0x89, 0x50, 0x4E, 0x47],
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46],     // "RIFF"
  WEBP_MARKER: [0x57, 0x45, 0x42, 0x50],   // "WEBP" at offset 8
} as const;

// Upload timeout in ms
const UPLOAD_TIMEOUT_MS = 120000; // 2 minutes

// Maximum error message length (XSS protection)
const MAX_ERROR_MESSAGE_LENGTH = 200;

// =========================================================================
// UTILITY FUNCTIONS
// =========================================================================

/**
 * Sanitize error message to prevent XSS
 * Only allows alphanumeric, spaces, and basic punctuation
 */
const sanitizeErrorMessage = (message: unknown): string => {
  if (typeof message !== 'string') {
    return 'An error occurred';
  }

  // Remove any HTML tags
  const stripped = message.replace(/<[^>]*>/g, '');

  // Only allow safe characters
  const sanitized = stripped.replace(/[^\w\s.,!?()-]/g, '');

  // Truncate to max length
  if (sanitized.length > MAX_ERROR_MESSAGE_LENGTH) {
    return sanitized.substring(0, MAX_ERROR_MESSAGE_LENGTH) + '...';
  }

  return sanitized || 'An error occurred';
};

/**
 * Check if bytes start with expected magic bytes
 */
const startsWith = (data: Uint8Array, magic: readonly number[]): boolean => {
  if (data.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (data[i] !== magic[i]) return false;
  }
  return true;
};

/**
 * Read first N bytes of file for magic bytes validation
 */
const readFileHeader = (file: File, bytes: number): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(reader.result));
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file.slice(0, bytes));
  });
};

/**
 * Generic file validation function
 */
const validateFile = async (
  file: File | null | undefined,
  config: FileValidationConfig
): Promise<FileValidationResult> => {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !config.extensions.includes(extension)) {
    return { valid: false, error: `File must be ${config.extensions.join(' or ')} format` };
  }

  // Check size
  const maxSize = config.maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${config.maxSizeMB}MB limit` };
  }

  // Check MIME type if specified
  if (config.mimePrefix && !file.type.startsWith(config.mimePrefix)) {
    // Allow empty MIME type (some browsers don't set it correctly)
    if (file.type !== '') {
      return { valid: false, error: `Invalid file type` };
    }
  }

  // Validate magic bytes if specified
  if (config.magicBytes && config.magicBytes.length > 0) {
    try {
      // Read enough bytes for all magic byte patterns
      const maxMagicLength = Math.max(...config.magicBytes.map(m => m.length));
      const header = await readFileHeader(file, maxMagicLength + 8); // +8 for WebP check

      const isValidMagic = config.magicBytes.some(magic => startsWith(header, magic));
      if (!isValidMagic) {
        return { valid: false, error: 'File content does not match expected format' };
      }
    } catch {
      return { valid: false, error: 'Failed to validate file' };
    }
  }

  return { valid: true };
};

/**
 * Service for managing product configurators
 */
class ConfiguratorService {
  // Store active XHR for cancellation
  private activeXhr: XMLHttpRequest | null = null;

  // =========================================================================
  // ADMIN: CONFIGURATOR CRUD
  // =========================================================================

  /**
   * Get configurator by master product ID (admin)
   */
  async getConfiguratorByProductId(masterProductId: number): Promise<Configurator | null> {
    const response = await fetch(`${ADMIN_API}/product/${masterProductId}`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });

    if (response.status === 404) {
      return null;
    }

    return handleResponse(response) as Promise<Configurator>;
  }

  /**
   * Create a new configurator
   */
  async createConfigurator(request: CreateConfiguratorRequest): Promise<Configurator> {
    const response = await fetch(ADMIN_API, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    });

    return handleResponse(response) as Promise<Configurator>;
  }

  /**
   * Update configurator
   */
  async updateConfigurator(configuratorId: number, request: UpdateConfiguratorRequest): Promise<Configurator> {
    const response = await fetch(`${ADMIN_API}/${configuratorId}`, {
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    });

    return handleResponse(response) as Promise<Configurator>;
  }

  /**
   * Delete configurator
   */
  async deleteConfigurator(configuratorId: number): Promise<void> {
    const response = await fetch(`${ADMIN_API}/${configuratorId}`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });

    await handleResponse(response);
  }

  /**
   * Import configuration from Mount Point Tool JSON
   */
  async importConfiguration(request: ImportConfigurationRequest): Promise<Configurator> {
    const response = await fetch(`${ADMIN_API}/import`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    });

    return handleResponse(response) as Promise<Configurator>;
  }

  /**
   * Upload base model GLB file
   */
  async uploadBaseModel(
    configuratorId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Configurator> {
    return this.uploadFile(
      `${ADMIN_API}/${configuratorId}/base-model`,
      file,
      onProgress
    ) as Promise<Configurator>;
  }

  /**
   * Delete base model
   */
  async deleteBaseModel(configuratorId: number): Promise<Configurator> {
    const response = await fetch(`${ADMIN_API}/${configuratorId}/base-model`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });

    return handleResponse(response) as Promise<Configurator>;
  }

  // =========================================================================
  // ADMIN: SLOT CRUD
  // =========================================================================

  /**
   * Get all slots for a configurator
   */
  async getSlots(configuratorId: number): Promise<ConfiguratorSlot[]> {
    const response = await fetch(`${ADMIN_API}/${configuratorId}/slots`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });

    return handleResponse(response) as Promise<ConfiguratorSlot[]>;
  }

  /**
   * Get slot by ID
   */
  async getSlotById(slotId: number): Promise<ConfiguratorSlot> {
    const response = await fetch(`${ADMIN_API}/slots/${slotId}`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });

    return handleResponse(response) as Promise<ConfiguratorSlot>;
  }

  /**
   * Create a new slot
   */
  async createSlot(configuratorId: number, request: CreateSlotRequest): Promise<ConfiguratorSlot> {
    const response = await fetch(`${ADMIN_API}/${configuratorId}/slots`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    });

    return handleResponse(response) as Promise<ConfiguratorSlot>;
  }

  /**
   * Update slot
   */
  async updateSlot(slotId: number, request: UpdateSlotRequest): Promise<ConfiguratorSlot> {
    const response = await fetch(`${ADMIN_API}/slots/${slotId}`, {
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    });

    return handleResponse(response) as Promise<ConfiguratorSlot>;
  }

  /**
   * Delete slot
   */
  async deleteSlot(slotId: number): Promise<void> {
    const response = await fetch(`${ADMIN_API}/slots/${slotId}`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });

    await handleResponse(response);
  }

  // =========================================================================
  // ADMIN: OPTION CRUD
  // =========================================================================

  /**
   * Get all options for a slot
   */
  async getOptions(slotId: number): Promise<ConfiguratorOption[]> {
    const response = await fetch(`${ADMIN_API}/slots/${slotId}/options`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });

    return handleResponse(response) as Promise<ConfiguratorOption[]>;
  }

  /**
   * Get option by ID
   */
  async getOptionById(optionId: number): Promise<ConfiguratorOption> {
    const response = await fetch(`${ADMIN_API}/options/${optionId}`, {
      method: 'GET',
      headers: defaultHeaders as HeadersInit,
    });

    return handleResponse(response) as Promise<ConfiguratorOption>;
  }

  /**
   * Create a new option
   */
  async createOption(slotId: number, request: CreateOptionRequest): Promise<ConfiguratorOption> {
    const response = await fetch(`${ADMIN_API}/slots/${slotId}/options`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    });

    return handleResponse(response) as Promise<ConfiguratorOption>;
  }

  /**
   * Update option
   */
  async updateOption(optionId: number, request: UpdateOptionRequest): Promise<ConfiguratorOption> {
    const response = await fetch(`${ADMIN_API}/options/${optionId}`, {
      method: 'PUT',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(request),
    });

    return handleResponse(response) as Promise<ConfiguratorOption>;
  }

  /**
   * Delete option
   */
  async deleteOption(optionId: number): Promise<void> {
    const response = await fetch(`${ADMIN_API}/options/${optionId}`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });

    await handleResponse(response);
  }

  /**
   * Upload GLB file for option
   */
  async uploadOptionGlb(
    optionId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ConfiguratorOption> {
    return this.uploadFile(
      `${ADMIN_API}/options/${optionId}/glb`,
      file,
      onProgress
    ) as Promise<ConfiguratorOption>;
  }

  /**
   * Delete option GLB
   */
  async deleteOptionGlb(optionId: number): Promise<ConfiguratorOption> {
    const response = await fetch(`${ADMIN_API}/options/${optionId}/glb`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });

    return handleResponse(response) as Promise<ConfiguratorOption>;
  }

  /**
   * Upload thumbnail for option
   */
  async uploadOptionThumbnail(
    optionId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ConfiguratorOption> {
    return this.uploadFile(
      `${ADMIN_API}/options/${optionId}/thumbnail`,
      file,
      onProgress
    ) as Promise<ConfiguratorOption>;
  }

  /**
   * Delete option thumbnail
   */
  async deleteOptionThumbnail(optionId: number): Promise<ConfiguratorOption> {
    const response = await fetch(`${ADMIN_API}/options/${optionId}/thumbnail`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });

    return handleResponse(response) as Promise<ConfiguratorOption>;
  }

  /**
   * Set option as default
   */
  async setOptionAsDefault(optionId: number): Promise<ConfiguratorOption> {
    const response = await fetch(`${ADMIN_API}/options/${optionId}/set-default`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
    });

    return handleResponse(response) as Promise<ConfiguratorOption>;
  }

  // =========================================================================
  // ADMIN: DIGITAL FILE UPLOAD (ZIP for downloads)
  // =========================================================================

  /**
   * Upload base digital file (ZIP) for configurator
   */
  async uploadBaseDigitalFile(
    configuratorId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Configurator> {
    return this.uploadFile(
      `${ADMIN_API}/${configuratorId}/base-digital-file`,
      file,
      onProgress
    ) as Promise<Configurator>;
  }

  /**
   * Delete base digital file
   */
  async deleteBaseDigitalFile(configuratorId: number): Promise<Configurator> {
    const response = await fetch(`${ADMIN_API}/${configuratorId}/base-digital-file`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });

    return handleResponse(response) as Promise<Configurator>;
  }

  /**
   * Upload digital file (ZIP) for option
   */
  async uploadOptionDigitalFile(
    optionId: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ConfiguratorOption> {
    return this.uploadFile(
      `${ADMIN_API}/options/${optionId}/digital-file`,
      file,
      onProgress
    ) as Promise<ConfiguratorOption>;
  }

  /**
   * Delete option digital file
   */
  async deleteOptionDigitalFile(optionId: number): Promise<ConfiguratorOption> {
    const response = await fetch(`${ADMIN_API}/options/${optionId}/digital-file`, {
      method: 'DELETE',
      headers: defaultHeaders as HeadersInit,
    });

    return handleResponse(response) as Promise<ConfiguratorOption>;
  }

  // =========================================================================
  // PUBLIC API
  // =========================================================================

  /**
   * Get configurator for public display (only enabled)
   */
  async getPublicConfigurator(masterProductId: number): Promise<Configurator | null> {
    const response = await fetch(`${PUBLIC_API}/product/${masterProductId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 404) {
      return null;
    }

    return handleResponse(response) as Promise<Configurator>;
  }

  /**
   * Check if product has enabled configurator
   */
  async hasConfigurator(masterProductId: number): Promise<boolean> {
    const response = await fetch(`${PUBLIC_API}/product/${masterProductId}/has-configurator`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    return handleResponse(response) as Promise<boolean>;
  }

  // =========================================================================
  // FILE UPLOAD
  // =========================================================================

  /**
   * Upload file with progress tracking, timeout, and abort support
   */
  private uploadFile(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    timeoutMs: number = UPLOAD_TIMEOUT_MS
  ): Promise<unknown> {
    const formData = new FormData();
    formData.append('file', file);

    const authHeader = defaultHeaders['Authorization'];
    if (!authHeader) {
      return Promise.reject(new Error('Authentication required. Please log in.'));
    }

    // Validate Bearer token format
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/);
    if (!bearerMatch || !bearerMatch[1]) {
      return Promise.reject(new Error('Invalid authentication token format'));
    }
    const token = bearerMatch[1];

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Set up timeout
      const timeoutId = setTimeout(() => {
        xhr.abort();
        reject(new Error('Upload timeout - please try again'));
      }, timeoutMs);

      this.activeXhr = xhr;

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress(percentComplete);
          }
        });
      }

      xhr.addEventListener('load', () => {
        clearTimeout(timeoutId);
        this.activeXhr = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error('Failed to parse response'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            // Sanitize error message from server to prevent XSS
            const safeMessage = sanitizeErrorMessage(errorResponse.message);
            reject(new Error(safeMessage));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        clearTimeout(timeoutId);
        this.activeXhr = null;
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        this.activeXhr = null;
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  }

  /**
   * Cancel active upload
   */
  cancelUpload(): void {
    if (this.activeXhr) {
      this.activeXhr.abort();
      this.activeXhr = null;
    }
  }

  // =========================================================================
  // FILE VALIDATION (Refactored - DRY)
  // =========================================================================

  /**
   * Validate GLB file with magic bytes check
   */
  async validateGLBFile(file: File, maxSizeMB: number = 50): Promise<FileValidationResult> {
    return validateFile(file, {
      extensions: ['glb'],
      maxSizeMB,
      magicBytes: [[...MAGIC_BYTES.GLB]],
    });
  }

  /**
   * Validate image file with magic bytes check
   */
  async validateImageFile(file: File, maxSizeMB: number = 5): Promise<FileValidationResult> {
    // For images, we need special handling for WebP
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (!file.type.startsWith('image/') && file.type !== '') {
      return { valid: false, error: 'File must be an image' };
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }

    // Validate image magic bytes
    try {
      const header = await readFileHeader(file, 12);

      // Check JPEG
      if (startsWith(header, MAGIC_BYTES.JPEG)) {
        return { valid: true };
      }

      // Check PNG
      if (startsWith(header, MAGIC_BYTES.PNG)) {
        return { valid: true };
      }

      // Check WebP (RIFF...WEBP)
      if (startsWith(header, MAGIC_BYTES.WEBP_RIFF) && header.length >= 12) {
        if (header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) {
          return { valid: true };
        }
      }

      return { valid: false, error: 'File is not a valid image (JPEG, PNG, or WebP required)' };
    } catch (e) {
      logError('[ConfiguratorService] Image validation failed:', e);
      return { valid: false, error: 'Failed to validate file' };
    }
  }

  /**
   * Validate ZIP file with magic bytes check
   */
  async validateZIPFile(file: File, maxSizeMB: number = 500): Promise<FileValidationResult> {
    return validateFile(file, {
      extensions: ['zip'],
      maxSizeMB,
      magicBytes: [[...MAGIC_BYTES.ZIP]],
    });
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    if (bytes < 0) return 'Invalid size';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const safeIndex = Math.min(i, sizes.length - 1);

    return Math.round((bytes / Math.pow(k, safeIndex)) * 10) / 10 + ' ' + sizes[safeIndex];
  }

  /**
   * Parse Mount Point Tool JSON
   */
  parseMountPointToolConfig(json: string): MountPointToolConfig | null {
    try {
      const parsed = JSON.parse(json);

      // Basic validation
      if (typeof parsed !== 'object' || parsed === null) {
        return null;
      }

      if (typeof parsed.baseModel !== 'string') {
        return null;
      }

      if (typeof parsed.slots !== 'object' || parsed.slots === null) {
        return null;
      }

      return parsed as MountPointToolConfig;
    } catch (e) {
      logError('[ConfiguratorService] Failed to parse Mount Point Tool config:', e);
      return null;
    }
  }
}

export const configuratorService = new ConfiguratorService();
