# Backend API - Admin Gallery Management

## 📋 Overview

This document specifies the backend API requirements for **Admin Gallery Management** feature. Admins need full control over user photos - view, delete, approve/reject, and manage photo metadata.

---

## 🔐 Security Requirements

### Admin Authentication Required
- All endpoints require admin authentication
- Admin role verification: `isAdmin: true` or `roles: ['ADMIN']`
- JWT token validation with admin privileges

### Authorization Levels
- **View**: Admin can view all user photos (public and private)
- **Delete**: Admin can delete any photo
- **Moderate**: Admin can approve/reject photos
- **Manage**: Admin can edit photo metadata

---

## 📡 API Endpoints

### 1. GET /api/admin/gallery/users

**Description:** Get list of all users who have uploaded photos (for admin gallery management)

**Authentication:** Admin required

**Query Parameters:**
```
?page=1
&limit=20
&sort=recent|most_photos|alphabetic|most_uploads
&filter=all|has_pending|has_rejected|has_approved
&search=user_email_or_name
```

**Example Request:**
```bash
GET /api/admin/gallery/users?page=1&limit=20&sort=recent&filter=all
Authorization: Bearer <admin_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": 7,
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "totalPhotos": 15,
        "publicPhotos": 12,
        "pendingPhotos": 2,
        "rejectedPhotos": 1,
        "lastUploadDate": "2024-01-15T10:30:00Z",
        "isActive": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 95,
      "hasNext": true,
      "hasPrev": false
    },
    "stats": {
      "totalUsers": 95,
      "totalPhotos": 1247,
      "pendingPhotos": 23,
      "rejectedPhotos": 8,
      "approvedPhotos": 1216
    }
  }
}
```

---

### 2. GET /api/admin/gallery/users/{userId}/photos

**Description:** Get all photos for a specific user (admin view - includes private photos)

**Authentication:** Admin required

**Query Parameters:**
```
?page=1
&limit=20
&sort=recent|oldest|product_name|verification_status
&filter=all|pending|approved|rejected|public|private
&productId=123 (optional - filter by specific product)
```

**Example Request:**
```bash
GET /api/admin/gallery/users/7/photos?page=1&limit=20&sort=recent&filter=all
Authorization: Bearer <admin_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": 7,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "photos": [
      {
        "id": 123,
        "productId": "456",
        "productName": "Tank Model",
        "fileName": "1727025678_tank_photo.jpg",
        "originalFilename": "tank_photo.jpg",
        "mimeType": "image/jpeg",
        "fileSize": 245760,
        "url": "https://mi-gallery.fra1.digitaloceanspaces.com/PRODUCT456/1727025678_tank_photo.jpg",
        "cdnUrl": "https://mi-gallery.fra1.digitaloceanspaces.com/PRODUCT456/1727025678_tank_photo.jpg",
        "thumbnailUrl": "https://mi-gallery.fra1.digitaloceanspaces.com/PRODUCT456/thumb_1727025678_tank_photo.jpg",
        "verificationStatus": "approved",
        "isPublic": true,
        "uploadDate": "2024-01-15T10:30:00Z",
        "likesCount": 5,
        "commentsCount": 2,
        "order": 1,
        "folderName": "PRODUCT456",
        "adminNotes": "Great build quality",
        "moderatedBy": "admin@example.com",
        "moderatedAt": "2024-01-15T11:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalPhotos": 45,
      "hasNext": true,
      "hasPrev": false
    },
    "stats": {
      "totalPhotos": 45,
      "publicPhotos": 40,
      "privatePhotos": 5,
      "pendingPhotos": 2,
      "approvedPhotos": 40,
      "rejectedPhotos": 3
    }
  }
}
```

---

### 3. DELETE /api/admin/gallery/photos/{photoId}

**Description:** Delete a photo (admin only)

**Authentication:** Admin required

**Request Body:**
```json
{
  "reason": "Inappropriate content",
  "notifyUser": true,
  "adminNotes": "Photo contained inappropriate content"
}
```

