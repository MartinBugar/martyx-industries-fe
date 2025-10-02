# Backend API - Payment Details Endpoint

## 🎯 Endpoint Overview

Tento dokument definuje presné požiadavky na backend API endpoint pre získanie detailov platby.

## 📋 API Specification

### **Endpoint Details**

```
GET /api/payments/{paymentId}
```

**Base URL:** `http://localhost:8080`  
**Full URL:** `http://localhost:8080/api/payments/{paymentId}`  
**Method:** `GET`  
**Content-Type:** `application/json`

### **Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `paymentId` | string/number | ✅ | Unique identifier platby |

### **Request Headers**

```http
Authorization: Bearer {JWT_TOKEN}
Accept-Language: sk-SK,sk;q=0.9,en;q=0.8
Content-Type: application/json
Accept: application/json
```

### **Authentication**

- **Required:** JWT token v Authorization header
- **Scope:** User môže pristupovať len k svojim platbám
- **Validation:** Overiť že `payment.user_id = authenticated_user.id`

## 📤 Response Specification

### **Success Response (200 OK)**

```json
{
  "id": 1,
  "paymentReference": "PAY-1234567890",
  "orderId": 123,
  "orderNumber": "ORD-2024-001",
  "amount": 29.99,
  "currency": "EUR",
  "paymentMethod": "PAYPAL",
  "status": "COMPLETED",
  "transactionId": "TXN-ABC123",
  "payerId": "PAYER123",
  "payerEmail": "customer@example.com",
  "paymentUrl": null,
  
  // Download URLs - preferovaná štruktúra
  "downloadLinks": [
    {
      "productId": 101,
      "productName": "Ferrari F40 - 1:24 Scale Model",
      "url": "https://cdn.example.com/downloads/product-101.zip",
      "token": "download-token-123"
    },
    {
      "productId": 102,
      "productName": "Lamborghini Aventador - 1:24 Scale",
      "url": "https://cdn.example.com/downloads/product-102.zip",
      "token": "download-token-456"
    }
  ],
  
  // Alternatívne/Legacy download fields (pre backward compatibility)
  "downloadUrls": [
    "https://cdn.example.com/downloads/product-101.zip",
    "https://cdn.example.com/downloads/product-102.zip"
  ],
  "downloadTokens": [
    "download-token-123",
    "download-token-456"
  ],
  
  // Invoice downloads
  "invoiceDownloadUrls": [
    "https://cdn.example.com/invoices/invoice-123.pdf"
  ],
  "invoiceDownloadTokens": [
    "invoice-token-789"
  ],
  
  // All products convenience URL (zip všetkých produktov)
  "allProductsDownloadUrl": "https://cdn.example.com/downloads/order-123-all.zip",
  "allProductsDownloadToken": "all-products-token-abc",
  
  // Legacy single fields (pre backward compatibility)
  "downloadUrl": "https://cdn.example.com/downloads/product-101.zip",
  "downloadToken": "download-token-123",
  "invoiceDownloadUrl": "https://cdn.example.com/invoices/invoice-123.pdf",
  "invoiceDownloadToken": "invoice-token-789",
  
  // Order items pre zobrazenie v UI
  "orderItems": [
    {
      "productId": 101,
      "productName": "Ferrari F40 - 1:24 Scale Model",
      "quantity": 1,
      "unitPrice": 29.99
    },
    {
      "productId": 102,
      "productName": "Lamborghini Aventador - 1:24 Scale",
      "quantity": 2,
      "unitPrice": 34.99
    }
  ],
  
  // Timestamps (ISO 8601 format)
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z",
  "completedAt": "2024-01-15T10:35:00Z",
  
  "errorMessage": null
}
```

