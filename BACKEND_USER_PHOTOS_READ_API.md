# Backend API - User Photos Reading Implementation

## Prehľad

Tento dokument špecifikuje presné požiadavky na backend implementáciu pre čítanie fotografií používateľov. Frontend očakáva konkrétne API endpointy a formát dát pre zobrazenie fotografií v galérii.

## 🔒 Bezpečnosť

**KRITICKÉ:** Používateľ môže vidieť **LEN SVOJE VLASTNÉ** fotografie. Backend musí overiť vlastníctvo fotografií cez JWT token.

## API Endpointy

### 1. Získanie fotografií pre konkrétny produkt

**Endpoint:** `GET /api/user-photos/{product_id}`

#### Request

**URL Parametre:**
- `product_id` - ID produktu (napr. "ENDEAVOUR", "1", "TANK_MODEL")

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Príklad URL:**
```
GET /api/user-photos/ENDEAVOUR
GET /api/user-photos/1
```

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "product_id": "ENDEAVOUR",
    "product_name": "Endeavour Space Shuttle",
    "total_photos": 3,
    "photos": [
      {
        "id": 123,
        "original_filename": "model_photo_1.jpg",
        "file_name": "1_ENDEAVOUR_1703123456789_model_photo_1.jpg",
        "file_size": 2048576,
        "mime_type": "image/jpeg",
        "cdn_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/1/ENDEAVOUR/1703123456789_model_photo_1.jpg",
        "thumbnail_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/1/ENDEAVOUR/thumbs/1703123456789_model_photo_1.jpg",
        "verification_status": "approved",
        "upload_date": "2024-12-21T10:30:00Z"
      },
      {
        "id": 124,
        "original_filename": "assembled_model.png",
        "file_name": "1_ENDEAVOUR_1703123456790_assembled_model.png",
        "file_size": 1536000,
        "mime_type": "image/png",
        "cdn_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/1/ENDEAVOUR/1703123456790_assembled_model.png",
        "thumbnail_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/1/ENDEAVOUR/thumbs/1703123456790_assembled_model.png",
        "verification_status": "pending",
        "upload_date": "2024-12-21T11:15:00Z"
      }
    ]
  }
}
```

#### Response No Photos (200)

Ak používateľ nemá žiadne fotografie pre daný produkt:

```json
{
  "success": true,
  "data": {
    "product_id": "ENDEAVOUR",
    "product_name": "Endeavour Space Shuttle",
    "total_photos": 0,
    "photos": []
  }
}
```

#### Response Error (404)

Ak produkt neexistuje alebo používateľ ho nevlastní:

```json
{
  "success": false,
  "message": "Product not found or not owned by user"
}
```

#### Response Error (401)

Ak JWT token je neplatný:

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### 2. Získanie všetkých fotografií používateľa

**Endpoint:** `GET /api/user-photos`

#### Request

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Query Parameters (voliteľné):**
```
?page=1&limit=20&status=approved&product_id=ENDEAVOUR
```

- `page` - Číslo stránky (default: 1)
- `limit` - Počet položiek na stránku (default: 20, max: 100)
- `status` - Filter podľa statusu: `pending`, `approved`, `rejected`
- `product_id` - Filter podľa produktu

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "id": 123,
        "product_id": "ENDEAVOUR",
        "product_name": "Endeavour Space Shuttle",
        "original_filename": "model_photo_1.jpg",
        "file_name": "1_ENDEAVOUR_1703123456789_model_photo_1.jpg",
        "file_size": 2048576,
        "mime_type": "image/jpeg",
        "cdn_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/1/ENDEAVOUR/1703123456789_model_photo_1.jpg",
        "thumbnail_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/1/ENDEAVOUR/thumbs/1703123456789_model_photo_1.jpg",
        "verification_status": "approved",
        "upload_date": "2024-12-21T10:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_items": 25,
      "items_per_page": 20,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

## Databázové dotazy

### SQL Query pre konkrétny produkt

```sql
SELECT 
    id,
    product_id,
    product_name,
    original_filename,
    file_name,
    file_size,
    mime_type,
    cdn_url,
    thumbnail_url,
    verification_status,
    upload_date