**Example Request:**
```bash
DELETE /api/admin/gallery/photos/123
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "reason": "Inappropriate content",
  "notifyUser": true,
  "adminNotes": "Photo contained inappropriate content"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Photo deleted successfully",
  "data": {
    "photoId": 123,
    "deletedAt": "2024-01-15T12:00:00Z",
    "deletedBy": "admin@example.com",
    "reason": "Inappropriate content",
    "userNotified": true
  }
}
```

---

### 4. PUT /api/admin/gallery/photos/{photoId}/moderate

**Description:** Approve or reject a photo

**Authentication:** Admin required

**Request Body:**
```json
{
  "action": "approve|reject",
  "adminNotes": "Great build quality, approved",
  "notifyUser": true
}
```

**Example Request:**
```bash
PUT /api/admin/gallery/photos/123/moderate
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "action": "approve",
  "adminNotes": "Great build quality, approved",
  "notifyUser": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Photo approved successfully",
  "data": {
    "photoId": 123,
    "verificationStatus": "approved",
    "moderatedBy": "admin@example.com",
    "moderatedAt": "2024-01-15T12:00:00Z",
    "adminNotes": "Great build quality, approved",
    "userNotified": true
  }
}
```

---

### 5. PUT /api/admin/gallery/photos/{photoId}

**Description:** Update photo metadata (admin only)

**Authentication:** Admin required

**Request Body:**
```json
{
  "isPublic": true,
  "adminNotes": "Updated admin notes",
  "order": 2
}
```

**Example Request:**
```bash
PUT /api/admin/gallery/photos/123
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "isPublic": true,
  "adminNotes": "Updated admin notes",
  "order": 2
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Photo updated successfully",
  "data": {
    "photoId": 123,
    "isPublic": true,
    "adminNotes": "Updated admin notes",
    "order": 2,
    "updatedAt": "2024-01-15T12:00:00Z",
    "updatedBy": "admin@example.com"
  }
}
```

---

### 6. GET /api/admin/gallery/photos/pending

**Description:** Get all pending photos for moderation

**Authentication:** Admin required

**Query Parameters:**
```
?page=1
&limit=20
&sort=upload_date|user_name|product_name
&userId=7 (optional - filter by specific user)
```

