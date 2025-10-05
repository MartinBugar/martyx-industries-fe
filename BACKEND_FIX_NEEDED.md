# 🔧 Backend Fix Pre All Photos Endpoint

## ❌ Problém

`AllPublicPhotosResponse` momentálne **CHÝBA** `stats` field, čo spôsobuje že frontend zobrazuje `0 Builders, 0 Models, 0 Photos`.

---

## ✅ Riešenie

Pridaj `stats` field do `AllPublicPhotosResponse`:

```java
package com.martyx.martyxindystriesbe.model.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AllPublicPhotosResponse {

    private List<PublicPhotoDto> photos;
    private PublicGalleryListResponse.PaginationDto pagination;
    private PublicGalleryListResponse.StatsDto stats;  // ← PRIDAJ TOTO!

    // Constructors
    public AllPublicPhotosResponse() {
    }

    public AllPublicPhotosResponse(List<PublicPhotoDto> photos,
                                   PublicGalleryListResponse.PaginationDto pagination,
                                   PublicGalleryListResponse.StatsDto stats) {  // ← PRIDAJ PARAMETER
        this.photos = photos;
        this.pagination = pagination;
        this.stats = stats;  // ← PRIDAJ TOTO
    }

    // Getters & Setters
    public List<PublicPhotoDto> getPhotos() {
        return photos;
    }

    public void setPhotos(List<PublicPhotoDto> photos) {
        this.photos = photos;
    }

    public PublicGalleryListResponse.PaginationDto getPagination() {
        return pagination;
    }

    public void setPagination(PublicGalleryListResponse.PaginationDto pagination) {
        this.pagination = pagination;
    }

    // ← PRIDAJ TOTO
    public PublicGalleryListResponse.StatsDto getStats() {
        return stats;
    }

    public void setStats(PublicGalleryListResponse.StatsDto stats) {
        this.stats = stats;
    }

    // ... PublicPhotoDto inner class zostáva rovnaká
}
```

---

## 📊 Ako získať Stats

V service metóde `getAllPublicPhotos()` spusti SQL query:

```java
public AllPublicPhotosResponse getAllPublicPhotos(String sort, int page, int limit, Long currentUserId) {

    // 1. Fetch photos (už máš implementované)
    List<PublicPhotoDto> photos = fetchPhotosWithUserInfo(sort, page, limit, currentUserId);

    // 2. Fetch pagination (už máš implementované)
    PaginationDto pagination = calculatePagination(page, limit);

    // 3. Fetch stats (PRIDAJ TOTO!)
    StatsDto stats = fetchGalleryStats();

    // 4. Return response
    return new AllPublicPhotosResponse(photos, pagination, stats);
}
```

---

## 🔍 SQL Query Pre Stats

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

**Výsledok:**
```java
StatsDto stats = new StatsDto();
stats.setTotalUsers(resultSet.getInt("totalUsers"));
        stats.setTotalPublicModels(resultSet.getInt("totalPublicModels"));
        stats.setTotalPublicPhotos(resultSet.getInt("totalPublicPhotos"));
```

---

## 📝 Kompletný Response Po Oprave

```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "photoId": 1,
        "thumbnailUrl": "https://...",
        "cdnUrl": "https://...",
        "uploadDate": "2024-12-21T10:30:00",
        "likesCount": 12,
        "isLikedByUser": false,
        "productId": "APOLLO11",
        "productName": "Apollo 11 Saturn V",
        "userId": 10,
        "username": "SpaceBuilder42"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalUsers": 87,
      "itemsPerPage": 20
    },
    "stats": {                    // ← TOTO CHÝBA!
      "totalUsers": 87,
      "totalPublicModels": 234,
      "totalPublicPhotos": 1523
    }
  }
}
```

---

## ✅ Checklist

- [ ] Pridaj `stats` field do `AllPublicPhotosResponse`
- [ ] Pridaj getter/setter pre `stats`
- [ ] Uprav constructor aby prijímal `stats`
- [ ] V service metóde zavolaj SQL query pre stats
- [ ] Vytvor `StatsDto` zo SQL výsledku
- [ ] Odovzdaj `stats` do `AllPublicPhotosResponse` constructora
- [ ] Otestuj endpoint - stats by mali byť v response

---

## 🧪 Test

```bash
curl -X GET "http://localhost:8080/api/public-gallery/all-photos?page=1&limit=10"
```

**Očakávaný response:**
```json
{
  "success": true,
  "data": {
    "photos": [...],
    "pagination": {...},
    "stats": {              // ← MUSÍ TU BYŤ!
      "totalUsers": 87,
      "totalPublicModels": 234,
      "totalPublicPhotos": 1523
    }
  }
}
```

---

**Frontend je pripravený a čaká na tento fix!** 🚀
