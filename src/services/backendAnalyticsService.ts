/**
 * Backend Analytics Service
 * Sends analytics events to backend API for tracking and analysis
 */

import { API_BASE_URL, defaultHeaders } from './apiUtils';
import type { AnalyticsEventDto } from '../types/analytics';
import { getSessionId, getVisitorId, refreshSession } from './sessionManager';

/**
 * Track a generic analytics event to backend
 */
export const trackEventToBackend = async (eventData: Partial<AnalyticsEventDto>): Promise<void> => {
  try {
    // Refresh session on any tracking event
    refreshSession();

    // Enrich event with session and visitor IDs
    const enrichedEvent: Partial<AnalyticsEventDto> = {
      ...eventData,
      session_id: eventData.session_id || getSessionId(),
      visitor_id: eventData.visitor_id || getVisitorId(),
      event_timestamp: new Date().toISOString(),
      page_url: window.location.href,
      referrer_url: document.referrer || undefined,
    };

    const response = await fetch(`${API_BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers: defaultHeaders as HeadersInit,
      body: JSON.stringify(enrichedEvent),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Backend Analytics] Failed to track event:', errorText);
    } else {
      console.log('[Backend Analytics] Event tracked:', eventData.event_type);
    }
  } catch (error) {
    console.error('[Backend Analytics] Error tracking event:', error);
    // Don't throw - analytics failures shouldn't break the app
  }
};

/**
 * Track product view event
 */
export const trackProductView = async (
  masterProductId: number,
  userId?: number,
  utmParams?: { [key: string]: string }
): Promise<void> => {
  const sessionId = getSessionId();
  const visitorId = getVisitorId();

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
      console.error('[Backend Analytics] Failed to track product view');
    } else {
      console.log('[Backend Analytics] Product view tracked:', masterProductId);
    }
  } catch (error) {
    console.error('[Backend Analytics] Error tracking product view:', error);
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
    page_url: window.location.href,
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
  trackEventToBackend,
  trackProductView,
  trackAddToCart,
  trackRemoveFromCart,
  trackCheckoutStart,
  trackPageView,
  extractUTMParams,
  getDeviceType,
};
