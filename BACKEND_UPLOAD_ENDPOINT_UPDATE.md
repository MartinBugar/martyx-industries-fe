# Backend Endpoint Update - Gallery Upload

## 🎯 **Zmeň existujúci `/upload` endpoint**

### **Pred zmenou:**
```java
@PostMapping(value = "/upload", consumes = "multipart/form-data")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<GalleryUploadResponse> uploadImage(
        @PathVariable String productId,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "order", required = false) Integer order) {
    
    // ... implementácia s MultipartFile
}
```

### **Po zmene:**
```java
@PostMapping(value = "/upload", consumes = "application/json")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<GalleryUploadResponse> uploadImage(
        @PathVariable String productId,
        @Valid @RequestBody UploadImageJsonRequest request) {
    
    log.info("Uploading image for product: {}, file: {}, order: {}", 
        productId, request.getOriginalName(), request.getOrder());

    try {
        Long productIdLong = Long.parseLong(productId);
        
        // Validácie
        if (!request.isValidImageType()) {
            return ResponseEntity.badRequest().body(
                new GalleryUploadResponse(false, null, null, "Invalid image type")
            );
        }

        if (!request.isValidFileSize()) {
            return ResponseEntity.badRequest().body(
                new GalleryUploadResponse(false, null, null, "Invalid file size")
            );
        }

        if (!request.hasValidFileData()) {
            return ResponseEntity.badRequest().body(
                new GalleryUploadResponse(false, null, null, "Missing or invalid file data")
            );
        }
        
        // Volaj service metódu pre JSON upload
        GalleryUploadResponse response = galleryService.uploadImageFromJson(productIdLong, request);
        
        if (response.isSuccess()) {
            log.info("Successfully uploaded image for product: {}", productId);
            return ResponseEntity.ok(response);
        } else {
            log.warn("Upload failed for product {}: {}", productId, response.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
        
    } catch (NumberFormatException e) {
        log.error("Invalid product ID format: {}", productId, e);
        return ResponseEntity.badRequest().body(
            new GalleryUploadResponse(false, null, null, "Invalid product ID format")
        );
    } catch (Exception e) {
        log.error("Error uploading image for product {}: {}", productId, e.getMessage(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            new GalleryUploadResponse(false, null, null, "Internal server error")
        );
    }
}
```

## 📋 **UploadImageJsonRequest trieda musí mať:**

```java
public class UploadImageJsonRequest {
    @NotBlank
    private String fileName;
    
    @NotBlank
    private String originalName;
    
    @NotBlank
    private String mimeType;
    
    @Min(1)
    private Long fileSize;
    
    private Integer order = 0;
    
    @NotBlank
    private String folderName;
    
    @NotBlank
    private String fileData; // Base64 encoded image data
    
    // Getters, setters, validačné metódy...
    
    public boolean isValidImageType() {
        return mimeType != null && (
            mimeType.equals("image/jpeg") || 
            mimeType.equals("image/jpg") || 
            mimeType.equals("image/png") || 
            mimeType.equals("image/webp") || 
            mimeType.equals("image/gif")
        );
    }
    
    public boolean isValidFileSize() {
        return fileSize != null && fileSize > 0 && fileSize <= 10 * 1024 * 1024; // 10MB max
    }
    
    public boolean hasValidFileData() {
        return fileData != null && !fileData.trim().isEmpty();
    }
}
```

## 🔧 **Service metóda `uploadImageFromJson`:**

```java
public GalleryUploadResponse uploadImageFromJson(Long productId, UploadImageJsonRequest request) {
    try {
        // 1. Dekóduj base64 na byte array
        byte[] imageBytes = Base64.getDecoder().decode(request.getFileData());
        
        // 2. Vytvor InputStream z byte array
        InputStream imageStream = new ByteArrayInputStream(imageBytes);
        
        // 3. Upload do DigitalOcean Spaces
        String spacesUrl = uploadToDigitalOceanSpaces(
            request.getFolderName(),
            request.getFileName(),
            imageStream,
            request.getMimeType(),
            imageBytes.length
        );
        
        // 4. Ulož metadata do databázy
        GalleryImage savedImage = saveImageMetadata(productId, request, spacesUrl);
        
        return new GalleryUploadResponse(true, savedImage, spacesUrl, "Upload successful");
        
    } catch (Exception e) {
        log.error("Failed to upload image from JSON: {}", e.getMessage(), e);
        return new GalleryUploadResponse(false, null, null, "Upload failed: " + e.getMessage());
    }
}
```

## 🎯 **Výsledok:**

Frontend posiela:
```json
{
  "fileName": "1727025678_image.jpg",
  "originalName": "image.jpg", 
  "mimeType": "image/jpeg",
  "fileSize": 245760,
  "order": 1,
  "folderName": "PRODUCT123",
  "fileData": "/9j/4AAQSkZJRgABAQAAAQ..." // Base64 string
}
```

Backend dekóduje base64 → byte[] → InputStream → DigitalOcean Spaces + DB
