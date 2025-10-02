# Backend Integrácia - Mazanie Užívateľských Fotiek

## Prehľad

Tento dokument špecifikuje backend implementáciu pre mazanie užívateľských fotiek modelov. Frontend už má implementované volanie na DELETE endpoint.

## API Endpoint

### DELETE `/api/user-photos/{photoId}`

Zmaže konkrétnu fotku užívateľa na základe photo ID.

## Request Špecifikácia

### HTTP Method
```
DELETE
```

### URL Pattern
```
/api/user-photos/{photoId}
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `photoId` | `integer` | ✅ | Jedinečný identifikátor fotky na zmazanie |

### Headers
| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Authorization` | `Bearer {jwt-token}` | ✅ | JWT token pre autentifikáciu užívateľa |
| `Content-Type` | `application/json` | ✅ | Typ obsahu requestu |

### Request Body
```
Žiadny request body nie je potrebný.
```

## Response Špecifikácia

### Úspešná odpoveď (200 OK)
```json
{
  "success": true,
  "message": "Photo deleted successfully",
  "data": {
    "deletedPhotoId": 123,
    "deletedAt": "2025-10-02T15:30:45.123Z"
  }
}
```

### Chybové odpovede

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid or missing authentication token"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "FORBIDDEN", 
  "message": "You can only delete your own photos"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "PHOTO_NOT_FOUND",
  "message": "Photo with ID 123 not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Failed to delete photo from storage"
}
```

## Backend Implementačné Požiadavky

### 1. Autentifikácia a Autorizácia
```javascript
// Pseudokód
async function deleteUserPhoto(photoId, userId) {
  // 1. Validácia JWT tokenu
  const user = await validateJWTToken(request.headers.authorization);
  if (!user) {
    return response.status(401).json({
      success: false,
      error: "UNAUTHORIZED",
      message: "Invalid or missing authentication token"
    });
  }

  // 2. Overenie vlastníctva fotky
  const photo = await getUserPhoto(photoId);
  if (!photo) {
    return response.status(404).json({
      success: false,
      error: "PHOTO_NOT_FOUND", 
      message: `Photo with ID ${photoId} not found`
    });
  }

  if (photo.userId !== user.id) {
    return response.status(403).json({
      success: false,
      error: "FORBIDDEN",
      message: "You can only delete your own photos"
    });
  }
}
```

### 2. Databázové Operácie

#### Tabuľka: `user_photos`
```sql
-- Nájdenie fotky pre overenie vlastníctva
SELECT id, user_id, product_id, file_name, cdn_url, thumbnail_url 
FROM user_photos 
WHERE id = ? AND user_id = ?;

-- Zmazanie záznamu z databázy
DELETE FROM user_photos 
WHERE id = ? AND user_id = ?;
```

### 3. Digital Ocean Spaces Cleanup
```javascript
// Pseudokód pre mazanie súborov z CDN
async function deleteFromDigitalOceanSpaces(photo) {
  try {
    // Zmazanie hlavnej fotky
    await digitalOceanSpaces.deleteObject({
      Bucket: 'mi-gallery',
      Key: extractKeyFromUrl(photo.cdn_url) // napr. "userModels/1/ENDEAVOUR/images/1_1_1727873661640_ja.jpg"
    });

    // Zmazanie thumbnail
    if (photo.thumbnail_url) {
      await digitalOceanSpaces.deleteObject({
        Bucket: 'mi-gallery', 
        Key: extractKeyFromUrl(photo.thumbnail_url) // napr. "userModels/1/ENDEAVOUR/images/thumbs/1_1_1727873661640_ja.jpg"
      });
    }

    console.log(`Successfully deleted files for photo ID: ${photo.id}`);
  } catch (error) {
    console.error(`Failed to delete files from Digital Ocean Spaces:`, error);
    throw new Error('Failed to delete photo from storage');
  }
}

