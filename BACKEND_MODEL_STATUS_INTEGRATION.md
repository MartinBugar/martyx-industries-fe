# Backend Integration - Model Status Toggles

## Overview
Implementácia prepínačov pre stav modelov v "Moja zbierka" - používateľ si môže nastaviť či je model dokončený a či má byť verejný v budúcej galérii.

## Database Changes

### 1. Nová tabuľka: `user_model_status`

```sql
CREATE TABLE user_model_status (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    order_id BIGINT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_user_product (user_id, product_id, order_id)
);
```

### 2. Indexy pre výkon

```sql
CREATE INDEX idx_user_model_status_user_id ON user_model_status(user_id);
CREATE INDEX idx_user_model_status_product_id ON user_model_status(product_id);
CREATE INDEX idx_user_model_status_public ON user_model_status(is_public);
CREATE INDEX idx_user_model_status_completed ON user_model_status(is_completed);
```

## API Endpoints

### 1. Update Model Status

**Endpoint:** `PATCH /api/user-models/{productId}/status`

**Headers:**
```
Authorization: Bearer {jwt-token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "is_completed": true,
  "is_public": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Model status updated successfully",
  "data": {
    "product_id": "123",
    "is_completed": true,
    "is_public": false,
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid/missing JWT token
- `403 Forbidden` - User doesn't own this product
- `404 Not Found` - Product not found in user's orders
- `400 Bad Request` - Invalid request body
- `500 Internal Server Error` - Database/server error

### 2. Get User Collection (Enhanced)

**Endpoint:** `GET /api/user-collection`

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "models": [
      {
        "order_id": "ORD-001",
        "order_number": "2024-001",
        "product_id": "123",
        "product_name": "Model XYZ",
        "purchase_date": "2024-01-10T00:00:00Z",
        "order_status": "completed",
        "quantity": 1,
        "price": 29.99,
        "currency": "EUR",
        "can_upload": true,
        "max_photos": 10,
        "is_completed": true,
        "is_public": false,
        "photos": [
          {
            "id": 1,
            "originalFilename": "model1.jpg",
            "fileName": "abc123.jpg",
            "fileSize": 1024000,
            "cdnUrl": "https://cdn.example.com/abc123.jpg",
            "thumbnailUrl": "https://cdn.example.com/thumb_abc123.jpg",
            "verificationStatus": "approved",
            "uploadDate": "2024-01-12T10:00:00Z",
            "productId": "123",
            "productName": "Model XYZ"
          }
        ]
      }
    ],
    "total_models": 5,
    "completed_models": 3
  }
}
```

## Backend Implementation

### 1. Controller Method

```java
@PatchMapping("/user-models/{productId}/status")
@PreAuthorize("hasRole('USER')")
public ResponseEntity<?> updateModelStatus(
    @PathVariable String productId,
    @RequestBody ModelStatusUpdateRequest request,
    Authentication authentication
) {
    try {
        Long userId = getUserIdFromAuth(authentication);
        
        // Validate that user owns this product
        if (!userOwnsProduct(userId, Long.parseLong(productId))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse("You don't own this product"));
        }
        
        // Update or create status record
        UserModelStatus status = userModelStatusService.updateStatus(
            userId, 
            Long.parseLong(productId), 
            request.getIsCompleted(), 
            request.getIsPublic()
        );
        
        return ResponseEntity.ok(new SuccessResponse(
            "Model status updated successfully", 
            status
        ));
        
    } catch (Exception e) {
        logger.error("Error updating model status", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("Failed to update model status"));
    }
}
```

### 2. Service Layer

