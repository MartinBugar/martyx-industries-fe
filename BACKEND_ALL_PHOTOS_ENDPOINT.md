# Backend Endpoint: GET /api/public-gallery/all-photos

## 📋 Popis
Tento endpoint vracia **všetky verejné fotky od všetkých užívateľov** v jednom zozname (nie zoskupené podľa užívateľov). Používa sa na "All Photos" view v galerii.

---

## 🔌 Endpoint
```
GET /api/public-gallery/all-photos
```

## 🔐 Autentifikácia
- **Optional** - endpoint funguje aj bez prihlásenia
- Ak je poskytnutý JWT token → `is_liked_by_user` ukazuje či aktuálny user dal like
- Ak NIE je token → `is_liked_by_user` je vždy `false`

---

## 📥 Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sort` | String | No | `recent` | `recent` alebo `most_liked` |
| `page` | Integer | No | `1` | Číslo stránky |
| `limit` | Integer | No | `20` | Počet fotiek na stránku |

**Example Request:**
```bash
GET /api/public-gallery/all-photos?sort=recent&page=1&limit=20
```

---

## 📤 Response Format

### Success Response (200 OK)

**DÔLEŽITÉ:** Response musí obsahovať **camelCase** field names (nie snake_case), pretože frontend ich transformuje.

```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "id": 789,
        "thumbnailUrl": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/123/ENDEAVOUR/thumbs/photo1.jpg",
        "cdnUrl": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/123/ENDEAVOUR/photo1.jpg",
        "uploadDate": "2024-12-21T10:30:00Z",
        "likesCount": 12,
        "isLikedByUser": false,
        "commentsCount": 0,
        "userId": 123,
        "nickname": "SpaceBuilder42",
        "userAvatarUrl": null,
        "productName": "Endeavour Space Shuttle"
      },
      {
        "id": 790,
        "thumbnailUrl": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/456/ISS/thumbs/photo2.jpg",
        "cdnUrl": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/456/ISS/photo2.jpg",
        "uploadDate": "2024-12-20T15:20:00Z",
        "likesCount": 8,
        "isLikedByUser": true,
        "commentsCount": 0,
        "userId": 456,
        "nickname": "ModelMaster99",
        "userAvatarUrl": "https://example.com/avatar.jpg",
        "productName": "International Space Station"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalPhotos": 193,
      "itemsPerPage": 20
    },
    "stats": {
      "totalUsers": 87,
      "totalPublicModels": 234,
      "totalPublicPhotos": 1523
    }
  }
}
```

---

## 🗂️ Response DTO Structure

### AllPublicPhotosResponse
```java
public class AllPublicPhotosResponse {
    private List<PublicPhotoDto> photos;
    private PaginationDto pagination;
    private StatsDto stats;  // ← MUSÍŠ PRIDAŤ!
}
```

**POZOR:** Backend DTO má len `photos` a `pagination`. **MUSÍŠ PRIDAŤ** `stats` field!

### PublicPhotoDto (už existuje v backenде)
```java
public class PublicPhotoDto {
    private Long photoId;               // ← Photo ID (nie "id"!)
    private String thumbnailUrl;        // Thumbnail URL (malý obrázok)
    private String cdnUrl;              // Full-size image URL
    private LocalDateTime uploadDate;   // Upload date
    private Long likesCount;            // Počet likes
    private Boolean isLikedByUser;      // true/false - či aktuálny user dal like

    // User info
    private Long userId;                // ID užívateľa
    private String username;            // ← USERNAME užívateľa (nie "nickname"!)

    // Product info
    private String productId;           // Product ID
    private String productName;         // Názov modelu
}
```

**DÔLEŽITÉ ZMENY:**
- Backend používa `photoId` nie `id`
- Backend používa `username` nie `nickname`
- Frontend to vie spracovať (service transformuje správne)

### PhotosPaginationDTO
```java
public class PhotosPaginationDTO {
    private Integer currentPage;
    private Integer totalPages;
    private Integer totalPhotos;        // POZOR: nie totalUsers, ale totalPhotos
    private Integer itemsPerPage;
}
```

### GalleryStatsDTO
```java
public class GalleryStatsDTO {
    private Integer totalUsers;
    private Integer totalPublicModels;
    private Integer totalPublicPhotos;
}
```

---

## 🔍 SQL Query Implementation

### Main Query - Fetch Photos

