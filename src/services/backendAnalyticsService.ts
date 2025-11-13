/**
 * Backend Analytics Service
 * Sends analytics events to backend API for tracking and analysis
 *
 * GDPR-compliant: All tracking functions check for user consent before sending data
 */

import { API_BASE_URL, defaultHeaders } from './apiUtils';
import type { AnalyticsEventDto } from '../types/analytics';
import { getSessionId, getVisitorId, refreshSession } from './sessionManager';
import { getConsent } from '../utils/cookieConsent';
import { enqueueEvent, processQueue } from './analyticsQueue';
import { logInfo, logError } from './logger';

/**
 * Check if user has given consent for analytics tracking
 * Uses the main cookie consent system from utils/cookieConsent
 */
const hasAnalyticsConsent = (): boolean => {
  const consent = getConsent();
  return consent?.categories?.analytics === true;
};

// Process queue every 60 seconds
const QUEUE_PROCESS_INTERVAL = 60000;
let queueProcessorInterval: number | null = null;

/**
 * Start queue processor (call this once when app initializes)
 */
export const startQueueProcessor = (): void => {
  if (queueProcessorInterval) {
    return; // Already running
  }

  logInfo('[Backend Analytics] Starting queue processor...');

  queueProcessorInterval = setInterval(() => {
    processQueue(sendEventToBackend).catch((error) => {
      logError('[Backend Analytics] Queue processing error:', error);
    });
  }, QUEUE_PROCESS_INTERVAL);

  // Process immediately on start
  processQueue(sendEventToBackend).catch((error) => {
    logError('[Backend Analytics] Initial queue processing error:', error);
  });
};

/**
 * Stop queue processor (for cleanup)
 */
export const stopQueueProcessor = (): void => {
  if (queueProcessorInterval) {
    clearInterval(queueProcessorInterval);
    queueProcessorInterval = null;
    logInfo('[Backend Analytics] Queue processor stopped');
  }
};

/**
 * Send event to backend (internal function for queue processing)
 * Returns true if successful, false otherwise
 */
const sendEventToBackend = async (eventData: Partial<AnalyticsEventDto>): Promise<boolean> => {
  try {
    // Enrich event with session and visitor IDs
    const enrichedEvent: Partial<AnalyticsEventDto> = {
      ...eventData,
      session_id: eventData.session_id || getSessionId(),
      visitor_id: eventData.visitor_id || getVisitorId(),
      event_timestamp: new Date().toISOString(),
      referrer_url: document.referrer || undefined,
    };

    const response = await fetch(`${API_BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(enrichedEvent),
    });

    if (!response.ok) {
      logError('[Backend Analytics] Failed to track event:', response.status);
      return false;
    }

    logInfo('[Backend Analytics] Event tracked:', eventData.event_type);
    return true;
  } catch (error) {
    logError('[Backend Analytics] Error tracking event:', error);
    return false;
  }
};

/**
 * Track a generic analytics event to backend
 * GDPR-compliant: Checks for user consent before tracking
 * Resilient: Failed events are queued for retry
 */
export const trackEventToBackend = async (eventData: Partial<AnalyticsEventDto>): Promise<void> => {
  // Check consent before tracking
  if (!hasAnalyticsConsent()) {
    logInfo('[Backend Analytics] Tracking skipped - no user consent');
    return;
  }

  // Refresh session on any tracking event
  refreshSession();

  // Try to send immediately
  const success = await sendEventToBackend(eventData);

  // If failed, enqueue for retry
  if (!success) {
    logInfo('[Backend Analytics] Event failed, adding to queue');
    enqueueEvent(eventData);
  }
};

/**
 * Track product view event
 * GDPR-compliant: Checks for user consent before tracking
 */
export const trackProductView = async (
  masterProductId: number,
  userId?: number,
  utmParams?: { [key: string]: string }
): Promise<void> => {
  // Check consent before tracking
  if (!hasAnalyticsConsent()) {
    logInfo('[Backend Analytics] Product view tracking skipped - no user consent');
    return;
  }

  const sessionId = getSessionId();

  try {
    const params = new URLSearchParams({
      masterProductId: masterProductId.toString(),
      sessionId: sessionId,
      ...(userId && { userId: userId.toString() }),
      ...(utmParams?.utm_source && { utmSource: utmParams.utm_source }),
      ...(utmParams?.utm_medium && { utmMedium: utmParams.utm_medium }),
      ...(utmParams?.utm_campaign && { utmCampaign: utmParams.utm_campaign }),
      ...(utmParams?.utm_term && { utmTerm: utmParams.utm_term }),
      ...(utmParams?.utm_content && { utmContent: utmParams.utm_content }),
    });

    const response = await fetch(`${API_BASE_URL}/api/analytics/track/product-view?${params}`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
    });

    if (!response.ok) {
      logError('[Backend Analytics] Failed to track product view');
    } else {
      logInfo('[Backend Analytics] Product view tracked:', masterProductId);
    }
  } catch (error) {
    logError('[Backend Analytics] Error tracking product view:', error);
  }
};

/**
 * Track add to cart event
 */
export const trackAddToCart = async (
  masterProductId: number,
  variantId: number | null,
  userId?: number
): Promise<void> => {
  await trackEventToBackend({
    event_type: 'ADD_TO_CART',
    event_category: 'ECOMMERCE',
    event_name: 'Add to Cart',
    master_product_id: masterProductId,
    variant_id: variantId || undefined,
    user_id: userId,
  });
};

/**
 * Track remove from cart event
 */
export const trackRemoveFromCart = async (
  masterProductId: number,
  variantId: number | null,
  userId?: number
): Promise<void> => {
  await trackEventToBackend({
    event_type: 'REMOVE_FROM_CART',
    event_category: 'ECOMMERCE',
    event_name: 'Remove from Cart',
    master_product_id: masterProductId,
    variant_id: variantId || undefined,
    user_id: userId,
  });
};

/**
 * Track checkout start event
 */
export const trackCheckoutStart = async (
  userId?: number,
  revenue?: number
): Promise<void> => {
  await trackEventToBackend({
    event_type: 'CHECKOUT_START',
    event_category: 'ECOMMERCE',
    event_name: 'Checkout Started',
    user_id: userId,
    revenue_amount: revenue,
  });
};

/**
 * Track page view event
 */
export const trackPageView = async (
  pagePath: string,
  pageTitle?: string
): Promise<void> => {
  await trackEventToBackend({
    event_type: 'PAGE_VIEW',
    event_category: 'USER_ACTION',
    event_name: pageTitle || pagePath,
  });
};

/**
 * Extract UTM parameters from current URL
 */
export const extractUTMParams = (): { [key: string]: string } | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: { [key: string]: string } = {};

  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  let hasUtm = false;

  utmKeys.forEach((key) => {
    const value = urlParams.get(key);
    if (value) {
      utmParams[key] = value;
      hasUtm = true;
    }
  });

  return hasUtm ? utmParams : undefined;
};

/**
 * Get device type based on screen width and user agent
 */
export const getDeviceType = (): 'DESKTOP' | 'MOBILE' | 'TABLET' => {
  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  if (/tablet|ipad/.test(userAgent)) {
    return 'TABLET';
  }

  if (/mobile|android|iphone/.test(userAgent) || width < 768) {
    return 'MOBILE';
  }

  return 'DESKTOP';
};

export default {
  startQueueProcessor,
  stopQueueProcessor,
  trackEventToBackend,
  trackProductView,
  trackAddToCart,
  trackRemoveFromCart,
  trackCheckoutStart,
  trackPageView,
  extractUTMParams,
  getDeviceType,
};
