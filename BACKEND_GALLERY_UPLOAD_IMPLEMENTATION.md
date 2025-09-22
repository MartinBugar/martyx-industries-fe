# Backend Implementation: Gallery Upload System

## 🎯 **Cieľ**
Presunúť nahrávanie obrázkov z frontendu na backend. Frontend bude posielať obrázky + metadata na backend, backend ich nahráva do DigitalOcean Spaces a uloží metadata do databázy.

## 📋 **Čo treba implementovať**

### 1. **Nový API endpoint pre upload**
```
POST /api/products/{productId}/gallery/upload
```

**Request:**
- `Content-Type: multipart/form-data`
- `file`: File (obrázok)
- `productId`: string (z URL parametra)
- `order`: number (optional - poradie obrázka)

**Response:**
```json
{
  "success": true,
  "image": {
    "id": "uuid",
    "productId": "123",
    "fileName": "1727025678_image.jpg",
    "originalName": "image.jpg",
    "mimeType": "image/jpeg",
    "size": 245760,
    "url": "https://mi-gallery.fra1.digitaloceanspaces.com/PRODUCT123/1727025678_image.jpg",
    "cdnUrl": "https://mi-gallery.fra1.digitaloceanspaces.com/PRODUCT123/1727025678_image.jpg",
    "order": 1,
    "folderName": "PRODUCT123",
    "createdAt": "2025-09-22T20:00:00.000Z"
  },
  "cdnUrl": "https://mi-gallery.fra1.digitaloceanspaces.com/PRODUCT123/1727025678_image.jpg"
}
```

### 2. **Backend logika**
1. **Príjem súboru** z multipart/form-data
2. **Validácia súboru**:
   - Typ: jpg, jpeg, png, webp, gif
   - Veľkosť: max 10MB
   - Názov: sanitizácia
3. **Generovanie názvu súboru**:
   ```
   {timestamp}_{sanitized_original_name}.{extension}
   ```
4. **Upload do DigitalOcean Spaces**:
   - Folder: `{PRODUCT_ID.toUpperCase()}/`
   - Key: `{folder}/{generated_filename}`
   - ACL: `public-read`
   - Cache-Control: `max-age=31536000`
5. **Uloženie do databázy** (tabuľka `gallery_images` alebo podobne):
   ```sql
   INSERT INTO gallery_images (
     id, product_id, file_name, original_name, 
     mime_type, size, url, cdn_url, order_num, 
     folder_name, created_at
   ) VALUES (...)
   ```

### 3. **Existujúce API endpoints upraviť**

#### **GET /api/products/{productId}/gallery**
- Už existuje, ale overiť že vracia správne dáta
- Zoradiť podľa `order_num ASC`

#### **DELETE /api/products/{productId}/gallery/{imageId}**  
- Upraviť aby mazal aj z DigitalOcean Spaces
- Najprv zmazať z DB, potom z Spaces

#### **POST /api/products/{productId}/gallery/reorder**
- Už existuje, ale overiť funkcionalitu

### 4. **Nový endpoint pre mazanie (optional)**
```
POST /api/gallery/delete
```
**Request:**
```json
{
  "key": "PRODUCT123/1727025678_image.jpg",
  "imageUrl": "https://mi-gallery.fra1.digitaloceanspaces.com/PRODUCT123/1727025678_image.jpg"
}
```

### 5. **DigitalOcean Spaces konfigurácia**
Backend musí mať tieto environment premenné:
```
DO_SPACES_ACCESS_KEY=your_access_key
DO_SPACES_SECRET_KEY=your_secret_key  
DO_SPACES_BUCKET=mi-gallery
DO_SPACES_ENDPOINT=fra1.digitaloceanspaces.com
DO_SPACES_REGION=fra1
```

### 6. **AWS SDK setup na backende**
```javascript
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  endpoint: new AWS.Endpoint(`https://${bucket}.${endpoint}`),
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
  region: 'fra1',
  signatureVersion: 'v4',
  s3ForcePathStyle: false,
  s3BucketEndpoint: true
});
```

## 🔧 **Technické detaily**

### **Databázová štruktúra (ak neexistuje)**
```sql
CREATE TABLE gallery_images (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  original_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  url TEXT NOT NULL,
  cdn_url TEXT,
  order_num INT DEFAULT 0,
  folder_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_product_id (product_id),
  INDEX idx_order (product_id, order_num)
);
```

### **Error handling**
- Validačné chyby: 400 Bad Request
- Chyby uploadu do Spaces: 500 Internal Server Error  
- Neexistujúci produkt: 404 Not Found
- Nedostatočné oprávnenia: 403 Forbidden

### **Sanitizácia názvov súborov**
```javascript
function sanitizeFileName(originalName) {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop() || 'png';
  const baseName = originalName
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace special chars
    .substring(0, 50); // Limit length
  
  return `${timestamp}_${baseName}.${extension}`;
}
```

## 🚀 **Výhody tohto riešenia**
- ✅ Žiadny AWS SDK vo frontende (menší bundle)
- ✅ Žiadne produkčné chyby s minifikáciou  
- ✅ Bezpečnejšie (credentials iba na backende)
- ✅ Lepšie error handling a validácia
- ✅ Centralizovaná logika uploadov

## 📝 **Poznámky**
- Frontend už je pripravený na toto API
- Stačí implementovať backend a všetko bude fungovať
- Existujúce obrázky v DB ostanú funkčné
- Testovať s malými obrázkami najprv
