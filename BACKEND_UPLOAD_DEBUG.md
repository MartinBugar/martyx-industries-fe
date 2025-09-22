# 🔍 Backend Upload Error Debug Guide

## Error Details
- **Status**: 500 Internal Server Error
- **Error Code**: ERR_INTERNAL  
- **Message**: "Internal error"
- **Endpoint**: `POST /api/products/1/gallery/upload`

## Most Likely Causes

### 1. **DigitalOcean Spaces Configuration** ⚠️
```java
// Check if these environment variables are set:
DO_SPACES_ACCESS_KEY=your_access_key
DO_SPACES_SECRET_KEY=your_secret_key  
DO_SPACES_ENDPOINT=fra1.digitaloceanspaces.com
DO_SPACES_BUCKET=mi-gallery
DO_SPACES_REGION=fra1
```

**Debug Steps:**
- Check if `galleryService` can connect to DigitalOcean Spaces
- Verify credentials are valid
- Test bucket access permissions

### 2. **Database Connection Error** ⚠️
```java
// Check if product_gallery table exists:
CREATE TABLE product_gallery (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    url TEXT NOT NULL,
    cdn_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    folder_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Debug Steps:**
- Check if database is accessible
- Verify `product_gallery` table exists
- Check if product with ID "1" exists in products table

### 3. **File Validation Error** ⚠️
```java
// Check galleryService.isValidImageFile() method
public boolean isValidImageFile(MultipartFile file) {
    // Verify this method doesn't throw exceptions
    String contentType = file.getContentType();
    return contentType != null && contentType.startsWith("image/");
}
```

### 4. **Missing Service Dependencies** ⚠️
```java
// Check if galleryService is properly injected:
@Autowired
private GalleryService galleryService;
```

## Backend Debug Steps

### Step 1: Add Detailed Logging
```java
@PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<GalleryUploadResponse> uploadImage(
        @PathVariable String productId,
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "order", required = false) Integer order) {
    
    log.info("=== UPLOAD DEBUG START ===");
    log.info("Product ID: {}", productId);
    log.info("File name: {}", file.getOriginalFilename());
    log.info("File size: {}", file.getSize());
    log.info("File type: {}", file.getContentType());
    log.info("Order: {}", order);
    
    try {
        // Step-by-step debugging
        log.info("Step 1: Validating file...");
        if (file.isEmpty()) {
            log.error("File is empty");
            return ResponseEntity.badRequest().body(/*...*/);
        }

        log.info("Step 2: Checking file validation...");
        if (!galleryService.isValidImageFile(file)) {
            log.error("Invalid image file");
            return ResponseEntity.badRequest().body(/*...*/);
        }

        log.info("Step 3: Parsing product ID...");
        Long productIdLong = Long.parseLong(productId);
        log.info("Parsed product ID: {}", productIdLong);

        log.info("Step 4: Calling galleryService.uploadImage...");
        GalleryUploadResponse response = galleryService.uploadImage(productIdLong, file, order);
        log.info("Gallery service response: {}", response);
        
        // ... rest of the method
        
    } catch (Exception e) {
        log.error("=== UPLOAD ERROR ===", e);
        log.error("Error class: {}", e.getClass().getName());
        log.error("Error message: {}", e.getMessage());
        log.error("Stack trace: ", e);
        throw e; // Re-throw to see full stack trace
    }
}
```

### Step 2: Check GalleryService Implementation
```java
public GalleryUploadResponse uploadImage(Long productId, MultipartFile file, Integer order) {
    log.info("GalleryService.uploadImage called with productId: {}, file: {}", 
        productId, file.getOriginalFilename());
    
    try {
        // 1. Check if product exists
        log.info("Checking if product exists...");
        // Your product validation logic
        
        // 2. Generate filename
        log.info("Generating filename...");
        String fileName = generateFileName(file.getOriginalFilename());
        log.info("Generated filename: {}", fileName);
        
        // 3. Upload to DigitalOcean Spaces
        log.info("Uploading to DigitalOcean Spaces...");
        String spacesUrl = uploadToSpaces(productId, fileName, file);
        log.info("Spaces URL: {}", spacesUrl);
        
        // 4. Save metadata to database
        log.info("Saving metadata to database...");
        GalleryImage savedImage = saveToDatabase(productId, fileName, file, spacesUrl, order);
        log.info("Saved to database: {}", savedImage);
        
        return new GalleryUploadResponse(true, savedImage, spacesUrl, null);
        
    } catch (Exception e) {
        log.error("GalleryService upload error: ", e);
        return new GalleryUploadResponse(false, null, null, e.getMessage());
    }
}
```

### Step 3: Test Individual Components

**Test DigitalOcean Connection:**
```java
@Test
public void testDigitalOceanConnection() {
    // Test if you can connect to DO Spaces
    // Try to list bucket contents
    // Try to upload a test file
}
```

**Test Database Connection:**
```java
@Test
public void testDatabaseConnection() {
    // Test if you can query product_gallery table
    // Test if you can insert a test record
}
```

## Quick Fixes to Try

### Fix 1: Check Environment Variables
```bash
# In your backend application.properties or environment:
spring.datasource.url=jdbc:mysql://localhost:3306/your_db
do.spaces.access-key=your_access_key
do.spaces.secret-key=your_secret_key
do.spaces.bucket=mi-gallery
do.spaces.endpoint=fra1.digitaloceanspaces.com
```

### Fix 2: Ensure Product Exists
```sql
-- Check if product with ID 1 exists:
SELECT * FROM products WHERE id = 1;

-- If not, create a test product:
INSERT INTO products (id, name, sku, price, currency, active) 
VALUES (1, 'Test Product', 'TEST-001', 29.99, 'USD', true);
```

### Fix 3: Create Missing Table
```sql
-- Create product_gallery table if it doesn't exist:
CREATE TABLE IF NOT EXISTS product_gallery (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    url TEXT NOT NULL,
    cdn_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    folder_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_product_id (product_id)
);
```

## Expected Frontend Request
```
POST /api/products/1/gallery/upload
Content-Type: multipart/form-data; boundary=...

--boundary
Content-Disposition: form-data; name="file"; filename="image.jpg"
Content-Type: image/jpeg

[binary image data]
--boundary
Content-Disposition: form-data; name="order"

0
--boundary--
```

## Next Steps
1. **Add detailed logging** to backend upload method
2. **Check backend logs** for exact error location  
3. **Verify environment variables** are set correctly
4. **Test database connectivity** 
5. **Test DigitalOcean Spaces connectivity**

The error is definitely on the backend side in the `galleryService.uploadImage()` method. Check the backend logs for the exact stack trace! 🔍
