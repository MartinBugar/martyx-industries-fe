# 🚨 URGENT: Backend Implementation Required

## Problem
Frontend is getting **500 Internal Server Error** when trying to upload user photos.

**Error Details:**
- Endpoint: `POST http://localhost:8080/api/user-photos/upload`
- Status: `500 Internal Server Error`
- Message: `Invalid authentication` or similar

## Root Cause
The `/api/user-photos/upload` endpoint is **NOT IMPLEMENTED** on the backend.

## Required Implementation

### 1. Create the Upload Endpoint

**Endpoint:** `POST /api/user-photos/upload`

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Form Data:**
```
product_id: string (e.g., "ENDEAVOUR")
product_name: string (e.g., "Endeavour Space Shuttle")
order_id: string (e.g., "ORD-20251002125945-52688436")
photos: File[] (multiple files)
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Fotografie boli úspešne nahrané",
  "data": {
    "uploaded_count": 3,
    "photos": [
      {
        "id": 123,
        "original_filename": "model_photo_1.jpg",
        "cdn_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/1/ENDEAVOUR/1703123456789_model_photo_1.jpg",
        "verification_status": "pending",
        "upload_date": "2024-12-21T10:30:00Z"
      }
    ]
  }
}
```

### 2. Database Table

Create the `user_model_photos` table as specified in `BACKEND_USER_PHOTOS_INTEGRATION.md`.

### 3. Digital Ocean Spaces Integration

Set up file upload to Digital Ocean Spaces with the folder structure:
```
user-photos/{user_id}/{product_name}/{timestamp}_{filename}
```

## Quick Test Implementation

**Minimal working endpoint (Java Spring Boot):**

```java
@RestController
@RequestMapping("/api/user-photos")
public class UserPhotosController {
    
    @PostMapping("/upload")
    public ResponseEntity<?> uploadPhotos(
        @RequestParam("product_id") String productId,
        @RequestParam("product_name") String productName,
        @RequestParam("order_id") String orderId,
        @RequestParam("photos") MultipartFile[] photos,
        Authentication authentication
    ) {
        try {
            // Basic validation
            if (photos.length == 0) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "No files provided"));
            }
            
            // TODO: Implement actual file upload to Digital Ocean Spaces
            // TODO: Save metadata to database
            
            // Mock response for now
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Files uploaded successfully (MOCK)",
                "data", Map.of(
                    "uploaded_count", photos.length,
                    "photos", Arrays.stream(photos).map(file -> Map.of(
                        "id", System.currentTimeMillis(),
                        "original_filename", file.getOriginalFilename(),
                        "cdn_url", "https://mock-url.com/" + file.getOriginalFilename(),
                        "verification_status", "pending",
                        "upload_date", Instant.now().toString()
                    )).toArray()
                )
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "message", "Upload failed: " + e.getMessage()));
        }
    }
}
```

## Frontend Workaround

For **immediate testing**, add this to `.env` file:
```
VITE_MOCK_UPLOADS=true
```

This will enable mock mode in frontend until backend is implemented.

## Full Implementation Guide

See `BACKEND_USER_PHOTOS_INTEGRATION.md` for complete implementation details including:
- Database schema
- Digital Ocean Spaces setup
- Security considerations
- Error handling
- Testing procedures

## Priority: HIGH 🔥

This feature is blocking user photo uploads in the "Moja zbierka" section.

**Estimated implementation time:** 2-4 hours for basic version, 1-2 days for full implementation.
