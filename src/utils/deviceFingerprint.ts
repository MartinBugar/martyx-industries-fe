/**
 * Device Fingerprint Generator
 *
 * SECURITY: Generates a unique fingerprint for the current device/browser
 * Used to detect token theft - if refresh token is used from different device,
 * all user tokens are revoked.
 *
 * This is NOT for tracking users, but for security purposes only.
 * Fingerprint is hashed before sending to server.
 *
 * Factors used:
 * - User Agent
 * - Screen resolution
 * - Timezone
 * - Language
 * - Platform
 * - Hardware concurrency (CPU cores)
 * - Device memory (if available)
 * - WebGL renderer (GPU info)
 */

import { logWarn } from '../services/logger';

/**
 * Generate a device fingerprint hash
 * @returns SHA-256 hash of device characteristics
 */
export const generateDeviceFingerprint = async (): Promise<string> => {
  try {
    const components: string[] = [];

    // User Agent
    components.push(navigator.userAgent || 'unknown');

    // Screen info
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown');

    // Language
    components.push(navigator.language || 'unknown');

    // Platform
    components.push(navigator.platform || 'unknown');

    // Hardware concurrency (CPU cores)
    components.push(String(navigator.hardwareConcurrency || 0));

    // Device memory (Chrome only)
    const nav = navigator as Navigator & { deviceMemory?: number };
    components.push(String(nav.deviceMemory || 0));

    // WebGL renderer (GPU info)
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl && gl instanceof WebGLRenderingContext) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          components.push(renderer || 'unknown');
        }
      }
    } catch {
      components.push('webgl-unavailable');
    }

    // Combine all components
    const fingerprintString = components.join('|||');

    // Hash the fingerprint
    const hash = await hashString(fingerprintString);

    return hash;
  } catch (error) {
    logWarn('Failed to generate device fingerprint:', error);
    // Return a fallback fingerprint based on what we can get
    return await hashString(navigator.userAgent + screen.width + screen.height);
  }
};

/**
 * Hash a string using SHA-256
 * @param str String to hash
 * @returns Hex-encoded SHA-256 hash
 */
const hashString = async (str: string): Promise<string> => {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback for environments without crypto.subtle
    // Simple hash function (not cryptographically secure, but better than nothing)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
};

/**
 * Cache the fingerprint to avoid recalculating
 */
let cachedFingerprint: string | null = null;

/**
 * Get device fingerprint (cached)
 * @returns Device fingerprint hash
 */
export const getDeviceFingerprint = async (): Promise<string> => {
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  cachedFingerprint = await generateDeviceFingerprint();
  return cachedFingerprint;
};

/**
 * Clear cached fingerprint (for testing)
 */
export const clearFingerprintCache = (): void => {
  cachedFingerprint = null;
};
