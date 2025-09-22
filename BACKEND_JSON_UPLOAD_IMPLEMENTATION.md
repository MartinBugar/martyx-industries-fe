# 🚀 Backend Metadata-Only Implementation

## Frontend-First Upload Approach

### **Process Flow:**
1. **Frontend uploads image directly to DigitalOcean Spaces**
2. **Frontend sends only metadata to backend database**

### **Endpoint:** `POST /api/products/{productId}/gallery/metadata`

### **Request Body (JSON):**
```json
{
  "fileName": "1734567890_image1.jpg",
  "originalName": "image1.jpg", 
  "mimeType": "image/jpeg",
  "fileSize": 2048576,
  "order": 0,
  "folderName": "1",
  "url": "https://mi-gallery.fra1.digitaloceanspaces.com/1/1734567890_image1.jpg",
  "cdnUrl": "https://mi-gallery.fra1.digitaloceanspaces.com/1/1734567890_image1.jpg"
}
```

### **Response (JSON):**
```json
{
  "success": true,
  "image": {
    "id": "uuid-here",
    "productId": "1",
    "fileName": "1734567890_image1.jpg",
    "originalName": "image1.jpg",
    "mimeType": "image/jpeg",
    "size": 2048576,
    "url": "https://mi-gallery.fra1.digitaloceanspaces.com/1/1734567890_image1.jpg",
    "cdnUrl": "https://mi-gallery.fra1.digitaloceanspaces.com/1/1734567890_image1.jpg",
    "order": 0,
    "folderName": "1",
    "createdAt": "2025-09-22T18:00:00Z"
  },
  "cdnUrl": "https://mi-gallery.fra1.digitaloceanspaces.com/1/1734567890_image1.jpg",
  "message": null
}
```

## Backend Controller Implementation

```java
@RestController
@RequestMapping("/api/products")
public class ProductGalleryController {

    @PostMapping("/{productId}/gallery/metadata")
    public ResponseEntity<GalleryUploadResponse> saveImageMetadata(
            @PathVariable String productId,
            @RequestBody ImageMetadataRequest request) {
        
        log.info("Saving metadata for product: {}, file: {}, url: {}", 
            productId, request.getFileName(), request.getUrl());
        
        try {
            // Validate request
            if (request.getUrl() == null || request.getUrl().isEmpty()) {
                return ResponseEntity.badRequest().body(
                    new GalleryUploadResponse(false, null, null, "Image URL is required")
                );
            }

            if (!isValidImageType(request.getMimeType())) {
                return ResponseEntity.badRequest().body(
                    new GalleryUploadResponse(false, null, null, "Invalid image type")
                );
            }

            Long productIdLong = Long.parseLong(productId);
            
            // Call service to save metadata only
            GalleryUploadResponse response = galleryService.saveImageMetadata(productIdLong, request);
            
            if (response.isSuccess()) {
                log.info("Successfully saved metadata for product: {}", productId);
                return ResponseEntity.ok(response);
            } else {
                log.warn("Metadata save failed for product {}: {}", productId, response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (NumberFormatException e) {
            log.error("Invalid product ID format: {}", productId, e);
            return ResponseEntity.badRequest().body(
                new GalleryUploadResponse(false, null, null, "Invalid product ID format")
            );
        } catch (Exception e) {
            log.error("Error saving metadata for product {}: {}", productId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new GalleryUploadResponse(false, null, null, "Internal server error")
            );
        }
    }
    
    private boolean isValidImageType(String mimeType) {
        return mimeType != null && (
            mimeType.equals("image/jpeg") ||
            mimeType.equals("image/png") ||
            mimeType.equals("image/webp") ||
            mimeType.equals("image/gif")
        );
    }
}
```

## Request DTO

```java
public class UploadImageJsonRequest {
    private String fileName;
    private String originalName;
    private String mimeType;
    private long fileSize;
    private String fileData; // base64
    private Integer order;
    private String folderName;
    
    // Getters and setters...
}
```

## Service Implementation

```java
@Service
public class GalleryService {
    
    public GalleryUploadResponse uploadImageFromJson(Long productId, UploadImageJsonRequest request) {
        try {
            log.info("Processing JSON upload for product: {}", productId);
            
            // 1. Decode base64 to bytes
            byte[] imageBytes = Base64.getDecoder().decode(request.getFileData());
            log.info("Decoded image size: {} bytes", imageBytes.length);
            
            // 2. Upload to DigitalOcean Spaces
            String spacesUrl = uploadBytesToSpaces(
                request.getFolderName(), 
                request.getFileName(), 
                imageBytes, 
                request.getMimeType()
            );
            log.info("Uploaded to Spaces: {}", spacesUrl);
            
            // 3. Save metadata to database
            GalleryImage savedImage = saveImageMetadata(
                productId,
                request.getFileName(),
                request.getOriginalName(),
                request.getMimeType(),
                request.getFileSize(),
                spacesUrl,
                request.getOrder(),
                request.getFolderName()
            );
            log.info("Saved metadata to database: {}", savedImage.getId());
            
            return new GalleryUploadResponse(true, savedImage, spacesUrl, null);
            
        } catch (Exception e) {
            log.error("JSON upload failed: ", e);
            return new GalleryUploadResponse(false, null, null, e.getMessage());
        }
    }
    
    private String uploadBytesToSpaces(String folderName, String fileName, 
                                     byte[] imageBytes, String mimeType) {
        // Upload bytes to DigitalOcean Spaces
        // Return public URL
        String key = folderName + "/" + fileName;
        // ... DigitalOcean Spaces upload logic ...
        return "https://mi-gallery.fra1.digitaloceanspaces.com/" + key;
    }
    
    private GalleryImage saveImageMetadata(Long productId, String fileName, 
                                         String originalName, String mimeType, 
                                         long fileSize, String url, Integer order, 
                                         String folderName) {
        // Save to product_gallery table
        GalleryImage image = new GalleryImage();
        image.setId(UUID.randomUUID().toString());
        image.setProductId(productId.toString());
        image.setFileName(fileName);
        image.setOriginalName(originalName);
        image.setMimeType(mimeType);
        image.setSize(fileSize);
        image.setUrl(url);
        image.setCdnUrl(url);
        image.setOrder(order != null ? order : 0);
        image.setFolderName(folderName);
        image.setCreatedAt(Timestamp.from(Instant.now()));
        
        return galleryRepository.save(image);
    }
}
```

## Key Benefits of JSON Approach:

1. **✅ No multipart issues** - simple JSON request
2. **✅ Easy debugging** - can log full request
3. **✅ Same functionality** - upload to Spaces + save metadata to DB
4. **✅ Better error handling** - clear JSON error responses
5. **✅ Flexible** - can add more metadata fields easily

## Migration Steps:

1. **Add new endpoint** `/{productId}/gallery/upload-json`
2. **Keep old endpoint** for backward compatibility  
3. **Test JSON endpoint** with frontend
4. **Remove old endpoint** when confirmed working

This approach separates concerns clearly:
- **Frontend**: Converts file to base64, sends JSON
- **Backend**: Decodes base64, uploads to Spaces, saves metadata to DB