function extractKeyFromUrl(cdnUrl) {
  // Extrahovanie kľúča z CDN URL
  // Z: "https://mi-gallery.fra1.digitaloceanspaces.com/userModels/1/ENDEAVOUR/images/1_1_1727873661640_ja.jpg"
  // Na: "userModels/1/ENDEAVOUR/images/1_1_1727873661640_ja.jpg"
  const urlParts = cdnUrl.split('.com/');
  return urlParts[1];
}
```

### 4. Kompletný Endpoint Implementation
```javascript
// Express.js príklad
app.delete('/api/user-photos/:photoId', async (req, res) => {
  const { photoId } = req.params;
  
  try {
    // 1. Autentifikácia
    const user = await validateJWTToken(req.headers.authorization);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid or missing authentication token"
      });
    }

    // 2. Nájdenie a overenie fotky
    const photo = await db.query(
      'SELECT * FROM user_photos WHERE id = ? AND user_id = ?',
      [photoId, user.id]
    );

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: "PHOTO_NOT_FOUND",
        message: `Photo with ID ${photoId} not found`
      });
    }

    // 3. Zmazanie súborov z Digital Ocean Spaces
    await deleteFromDigitalOceanSpaces(photo);

    // 4. Zmazanie záznamu z databázy
    await db.query(
      'DELETE FROM user_photos WHERE id = ? AND user_id = ?',
      [photoId, user.id]
    );

    // 5. Úspešná odpoveď
    res.status(200).json({
      success: true,
      message: "Photo deleted successfully",
      data: {
        deletedPhotoId: parseInt(photoId),
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_SERVER_ERROR",
      message: "Failed to delete photo"
    });
  }
});
```

## Frontend Volanie (Už Implementované)

### JavaScript/TypeScript Kód
```typescript
const deletePhoto = async (photoId: number) => {
  const token = getAuthToken();
  
  const response = await fetch(
    `${process.env.VITE_API_URL}/api/user-photos/${photoId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete photo');
  }

  return await response.json();
};
```

## Bezpečnostné Požiadavky

### 1. Autentifikácia
- ✅ Overenie platnosti JWT tokenu
- ✅ Kontrola expirácie tokenu

### 2. Autorizácia  
- ✅ Užívateľ môže zmazať len svoje vlastné fotky
- ✅ Overenie `user_id` v databáze

### 3. Validácia
- ✅ Validácia `photoId` parametra (číselný, pozitívny)
- ✅ Kontrola existencie fotky v databáze

### 4. Error Handling
- ✅ Graceful handling chýb Digital Ocean Spaces
- ✅ Rollback pri čiastočnom zlyhaní
- ✅ Detailné logovanie chýb

## Testovanie

### Test Cases

#### 1. Úspešné zmazanie
```bash
curl -X DELETE \
  http://localhost:8080/api/user-photos/123 \
  -H "Authorization: Bearer valid-jwt-token" \
  -H "Content-Type: application/json"

# Expected: 200 OK s success response
```

#### 2. Neautorizovaný prístup
```bash
curl -X DELETE \
  http://localhost:8080/api/user-photos/123 \
  -H "Content-Type: application/json"

# Expected: 401 Unauthorized
```

#### 3. Fotka neexistuje
```bash
curl -X DELETE \
  http://localhost:8080/api/user-photos/99999 \
  -H "Authorization: Bearer valid-jwt-token" \
  -H "Content-Type: application/json"

# Expected: 404 Not Found
```

#### 4. Pokus o zmazanie cudzej fotky
```bash
curl -X DELETE \
  http://localhost:8080/api/user-photos/123 \
  -H "Authorization: Bearer other-user-jwt-token" \
  -H "Content-Type: application/json"

# Expected: 403 Forbidden
```

## Databázová Štruktúra

### Tabuľka: `user_photos`
```sql
CREATE TABLE user_photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  cdn_url TEXT NOT NULL,
  thumbnail_url TEXT,
  verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_product (user_id, product_id),
  INDEX idx_verification_status (verification_status)
);
```

## Poznámky pre Implementáciu

### 1. Digital Ocean Spaces Konfigurácia
```javascript
const AWS = require('aws-sdk');

const spacesEndpoint = new AWS.Endpoint('fra1.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: 'fra1'
});
```

### 2. Environment Variables
```env
DO_SPACES_KEY=your_digital_ocean_spaces_key
DO_SPACES_SECRET=your_digital_ocean_spaces_secret
DO_SPACES_BUCKET=mi-gallery
JWT_SECRET=your_jwt_secret
```

### 3. Error Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'photo-delete-errors.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

// Použitie v endpointe
logger.error('Failed to delete photo', { 
  photoId, 
  userId: user.id, 
  error: error.message 
});
```

## Monitoring a Metriky

### Odporúčané Metriky
- Počet úspešných zmazaní fotiek
- Počet neúspešných pokusov
- Čas odozvy endpointu
- Chyby Digital Ocean Spaces

### Health Check
```javascript
app.get('/api/health/photo-delete', async (req, res) => {
  try {
    // Test databázového pripojenia
    await db.query('SELECT 1');
    
    // Test Digital Ocean Spaces pripojenia
    await s3.headBucket({ Bucket: 'mi-gallery' }).promise();
    
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
```

---

**Frontend Status**: ✅ Implementované  
**Backend Status**: ⏳ Čaká na implementáciu  
**Dokumentácia**: ✅ Kompletná  

Tento dokument poskytuje všetky potrebné informácie pre implementáciu DELETE endpointu na backend strane.