**Example Request:**
```bash
GET /api/admin/gallery/photos/pending?page=1&limit=20&sort=upload_date
Authorization: Bearer <admin_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "id": 124,
        "userId": 7,
        "userEmail": "user@example.com",
        "userName": "John Doe",
        "productId": "456",
        "productName": "Tank Model",
        "fileName": "1727025678_tank_photo2.jpg",
        "originalFilename": "tank_photo2.jpg",
        "url": "https://mi-gallery.fra1.digitaloceanspaces.com/PRODUCT456/1727025678_tank_photo2.jpg",
        "thumbnailUrl": "https://mi-gallery.fra1.digitaloceanspaces.com/PRODUCT456/thumb_1727025678_tank_photo2.jpg",
        "uploadDate": "2024-01-15T10:30:00Z",
        "verificationStatus": "pending",
        "isPublic": false
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalPhotos": 23,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### 7. POST /api/admin/gallery/photos/{photoId}/bulk-action

**Description:** Perform bulk actions on multiple photos

**Authentication:** Admin required

**Request Body:**
```json
{
  "action": "approve|reject|delete|make_public|make_private",
  "photoIds": [123, 124, 125],
  "reason": "Bulk approval",
  "adminNotes": "All photos approved in bulk",
  "notifyUsers": true
}
```

**Example Request:**
```bash
POST /api/admin/gallery/photos/bulk-action
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "action": "approve",
  "photoIds": [123, 124, 125],
  "reason": "Bulk approval",
  "adminNotes": "All photos approved in bulk",
  "notifyUsers": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Bulk action completed",
  "data": {
    "action": "approve",
    "processedPhotos": 3,
    "successfulPhotos": 3,
    "failedPhotos": 0,
    "results": [
      {
        "photoId": 123,
        "success": true,
        "message": "Photo approved"
      },
      {
        "photoId": 124,
        "success": true,
        "message": "Photo approved"
      },
      {
        "photoId": 125,
        "success": true,
        "message": "Photo approved"
      }
    ],
    "processedAt": "2024-01-15T12:00:00Z",
    "processedBy": "admin@example.com"
  }
}
```

---

## 🗄️ Database Schema Updates

### New Tables

#### 1. admin_photo_actions
```sql
CREATE TABLE admin_photo_actions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    photo_id BIGINT NOT NULL,
    admin_id BIGINT NOT NULL,
    action_type ENUM('approve', 'reject', 'delete', 'update', 'bulk_action') NOT NULL,
    reason VARCHAR(500),
    admin_notes TEXT,
    user_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES gallery_images(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_photo_id (photo_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
);
```

#### 2. photo_moderation_queue
```sql
CREATE TABLE photo_moderation_queue (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    photo_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
    flagged_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (photo_id) REFERENCES gallery_images(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_photo (photo_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
```

### Updated Tables

#### 1. gallery_images (add admin fields)
```sql
ALTER TABLE gallery_images 
ADD COLUMN admin_notes TEXT,
ADD COLUMN moderated_by BIGINT,
ADD COLUMN moderated_at TIMESTAMP NULL,
ADD COLUMN verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
ADD COLUMN is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
ADD INDEX idx_verification_status (verification_status),
ADD INDEX idx_is_public (is_public),
ADD INDEX idx_moderated_by (moderated_by),
ADD FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL;
```

---

## 🎯 Controller Implementation

### AdminGalleryController.java

```java
@RestController
@RequestMapping("/api/admin/gallery")
@PreAuthorize("hasRole('ADMIN')")
@Validated
public class AdminGalleryController {

    @Autowired
    private AdminGalleryService adminGalleryService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<AdminUserGalleryListResponse>> getUsersWithPhotos(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(defaultValue = "all") String filter,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        
        AdminUserGalleryListRequest request = AdminUserGalleryListRequest.builder()
            .page(page)
            .limit(limit)
            .sort(sort)
            .filter(filter)
            .search(search)
            .build();
            
        AdminUserGalleryListResponse response = adminGalleryService.getUsersWithPhotos(request, authentication);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/users/{userId}/photos")
    public ResponseEntity<ApiResponse<AdminUserPhotosResponse>> getUserPhotos(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(defaultValue = "all") String filter,
            @RequestParam(required = false) String productId,
            Authentication authentication) {
        
        AdminUserPhotosRequest request = AdminUserPhotosRequest.builder()
            .userId(userId)
            .page(page)
            .limit(limit)
            .sort(sort)
            .filter(filter)
            .productId(productId)
            .build();
            
        AdminUserPhotosResponse response = adminGalleryService.getUserPhotos(request, authentication);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/photos/{photoId}")
    public ResponseEntity<ApiResponse<AdminPhotoDeleteResponse>> deletePhoto(
            @PathVariable Long photoId,
            @RequestBody @Valid AdminPhotoDeleteRequest request,
            Authentication authentication) {
        
        AdminPhotoDeleteResponse response = adminGalleryService.deletePhoto(photoId, request, authentication);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/photos/{photoId}/moderate")
    public ResponseEntity<ApiResponse<AdminPhotoModerateResponse>> moderatePhoto(
            @PathVariable Long photoId,
            @RequestBody @Valid AdminPhotoModerateRequest request,
            Authentication authentication) {
        
        AdminPhotoModerateResponse response = adminGalleryService.moderatePhoto(photoId, request, authentication);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/photos/{photoId}")
    public ResponseEntity<ApiResponse<AdminPhotoUpdateResponse>> updatePhoto(
            @PathVariable Long photoId,
            @RequestBody @Valid AdminPhotoUpdateRequest request,
            Authentication authentication) {
        
        AdminPhotoUpdateResponse response = adminGalleryService.updatePhoto(photoId, request, authentication);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/photos/pending")
    public ResponseEntity<ApiResponse<AdminPendingPhotosResponse>> getPendingPhotos(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "upload_date") String sort,
            @RequestParam(required = false) Long userId,
            Authentication authentication) {
        
        AdminPendingPhotosRequest request = AdminPendingPhotosRequest.builder()
            .page(page)
            .limit(limit)
            .sort(sort)
            .userId(userId)
            .build();
            
        AdminPendingPhotosResponse response = adminGalleryService.getPendingPhotos(request, authentication);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/photos/bulk-action")
    public ResponseEntity<ApiResponse<AdminBulkActionResponse>> bulkAction(
            @RequestBody @Valid AdminBulkActionRequest request,
            Authentication authentication) {
        
        AdminBulkActionResponse response = adminGalleryService.performBulkAction(request, authentication);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

---

## 📝 Request/Response DTOs

### Request DTOs

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserGalleryListRequest {
    private int page;
    private int limit;
    private String sort;
    private String filter;
    private String search;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserPhotosRequest {
    private Long userId;
    private int page;
    private int limit;
    private String sort;
    private String filter;
    private String productId;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPhotoDeleteRequest {
    @NotBlank(message = "Reason is required")
    private String reason;
    
    private boolean notifyUser = true;
    
    private String adminNotes;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPhotoModerateRequest {
    @NotBlank(message = "Action is required")
    @Pattern(regexp = "approve|reject", message = "Action must be 'approve' or 'reject'")
    private String action;
    
    private String adminNotes;
    
    private boolean notifyUser = true;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPhotoUpdateRequest {
    private Boolean isPublic;
    private String adminNotes;
    private Integer order;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPendingPhotosRequest {
    private int page;
    private int limit;
    private String sort;
    private Long userId;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBulkActionRequest {
    @NotBlank(message = "Action is required")
    @Pattern(regexp = "approve|reject|delete|make_public|make_private", 
             message = "Invalid action")
    private String action;
    
    @NotEmpty(message = "Photo IDs are required")
    private List<Long> photoIds;
    
    private String reason;
    private String adminNotes;
    private boolean notifyUsers = true;
}
```

### Response DTOs

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserGalleryListResponse {
    private List<AdminUserSummary> users;
    private PaginationInfo pagination;
    private AdminGalleryStats stats;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserSummary {
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private int totalPhotos;
    private int publicPhotos;
    private int pendingPhotos;
    private int rejectedPhotos;
    private LocalDateTime lastUploadDate;
    private boolean isActive;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserPhotosResponse {
    private AdminUserInfo user;
    private List<AdminPhotoInfo> photos;
    private PaginationInfo pagination;
    private AdminUserPhotoStats stats;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPhotoInfo {
    private Long id;
    private String productId;
    private String productName;
    private String fileName;
    private String originalFilename;
    private String mimeType;
    private Long fileSize;
    private String url;
    private String cdnUrl;
    private String thumbnailUrl;
    private String verificationStatus;
    private boolean isPublic;
    private LocalDateTime uploadDate;
    private int likesCount;
    private int commentsCount;
    private Integer order;
    private String folderName;
    private String adminNotes;
    private String moderatedBy;
    private LocalDateTime moderatedAt;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPhotoDeleteResponse {
    private Long photoId;
    private LocalDateTime deletedAt;
    private String deletedBy;
    private String reason;
    private boolean userNotified;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPhotoModerateResponse {
    private Long photoId;
    private String verificationStatus;
    private String moderatedBy;
    private LocalDateTime moderatedAt;
    private String adminNotes;
    private boolean userNotified;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminPhotoUpdateResponse {
    private Long photoId;
    private Boolean isPublic;
    private String adminNotes;
    private Integer order;
    private LocalDateTime updatedAt;
    private String updatedBy;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminBulkActionResponse {
    private String action;
    private int processedPhotos;
    private int successfulPhotos;
    private int failedPhotos;
    private List<BulkActionResult> results;
    private LocalDateTime processedAt;
    private String processedBy;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkActionResult {
    private Long photoId;
    private boolean success;
    private String message;
}
```

---

## 🔧 Service Implementation

### AdminGalleryService.java

```java
@Service
@Transactional
public class AdminGalleryService {

    @Autowired
    private GalleryImageRepository galleryImageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AdminPhotoActionRepository adminPhotoActionRepository;
    
    @Autowired
    private PhotoModerationQueueRepository photoModerationQueueRepository;
    
    @Autowired
    private DigitalOceanSpacesService digitalOceanSpacesService;
    
    @Autowired
    private NotificationService notificationService;

    public AdminUserGalleryListResponse getUsersWithPhotos(AdminUserGalleryListRequest request, Authentication authentication) {
        // Implementation for getting users with photos
        // Include pagination, sorting, filtering, and search
    }

    public AdminUserPhotosResponse getUserPhotos(AdminUserPhotosRequest request, Authentication authentication) {
        // Implementation for getting user photos
        // Include all photos (public and private) for admin view
    }

    public AdminPhotoDeleteResponse deletePhoto(Long photoId, AdminPhotoDeleteRequest request, Authentication authentication) {
        // Implementation for deleting photo
        // 1. Delete from DigitalOcean Spaces
        // 2. Delete from database
        // 3. Log admin action
        // 4. Notify user if requested
    }

    public AdminPhotoModerateResponse moderatePhoto(Long photoId, AdminPhotoModerateRequest request, Authentication authentication) {
        // Implementation for moderating photo
        // 1. Update verification status
        // 2. Log admin action
        // 3. Update moderation queue
        // 4. Notify user if requested
    }

    public AdminPhotoUpdateResponse updatePhoto(Long photoId, AdminPhotoUpdateRequest request, Authentication authentication) {
        // Implementation for updating photo metadata
        // 1. Update photo fields
        // 2. Log admin action
    }

    public AdminPendingPhotosResponse getPendingPhotos(AdminPendingPhotosRequest request, Authentication authentication) {
        // Implementation for getting pending photos
        // Include user information and photo details
    }

    public AdminBulkActionResponse performBulkAction(AdminBulkActionRequest request, Authentication authentication) {
        // Implementation for bulk actions
        // Process multiple photos in transaction
        // Handle partial failures gracefully
    }
}
```

---

## 📧 Notification System

### Email Notifications

```java
@Service
public class PhotoModerationNotificationService {

    public void notifyPhotoApproved(Long photoId, String userEmail, String adminNotes) {
        // Send email notification about photo approval
    }

    public void notifyPhotoRejected(Long photoId, String userEmail, String reason, String adminNotes) {
        // Send email notification about photo rejection
    }

    public void notifyPhotoDeleted(Long photoId, String userEmail, String reason, String adminNotes) {
        // Send email notification about photo deletion
    }
}
```

---

## 🚀 Implementation Priority

### Phase 1: Core Admin Functions
1. **GET /api/admin/gallery/users** - List users with photos
2. **GET /api/admin/gallery/users/{userId}/photos** - Get user photos
3. **DELETE /api/admin/gallery/photos/{photoId}** - Delete photo
4. **PUT /api/admin/gallery/photos/{photoId}/moderate** - Approve/reject photo

### Phase 2: Advanced Features
1. **PUT /api/admin/gallery/photos/{photoId}** - Update photo metadata
2. **GET /api/admin/gallery/photos/pending** - Pending photos queue
3. **POST /api/admin/gallery/photos/bulk-action** - Bulk actions

### Phase 3: Analytics & Reporting
1. Admin dashboard with photo statistics
2. Moderation queue management
3. User notification system
4. Audit trail for all admin actions

---

## ✅ Testing Requirements

### Unit Tests
- Service layer methods
- Repository queries
- Validation logic
- Error handling

### Integration Tests
- API endpoints
- Database operations
- File system operations
- Authentication/authorization

### Security Tests
- Admin role verification
- Input validation
- SQL injection prevention
- File upload security

---

This specification provides a complete foundation for implementing admin gallery management functionality with proper security, error handling, and user experience considerations.
