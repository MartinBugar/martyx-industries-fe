# Backend Integration Guide - Cassandra Avatar & Photo Upload System

## 🎯 Prehľad projektu

Implementácia kompletného gamifikačného systému pre personalizovanú Cassandru s photo upload funkcionalitou a Digital Ocean CDN integráciou.

## 📊 Databázová štruktúra

### 1. Rozšírenie existujúcej `users` tabuľky

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  current_level INT DEFAULT 0,
  completed_models_count INT DEFAULT 0,
  total_photos_uploaded INT DEFAULT 0,
  last_level_up TIMESTAMP NULL,
  avatar_head_url VARCHAR(255) NULL,
  avatar_full_url VARCHAR(255) NULL;
```

### 2. Tabuľka pre level rewards

```sql
CREATE TABLE level_rewards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  level INT UNIQUE NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  item_type ENUM('hat', 'shirt', 'pants', 'shoes', 'accessory') NOT NULL,
  item_image_url VARCHAR(255) NOT NULL,
  rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_level (level)
);
```

### 3. Tabuľka pre zakúpené modely

```sql
CREATE TABLE user_purchased_models (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  model_id INT NOT NULL,
  order_id INT NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('purchased', 'photo_uploaded', 'completed') DEFAULT 'purchased',
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_model (user_id, model_id),
  INDEX idx_user_status (user_id, status)
);
```

### 4. Tabuľka pre uploadované fotky

```sql
CREATE TABLE user_model_photos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  order_id INT NOT NULL,
  model_id INT NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  
  -- Photo storage info
  original_filename VARCHAR(255) NOT NULL,
  cdn_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NULL,
  file_size INT NOT NULL, -- in bytes
  mime_type VARCHAR(100) NOT NULL,
  
  -- Upload metadata
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  upload_ip VARCHAR(45) NULL,
  
  -- Verification system
  verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  verified_by INT NULL, -- admin user_id
  verified_at TIMESTAMP NULL,
  admin_notes TEXT NULL,
  
  -- Level system integration
  level_awarded BOOLEAN DEFAULT FALSE,
  level_awarded_at TIMESTAMP NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_user_verification (user_id, verification_status),
  INDEX idx_pending_verification (verification_status, upload_date)
);
```

### 5. Tabuľka pre user Cassandra items

```sql
CREATE TABLE user_cassandra_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  level_unlocked INT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_equipped BOOLEAN DEFAULT FALSE,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (level_unlocked) REFERENCES level_rewards(level),
  UNIQUE KEY unique_user_item (user_id, item_name),
  INDEX idx_user_equipped (user_id, is_equipped)
);
```

## 🔌 API Endpoints

### User Collection & Progress

#### GET /api/user/purchased-models
Vráti všetky zakúpené modely s photo status

**Response:**
```json
{
  "models": [
    {
      "order_id": 123,
      "model_id": 456,
      "model_name": "Ferrari F40 - 1:24 Scale",
      "purchase_date": "2024-01-15T10:30:00Z",
      "photos": [
        {
          "id": 789,
          "cdn_url": "https://martyx-model-photos.fra1.cdn.digitaloceanspaces.com/users/123/456/photo.jpg",
          "thumbnail_url": "https://martyx-model-photos.fra1.cdn.digitaloceanspaces.com/users/123/456/photo_thumb.jpg",
          "verification_status": "approved",
          "upload_date": "2024-01-20T14:15:00Z"
        }
      ],
      "can_upload": true,
      "max_photos": 10
    }
  ],
  "total_models": 5,
  "completed_models": 2
}
```

#### GET /api/user/level-info
Vráti aktuálny level a progress info

**Response:**
```json
{
  "current_level": 5,
  "completed_models_count": 5,
  "total_photos_uploaded": 12,
  "next_level_reward": {
    "level": 6,
    "item_name": "Zelené tričko",
    "item_type": "shirt",
    "item_image_url": "/items/green_shirt.png"
  }
}
```

#### POST /api/user/upload-model-photo
Upload fotky pre konkrétny model

**Content-Type:** `multipart/form-data`

**Body:**
```
order_id: 123
model_id: 456
photos: File[] (max 5 súborov)
```

**Response:**
```json
{
  "success": true,
  "uploaded_photos": [
    {
      "id": 789,
      "cdn_url": "https://martyx-model-photos.fra1.cdn.digitaloceanspaces.com/users/123/456/photo.jpg",
      "thumbnail_url": "https://martyx-model-photos.fra1.cdn.digitaloceanspaces.com/users/123/456/photo_thumb.jpg",
      "original_filename": "my_model.jpg"
    }
  ],
  "message": "Fotky boli úspešne uploadnuté",
  "errors": []
}
```

#### DELETE /api/user/delete-model-photo/{photo_id}
Zmaže fotku (len ak nie je approved)

**Response:**
```json
{
  "success": true,
  "message": "Fotka bola úspešne zmazaná"
}
```

#### GET /api/user/photo-upload-limits
Vráti limity pre upload

**Response:**
```json
{
  "max_file_size": 10485760,
  "allowed_types": ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  "max_photos_per_model": 10,
  "max_photos_per_day": 20
}
```

### Cassandra Customization

#### GET /api/user/cassandra-items
Vráti všetky odomknuté items pre usera

**Response:**
```json
{
  "items": [
    {
      "item_name": "Červená čiapka",
      "item_type": "hat",
      "level_unlocked": 1,
      "is_equipped": true,
      "unlocked_at": "2024-01-15T10:30:00Z"
    }
  ],
  "equipped_items": {
    "hat": "Červená čiapka",
    "shirt": null,
    "pants": null,
    "shoes": null,
    "accessory": null
  }
}
```

#### PUT /api/user/cassandra-equip
Equipne/unequipne item

**Body:**
```json
{
  "item_name": "Červená čiapka",
  "item_type": "hat"
}
```

**Response:**
```json
{
  "success": true,
  "equipped_items": {
    "hat": "Červená čiapka",
    "shirt": "Modré tričko",
    "pants": null,
    "shoes": null,
    "accessory": null
  }
}
```

#### GET /api/level-rewards
Vráti všetky dostupné rewards pre všetky levely

**Response:**
```json
{
  "rewards": [
    {
      "level": 1,
      "item_name": "Červená čiapka",
      "item_type": "hat",
      "item_image_url": "/items/red_hat.png",
      "rarity": "common"
    }
  ]
}
```

### Admin Endpoints

#### GET /api/admin/pending-photos
Zoznam fotiek čakajúcich na schválenie

**Query params:** `?page=1&limit=20&user_id=123`

**Response:**
```json
{
  "photos": [
    {
      "id": 789,
      "user_id": 123,
      "user_name": "John Doe",
      "model_name": "Ferrari F40",
      "cdn_url": "https://...",
      "thumbnail_url": "https://...",
      "upload_date": "2024-01-20T14:15:00Z",
      "file_size": 2048576
    }
  ],
  "total": 50,
  "page": 1,
  "pages": 3
}
```

#### PUT /api/admin/verify-photo/{photo_id}
Schváli/zamietne fotku

**Body:**
```json
{
  "status": "approved",
  "admin_notes": "Kvalitná fotka modelu"
}
```

**Response:**
```json
{
  "success": true,
  "level_up_occurred": true,
  "new_level": 6,
  "message": "Fotka schválená, user dosiahol nový level!"
}
```

#### POST /api/admin/bulk-verify-photos
Hromadné schvaľovanie

**Body:**
```json
{
  "photo_ids": [789, 790, 791],
  "status": "approved",
  "admin_notes": "Bulk approval"
}
```

## ☁️ Digital Ocean Spaces Konfigurácia

### Environment Variables
```env
DO_SPACES_KEY=your_access_key
DO_SPACES_SECRET=your_secret_key
DO_SPACES_ENDPOINT=fra1.digitaloceanspaces.com
DO_SPACES_BUCKET=martyx-model-photos
DO_SPACES_REGION=fra1
DO_SPACES_CDN_URL=https://martyx-model-photos.fra1.cdn.digitaloceanspaces.com
```

### File Organization
```
martyx-model-photos/
├── users/
│   └── {user_id}/
│       └── {model_id}/
│           ├── originals/
│           │   └── {timestamp}_{random}.jpg
│           └── thumbnails/
│               └── {timestamp}_{random}_thumb.jpg
```

### Upload Process
1. **Validácia súboru** (typ, veľkosť, počet)
2. **Generovanie unique filename** - `{user_id}/{model_id}/{timestamp}_{random}.{ext}`
3. **Upload do DO Spaces** - originál + thumbnail (ak obrázok)
4. **Uloženie metadata** do databázy
5. **Return CDN URLs**

## 🔒 Security & Validation

### File Validation
- **Allowed types**: jpg, jpeg, png, webp
- **Max file size**: 10MB per file
- **Max files per upload**: 5
- **Max files per model**: 10
- **Max uploads per day**: 20 per user

### Security Measures
- **Rate limiting**: 10 requests/minute per user
- **File scanning**: Basic malware check
- **Image validation**: Verify it's actually an image
- **User verification**: Only own models
- **CORS protection**: Frontend domain only

## 🎮 Level System Logic

### Level Up Process
```javascript
async function checkLevelUp(userId, photoId) {
  // 1. Mark photo as approved
  await updatePhotoStatus(photoId, 'approved');
  
  // 2. Check if this model is now "completed" for user
  const modelCompleted = await isModelFirstTimeCompleted(userId, modelId);
  
  if (modelCompleted) {
    // 3. Award level up
    const newLevel = await incrementUserLevel(userId);
    
    // 4. Unlock new item
    await unlockLevelReward(userId, newLevel);
    
    // 5. Send notification
    await sendLevelUpNotification(userId, newLevel);
    
    return { levelUp: true, newLevel };
  }
  
  return { levelUp: false };
}
```

### Level Rewards (Seed Data)
```sql
INSERT INTO level_rewards (level, item_name, item_type, item_image_url, rarity) VALUES
(1, 'Červená čiapka', 'hat', '/items/red_hat.png', 'common'),
(2, 'Modré tričko', 'shirt', '/items/blue_shirt.png', 'common'),
(3, 'Čierne nohavice', 'pants', '/items/black_pants.png', 'common'),
(4, 'Biele tenisky', 'shoes', '/items/white_sneakers.png', 'common'),
(5, 'Okuliare', 'accessory', '/items/glasses.png', 'common'),
(6, 'Zelené tričko', 'shirt', '/items/green_shirt.png', 'common'),
(7, 'Žltá čiapka', 'hat', '/items/yellow_hat.png', 'common'),
(8, 'Hnedé topánky', 'shoes', '/items/brown_shoes.png', 'common'),
(9, 'Hodinky', 'accessory', '/items/watch.png', 'rare'),
(10, 'Ruksak', 'accessory', '/items/backpack.png', 'rare'),
(11, 'Mechanická kombinéza', 'shirt', '/items/mechanic_suit.png', 'rare'),
(12, 'Pilotné okuliare', 'accessory', '/items/pilot_glasses.png', 'rare'),
(13, 'Námorná čiapka', 'hat', '/items/naval_hat.png', 'rare'),
(14, 'Staviteľská prilba', 'hat', '/items/hard_hat.png', 'rare'),
(15, 'Laboratórny plášť', 'shirt', '/items/lab_coat.png', 'epic'),
(16, 'Zlaté hodinky', 'accessory', '/items/gold_watch.png', 'epic'),
(17, 'Kožená bunda', 'shirt', '/items/leather_jacket.png', 'epic'),
(18, 'Špeciálne topánky', 'shoes', '/items/special_boots.png', 'epic'),
(19, 'Designer okuliare', 'accessory', '/items/designer_glasses.png', 'legendary'),
(20, 'Exkluzívna koruna', 'hat', '/items/crown.png', 'legendary');
```

## 📊 Analytics & Reporting

### GET /api/admin/upload-stats
Štatistiky uploadov

**Response:**
```json
{
  "total_photos": 1250,
  "pending_verification": 45,
  "approved_today": 23,
  "rejected_today": 2,
  "storage_used": "1.2 GB",
  "top_uploaders": [
    { "user_id": 123, "user_name": "John Doe", "count": 15 }
  ]
}
```

## 🔔 Notification System

### Events to notify
- Photo uploaded successfully
- Photo approved/rejected
- Level up achieved
- Storage quota warnings

### Notification channels
- In-app notifications
- Email notifications (optional)
- WebSocket real-time updates

## 🧪 Testing Requirements

### Unit Tests
- File upload validation
- DO Spaces integration
- Level up logic
- Security validations

### Integration Tests
- Complete upload flow
- Admin verification flow
- Error handling scenarios
- Rate limiting

### Load Tests
- Multiple concurrent uploads
- Large file handling
- CDN performance

## 🚀 Implementation Steps

### Phase 1: Database Setup
1. Create all required tables
2. Add indexes for performance
3. Insert seed data for level rewards
4. Test database connections

### Phase 2: Basic API Endpoints
1. Implement user collection endpoint
2. Implement level info endpoint
3. Basic authentication middleware
4. Error handling setup

### Phase 3: Photo Upload System
1. Digital Ocean Spaces setup
2. File upload endpoint with validation
3. Thumbnail generation
4. CDN URL generation

### Phase 4: Admin System
1. Admin verification endpoints
2. Bulk operations
3. Analytics dashboard
4. Admin authentication

### Phase 5: Level System Integration
1. Level up logic implementation
2. Item unlock system
3. Avatar generation (optional)
4. Notification system

### Phase 6: Testing & Optimization
1. Unit and integration tests
2. Performance optimization
3. Security audit
4. Load testing

## 📝 Error Codes

### Upload Errors
- `UPLOAD_001`: File too large
- `UPLOAD_002`: Invalid file type
- `UPLOAD_003`: Too many files
- `UPLOAD_004`: Daily limit exceeded
- `UPLOAD_005`: Model not found
- `UPLOAD_006`: Upload failed

### Verification Errors
- `VERIFY_001`: Photo not found
- `VERIFY_002`: Already verified
- `VERIFY_003`: Insufficient permissions

### Level System Errors
- `LEVEL_001`: Invalid level
- `LEVEL_002`: Item already unlocked
- `LEVEL_003`: Item not available

## 🔧 Configuration Examples

### Node.js/Express Example
```javascript
const multer = require('multer');
const AWS = require('aws-sdk');

// Digital Ocean Spaces config
const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET
});

// Multer config for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});
```

### Rate Limiting Example
```javascript
const rateLimit = require('express-rate-limit');

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many upload requests, please try again later'
});
```

## 📞 Support & Questions

Pre otázky ohľadom implementácie kontaktujte frontend team alebo vytvorte issue v projekte.

---

**Verzia dokumentu:** 1.0  
**Posledná aktualizácia:** 2024-10-02  
**Autor:** Frontend Development Team
