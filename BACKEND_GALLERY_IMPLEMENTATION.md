# 🚀 Backend Implementation Guide: Product Gallery Management

## Context
Frontend aplikácia používa DigitalOcean Spaces na ukladanie obrázkov a potrebuje backend API na správu metadát obrázkov v databáze. Namiesto pokusov o listing DigitalOcean Spaces buckets, chceme ukladať metadata obrázkov do databázy pri uploade a načítavať presné názvy súborov z databázy.

## Required Database Schema

Vytvor tabuľku `product_gallery` s nasledujúcou štruktúrou:

```sql
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_product_id (product_id),
    INDEX idx_display_order (display_order),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

## Required API Endpoints

### 1. GET /api/products/{productId}/gallery

```typescript
// Response Type
interface GalleryImage {
  id: string;
  productId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  cdnUrl?: string;
  order: number;
  createdAt: string;
}

// Response: GalleryImage[]
```

**Implementation:**
- Načítaj všetky obrázky pre daný `productId` z databázy
- Zoradi podľa `display_order` ASC
- Vráť pole `GalleryImage` objektov

### 2. POST /api/products/{productId}/gallery/upload

```typescript
// Request (FormData)
interface UploadRequest {
  file: File;
  productId: string;
  order?: number; // Optional, auto-calculate if not provided
}

// Response Type
interface UploadResponse {
  success: boolean;
  image: GalleryImage;
  cdnUrl: string;
}
```

**Implementation:**
1. **Validate file**: Check file type (jpg, png, webp, gif), size limit (10MB)
2. **Generate filename**: `{timestamp}_{sanitized_original_name}.{extension}`
3. **Upload to DigitalOcean Spaces**: 
   - Folder: `{PRODUCT_ID.toUpperCase()}/`
   - Full path: `{PRODUCT_ID.toUpperCase()}/{generated_filename}`
4. **Save metadata to database**:
   ```sql
   INSERT INTO product_gallery (
       id, product_id, file_name, original_name, mime_type, 
       file_size, url, cdn_url, display_order, folder_name
   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
   ```
5. **Return response** s `GalleryImage` objektom a CDN URL

### 3. DELETE /api/products/{productId}/gallery/{imageId}

```typescript
// Response Type
interface DeleteResponse {
  success: boolean;
}
```

**Implementation:**
1. **Find image** v databáze podľa `imageId` a `productId`
2. **Delete from DigitalOcean Spaces** using image path
3. **Delete from database**
4. **Reorder remaining images** (optional - update `display_order`)

### 4. POST /api/products/{productId}/gallery/reorder

```typescript
// Request Type
interface ReorderRequest {
  productId: string;
  imageOrders: Array<{
    imageId: string;
    order: number;
  }>;
}

// Response Type
interface ReorderResponse {
  success: boolean;
}
```

**Implementation:**
- Update `display_order` pre každý obrázok v batch operácii

## DigitalOcean Spaces Configuration

```javascript
// Environment variables needed
const config = {
  DO_SPACES_ACCESS_KEY: process.env.DO_SPACES_ACCESS_KEY,
  DO_SPACES_SECRET_KEY: process.env.DO_SPACES_SECRET_KEY,
  DO_SPACES_ENDPOINT: process.env.DO_SPACES_ENDPOINT || 'fra1.digitaloceanspaces.com',
  DO_SPACES_BUCKET: process.env.DO_SPACES_BUCKET || 'mi-gallery',
  DO_SPACES_REGION: process.env.DO_SPACES_REGION || 'fra1'
};

// File structure in DigitalOcean Spaces:
// mi-gallery/
//   ├── 1/
//   │   ├── 1734567890_image1.jpg
//   │   └── 1734567891_image2.png
//   ├── 2/
//   │   └── 1734567892_main.webp
//   └── ...
```

## Key Implementation Details

### 1. File Naming Convention
```javascript
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
  return `${timestamp}_${baseName}.${extension}`;
};
```

### 2. Folder Structure
- Každý produkt má vlastný priečinok: `{PRODUCT_ID.toUpperCase()}/`
- Napríklad: product ID "1" → folder "1/"
- Napríklad: product ID "endeavour-tank" → folder "ENDEAVOUR-TANK/"

### 3. CDN URL Generation
```javascript
const generateCDNUrl = (productId, fileName) => {
  const folderName = productId.toUpperCase();
  return `https://${bucket}.${endpoint}/${folderName}/${fileName}`;
};
```

### 4. Error Handling
- Validate file types: `['image/jpeg', 'image/png', 'image/webp', 'image/gif']`
- File size limit: 10MB
- Handle DigitalOcean Spaces upload errors
- Database transaction rollback on failures

### 5. Security
- Validate `productId` exists v products table
- Sanitize file names
- Rate limiting na upload endpoints
- File type validation (nie len extension check)

## Testing Checklist
- [ ] Upload obrázka cez POST endpoint
- [ ] Načítanie obrázkov cez GET endpoint
- [ ] Mazanie obrázka + cleanup z Spaces
- [ ] Reorder functionality
- [ ] Error handling pre neexistujúce produkty
- [ ] File validation (type, size)
- [ ] Database constraints a foreign keys

## Expected Frontend Integration
Po implementácii by frontend automaticky:
1. **Upload**: Uloží obrázok do Spaces + metadata do DB
2. **Loading**: Načíta presné zoznamy obrázkov z DB (nie listing Spaces)
3. **Display**: Zobrazí obrázky v správnom poradí podľa `display_order`
4. **Delete**: Vymaže z Spaces aj z DB

---

**Tento prístup eliminuje potrebu listing DigitalOcean Spaces buckets a poskytuje plnú kontrolu nad gallery management cez databázu.** 🎯
