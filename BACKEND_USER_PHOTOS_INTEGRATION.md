# Backend Integration - User Model Photos Upload

## Prehľad

Tento dokument popisuje implementáciu backend funkcionalít pre upload a správu fotografií modelov od používateľov. Systém umožňuje používateľom uploadovať fotografie dokončených modelov, ktoré sa ukladajú do Digital Ocean Spaces a metadata do databázy.

## Databázová štruktúra

### Nová tabuľka: `user_model_photos`

```sql
CREATE TABLE user_model_photos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(500) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    
    -- File information
    original_filename VARCHAR(500) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- CDN URLs
    cdn_url VARCHAR(1000) NOT NULL,
    thumbnail_url VARCHAR(1000),
    
    -- Verification
    verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    verified_by BIGINT NULL,
    verified_at TIMESTAMP NULL,
    rejection_reason TEXT NULL,
    
    -- Metadata
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_user_product (user_id, product_id),
    INDEX idx_verification_status (verification_status),
    INDEX idx_upload_date (upload_date)
);
```

## API Endpointy

### 1. Upload fotografií

**POST** `/api/user-photos/upload`

#### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

#### Request Body (FormData)
```
product_id: string (required)
product_name: string (required) 
order_id: string (required)
photos: File[] (required, max 10 files)
```

#### File Validation
- **Povolené typy:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- **Maximálna veľkosť:** 10MB na súbor
- **Maximálny počet:** 10 súborov na request

#### Response Success (200)
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
        "file_name": "1_ENDEAVOUR_1703123456789_model_photo_1.jpg",
        "cdn_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/1/ENDEAVOUR/1703123456789_model_photo_1.jpg",
        "thumbnail_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/1/ENDEAVOUR/thumbs/1703123456789_model_photo_1.jpg",
        "verification_status": "pending",
        "upload_date": "2024-12-21T10:30:00Z"
      }
    ]
  }
}
```

#### Response Error (400/500)
```json
{
  "success": false,
  "message": "Chyba pri uploade",
  "errors": [
    "Súbor model_photo.jpg je príliš veľký (max 10MB)",
    "Nepodporovaný typ súboru: .gif"
  ]
}
```

### 2. Získanie fotografií používateľa

**GET** `/api/user-photos/{product_id}`

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "product_id": "ENDEAVOUR",
    "product_name": "Endeavour Space Shuttle",
    "total_photos": 5,
    "photos": [
      {
        "id": 123,
        "original_filename": "model_photo_1.jpg",
        "file_name": "1_ENDEAVOUR_1703123456789_model_photo_1.jpg",
        "file_size": 2048576,
        "cdn_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/1/ENDEAVOUR/1703123456789_model_photo_1.jpg",
        "thumbnail_url": "https://martyx-spaces.fra1.digitaloceanspaces.com/user-photos/1/ENDEAVOUR/thumbs/1703123456789_model_photo_1.jpg",
        "verification_status": "approved",
        "upload_date": "2024-12-21T10:30:00Z"
      }
    ]
  }
}
```

### 3. Získanie všetkých fotografií používateľa

**GET** `/api/user-photos`

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Query Parameters
```
page: number (default: 1)
limit: number (default: 20, max: 100)
status: string (optional: 'pending', 'approved', 'rejected')
product_id: string (optional)
```

#### Response Success (200)
```json
{
  "success": true,
  "data": {
    "photos": [...],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_items": 45,
      "items_per_page": 20
    }
  }
}
```

## Digital Ocean Spaces Štruktúra

### Adresárová štruktúra
```
martyx-spaces/
└── user-photos/
    └── {user_id}/
        └── {product_name}/
            ├── {timestamp}_{original_filename}
            ├── {timestamp}_{original_filename}
            └── thumbs/
                ├── {timestamp}_{original_filename}
                └── {timestamp}_{original_filename}
```

### Príklad
```
martyx-spaces/
└── user-photos/
    └── 1/
        └── ENDEAVOUR/
            ├── 1703123456789_model_photo_1.jpg
            ├── 1703123456790_model_photo_2.jpg
            └── thumbs/
                ├── 1703123456789_model_photo_1.jpg
                └── 1703123456790_model_photo_2.jpg
```

## Implementačné detaily

### 1. Upload Process

