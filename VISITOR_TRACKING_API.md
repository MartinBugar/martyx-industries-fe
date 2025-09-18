# 📊 Visitor Tracking API Documentation

Tento dokument popisuje API endpoints, ktoré potrebujete implementovať na backend pre kompletný visitor tracking systém.

## 🔗 API Endpoints na implementáciu

### 1. Session Tracking

**POST `/api/admin/visits/session`**
```typescript
interface SessionData {
  sessionId: string;
  visitorId: string;
  ipAddress?: string; // Automaticky získané z requestu
  userAgent: string;
  browserInfo: {
    name: string;
    version: string;
    platform: string;
    language: string;
    cookiesEnabled: boolean;
    screenResolution: string;
    timezone: string;
  };
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };
  locationInfo?: {
    country?: string;
    region?: string;
    city?: string;
    timezone: string;
  };
  entryPage: string;
  exitPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  sessionDuration?: number; // v sekundách
  pageViews: Array<{
    path: string;
    title: string;
    referrer?: string;
    timestamp: string;
    timeOnPage?: number; // v sekundách
    scrollDepth?: number; // percentá 0-100
  }>;
  totalClicks: number;
  scrollDepth: number;
  timestamp: string;
}
```

### 2. Event Tracking

**POST `/api/admin/visits/event`**
```typescript
interface EventData {
  sessionId: string;
  visitorId: string;
  eventType: string; // 'cart_add', 'checkout_start', 'purchase', etc.
  eventData: any; // Flexible data based on event type
  timestamp: string;
  page: string;
}

// Príklady event types:
// 'cart_add' - pridanie do košíka
// 'checkout_start' - začatie checkout procesu
// 'purchase' - úspešný nákup
// 'product_view' - zobrazenie produktu
// 'search' - vyhľadávanie
// 'newsletter_signup' - prihlásenie k newsletteru
```

### 3. Analytics Endpoints

**GET `/api/admin/visitors/analytics?days=30`**
```typescript
interface VisitorAnalytics {
  totalVisitors: number;
  uniqueVisitors: number;
  totalPageViews: number;
  averageSessionDuration: number;
  bounceRate: number;
  topPages: Array<{ page: string; views: number; }>;
  topReferrers: Array<{ referrer: string; count: number; }>;
  browserStats: Array<{ browser: string; count: number; percentage: number; }>;
  deviceStats: Array<{ device: string; count: number; percentage: number; }>;
  countryStats: Array<{ country: string; count: number; percentage: number; }>;
  trafficSources: Array<{ source: string; count: number; percentage: number; }>;
  hourlyDistribution: Array<{ hour: number; count: number; }>;
  dailyDistribution: Array<{ day: string; count: number; }>;
  conversionMetrics: {
    cartAdds: number;
    checkoutStarts: number;
    purchases: number;
    conversionRate: number;
  };
}
```

**GET `/api/admin/visitors/realtime`**
```typescript
interface RealTimeData {
  activeVisitors: number; // počet návštevníkov za posledných 5 minút
  currentPageViews: Array<{ page: string; count: number; }>;
  recentVisitors: Array<{
    id: string;
    country?: string;
    page: string;
    timestamp: string;
    device: string;
  }>;
  trafficSources: Array<{ source: string; count: number; }>;
}
```

**GET `/api/admin/visitors/top-pages?days=30`**
```typescript
interface TopPageData {
  page: string;
  views: number;
  avgTime: number; // priemerný čas na stránke v sekundách
  bounceRate: number; // percentá
}
```

**GET `/api/admin/visitors/traffic-sources?days=30`**
```typescript
interface TrafficSourceData {
  source: string;
  count: number;
  percentage: number;
  conversionRate: number;
}
```

**GET `/api/admin/visitors/device-stats?days=30`**
```typescript
interface DeviceStatsData {
  device: string;
  browser: string;
  os: string;
  count: number;
  percentage: number;
}
```

**GET `/api/admin/visitors/conversion-funnel?days=30`**
```typescript
interface ConversionFunnelData {
  step: string; // 'visit', 'product_view', 'cart_add', 'checkout_start', 'purchase'
  visitors: number;
  conversionRate: number;
}
```

**GET `/api/admin/visitors/geographic?days=30`**
```typescript
interface GeographicData {
  country: string;
  region?: string;
  city?: string;
  count: number;
  percentage: number;
}
```

## 🗄️ Database Schema