FROM user_model_photos 
WHERE user_id = ? 
  AND product_id = ?
ORDER BY upload_date DESC;
```

### SQL Query pre všetky fotografie používateľa

```sql
SELECT 
    id,
    product_id,
    product_name,
    original_filename,
    file_name,
    file_size,
    mime_type,
    cdn_url,
    thumbnail_url,
    verification_status,
    upload_date
FROM user_model_photos 
WHERE user_id = ?
  AND (? IS NULL OR verification_status = ?)  -- status filter
  AND (? IS NULL OR product_id = ?)           -- product_id filter
ORDER BY upload_date DESC
LIMIT ? OFFSET ?;
```

## Java Implementation

### Controller

```java
@RestController
@RequestMapping("/api/user-photos")
public class UserPhotosController {

    @Autowired
    private UserPhotosService userPhotosService;

    @GetMapping("/{productId}")
    public ResponseEntity<?> getPhotosByProduct(
        @PathVariable String productId,
        Authentication authentication
    ) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            
            List<UserModelPhoto> photos = userPhotosService.getPhotosByUserAndProduct(userId, productId);
            
            // Get product name (you might need to fetch this from products table)
            String productName = getProductName(productId);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "data", Map.of(
                    "product_id", productId,
                    "product_name", productName,
                    "total_photos", photos.size(),
                    "photos", photos.stream().map(this::mapToPhotoResponse).toList()
                )
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Failed to load photos: " + e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllUserPhotos(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String product_id,
        Authentication authentication
    ) {
        try {
            Long userId = getUserIdFromAuth(authentication);
            
            // Validate limit
            if (limit > 100) limit = 100;
            
            PageRequest pageRequest = PageRequest.of(page - 1, limit);
            Page<UserModelPhoto> photosPage = userPhotosService.getUserPhotos(
                userId, status, product_id, pageRequest
            );
            
            Map<String, Object> response = Map.of(
                "success", true,
                "data", Map.of(
                    "photos", photosPage.getContent().stream().map(this::mapToPhotoResponse).toList(),
                    "pagination", Map.of(
                        "current_page", page,
                        "total_pages", photosPage.getTotalPages(),
                        "total_items", photosPage.getTotalElements(),
                        "items_per_page", limit,
                        "has_next", photosPage.hasNext(),
                        "has_prev", photosPage.hasPrevious()
                    )
                )
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Failed to load photos: " + e.getMessage()
            ));
        }
    }

    private Map<String, Object> mapToPhotoResponse(UserModelPhoto photo) {
        return Map.of(
            "id", photo.getId(),
            "product_id", photo.getProductId(),
            "product_name", photo.getProductName(),
            "original_filename", photo.getOriginalFilename(),
            "file_name", photo.getFileName(),
            "file_size", photo.getFileSize(),
            "mime_type", photo.getMimeType(),
            "cdn_url", photo.getCdnUrl(),
            "thumbnail_url", photo.getThumbnailUrl(),
            "verification_status", photo.getVerificationStatus(),
            "upload_date", photo.getUploadDate().toString()
        );
    }

    private Long getUserIdFromAuth(Authentication authentication) {
        // Extract user ID from JWT token
        // Implementation depends on your JWT structure
        return ((UserPrincipal) authentication.getPrincipal()).getId();
    }
    
    private String getProductName(String productId) {
        // Fetch product name from products table or return productId as fallback
        return productId; // Simplified - implement proper product lookup
    }
}
```

### Service Layer

```java
@Service
public class UserPhotosService {

    @Autowired
    private UserModelPhotosRepository repository;

    public List<UserModelPhoto> getPhotosByUserAndProduct(Long userId, String productId) {
        return repository.findByUserIdAndProductIdOrderByUploadDateDesc(userId, productId);
    }

