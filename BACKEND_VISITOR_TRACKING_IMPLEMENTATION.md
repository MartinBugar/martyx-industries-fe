# 🚀 Backend Implementation Guide: Visitor Tracking System

## 📋 Overview
Implement a comprehensive visitor tracking system that records website visits with IP geolocation for analytics. The system must be efficient, secure, and provide detailed metrics for admin dashboard.

## 🎯 Required API Endpoints

### 1. Track Visit Endpoint
**Endpoint:** `POST /api/admin/visits/track`
**Purpose:** Record a single website visit with detailed metadata
**Authentication:** Admin-protected endpoint

**Request Body:**
```json
{
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "referrer": "https://google.com",
  "language": "en-US",
  "screenResolution": "1920x1080",
  "timezone": "Europe/Bratislava"
}
```

**Response:**
```json
{
  "totalCount": 12567,
  "todayCount": 45
}
```

**Implementation Requirements:**
- Extract IP address from request headers (`req.ip` or `req.connection.remoteAddress`)
- Perform IP geolocation lookup to get country information
- Store visit record in database with timestamp
- Return updated total count and today's count
- Handle duplicate requests gracefully (max 1 visit per IP per hour)

### 2. Get Visitor Count
**Endpoint:** `GET /api/admin/visits/count`
**Purpose:** Get total and today's visitor counts
**Authentication:** Admin-protected endpoint

**Response:**
```json
{
  "totalCount": 12567,
  "todayCount": 45
}
```

### 3. Get Daily Visitor Data
**Endpoint:** `GET /api/admin/visits/daily?days=30`
**Purpose:** Get daily visitor statistics for the last N days
**Authentication:** Admin-protected endpoint

**Query Parameters:**
- `days` (optional, default: 30) - Number of days to include

**Response:**
```json
[
  {
    "date": "2025-09-18",
    "count": 45,
    "uniqueCount": 32
  },
  {
    "date": "2025-09-17",
    "count": 38,
    "uniqueCount": 28
  }
  // ... for each day in the range
]
```

**Implementation Notes:**
- Always return data for exactly N days (including days with 0 visits)
- Use YYYY-MM-DD format for dates
- `count` = total visits for that day
- `uniqueCount` = unique IP addresses for that day
- Data should be ordered chronologically (oldest first)

### 4. Get Visitor Location Statistics
**Endpoint:** `GET /api/admin/visits/locations`
**Purpose:** Get visitor statistics by country
**Authentication:** Admin-protected endpoint

**Response:**
```json
[
  {
    "country": "Slovakia",
    "countryCode": "🇸🇰",
    "count": 5432,
    "percentage": 43.2
  },
  {
    "country": "Czech Republic",
    "countryCode": "🇨🇿",
    "count": 3210,
    "percentage": 25.5
  }
  // ... ordered by count (descending)
]
```

## 🗄️ Database Schema

### visits Table
```sql
CREATE TABLE visits (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  country VARCHAR(100),
  country_code VARCHAR(2),
  user_agent TEXT,
  referrer TEXT,
  language VARCHAR(10),
  screen_resolution VARCHAR(20),
  timezone VARCHAR(50),
  visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Indexes for performance
  INDEX idx_visited_at (visited_at),
  INDEX idx_ip_address (ip_address),
  INDEX idx_country (country),
  INDEX idx_date_ip (DATE(visited_at), ip_address)
);
```

### visit_daily_stats Table (Optional - for performance)
```sql
CREATE TABLE visit_daily_stats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_visits INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_date (date)
);
```

## 🌍 IP Geolocation Implementation

### Recommended Service: MaxMind GeoLite2
```javascript
// Example implementation with maxmind
const maxmind = require('maxmind');

let geoLookup;

// Initialize geolocation database
async function initializeGeolocation() {
  try {
    geoLookup = await maxmind.open('./GeoLite2-Country.mmdb');
    console.log('Geolocation database loaded successfully');
  } catch (error) {
    console.error('Failed to load geolocation database:', error);
  }
}

// Get country from IP address
function getCountryFromIP(ipAddress) {
  try {
    if (!geoLookup) return { country: 'Unknown', countryCode: 'XX' };

    const result = geoLookup.get(ipAddress);
    const country = result?.country?.names?.en || 'Unknown';
    const countryCode = result?.country?.iso_code || 'XX';

    return { country, countryCode };
  } catch (error) {
    console.warn('Geolocation lookup failed:', error);
    return { country: 'Unknown', countryCode: 'XX' };
  }
}
```

