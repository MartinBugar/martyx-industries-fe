/**
 * Analytics and Email Campaign Type Definitions
 * Corresponds to backend DTOs for event tracking, funnel analysis, and email campaigns
 */

/**
 * Event Category enum
 */
export const EventCategory = {
  ECOMMERCE: 'ECOMMERCE',
  USER_ACTION: 'USER_ACTION',
  SYSTEM: 'SYSTEM',
  MARKETING: 'MARKETING',
  ERROR: 'ERROR'
} as const;
export type EventCategory = typeof EventCategory[keyof typeof EventCategory];

/**
 * Device Type enum
 */
export const DeviceType = {
  DESKTOP: 'DESKTOP',
  MOBILE: 'MOBILE',
  TABLET: 'TABLET',
  OTHER: 'OTHER'
} as const;
export type DeviceType = typeof DeviceType[keyof typeof DeviceType];

/**
 * Email Campaign Type enum
 */
export const EmailCampaignType = {
  PROMOTIONAL: 'PROMOTIONAL',
  TRANSACTIONAL: 'TRANSACTIONAL',
  ABANDONED_CART: 'ABANDONED_CART',
  NEWSLETTER: 'NEWSLETTER',
  WELCOME: 'WELCOME',
  WIN_BACK: 'WIN_BACK'
} as const;
export type EmailCampaignType = typeof EmailCampaignType[keyof typeof EmailCampaignType];

/**
 * Email Campaign Status enum
 */
export const EmailCampaignStatus = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  CANCELLED: 'CANCELLED'
} as const;
export type EmailCampaignStatus = typeof EmailCampaignStatus[keyof typeof EmailCampaignStatus];

/**
 * Analytics Event data
 * Event tracking for user behavior, conversions, and e-commerce metrics
 */
export interface AnalyticsEventDto {
  id: number;
  event_type: string;
  event_category: string; // EventCategory enum value
  event_name: string;
  user_id?: number;
  session_id: string;
  visitor_id?: string;
  event_properties?: string; // JSON object
  product_id?: number;
  variant_id?: number;
  master_product_id?: number;
  order_id?: number;
  revenue_amount?: number;
  currency?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  device_type?: string; // DeviceType enum value
  browser?: string;
  operating_system?: string;
  screen_resolution?: string;
  ip_address?: string;
  country?: string;
  country_code?: string;
  city?: string;
  referrer_url?: string;
  landing_page?: string;
  event_timestamp: string; // ISO date string
  created_at: string; // ISO date string
}

/**
 * Funnel Step (nested in ConversionFunnelDto)
 */
export interface FunnelStepDto {
  step_order: number;
  step_name: string;
  event_type: string;
  required: boolean;
}

/**
 * Conversion Funnel definition
 * Predefined funnel for tracking user progression through event sequences
 */
export interface ConversionFunnelDto {
  id: number;
  funnel_name: string;
  funnel_code: string;
  funnel_steps: FunnelStepDto[];
  is_active: boolean;
  description?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Step Metric (nested in FunnelAnalyticsDto)
 */
export interface StepMetricDto {
  step_order: number;
  step_name: string;
  users_entered: number;
  users_completed: number;
  users_dropped: number;
  completion_rate: number;
  drop_off_rate: number;
  average_time_spent_seconds: number;
}

/**
 * Funnel Analytics metrics
 * Daily aggregated funnel performance metrics
 */
export interface FunnelAnalyticsDto {
  id: number;
  funnel_id: number;
  funnel_name: string;
  funnel_code: string;
  date: string; // ISO date string (LocalDate)
  step_metrics: StepMetricDto[];
  total_sessions: number;
  completed_sessions: number;
  conversion_rate: number;
  total_revenue: number;
  average_revenue_per_session: number;
  calculated_at: string; // ISO date string
}

/**
 * Product Analytics Daily metrics
 * Daily aggregated product performance data
 */
export interface ProductAnalyticsDailyDto {
  id: number;
  date: string; // ISO date string (LocalDate)
  product_id: number;
  product_name?: string;
  variant_id?: number;
  variant_name?: string;
  master_product_id?: number;
  page_views: number;
  unique_visitors: number;
  add_to_cart_count: number;
  add_to_wishlist_count: number;
  remove_from_cart_count: number;
  units_sold: number;
  revenue: number;
  orders_count: number;
  conversion_rate: number;
  cart_add_rate: number;
  average_order_value: number;
  calculated_at: string; // ISO date string
  // Trend indicators (compared to previous period)
  views_trend?: string; // UP, DOWN, STABLE
  views_change_percentage?: number;
  sales_trend?: string; // UP, DOWN, STABLE
  sales_change_percentage?: number;
}

/**
 * Email Campaign data
 * Email marketing campaign with performance tracking
 */
export interface EmailCampaignDto {
  id: number;
  campaign_name: string;
  campaign_code: string;
  campaign_type: string; // EmailCampaignType enum value
  subject_line: string;
  from_email: string;
  from_name?: string;
  segment_id?: number;
  segment_name?: string;
  target_user_ids?: number[];
  scheduled_at?: string; // ISO date string
  sent_at?: string; // ISO date string
  completed_at?: string; // ISO date string
  total_recipients?: number;
  total_sent?: number;
  total_delivered?: number;
  total_opened?: number;
  total_clicked?: number;
  total_bounced?: number;
  total_unsubscribed?: number;
  total_conversions?: number;
  revenue_generated?: number;
  open_rate?: number;
  click_rate?: number;
  click_through_rate?: number;
  conversion_rate?: number;
  bounce_rate?: number;
  unsubscribe_rate?: number;
  campaign_status: string; // EmailCampaignStatus enum value
  created_by?: number;
  created_by_name?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

/**
 * Email Event data (for tracking individual email interactions)
 */
export interface EmailEventDto {
  id: number;
  campaign_id: number;
  user_id?: number;
  email: string;
  event_type: string; // SENT, DELIVERED, OPENED, CLICKED, BOUNCED, UNSUBSCRIBED
  event_timestamp: string; // ISO date string
  ip_address?: string;
  user_agent?: string;
  link_url?: string;
  created_at: string; // ISO date string
}