```java
@PostMapping("/upload")
public ResponseEntity<?> uploadPhotos(
    @RequestParam("product_id") String productId,
    @RequestParam("product_name") String productName,
    @RequestParam("order_id") String orderId,
    @RequestParam("photos") MultipartFile[] photos,
    Authentication authentication
) {
    try {
        // 1. Validate user authentication
        Long userId = getUserIdFromAuth(authentication);
        
        // 2. Validate files
        validateFiles(photos);
        
        // 3. Verify user owns the order
        verifyOrderOwnership(userId, orderId);
        
        // 4. Process each file
        List<UserModelPhoto> uploadedPhotos = new ArrayList<>();
        
        for (MultipartFile photo : photos) {
            // Generate unique filename
            String timestamp = String.valueOf(System.currentTimeMillis());
            String originalName = photo.getOriginalFilename();
            String fileName = userId + "_" + productId + "_" + timestamp + "_" + originalName;
            
            // Upload to Digital Ocean Spaces
            String cdnUrl = uploadToSpaces(photo, userId, productId, fileName);
            
            // Create thumbnail
            String thumbnailUrl = createAndUploadThumbnail(photo, userId, productId, fileName);
            
            // Save to database
            UserModelPhoto photoEntity = new UserModelPhoto();
            photoEntity.setUserId(userId);
            photoEntity.setProductId(productId);
            photoEntity.setProductName(productName);
            photoEntity.setOrderId(orderId);
            photoEntity.setOriginalFilename(originalName);
            photoEntity.setFileName(fileName);
            photoEntity.setFileSize(photo.getSize());
            photoEntity.setMimeType(photo.getContentType());
            photoEntity.setCdnUrl(cdnUrl);
            photoEntity.setThumbnailUrl(thumbnailUrl);
            photoEntity.setVerificationStatus("pending");
            
            uploadedPhotos.add(userModelPhotoRepository.save(photoEntity));
        }
        
        return ResponseEntity.ok(new UploadResponse(uploadedPhotos));
        
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
    }
}
```

### 2. File Validation

```java
private void validateFiles(MultipartFile[] files) throws ValidationException {
    if (files.length == 0) {
        throw new ValidationException("Žiadne súbory neboli vybrané");
    }
    
    if (files.length > 10) {
        throw new ValidationException("Maximálne 10 súborov na upload");
    }
    
    List<String> allowedTypes = Arrays.asList(
        "image/jpeg", "image/jpg", "image/png", "image/webp"
    );
    
    long maxSize = 10 * 1024 * 1024; // 10MB
    
    for (MultipartFile file : files) {
        if (!allowedTypes.contains(file.getContentType())) {
            throw new ValidationException(
                "Nepodporovaný typ súboru: " + file.getOriginalFilename()
            );
        }
        
        if (file.getSize() > maxSize) {
            throw new ValidationException(
                "Súbor " + file.getOriginalFilename() + " je príliš veľký (max 10MB)"
            );
        }
    }
}
```

### 3. Digital Ocean Spaces Upload

```java
private String uploadToSpaces(MultipartFile file, Long userId, String productId, String fileName) {
    try {
        // Configure AWS S3 client for Digital Ocean Spaces
        AmazonS3 s3Client = AmazonS3ClientBuilder.standard()
            .withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(
                "https://fra1.digitaloceanspaces.com", "fra1"))
            .withCredentials(new AWSStaticCredentialsProvider(
                new BasicAWSCredentials(spacesKey, spacesSecret)))
            .build();
        
        // Upload path
        String key = "user-photos/" + userId + "/" + productId + "/" + fileName;
        
        // Upload file
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());
        
        s3Client.putObject(new PutObjectRequest(bucketName, key, file.getInputStream(), metadata)
            .withCannedAcl(CannedAccessControlList.PublicRead));
        
        // Return CDN URL
        return "https://" + bucketName + ".fra1.digitaloceanspaces.com/" + key;
        
    } catch (Exception e) {
        throw new RuntimeException("Chyba pri uploade do Digital Ocean Spaces", e);
    }
}
```

### 4. Thumbnail Generation