```sql
SELECT
  ump.id,
  ump.thumbnail_url AS thumbnailUrl,
  ump.cdn_url AS cdnUrl,
  ump.upload_date AS uploadDate,
  COALESCE(l.likes_count, 0) AS likesCount,
  CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END AS isLikedByUser,
  0 AS commentsCount,
  u.id AS userId,
  u.nickname,
  u.avatar_url AS userAvatarUrl,
  ums.product_name AS productName
FROM user_model_photos ump
INNER JOIN user_model_status ums
  ON ump.user_id = ums.user_id
  AND ump.product_id = ums.product_id
INNER JOIN users u
  ON ump.user_id = u.id
LEFT JOIN (
  SELECT photo_id, COUNT(*) AS likes_count
  FROM photo_likes
  GROUP BY photo_id
) l ON ump.id = l.photo_id
LEFT JOIN photo_likes ul
  ON ump.id = ul.photo_id
  AND ul.user_id = :currentUserId  -- NULL if not authenticated
WHERE ums.is_public = true
  AND ump.verification_status = 'approved'
ORDER BY
  CASE WHEN :sort = 'recent' THEN ump.upload_date END DESC,
  CASE WHEN :sort = 'most_liked' THEN COALESCE(l.likes_count, 0) END DESC
LIMIT :limit OFFSET :offset;
```

**Parameters:**
- `:currentUserId` - ID aktuálneho usera (alebo `NULL` ak nie je prihlásený)
- `:sort` - `"recent"` alebo `"most_liked"`
- `:limit` - počet fotiek na stránku (default 20)
- `:offset` - `(page - 1) * limit`

---

### Count Query - Total Photos

```sql
SELECT COUNT(*) AS totalPhotos
FROM user_model_photos ump
INNER JOIN user_model_status ums
  ON ump.user_id = ums.user_id
  AND ump.product_id = ums.product_id
WHERE ums.is_public = true
  AND ump.verification_status = 'approved';
```

---

### Stats Query - Gallery Statistics

```sql
SELECT
  COUNT(DISTINCT u.id) AS totalUsers,
  COUNT(DISTINCT ums.product_id) AS totalPublicModels,
  COUNT(ump.id) AS totalPublicPhotos
FROM users u
INNER JOIN user_model_status ums ON u.id = ums.user_id
INNER JOIN user_model_photos ump
  ON ums.user_id = ump.user_id
  AND ums.product_id = ump.product_id
WHERE ums.is_public = true
  AND ump.verification_status = 'approved';
```

---

## ⚠️ KRITICKÉ BODY

### 1. Field Naming - MUSÍ byť camelCase
❌ **ZLE:**
```json
{
  "thumbnail_url": "...",
  "user_id": 123
}
```

✅ **SPRÁVNE:**
```json
{
  "thumbnailUrl": "...",
  "userId": 123
}
```

### 2. User Info - Musí obsahovať `nickname`
Každá fotka MUSÍ obsahovať informácie o užívateľovi:
```json
{
  "userId": 123,
  "nickname": "SpaceBuilder42",    // ← TOTO JE DÔLEŽITÉ!
  "userAvatarUrl": null
}
```

Frontend transformuje `nickname` → `username` pre zobrazenie.

### 3. Pagination - `totalPhotos` nie `totalUsers`
❌ **ZLE:**
```json
"pagination": {
  "totalUsers": 100  // ← ZLE, toto sú fotky nie useri
}
```

✅ **SPRÁVNE:**
```json
"pagination": {
  "totalPhotos": 193  // ← Celkový počet fotiek
}
```

### 4. Authentication je Optional
```java
@GetMapping("/all-photos")
public ResponseEntity<ApiResponse<AllPublicPhotosResponse>> getAllPublicPhotos(
    @RequestParam(defaultValue = "recent") String sort,
    @RequestParam(defaultValue = "1") int page,
    @RequestParam(defaultValue = "20") int limit,
    @AuthenticationPrincipal UserDetailsImpl currentUser  // Môže byť NULL!
) {
    Long currentUserId = currentUser != null ? currentUser.getId() : null;
    // ... continue
}
```

### 5. Sorting
- `sort=recent` → ORDER BY `upload_date DESC` (najnovšie fotky prvé)
- `sort=most_liked` → ORDER BY `likes_count DESC` (najviac lajkované prvé)

---

## ✅ Testing Checklist

### Test 1: Unauthenticated Request
```bash
curl -X GET "http://localhost:8080/api/public-gallery/all-photos?sort=recent&page=1&limit=10"
```