### Visitors Table
```sql
CREATE TABLE visitors (
  id VARCHAR(255) PRIMARY KEY,
  first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_count INT DEFAULT 1,
  total_page_views INT DEFAULT 0,
  total_time_spent INT DEFAULT 0, -- v sekundách
  browser_name VARCHAR(100),
  browser_version VARCHAR(50),
  os VARCHAR(100),
  device_type ENUM('desktop', 'mobile', 'tablet'),
  country VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  timezone VARCHAR(100),
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Sessions Table
```sql
CREATE TABLE visitor_sessions (
  id VARCHAR(255) PRIMARY KEY,
  visitor_id VARCHAR(255),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INT, -- v sekundách
  page_views INT DEFAULT 0,
  entry_page VARCHAR(500),
  exit_page VARCHAR(500),
  referrer TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  screen_resolution VARCHAR(20),
  total_clicks INT DEFAULT 0,
  max_scroll_depth INT DEFAULT 0,
  is_bounce BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
  INDEX idx_session_start (start_time),
  INDEX idx_visitor_id (visitor_id)
);
```

### Page Views Table
```sql
CREATE TABLE page_views (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255),
  visitor_id VARCHAR(255),
  page_path VARCHAR(500),
  page_title VARCHAR(500),
  referrer TEXT,
  time_on_page INT, -- v sekundách
  scroll_depth INT, -- percentá 0-100
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
  INDEX idx_page_path (page_path),
  INDEX idx_timestamp (timestamp),
  INDEX idx_session_id (session_id)
);
```

### Events Table
```sql
CREATE TABLE visitor_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255),
  visitor_id VARCHAR(255),
  event_type VARCHAR(100),
  event_data JSON,
  page_path VARCHAR(500),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (session_id) REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (visitor_id) REFERENCES visitors(id) ON DELETE CASCADE,
  INDEX idx_event_type (event_type),
  INDEX idx_timestamp (timestamp),
  INDEX idx_session_id (session_id)
);
```

## 🔧 Implementation Notes

### 1. IP Geolocation
Pre country/region/city detection môžete použiť:
- **MaxMind GeoIP2** (najlepšia presnosť)
- **IP-API** (free tier dostupný)
- **GeoJS** (jednoduchý a zdarma)

```javascript
// Príklad s IP-API
const getLocationFromIP = async (ip) => {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    return {
      country: data.country,
      region: data.regionName,
      city: data.city,
      timezone: data.timezone
    };
  } catch (error) {
    console.error('Geolocation failed:', error);
    return null;
  }
};
```

### 2. Real-time Data Calculation
Pre real-time metriky:
- **Active visitors**: počet unique visitors za posledných 5 minút
- **Current page views**: aktuálne prezerané stránky (posledné 2 minúty)
- **Recent visitors**: posledných 20 návštevníkov

### 3. Performance Optimizations
```sql
-- Indexes pre rýchle queries
CREATE INDEX idx_sessions_recent ON visitor_sessions(start_time DESC);
CREATE INDEX idx_events_recent ON visitor_events(timestamp DESC);
CREATE INDEX idx_pageviews_recent ON page_views(timestamp DESC);

-- Composite indexes
CREATE INDEX idx_session_visitor_time ON visitor_sessions(visitor_id, start_time);
CREATE INDEX idx_events_type_time ON visitor_events(event_type, timestamp);
```

### 4. Data Retention
```sql
-- Cleanup old data (starších ako 2 roky)
DELETE FROM visitor_events WHERE timestamp < DATE_SUB(NOW(), INTERVAL 2 YEAR);
DELETE FROM page_views WHERE timestamp < DATE_SUB(NOW(), INTERVAL 2 YEAR);
DELETE FROM visitor_sessions WHERE start_time < DATE_SUB(NOW(), INTERVAL 2 YEAR);
```

### 5. Privacy Compliance (GDPR)
- **IP anonymization**: Ukladajte iba prvé 3 oktety IP adresy
- **Data retention**: Automatické mazanie starých dát
- **Opt-out**: Možnosť vypnúť tracking
- **Cookie consent**: Začnite tracking až po súhlase

```javascript
// IP anonymization
const anonymizeIP = (ip) => {
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
  return ip;
};
```

## 📈 Sample Queries

### Daily Visitors
```sql
SELECT
  DATE(start_time) as date,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(*) as total_sessions
FROM visitor_sessions
WHERE start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(start_time)
ORDER BY date;
```

### Top Pages
```sql
SELECT
  page_path,
  COUNT(*) as views,
  AVG(time_on_page) as avg_time,
  SUM(CASE WHEN time_on_page < 10 THEN 1 ELSE 0 END) / COUNT(*) * 100 as bounce_rate
FROM page_views
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY page_path
ORDER BY views DESC
LIMIT 10;
```

### Conversion Funnel
```sql
SELECT
  'visits' as step,
  COUNT(DISTINCT visitor_id) as count
FROM visitor_sessions
WHERE start_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)

UNION ALL

SELECT
  'cart_adds' as step,
  COUNT(DISTINCT visitor_id) as count
FROM visitor_events
WHERE event_type = 'cart_add'
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)

UNION ALL

SELECT
  'purchases' as step,
  COUNT(DISTINCT visitor_id) as count
FROM visitor_events
WHERE event_type = 'purchase'
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY);
```

## 🚀 Quick Start

1. **Vytvorte databázové tabuľky** podľa schémy vyššie
2. **Implementujte API endpoints** v backende
3. **Pridajte IP geolocation** službu
4. **Nastavte automatické cleanup** starých dát
5. **Otestujte analytics** dashboard

Frontend automaticky začne posielať dáta na tieto endpoints po implementácii backendu.

---

*Pre otázky a podporu kontaktujte development tím.*