```java
private String createAndUploadThumbnail(MultipartFile file, Long userId, String productId, String fileName) {
    try {
        // Read original image
        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        
        // Create thumbnail (300x300 max, maintain aspect ratio)
        int maxSize = 300;
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();
        
        double ratio = Math.min((double) maxSize / width, (double) maxSize / height);
        int newWidth = (int) (width * ratio);
        int newHeight = (int) (height * ratio);
        
        BufferedImage thumbnail = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = thumbnail.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        g2d.dispose();
        
        // Convert to byte array
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(thumbnail, "jpg", baos);
        byte[] thumbnailBytes = baos.toByteArray();
        
        // Upload thumbnail
        String thumbnailKey = "user-photos/" + userId + "/" + productId + "/thumbs/" + fileName;
        
        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(thumbnailBytes.length);
        metadata.setContentType("image/jpeg");
        
        s3Client.putObject(new PutObjectRequest(bucketName, thumbnailKey, 
            new ByteArrayInputStream(thumbnailBytes), metadata)
            .withCannedAcl(CannedAccessControlList.PublicRead));
        
        return "https://" + bucketName + ".fra1.digitaloceanspaces.com/" + thumbnailKey;
        
    } catch (Exception e) {
        throw new RuntimeException("Chyba pri vytváraní thumbnail", e);
    }
}
```

### 5. Order Verification

```java
private void verifyOrderOwnership(Long userId, String orderId) throws ValidationException {
    Optional<Order> order = orderRepository.findByIdAndUserId(orderId, userId);
    
    if (order.isEmpty()) {
        throw new ValidationException("Objednávka nebola nájdená alebo nepatrí používateľovi");
    }
    
    if (!Arrays.asList("completed", "paid").contains(order.get().getStatus().toLowerCase())) {
        throw new ValidationException("Fotografie možno uploadovať len pre dokončené objednávky");
    }
}
```

## Security Considerations

### 1. Authentication & Authorization
- Všetky endpointy vyžadujú JWT token
- Používateľ môže uploadovať/prezerať len svoje fotografie
- Overenie vlastníctva objednávky pred uploadom

### 2. File Security
- Validácia typu súboru (MIME type + extension)
- Kontrola veľkosti súboru
- Sanitizácia názvov súborov
- Antivirus scanning (odporúčané)

### 3. Rate Limiting
```java
@RateLimiter(name = "photo-upload", fallbackMethod = "uploadRateLimitFallback")
@PostMapping("/upload")
public ResponseEntity<?> uploadPhotos(...) {
    // Implementation
}
```

## Configuration

### application.yml
```yaml
spaces:
  endpoint: https://fra1.digitaloceanspaces.com
  bucket: martyx-spaces
  access-key: ${SPACES_ACCESS_KEY}
  secret-key: ${SPACES_SECRET_KEY}
  region: fra1

upload:
  max-file-size: 10MB
  max-files-per-request: 10
  allowed-types:
    - image/jpeg
    - image/jpg
    - image/png
    - image/webp
```

## Error Handling

### Common Error Codes
- `400` - Validation error (nesprávny typ súboru, veľkosť, atď.)
- `401` - Unauthorized (chýba/neplatný token)
- `403` - Forbidden (nie je vlastníkom objednávky)
- `404` - Not found (objednávka/produkt neexistuje)
- `413` - Payload too large (súbor príliš veľký)
- `500` - Server error (chyba uploadu, databázy)

## Admin Panel Integration

### Verification Endpoints

**GET** `/api/admin/user-photos/pending`
- Zoznam fotografií čakajúcich na schválenie

**PUT** `/api/admin/user-photos/{id}/verify`
```json
{
  "status": "approved|rejected",
  "rejection_reason": "Dôvod zamietnutia (povinné pri rejected)"
}
```

## Monitoring & Logging

### Metrics to Track
- Upload success/failure rates
- File sizes and types
- Processing times
- Storage usage
- Verification rates

### Log Events
- File uploads (success/failure)
- Verification actions
- Security violations
- Performance issues

## Testing

### Unit Tests
- File validation logic
- Thumbnail generation
- Database operations
- Security checks

### Integration Tests
- Complete upload flow
- Digital Ocean Spaces integration
- API endpoint testing
- Error handling scenarios

## Deployment Checklist

- [ ] Database migration executed
- [ ] Digital Ocean Spaces configured
- [ ] Environment variables set
- [ ] Rate limiting configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security scanning completed
