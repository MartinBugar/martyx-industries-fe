# Backend Model Status Update Implementation

## Overview
This document outlines the required backend changes to support admin model status updates (Public/Private, Completed/In Progress) via toggle switches in the admin panel.

## Required Changes

### 1. New Endpoint

**URL:** `PUT /api/admin/gallery/users/{userId}/models/{productId}/status`

**Purpose:** Update model status (public/private, completed/in-progress) for a specific user's model

### 2. Request/Response DTOs

#### Request DTO
```java
package com.martyx.martyxindystriesbe.model.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminModelStatusUpdateRequest {
    private Boolean isPublic;
    private Boolean isCompleted;
    private String reason;
    private Boolean notifyUser = true;
}
```

#### Response DTO
```java
package com.martyx.martyxindystriesbe.model.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminModelStatusUpdateResponse {
    private boolean success;
    private String message;
}
```

### 3. Controller Implementation

```java
package com.martyx.martyxindystriesbe.controller.admin;

import com.martyx.martyxindystriesbe.model.dto.admin.AdminModelStatusUpdateRequest;
import com.martyx.martyxindystriesbe.model.dto.admin.AdminModelStatusUpdateResponse;
import com.martyx.martyxindystriesbe.service.AdminGalleryService;
import com.martyx.martyxindystriesbe.util.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/gallery")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGalleryController {
    
    private final AdminGalleryService adminGalleryService;
    
    public AdminGalleryController(AdminGalleryService adminGalleryService) {
        this.adminGalleryService = adminGalleryService;
    }
    
    @PutMapping("/users/{userId}/models/{productId}/status")
    public ResponseEntity<ApiResponse<AdminModelStatusUpdateResponse>> updateModelStatus(
            @PathVariable Long userId,
            @PathVariable String productId,
            @RequestBody AdminModelStatusUpdateRequest request,
            Authentication authentication) {
        
        try {
            // 1. Validate user exists
            User user = userService.findById(userId);
            if (user == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("User not found", "USER_NOT_FOUND"));
            }
            
            // 2. Validate product exists
            Product product = productService.findById(productId);
            if (product == null) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Product not found", "PRODUCT_NOT_FOUND"));
            }
            
            // 3. Update model status in database
            adminGalleryService.updateModelStatus(userId, productId, request);
            
            // 4. Notify user if requested
            if (request.getNotifyUser()) {
                notificationService.notifyUserModelStatusChanged(user, product, request);
            }
            
            // 5. Log admin action
            auditService.logAdminAction(authentication.getName(), 
                "UPDATE_MODEL_STATUS", userId, productId, request.getReason());
            
            return ResponseEntity.ok(ApiResponse.success(
                new AdminModelStatusUpdateResponse(true, "Model status updated successfully")
            ));
            
        } catch (Exception e) {
            log.error("Error updating model status for user {} product {}", userId, productId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Failed to update model status", "UPDATE_ERROR"));
        }
    }
}
```

### 4. Service Implementation

```java
package com.martyx.martyxindystriesbe.service;

import com.martyx.martyxindystriesbe.model.dto.admin.AdminModelStatusUpdateRequest;
import com.martyx.martyxindystriesbe.model.entity.UserModel;
import com.martyx.martyxindystriesbe.model.entity.UserPhoto;
import com.martyx.martyxindystriesbe.repository.UserModelRepository;
import com.martyx.martyxindystriesbe.repository.UserPhotoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AdminGalleryService {
    
    private final UserModelRepository userModelRepository;
    private final UserPhotoRepository userPhotoRepository;
    
    public AdminGalleryService(UserModelRepository userModelRepository, 
                              UserPhotoRepository userPhotoRepository) {
        this.userModelRepository = userModelRepository;
        this.userPhotoRepository = userPhotoRepository;
    }
    
    @Transactional
    public void updateModelStatus(Long userId, String productId, AdminModelStatusUpdateRequest request) {
        // 1. Update model status in user_models table
        UserModel userModel = userModelRepository.findByUserIdAndProductId(userId, productId);
        if (userModel == null) {
            throw new EntityNotFoundException("User model not found");
        }
        
        // 2. Update fields
        if (request.getIsPublic() != null) {
            userModel.setIsPublic(request.getIsPublic());
        }
        if (request.getIsCompleted() != null) {
            userModel.setIsCompleted(request.getIsCompleted());
        }
        
        userModel.setUpdatedAt(LocalDateTime.now());
        userModelRepository.save(userModel);
        
        // 3. Update all photos in this model to match the model status
        List<UserPhoto> photos = userPhotoRepository.findByUserIdAndProductId(userId, productId);
        for (UserPhoto photo : photos) {
            if (request.getIsPublic() != null) {
                photo.setPublic(request.getIsPublic());
            }
            photo.setUpdatedAt(LocalDateTime.now());
        }
        userPhotoRepository.saveAll(photos);
    }
}
```