    public Page<UserModelPhoto> getUserPhotos(Long userId, String status, String productId, Pageable pageable) {
        if (status != null && productId != null) {
            return repository.findByUserIdAndVerificationStatusAndProductIdOrderByUploadDateDesc(
                userId, status, productId, pageable
            );
        } else if (status != null) {
            return repository.findByUserIdAndVerificationStatusOrderByUploadDateDesc(
                userId, status, pageable
            );
        } else if (productId != null) {
            return repository.findByUserIdAndProductIdOrderByUploadDateDesc(
                userId, productId, pageable
            );
        } else {
            return repository.findByUserIdOrderByUploadDateDesc(userId, pageable);
        }
    }
}
```

### Repository

```java
@Repository
public interface UserModelPhotosRepository extends JpaRepository<UserModelPhoto, Long> {
    
    List<UserModelPhoto> findByUserIdAndProductIdOrderByUploadDateDesc(Long userId, String productId);
    
    Page<UserModelPhoto> findByUserIdOrderByUploadDateDesc(Long userId, Pageable pageable);
    
    Page<UserModelPhoto> findByUserIdAndVerificationStatusOrderByUploadDateDesc(
        Long userId, String status, Pageable pageable
    );
    
    Page<UserModelPhoto> findByUserIdAndProductIdOrderByUploadDateDesc(
        Long userId, String productId, Pageable pageable
    );
    
    Page<UserModelPhoto> findByUserIdAndVerificationStatusAndProductIdOrderByUploadDateDesc(
        Long userId, String status, String productId, Pageable pageable
    );
}
```

## Frontend Integration

Frontend volá tieto endpointy takto:

```typescript
// Load photos for specific product
const response = await fetch(`/api/user-photos/${productId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
const photos = data.data?.photos || [];
```

## Bezpečnostné požiadavky

### 1. Autentifikácia
- Všetky endpointy vyžadujú platný JWT token
- Token musí obsahovať `user_id`

### 2. Autorizácia
- Používateľ môže vidieť LEN svoje fotografie
- Filter `WHERE user_id = ?` je POVINNÝ v každom dotaze

### 3. Validácia
- Validovať `product_id` parameter
- Sanitizovať všetky vstupy
- Obmedziť `limit` parameter (max 100)

## Error Handling

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (user doesn't own the photos)
- `404` - Not Found (product doesn't exist)
- `500` - Internal Server Error

## Testing

### Test Cases

1. **Úspešné načítanie fotografií**
   ```bash
   curl -H "Authorization: Bearer <token>" \
        http://localhost:8080/api/user-photos/ENDEAVOUR
   ```

2. **Prázdny výsledok (žiadne fotografie)**
   ```bash
   curl -H "Authorization: Bearer <token>" \
        http://localhost:8080/api/user-photos/NONEXISTENT
   ```

3. **Neautorizovaný prístup**
   ```bash
   curl http://localhost:8080/api/user-photos/ENDEAVOUR
   # Should return 401
   ```

4. **Paginácia**
   ```bash
   curl -H "Authorization: Bearer <token>" \
        "http://localhost:8080/api/user-photos?page=1&limit=10"
   ```

## Deployment Checklist

- [ ] Database table `user_model_photos` exists
- [ ] JWT authentication configured
- [ ] User ID extraction from JWT implemented
- [ ] Repository methods implemented
- [ ] Service layer implemented
- [ ] Controller endpoints implemented
- [ ] Error handling implemented
- [ ] Security validation implemented
- [ ] API tested with real data
- [ ] CORS configured if needed

## Mock Implementation

Pre rýchle testovanie bez databázy:

```java
@GetMapping("/{productId}")
public ResponseEntity<?> getPhotosByProduct(@PathVariable String productId) {
    // Mock response
    return ResponseEntity.ok(Map.of(
        "success", true,
        "data", Map.of(
            "product_id", productId,
            "product_name", "Mock Product",
            "total_photos", 0,
            "photos", List.of()
        )
    ));
}
```
