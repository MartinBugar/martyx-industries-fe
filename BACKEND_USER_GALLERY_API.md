# Backend API - User Gallery Implementation

## 📋 Overview

This document specifies the backend API requirements for the **User Gallery** feature. The frontend is fully implemented and ready - it only needs these backend endpoints to function.

---

## 🎯 Feature Description

**User Gallery** zobrazuje verejné fotografie modelov od všetkých používateľov ktorí:
- Majú v "My Collection" aspoň jeden model
- K modelu majú priradené fotografie
- Majú označené `is_public = true` v `user_model_status`

---

## 🔐 Security Requirements

### Public Endpoints (No Auth Required)
- `GET /api/public-gallery` - Browse all public galleries
- `GET /api/public-gallery/:userId` - View specific user's public gallery

### Protected Endpoints (Auth Required)
- `POST /api/public-gallery/photos/:photoId/like` - Like a photo
- `DELETE /api/public-gallery/photos/:photoId/unlike` - Unlike a photo

**IMPORTANT:**
- Only show photos where `is_public = true` AND `verification_status = 'approved'`
- Never expose private user data (email, password, etc.)
- For likes: User must be authenticated

---

## 📡 API Endpoints

### 1. GET /api/public-gallery

**Description:** Get list of all users who have public photos

**Authentication:** NOT required (public endpoint)

**Query Parameters:**
```
?filter=all|completed        // all = všetky modely, completed = len is_completed=true
&sort=recent|most_photos|alphabetic|most_liked
&page=1
&limit=20
```

**Example Request:**
```bash
GET /api/public-gallery?filter=completed&sort=recent&page=1&limit=20
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "user_id": 123,
        "nickname": "SpaceBuilder42",
        "avatar_url": null,
        "total_public_models": 3,
        "total_public_photos": 15,
        "total_likes": 45,
        "latest_upload_date": "2024-12-21T10:30:00Z",
        "preview_photos": [
          {
            "thumbnail_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/123/ENDEAVOUR/thumbs/photo1.jpg",
            "product_name": "Endeavour Space Shuttle"
          },
          {
            "thumbnail_url": "https://...",
            "product_name": "ISS Model"
          }
        ]
      },
      {
        "user_id": 456,
        "nickname": "ModelMaster99",
        "avatar_url": "https://...",
        "total_public_models": 5,
        "total_public_photos": 28,
        "total_likes": 120,
        "latest_upload_date": "2024-12-20T15:20:00Z",
        "preview_photos": [...]
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_users": 87,
      "items_per_page": 20
    },
    "stats": {
      "total_users": 87,
      "total_public_models": 234,
      "total_public_photos": 1523
    }
  }
}
```

**SQL Implementation:**

```sql
-- Main query for users with public photos
WITH public_users AS (
  SELECT
    u.id as user_id,
    u.nickname,
    u.avatar_url,
    COUNT(DISTINCT ums.product_id) as total_public_models,
    COUNT(DISTINCT ump.id) as total_public_photos,
    COALESCE(SUM(l.likes_count), 0) as total_likes,
    MAX(ump.upload_date) as latest_upload_date
  FROM users u
  INNER JOIN user_model_status ums ON u.id = ums.user_id
  INNER JOIN user_model_photos ump ON ums.product_id = ump.product_id
                                   AND ums.user_id = ump.user_id
  LEFT JOIN (
    SELECT photo_id, COUNT(*) as likes_count
    FROM photo_likes
    GROUP BY photo_id
  ) l ON ump.id = l.photo_id
  WHERE ums.is_public = true
    AND ump.verification_status = 'approved'
    -- Filter parameter
    AND (? IS NULL OR ? = 'all' OR (? = 'completed' AND ums.is_completed = true))
  GROUP BY u.id, u.nickname, u.avatar_url
  -- Sorting
  ORDER BY
    CASE WHEN ? = 'recent' THEN MAX(ump.upload_date) END DESC,
    CASE WHEN ? = 'most_photos' THEN COUNT(ump.id) END DESC,
    CASE WHEN ? = 'most_liked' THEN COALESCE(SUM(l.likes_count), 0) END DESC,
    CASE WHEN ? = 'alphabetic' THEN u.nickname END ASC
  LIMIT ? OFFSET ?
)
SELECT * FROM public_users;

-- Query for preview photos (4 most recent per user)
SELECT
  ump.user_id,
  ump.thumbnail_url,
  ums.product_name
FROM user_model_photos ump
INNER JOIN user_model_status ums ON ump.user_id = ums.user_id
                                 AND ump.product_id = ums.product_id
WHERE ump.user_id IN (SELECT user_id FROM public_users)
  AND ums.is_public = true
  AND ump.verification_status = 'approved'
ORDER BY ump.user_id, ump.upload_date DESC
LIMIT 4 * (SELECT COUNT(*) FROM public_users);

-- Stats query
SELECT
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT ums.product_id) as total_public_models,
  COUNT(ump.id) as total_public_photos
FROM users u
INNER JOIN user_model_status ums ON u.id = ums.user_id
INNER JOIN user_model_photos ump ON ums.user_id = ump.user_id AND ums.product_id = ump.product_id
WHERE ums.is_public = true
  AND ump.verification_status = 'approved';
```