```java
@Service
public class UserModelStatusService {
    
    @Autowired
    private UserModelStatusRepository repository;
    
    @Transactional
    public UserModelStatus updateStatus(Long userId, Long productId, Boolean isCompleted, Boolean isPublic) {
        // Find existing record or create new one
        UserModelStatus status = repository.findByUserIdAndProductId(userId, productId)
            .orElse(new UserModelStatus(userId, productId));
        
        // Update fields if provided
        if (isCompleted != null) {
            status.setIsCompleted(isCompleted);
        }
        
        if (isPublic != null) {
            status.setIsPublic(isPublic);
        }
        
        status.setUpdatedAt(Instant.now());
        
        return repository.save(status);
    }
    
    public Map<Long, UserModelStatus> getUserModelStatuses(Long userId, List<Long> productIds) {
        List<UserModelStatus> statuses = repository.findByUserIdAndProductIdIn(userId, productIds);
        
        return statuses.stream()
            .collect(Collectors.toMap(
                UserModelStatus::getProductId,
                status -> status
            ));
    }
}
```

### 3. Repository

```java
@Repository
public interface UserModelStatusRepository extends JpaRepository<UserModelStatus, Long> {
    
    Optional<UserModelStatus> findByUserIdAndProductId(Long userId, Long productId);
    
    List<UserModelStatus> findByUserIdAndProductIdIn(Long userId, List<Long> productIds);
    
    List<UserModelStatus> findByUserIdAndIsPublicTrue(Long userId);
    
    List<UserModelStatus> findByUserIdAndIsCompletedTrue(Long userId);
    
    @Query("SELECT COUNT(s) FROM UserModelStatus s WHERE s.userId = :userId AND s.isCompleted = true")
    Long countCompletedModelsByUserId(@Param("userId") Long userId);
}
```

### 4. Entity

```java
@Entity
@Table(name = "user_model_status")
public class UserModelStatus {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "product_id", nullable = false)
    private Long productId;
    
    @Column(name = "order_id", nullable = false)
    private Long orderId;
    
    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted = false;
    
    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = false;
    
    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
    
    // Constructors, getters, setters...
}
```

### 5. Request/Response DTOs

```java
public class ModelStatusUpdateRequest {
    private Boolean isCompleted;
    private Boolean isPublic;
    
    // Getters, setters, validation...
}

public class ModelStatusResponse {
    private String productId;
    private Boolean isCompleted;
    private Boolean isPublic;
    private Instant updatedAt;
    
    // Getters, setters...
}
```

## Security Considerations

1. **JWT Authentication** - Všetky endpointy vyžadujú platný JWT token
2. **Authorization** - Používateľ môže upravovať len svoje vlastné modely
3. **Input Validation** - Validácia všetkých vstupných parametrov
4. **Rate Limiting** - Obmedzenie počtu requestov na minútu
5. **Audit Logging** - Logovanie všetkých zmien stavu modelov

## Integration with Existing Collection Endpoint

Upraviť existujúci `/api/user-collection` endpoint aby zahŕňal `is_completed` a `is_public` polia:

```java
// V UserCollectionService
public UserCollectionResponse getUserCollection(Long userId) {
    // Existing logic to get orders and products...
    
    // Get model statuses
    List<Long> productIds = models.stream()
        .map(Model::getProductId)
        .collect(Collectors.toList());
    
    Map<Long, UserModelStatus> statuses = userModelStatusService
        .getUserModelStatuses(userId, productIds);
    
    // Enhance models with status information
    models.forEach(model -> {
        UserModelStatus status = statuses.get(model.getProductId());
        if (status != null) {
            model.setIsCompleted(status.getIsCompleted());
            model.setIsPublic(status.getIsPublic());
        } else {
            // Default values
            model.setIsCompleted(false);
            model.setIsPublic(false);
        }
    });
    
    return new UserCollectionResponse(models, totalModels, completedModels);
}
```

## Future Enhancements

1. **Public Gallery** - Použitie `is_public` flag pre budúcu verejnú galériu
2. **Statistics** - Tracking completion rates, popular models
3. **Notifications** - Upozornenia pri dokončení modelov
4. **Achievements** - Badges za dokončené modely
5. **Social Features** - Sharing dokončených modelov

## Testing

### Unit Tests
- Test updateModelStatus s rôznymi scenármi
- Test authorization checks
- Test validation logic

### Integration Tests  
- Test celého API flow
- Test database constraints
- Test error handling

### Frontend Tests
- Test toggle functionality
- Test loading states
- Test error handling