### **Field Descriptions**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | ✅ | Unique ID platby |
| `paymentReference` | string | ❌ | External payment reference |
| `orderId` | number | ❌ | ID objednávky |
| `orderNumber` | string | ❌ | Human-readable order number |
| `amount` | number | ✅ | Suma platby |
| `currency` | string | ✅ | Mena (EUR, USD, atď.) |
| `paymentMethod` | string | ✅ | Spôsob platby (PAYPAL, CARD, atď.) |
| `status` | string | ✅ | Status platby |
| `transactionId` | string | ❌ | External transaction ID |
| `payerId` | string | ❌ | PayPal payer ID |
| `payerEmail` | string | ❌ | Email zákazníka |
| `downloadLinks` | array | ❌ | **Preferovaná štruktúra** - detailné download linky |
| `downloadUrls` | array | ❌ | Legacy - zoznam download URLs |
| `invoiceDownloadUrls` | array | ❌ | URLs pre stiahnutie faktúr |
| `allProductsDownloadUrl` | string | ❌ | URL pre stiahnutie všetkých produktov |
| `orderItems` | array | ❌ | Zoznam produktov v objednávke |

### **Payment Status Values**

| Status | Description |
|--------|-------------|
| `PENDING` | Platba čaká na spracovanie |
| `COMPLETED` | Platba úspešne dokončená |
| `CANCELLED` | Platba zrušená |
| `REFUNDED` | Platba refundovaná |
| `FAILED` | Platba zlyhala |

## ❌ Error Responses

### **404 Not Found**
```json
{
  "error": "Payment not found",
  "message": "Payment with ID 1 does not exist",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/payments/1"
}
```

### **401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/payments/1"
}
```

### **403 Forbidden**
```json
{
  "error": "Forbidden",
  "message": "You don't have permission to access this payment",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/payments/1"
}
```

### **500 Internal Server Error**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/payments/1"
}
```

## 💾 Database Schema Requirements

### **Payments Table**
```sql
CREATE TABLE payments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  payment_reference VARCHAR(255),
  order_id BIGINT,
  order_number VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  payment_method VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  transaction_id VARCHAR(255),
  payer_id VARCHAR(255),
  payer_email VARCHAR(255),
  payment_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  INDEX idx_user_id (user_id),
  INDEX idx_payment_reference (payment_reference),
  INDEX idx_status (status)
);
```

### **Download Links Table**
```sql
CREATE TABLE payment_download_links (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  payment_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  download_url TEXT NOT NULL,
  download_token VARCHAR(255),
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  INDEX idx_payment_id (payment_id)
);
```

### **Invoice Links Table**
```sql
CREATE TABLE payment_invoice_links (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  payment_id BIGINT NOT NULL,
  invoice_url TEXT NOT NULL,
  invoice_token VARCHAR(255),
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  INDEX idx_payment_id (payment_id)
);
```

## 🔍 SQL Query Example

```sql
SELECT 
  p.id,
  p.payment_reference,
  p.order_id,
  o.order_number,
  p.amount,
  p.currency,
  p.payment_method,
  p.status,
  p.transaction_id,
  p.payer_id,
  p.payer_email,
  p.payment_url,
  p.error_message,
  p.created_at,
  p.updated_at,
  p.completed_at,
  
  -- Download links
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'productId', dl.product_id,
      'productName', dl.product_name,
      'url', dl.download_url,
      'token', dl.download_token
    )
  ) as download_links,
  
  -- Invoice links
  GROUP_CONCAT(il.invoice_url) as invoice_urls,
  GROUP_CONCAT(il.invoice_token) as invoice_tokens,
  
  -- Order items
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'productId', oi.product_id,
      'productName', oi.product_name,
      'quantity', oi.quantity,
      'unitPrice', oi.unit_price
    )
  ) as order_items

FROM payments p
LEFT JOIN orders o ON p.order_id = o.id
LEFT JOIN payment_download_links dl ON p.id = dl.payment_id
LEFT JOIN payment_invoice_links il ON p.id = il.payment_id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE p.id = ? AND p.user_id = ?
GROUP BY p.id;
```

## 🔒 Security Requirements