---

### 2. GET /api/public-gallery/:userId

**Description:** Get specific user's public gallery with all their public photos grouped by models

**Authentication:** NOT required (public endpoint)

**URL Parameters:**
- `userId` - User ID (integer)

**Example Request:**
```bash
GET /api/public-gallery/123
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "user_id": 123,
      "nickname": "SpaceBuilder42",
      "avatar_url": null,
      "member_since": "2024-01-15T10:00:00Z",
      "total_public_models": 3,
      "total_public_photos": 15,
      "total_likes": 45
    },
    "models": [
      {
        "product_id": "ENDEAVOUR",
        "product_name": "Endeavour Space Shuttle",
        "is_completed": true,
        "photo_count": 5,
        "photos": [
          {
            "id": 789,
            "thumbnail_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/123/ENDEAVOUR/thumbs/photo1.jpg",
            "cdn_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/123/ENDEAVOUR/photo1.jpg",
            "upload_date": "2024-12-21T10:30:00Z",
            "likes_count": 12,
            "is_liked_by_user": false,
            "comments_count": 0
          },
          {
            "id": 790,
            "thumbnail_url": "...",
            "cdn_url": "...",
            "upload_date": "2024-12-20T14:20:00Z",
            "likes_count": 8,
            "is_liked_by_user": true,
            "comments_count": 0
          }
        ]
      },
      {
        "product_id": "ISS",
        "product_name": "International Space Station",
        "is_completed": true,
        "photo_count": 10,
        "photos": [...]
      }
    ]
  }
}
```

**Response 404 (User Not Found):**
```json
{
  "success": false,
  "message": "User not found or has no public photos"
}
```

**SQL Implementation:**

```sql
-- User info query
SELECT
  u.id as user_id,
  u.nickname,
  u.avatar_url,
  u.created_at as member_since,
  COUNT(DISTINCT ums.product_id) as total_public_models,
  COUNT(DISTINCT ump.id) as total_public_photos,
  COALESCE(SUM(l.likes_count), 0) as total_likes
FROM users u
INNER JOIN user_model_status ums ON u.id = ums.user_id
INNER JOIN user_model_photos ump ON ums.user_id = ump.user_id
                                 AND ums.product_id = ump.product_id
LEFT JOIN (
  SELECT photo_id, COUNT(*) as likes_count
  FROM photo_likes
  GROUP BY photo_id
) l ON ump.id = l.photo_id
WHERE u.id = ?
  AND ums.is_public = true
  AND ump.verification_status = 'approved'
GROUP BY u.id, u.nickname, u.avatar_url, u.created_at;

-- Photos grouped by model query
SELECT
  ums.product_id,
  ums.product_name,
  ums.is_completed,
  COUNT(ump.id) as photo_count,
  ump.id as photo_id,
  ump.thumbnail_url,
  ump.cdn_url,
  ump.upload_date,
  COALESCE(l.likes_count, 0) as likes_count,
  CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as is_liked_by_user,
  0 as comments_count
FROM user_model_status ums
INNER JOIN user_model_photos ump ON ums.user_id = ump.user_id
                                 AND ums.product_id = ump.product_id
LEFT JOIN (
  SELECT photo_id, COUNT(*) as likes_count
  FROM photo_likes
  GROUP BY photo_id
) l ON ump.id = l.photo_id
LEFT JOIN photo_likes ul ON ump.id = ul.photo_id AND ul.user_id = ? -- Current authenticated user
WHERE ums.user_id = ?
  AND ums.is_public = true
  AND ump.verification_status = 'approved'
ORDER BY ums.product_name ASC, ump.upload_date DESC;
```

**Note:** Pre `is_liked_by_user`:
- Ak je request autentifikovaný (JWT token): použiť `user_id` z tokenu
- Ak NIE je autentifikovaný: vždy `false`

---

### 3. POST /api/public-gallery/photos/:photoId/like

**Description:** Like a photo (toggle like - ak už je liked, unlike; ak nie je, like)

**Authentication:** REQUIRED (JWT token)

**URL Parameters:**
- `photoId` - Photo ID (integer)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "photo_id": 789
}
```

**Example Request:**
```bash
POST /api/public-gallery/photos/789/like
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "photo_id": 789
}
```

**Success Response (200):**
```json
{
  "success": true,
  "likes_count": 13,
  "is_liked": true
}
```

**Response 401 (Unauthorized):**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**Response 404 (Photo Not Found):**
```json
{
  "success": false,
  "message": "Photo not found"
}
```

**SQL Implementation:**

```sql
-- Check if already liked
SELECT id FROM photo_likes
WHERE photo_id = ? AND user_id = ?;

-- If exists, DELETE (unlike)
DELETE FROM photo_likes
WHERE photo_id = ? AND user_id = ?;

-- If not exists, INSERT (like)
INSERT INTO photo_likes (photo_id, user_id, created_at)
VALUES (?, ?, NOW());