### Alternative: IP-API (Free tier available)
```javascript
// Alternative implementation with IP-API
async function getCountryFromIP(ipAddress) {
  try {
    const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=country,countryCode`);
    const data = await response.json();

    if (data.status === 'success') {
      return {
        country: data.country,
        countryCode: data.countryCode
      };
    }

    return { country: 'Unknown', countryCode: 'XX' };
  } catch (error) {
    console.warn('IP-API lookup failed:', error);
    return { country: 'Unknown', countryCode: 'XX' };
  }
}
```

## 💾 Sample Implementation Code

### Track Visit Handler
```javascript
async function trackVisit(req, res) {
  try {
    // Extract IP address
    const ipAddress = req.ip ||
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);

    if (!ipAddress) {
      return res.status(400).json({ error: 'IP address not found' });
    }

    // Check for duplicate visits (max 1 per IP per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existingVisit = await db.query(
      'SELECT id FROM visits WHERE ip_address = ? AND visited_at > ?',
      [ipAddress, oneHourAgo]
    );

    if (existingVisit.length > 0) {
      // Return current counts without creating new record
      const counts = await getVisitorCounts();
      return res.json(counts);
    }

    // Get country information
    const { country, countryCode } = await getCountryFromIP(ipAddress);

    // Extract request data
    const {
      userAgent,
      referrer,
      language,
      screenResolution,
      timezone
    } = req.body;

    // Insert visit record
    await db.query(`
      INSERT INTO visits (
        ip_address, country, country_code, user_agent,
        referrer, language, screen_resolution, timezone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ipAddress, country, countryCode, userAgent,
      referrer, language, screenResolution, timezone
    ]);

    // Update daily stats (if using stats table)
    const today = new Date().toISOString().split('T')[0];
    await db.query(`
      INSERT INTO visit_daily_stats (date, total_visits, unique_visitors)
      VALUES (?, 1, 1)
      ON DUPLICATE KEY UPDATE
        total_visits = total_visits + 1,
        unique_visitors = (
          SELECT COUNT(DISTINCT ip_address)
          FROM visits
          WHERE DATE(visited_at) = ?
        )
    `, [today, today]);

    // Return updated counts
    const counts = await getVisitorCounts();
    res.json(counts);

  } catch (error) {
    console.error('Track visit error:', error);
    res.status(500).json({ error: 'Failed to track visit' });
  }
}
```

### Get Visitor Counts
```javascript
async function getVisitorCounts() {
  const today = new Date().toISOString().split('T')[0];

  const [totalResult, todayResult] = await Promise.all([
    db.query('SELECT COUNT(*) as count FROM visits'),
    db.query('SELECT COUNT(*) as count FROM visits WHERE DATE(visited_at) = ?', [today])
  ]);

  return {
    totalCount: totalResult[0].count,
    todayCount: todayResult[0].count
  };
}
```

### Get Daily Data
```javascript
async function getDailyVisitorData(req, res) {
  try {
    const days = parseInt(req.query.days) || 30;

    // Generate date range
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Query daily data
    const dailyData = await db.query(`
      SELECT
        DATE(visited_at) as date,
        COUNT(*) as count,
        COUNT(DISTINCT ip_address) as uniqueCount
      FROM visits
      WHERE DATE(visited_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(visited_at)
      ORDER BY date ASC
    `, [days]);

    // Create map for quick lookup
    const dataMap = new Map();
    dailyData.forEach(row => {
      dataMap.set(row.date, {
        date: row.date,
        count: row.count,
        uniqueCount: row.uniqueCount
      });
    });

    // Ensure all dates are included (with 0 counts if no data)
    const result = dates.map(date =>
      dataMap.get(date) || { date, count: 0, uniqueCount: 0 }
    );

    res.json(result);
  } catch (error) {
    console.error('Get daily data error:', error);
    res.status(500).json({ error: 'Failed to get daily data' });
  }
}
```

### Get Location Statistics
```javascript
async function getLocationStats(req, res) {
  try {
    const locationData = await db.query(`
      SELECT
        country,
        country_code as countryCode,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM visits)), 1) as percentage
      FROM visits
      WHERE country IS NOT NULL AND country != 'Unknown'
      GROUP BY country, country_code
      ORDER BY count DESC
      LIMIT 20
    `);

    res.json(locationData);
  } catch (error) {
    console.error('Get location stats error:', error);
    res.status(500).json({ error: 'Failed to get location stats' });
  }
}
```