### **Authentication & Authorization**
- ✅ JWT token validation
- ✅ User ownership verification (`payment.user_id = user.id`)
- ✅ Token expiration check
- ✅ Role-based access (user can access only own payments)

### **Rate Limiting**
- ✅ Max 100 requests/minute per user
- ✅ Max 1000 requests/hour per IP
- ✅ Exponential backoff pre rate limit exceeded

### **Data Protection**
- ✅ Sensitive data encryption (payment tokens)
- ✅ PCI DSS compliance pre card payments
- ✅ GDPR compliance pre personal data
- ✅ Audit logging pre payment access

### **CORS Configuration**
```javascript
// Allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://yourdomain.com'
];
```

## ⚡ Performance Requirements

### **Response Time**
- ✅ < 200ms pre cached responses
- ✅ < 500ms pre fresh queries
- ✅ < 1s pre complex aggregations

### **Caching Strategy**
- ✅ Redis cache pre completed payments (TTL: 5 minutes)
- ✅ CDN cache pre download URLs (TTL: 1 hour)
- ✅ Database query optimization (indexes)

### **Scalability**
- ✅ Database connection pooling
- ✅ Horizontal scaling support
- ✅ Load balancer ready

## 🧪 Testing

### **Unit Tests**
```bash
# Test successful payment retrieval
GET /api/payments/1
Authorization: Bearer valid_token
Expected: 200 OK with payment data

# Test unauthorized access
GET /api/payments/1
Authorization: Bearer invalid_token
Expected: 401 Unauthorized

# Test forbidden access (different user)
GET /api/payments/999
Authorization: Bearer valid_token_different_user
Expected: 403 Forbidden

# Test not found
GET /api/payments/99999
Authorization: Bearer valid_token
Expected: 404 Not Found
```

### **Integration Tests**
```bash
# Test complete flow
1. Create payment
2. Complete payment
3. Retrieve payment details
4. Verify download links
5. Verify invoice links
```

### **Load Tests**
```bash
# Concurrent requests
ab -n 1000 -c 10 -H "Authorization: Bearer token" \
  http://localhost:8080/api/payments/1
```

## 🎯 Use Cases

### **1. PayPal Success Page**
- User dokončí PayPal platbu
- Frontend volá `GET /api/payments/{paymentId}`
- Zobrazí download linky a invoice

### **2. Order History**
- User si prezerá históriu objednávok
- Frontend volá `GET /api/payments/{paymentId}` pre každú platbu
- Zobrazí detaily a možnosť re-download

### **3. Download Management**
- User chce znovu stiahnuť produkt
- Frontend volá `GET /api/payments/{paymentId}`
- Získa aktuálne download URLs

### **4. Customer Support**
- Admin potrebuje pomôcť zákazníkovi
- Admin má prístup k payment details
- Môže regenerovať download linky

## 📊 Monitoring & Logging

### **Metrics to Track**
- ✅ Response time percentiles (p50, p95, p99)
- ✅ Error rate by status code
- ✅ Cache hit/miss ratio
- ✅ Database query performance
- ✅ Download link generation time

### **Logging Requirements**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "message": "Payment details retrieved",
  "paymentId": 1,
  "userId": 123,
  "responseTime": 150,
  "cacheHit": true
}
```

### **Alerts**
- ✅ Response time > 1s
- ✅ Error rate > 5%
- ✅ Cache miss rate > 50%
- ✅ Database connection issues

## 🚀 Deployment Notes

### **Environment Variables**
```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=martyx_industries
DB_USER=api_user
DB_PASSWORD=secure_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# CDN
CDN_BASE_URL=https://cdn.yourdomain.com
DOWNLOAD_TOKEN_EXPIRATION=7d

# Cache
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_TTL=300

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000
```

### **Health Check**
```
GET /api/health
Response: 200 OK
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

**Verzia dokumentu:** 1.0  
**Posledná aktualizácia:** 2024-10-02  
**Autor:** Frontend Development Team  
**Status:** Ready for Implementation