-- Return updated count
SELECT COUNT(*) as likes_count FROM photo_likes WHERE photo_id = ?;
```

---

### 4. DELETE /api/public-gallery/photos/:photoId/unlike

**Description:** Unlike a photo

**Authentication:** REQUIRED (JWT token)

**URL Parameters:**
- `photoId` - Photo ID (integer)

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Example Request:**
```bash
DELETE /api/public-gallery/photos/789/unlike
Authorization: Bearer eyJhbGc...
```

**Success Response (200):**
```json
{
  "success": true,
  "likes_count": 12,
  "is_liked": false
}
```

**SQL Implementation:**

```sql
-- Delete like
DELETE FROM photo_likes
WHERE photo_id = ? AND user_id = ?;

-- Return updated count
SELECT COUNT(*) as likes_count FROM photo_likes WHERE photo_id = ?;
```

---

## 🗄️ Database Schema

### New Table: `photo_likes`

```sql
CREATE TABLE photo_likes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  photo_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (photo_id) REFERENCES user_model_photos(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  UNIQUE KEY unique_user_photo_like (photo_id, user_id),
  INDEX idx_photo_id (photo_id),
  INDEX idx_user_id (user_id)
);
```

### Existing Tables (Reference)

Already exist in database:
- `users` (id, nickname, email, avatar_url, created_at)
- `user_model_status` (user_id, product_id, order_id, is_public, is_completed, product_name)
- `user_model_photos` (id, user_id, product_id, thumbnail_url, cdn_url, verification_status, upload_date)

---

## 🔍 Testing

### Test Case 1: Browse Public Gallery
```bash
curl -X GET "http://localhost:8080/api/public-gallery?filter=all&sort=recent&page=1&limit=10"
```

**Expected:** List of users with public photos

### Test Case 2: View Specific User Gallery
```bash
curl -X GET "http://localhost:8080/api/public-gallery/123"
```

**Expected:** User profile + their public models with photos

### Test Case 3: Like Photo (Authenticated)
```bash
curl -X POST "http://localhost:8080/api/public-gallery/photos/789/like" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"photo_id": 789}'
```

**Expected:** `{"success": true, "likes_count": 13, "is_liked": true}`

### Test Case 4: Like Photo (Unauthenticated - Should Fail)
```bash
curl -X POST "http://localhost:8080/api/public-gallery/photos/789/like"
```

**Expected:** `401 Unauthorized`

### Test Case 5: Unlike Photo
```bash
curl -X DELETE "http://localhost:8080/api/public-gallery/photos/789/unlike" \
  -H "Authorization: Bearer <token>"
```

**Expected:** `{"success": true, "likes_count": 12, "is_liked": false}`

---

## ✅ Implementation Checklist

### Database
- [ ] Create `photo_likes` table
- [ ] Add indexes for performance
- [ ] Test foreign key constraints

### Endpoints
- [ ] `GET /api/public-gallery` - List users with public galleries
- [ ] `GET /api/public-gallery/:userId` - Specific user gallery
- [ ] `POST /api/public-gallery/photos/:photoId/like` - Like photo
- [ ] `DELETE /api/public-gallery/photos/:photoId/unlike` - Unlike photo

### Security
- [ ] Public endpoints work without authentication
- [ ] Like/Unlike endpoints require JWT token
- [ ] Never expose private user data (email, etc.)
- [ ] Only show `is_public = true` and `approved` photos
- [ ] Validate `user_id` from JWT token for likes

### Testing
- [ ] Test all endpoints with real data
- [ ] Test pagination (page 1, 2, 3...)
- [ ] Test filters (all, completed)
- [ ] Test sorting (recent, most_photos, alphabetic, most_liked)
- [ ] Test like/unlike toggle
- [ ] Test unauthenticated like (should fail with 401)

### Performance
- [ ] Add database indexes on frequently queried fields
- [ ] Optimize queries with EXPLAIN
- [ ] Consider caching for stats

---

## 🚀 Future Features (Prepared)

### Comments System
Frontend is prepared for comments but not yet implemented. When ready:

**Endpoint:** `GET /api/public-gallery/photos/:photoId/comments`
**Endpoint:** `POST /api/public-gallery/photos/:photoId/comments`

Already included in response:
```json
{
  "comments_count": 0
}
```

---

## 📞 Contact

If you have questions or need clarification:
- Check frontend implementation in `src/pages/UserGallery/`
- Check types in `src/types/userGallery.ts`
- Check service in `src/services/userGalleryService.ts`

---

**Frontend Status:** ✅ READY (waiting for backend)
**Backend Status:** ⏳ TO BE IMPLEMENTED

---

## 📊 Example Frontend-Backend Flow

1. User opens `/gallery` → Frontend calls `GET /api/public-gallery?filter=all&sort=recent&page=1&limit=20`
2. Backend returns list of users with preview photos
3. User clicks on a user card → Navigate to `/gallery/123`
4. Frontend calls `GET /api/public-gallery/123`
5. Backend returns user profile + all their public models with photos
6. User clicks on photo → Opens lightbox
7. User clicks heart icon → Frontend calls `POST /api/public-gallery/photos/789/like`
8. Backend toggles like, returns new count
9. Frontend updates UI immediately

---

**Good luck implementing! 🚀**