**Expected:**
- Status: 200 OK
- `photos` array nie je prázdny
- Každá fotka má `nickname` field
- Všetky `isLikedByUser` sú `false`

### Test 2: Authenticated Request
```bash
curl -X GET "http://localhost:8080/api/public-gallery/all-photos?sort=recent&page=1&limit=10" \
  -H "Authorization: Bearer <valid_jwt_token>"
```

**Expected:**
- Status: 200 OK
- `isLikedByUser` je `true` pre fotky ktoré user lajkol
- `isLikedByUser` je `false` pre fotky ktoré user nelajkol

### Test 3: Sorting by Likes
```bash
curl -X GET "http://localhost:8080/api/public-gallery/all-photos?sort=most_liked&page=1&limit=10"
```

**Expected:**
- Fotky sú zoradené podľa `likesCount` (najvyššie prvé)

### Test 4: Pagination
```bash
curl -X GET "http://localhost:8080/api/public-gallery/all-photos?page=2&limit=5"
```

**Expected:**
- Vráti fotky 6-10 (druhá stránka)
- `pagination.currentPage` = 2
- `pagination.itemsPerPage` = 5

---

## 🐛 Common Errors to Avoid

### Error 1: Missing user info
```json
// ❌ ZLE - chýba nickname
{
  "id": 789,
  "cdnUrl": "...",
  "userId": 123
  // nickname chýba!
}
```

### Error 2: Wrong field names (snake_case)
```json
// ❌ ZLE - snake_case namiesto camelCase
{
  "cdn_url": "...",
  "user_id": 123,
  "likes_count": 12
}
```

### Error 3: Null handling
```java
// ❌ ZLE - NullPointerException keď user nie je prihlásený
Long currentUserId = currentUser.getId();

// ✅ SPRÁVNE
Long currentUserId = currentUser != null ? currentUser.getId() : null;
```

---

## 📊 Example Response (Complete)

```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "id": 1,
        "thumbnailUrl": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/10/APOLLO11/thumbs/img1.jpg",
        "cdnUrl": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/10/APOLLO11/img1.jpg",
        "uploadDate": "2024-12-21T10:30:00Z",
        "likesCount": 15,
        "isLikedByUser": false,
        "commentsCount": 0,
        "userId": 10,
        "nickname": "SpaceExplorer",
        "userAvatarUrl": null,
        "productName": "Apollo 11 Saturn V"
      },
      {
        "id": 2,
        "thumbnailUrl": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/15/ISS/thumbs/img1.jpg",
        "cdnUrl": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/15/ISS/img1.jpg",
        "uploadDate": "2024-12-20T15:20:00Z",
        "likesCount": 8,
        "isLikedByUser": true,
        "commentsCount": 0,
        "userId": 15,
        "nickname": "ISSBuilder",
        "userAvatarUrl": "https://example.com/avatar.jpg",
        "productName": "International Space Station"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalPhotos": 193,
      "itemsPerPage": 20
    },
    "stats": {
      "totalUsers": 87,
      "totalPublicModels": 234,
      "totalPublicPhotos": 1523
    }
  }
}
```

---

## 🚀 Quick Implementation Guide

1. **Create DTOs** (see structure above)
2. **Implement Service Method:**
   ```java
   public AllPublicPhotosResponse getAllPublicPhotos(String sort, int page, int limit, Long currentUserId)
   ```
3. **Execute 3 SQL queries:**
   - Main query (photos with user info)
   - Count query (total photos)
   - Stats query (gallery statistics)
4. **Map results to DTOs** using camelCase field names
5. **Return response** wrapped in `ApiResponse.success()`

---

## 📝 Summary

**Čo endpoint vracia:**
- Zoznam VŠETKÝCH verejných fotiek od VŠETKÝCH užívateľov
- Každá fotka obsahuje info o užívateľovi (userId, nickname, avatar)
- Každá fotka obsahuje info o modeli (productName)
- Podporuje sorting (recent/most_liked) a pagination
- Optional authentication pre `isLikedByUser` field

**KĽÚČOVÉ FIELDY:**
- `nickname` - meno užívateľa (MUST have!)
- `thumbnailUrl` + `cdnUrl` - odkazy na obrázky
- `isLikedByUser` - či user dal like (false ak nie je prihlásený)
- `userId` - ID užívateľa pre link na jeho profil

---

Ak máš otázky, skontroluj kompletný `BACKEND_USER_GALLERY_API.md` pre viac detailov.