## 🔧 Performance Optimizations

### 1. Database Indexes
```sql
-- Primary indexes for fast queries
CREATE INDEX idx_visits_date ON visits(DATE(visited_at));
CREATE INDEX idx_visits_ip_date ON visits(ip_address, DATE(visited_at));
CREATE INDEX idx_visits_country ON visits(country);

-- Composite index for daily unique visitors
CREATE INDEX idx_visits_date_ip ON visits(DATE(visited_at), ip_address);
```

### 2. Caching Strategy
```javascript
// Cache visitor counts for 5 minutes
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}
```

### 3. Rate Limiting
```javascript
// Prevent abuse with rate limiting
const rateLimit = require('express-rate-limit');

const visitTrackingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 visits per IP per hour
  message: 'Too many visits tracked from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/admin/visits/track', visitTrackingLimiter, trackVisit);
```

## 🛡️ Security Considerations

### 1. IP Address Anonymization (GDPR Compliance)
```javascript
// Anonymize IP addresses for privacy
function anonymizeIP(ipAddress) {
  if (ipAddress.includes(':')) {
    // IPv6 - keep first 64 bits
    const parts = ipAddress.split(':');
    return parts.slice(0, 4).join(':') + '::';
  } else {
    // IPv4 - keep first 3 octets
    const parts = ipAddress.split('.');
    return parts.slice(0, 3).join('.') + '.0';
  }
}
```

### 2. Input Validation
```javascript
const { body, query } = require('express-validator');

// Validation for track visit
const validateTrackVisit = [
  body('userAgent').optional().isLength({ max: 500 }),
  body('referrer').optional().isURL(),
  body('language').optional().isLength({ max: 10 }),
  body('screenResolution').optional().matches(/^\d+x\d+$/),
  body('timezone').optional().isLength({ max: 50 })
];

// Validation for daily data
const validateDailyData = [
  query('days').optional().isInt({ min: 1, max: 365 })
];
```

## 📊 Database Maintenance

### 1. Data Retention Policy
```sql
-- Clean up old data (older than 2 years)
DELETE FROM visits
WHERE visited_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);

-- Set up automated cleanup (run daily)
CREATE EVENT cleanup_old_visits
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM visits
  WHERE visited_at < DATE_SUB(NOW(), INTERVAL 2 YEAR);
```

### 2. Daily Stats Maintenance
```sql
-- Recalculate daily stats (run nightly)
INSERT INTO visit_daily_stats (date, total_visits, unique_visitors)
SELECT
  DATE(visited_at) as date,
  COUNT(*) as total_visits,
  COUNT(DISTINCT ip_address) as unique_visitors
FROM visits
WHERE DATE(visited_at) = CURDATE()
GROUP BY DATE(visited_at)
ON DUPLICATE KEY UPDATE
  total_visits = VALUES(total_visits),
  unique_visitors = VALUES(unique_visitors);
```

## 🚀 Deployment Checklist

- [ ] Install geolocation database (MaxMind GeoLite2)
- [ ] Create database tables and indexes
- [ ] Set up rate limiting
- [ ] Configure CORS for admin endpoints
- [ ] Set up automated data cleanup
- [ ] Add monitoring for endpoint performance
- [ ] Test with various IP addresses
- [ ] Verify geolocation accuracy
- [ ] Test caching mechanisms
- [ ] Validate all API responses match frontend expectations

## 🧪 Testing Requirements

### Unit Tests
- Test IP geolocation function
- Test duplicate visit detection
- Test daily data aggregation
- Test location statistics calculation

### Integration Tests
- Test complete visit tracking flow
- Test all API endpoints
- Test with various IP addresses
- Test rate limiting
- Test caching behavior

### Performance Tests
- Test with large datasets (1M+ visits)
- Measure response times under load
- Test database query performance
- Verify cache effectiveness

---

**⚠️ Important Notes:**
- Frontend expects exact response formats - do not change field names
- All dates must be in YYYY-MM-DD format
- Country codes should be emoji flags (🇸🇰, 🇨🇿, etc.)
- Admin endpoints require authentication
- IP address handling must comply with privacy regulations
- Performance is critical - aim for <100ms response times