### 5. Repository Methods

#### UserModelRepository
```java
package com.martyx.martyxindystriesbe.repository;

import com.martyx.martyxindystriesbe.model.entity.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserModelRepository extends JpaRepository<UserModel, Long> {
    Optional<UserModel> findByUserIdAndProductId(Long userId, String productId);
}
```

#### UserPhotoRepository
```java
package com.martyx.martyxindystriesbe.repository;

import com.martyx.martyxindystriesbe.model.entity.UserPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserPhotoRepository extends JpaRepository<UserPhoto, Long> {
    List<UserPhoto> findByUserIdAndProductId(Long userId, String productId);
}
```

### 6. Entity Updates

#### UserModel Entity
```java
package com.martyx.martyxindystriesbe.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_models")
@Data
public class UserModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "product_id")
    private String productId;
    
    @Column(name = "product_name")
    private String productName;
    
    @Column(name = "is_public")
    private Boolean isPublic = false;
    
    @Column(name = "is_completed")
    private Boolean isCompleted = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

#### UserPhoto Entity
```java
package com.martyx.martyxindystriesbe.model.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_photos")
@Data
public class UserPhoto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "product_id")
    private String productId;
    
    @Column(name = "public")
    private Boolean public = false;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // ... other existing fields ...
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### 7. Database Migration

```sql
-- Add columns to user_models table if they don't exist
ALTER TABLE user_models 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add columns to user_photos table if they don't exist
ALTER TABLE user_photos 
ADD COLUMN IF NOT EXISTS public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_models_user_product ON user_models(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_user_photos_user_product ON user_photos(user_id, product_id);
```

### 8. Security Configuration

Ensure the endpoint is properly secured in your security configuration:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/admin/gallery/**").hasRole("ADMIN")
                // ... other configurations
            );
        return http.build();
    }
}
```

### 9. Error Handling

Add proper error handling for common scenarios:

```java
@ControllerAdvice
public class AdminGalleryExceptionHandler {
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleEntityNotFound(EntityNotFoundException ex) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(ex.getMessage(), "ENTITY_NOT_FOUND"));
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(ex.getMessage(), "INVALID_ARGUMENT"));
    }
}
```

### 10. Testing

Create unit tests for the new functionality:

```java
@ExtendWith(MockitoExtension.class)
class AdminGalleryServiceTest {
    
    @Mock
    private UserModelRepository userModelRepository;
    
    @Mock
    private UserPhotoRepository userPhotoRepository;
    
    @InjectMocks
    private AdminGalleryService adminGalleryService;
    
    @Test
    void updateModelStatus_ShouldUpdateModelAndPhotos() {
        // Given
        Long userId = 1L;
        String productId = "1";
        AdminModelStatusUpdateRequest request = AdminModelStatusUpdateRequest.builder()
            .isPublic(true)
            .isCompleted(false)
            .reason("Admin update")
            .notifyUser(true)
            .build();
        
        UserModel userModel = new UserModel();
        userModel.setUserId(userId);
        userModel.setProductId(productId);
        
        List<UserPhoto> photos = Arrays.asList(new UserPhoto(), new UserPhoto());
        
        when(userModelRepository.findByUserIdAndProductId(userId, productId))
            .thenReturn(Optional.of(userModel));
        when(userPhotoRepository.findByUserIdAndProductId(userId, productId))
            .thenReturn(photos);
        
        // When
        adminGalleryService.updateModelStatus(userId, productId, request);
        
        // Then
        assertTrue(userModel.getIsPublic());
        assertFalse(userModel.getIsCompleted());
        verify(userModelRepository).save(userModel);
        verify(userPhotoRepository).saveAll(photos);
    }
}
```

## Implementation Checklist

- [ ] Create AdminModelStatusUpdateRequest DTO
- [ ] Create AdminModelStatusUpdateResponse DTO
- [ ] Add updateModelStatus endpoint to AdminGalleryController
- [ ] Implement updateModelStatus method in AdminGalleryService
- [ ] Add findByUserIdAndProductId method to UserModelRepository
- [ ] Add findByUserIdAndProductId method to UserPhotoRepository
- [ ] Update UserModel entity with new fields
- [ ] Update UserPhoto entity with new fields
- [ ] Create database migration script
- [ ] Add proper error handling
- [ ] Create unit tests
- [ ] Test the endpoint with Postman/curl
- [ ] Update API documentation

## API Usage Example

```bash
# Update model to public and completed
curl -X PUT "http://localhost:8080/api/admin/gallery/users/7/models/1/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "isPublic": true,
    "isCompleted": true,
    "reason": "Admin marked model as public and completed",
    "notifyUser": true
  }'
```

## Response Example

```json
{
  "success": true,
  "message": null,
  "data": {
    "success": true,
    "message": "Model status updated successfully"
  },
  "errorCode": null
}
```

This implementation provides a complete solution for admin model status updates with proper validation, error handling, and database consistency.
