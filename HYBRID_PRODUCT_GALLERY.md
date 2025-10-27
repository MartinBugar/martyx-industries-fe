# Hybridná Product Gallery Architektúra

## 📖 Prehľad

Nová architektúra product gallery podporuje **MasterProduct + ProductVariant** model s inteligentným fallback mechanizmom.

### 🎯 Koncepty

- **Master Product Gallery**: Fotky zdieľané medzi všetkými variantmi produktu
- **Variant Gallery**: Variant-špecifické fotky (napr. "1:72 s LED" má vlastné fotky s osvetlením)
- **Fallback Logika**: Ak variant nemá vlastné fotky, automaticky zobrazí master product galériu

---

## 🔌 Backend API Endpointy

### Master Product Gallery (zdieľaná)

```http
GET    /api/master-products/{masterProductId}/gallery
POST   /api/master-products/{masterProductId}/gallery/upload
POST   /api/master-products/{masterProductId}/gallery/upload-json
DELETE /api/master-products/{masterProductId}/gallery/{imageId}
GET    /api/master-products/{masterProductId}/gallery/count
```

### Variant Gallery (variant-špecifická s fallback)

```http
GET    /api/master-products/{masterProductId}/variants/{variantId}/gallery
POST   /api/master-products/{masterProductId}/variants/{variantId}/gallery/upload
DELETE /api/master-products/{masterProductId}/variants/{variantId}/gallery/{imageId}
DELETE /api/master-products/{masterProductId}/variants/{variantId}/gallery
GET    /api/master-products/{masterProductId}/variants/{variantId}/gallery/count
```

---

## 💻 Frontend Service API

### Import

```typescript
import { productGalleryService } from '@/services/productGalleryService';
```

### Načítanie galérie

```typescript
// Načítať galériu pre variant (s fallback na master)
const images = await productGalleryService.getGalleryForVariant(
  masterProductId: 1,
  variantId: 5  // Optional - ak je null, načíta master product galériu
);

// Načítať len master product galériu
const masterImages = await productGalleryService.getMasterProductGallery(1);
```

### Upload obrázkov

```typescript
// Upload pre master product (zdieľané medzi variantmi)
const response = await productGalleryService.uploadImageForMasterProduct(
  masterProductId: 1,
  file: selectedFile,
  order: 0  // Optional - poradie zobrazenia
);

// Upload pre konkrétny variant
const response = await productGalleryService.uploadImageForVariant(
  masterProductId: 1,
  variantId: 5,
  file: selectedFile,
  order: 0
);
```

### Mazanie obrázkov

```typescript
// Vymazať obrázok z master product galérie
await productGalleryService.deleteImageForProduct(
  masterProductId: 1,
  variantId: null,  // null = master product
  imageId: 'abc-123'
);

// Vymazať obrázok z variant galérie
await productGalleryService.deleteImageForProduct(
  masterProductId: 1,
  variantId: 5,
  imageId: 'def-456'
);
```

### Počet obrázkov

```typescript
// Spočítať obrázky pre variant (s fallback na master)
const count = await productGalleryService.getImageCountForVariant(
  masterProductId: 1,
  variantId: 5  // Optional
);
```

---

## 🎨 Použitie v komponentoch

### Príklad: Product Detail Page

```tsx
import React, { useState, useEffect } from 'react';
import { productGalleryService } from '@/services/productGalleryService';

interface ProductDetailProps {
  masterProductId: number;
  selectedVariantId?: number;
}

const ProductDetail: React.FC<ProductDetailProps> = ({
  masterProductId,
  selectedVariantId
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGallery() {
      try {
        setLoading(true);

        // Načítaj galériu s fallback logikou
        const galleryImages = await productGalleryService.getGalleryForVariant(
          masterProductId,
          selectedVariantId  // Ak je undefined, načíta master galériu
        );

        // Extrahuj URLs
        const imageUrls = galleryImages.map(img => img.cdnUrl || img.url);
        setImages(imageUrls);

      } catch (error) {
        console.error('Failed to load gallery:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGallery();
  }, [masterProductId, selectedVariantId]);

  if (loading) return <div>Loading gallery...</div>;

  return (
    <div className="product-gallery">
      {images.map((url, index) => (
        <img key={index} src={url} alt={`Product ${index + 1}`} />
      ))}
    </div>
  );
};
```

### Príklad: Admin Gallery Upload

```tsx
import React, { useState } from 'react';
import { productGalleryService } from '@/services/productGalleryService';

interface AdminGalleryUploadProps {
  masterProductId: number;
  variantId?: number;  // Optional - ak nie je, uploaduje do master product
}

const AdminGalleryUpload: React.FC<AdminGalleryUploadProps> = ({
  masterProductId,
  variantId
}) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const response = variantId
        ? await productGalleryService.uploadImageForVariant(
            masterProductId,
            variantId,
            file
          )
        : await productGalleryService.uploadImageForMasterProduct(
            masterProductId,
            file
          );

      if (response.success) {
        alert('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-gallery-upload">
      <h3>
        Upload Image for {variantId ? `Variant #${variantId}` : 'Master Product'}
      </h3>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {uploading && <p>Uploading...</p>}
    </div>
  );
};
```

---

## 📂 Databázová štruktúra

```sql
product_gallery:
  - id
  - master_product_id    -- ID master produktu
  - variant_id           -- ID variantu (NULL pre master product galériu)
  - file_name
  - url
  - cdn_url
  - thumbnail_url
  - display_order

CONSTRAINT: master_product_id IS NOT NULL
```

**Pravidlá:**
- `variant_id = NULL` → Galéria pre master product (zdieľaná)
- `variant_id = 5` → Galéria pre variant #5 (špecifická)

---

## 🎯 Use Cases

### 1. Štandardný produkt s jednou galériu
```
MasterProduct: "Space Shuttle Endeavour" (ID: 1)
  └─ Master Gallery: 10 fotiek

Varianty:
  ├─ "1:72 Scale" (ID: 2) → používa master galériu
  ├─ "1:144 Scale" (ID: 3) → používa master galériu
  └─ "1:72 with Stand" (ID: 4) → používa master galériu
```

### 2. Produkt kde niektoré varianty majú vlastné fotky
```
MasterProduct: "Space Shuttle Endeavour" (ID: 1)
  └─ Master Gallery: 10 fotiek základného modelu

Varianty:
  ├─ "1:72 Scale" (ID: 2) → používa master galériu ✓
  ├─ "1:144 Scale" (ID: 3) → používa master galériu ✓
  └─ "1:72 with LED Kit" (ID: 5) → má vlastných 8 fotiek s LED osvetlením 💡
```

---

## ✅ Výhody

- ✅ **Žiadna duplicita**: Zdieľané fotky sa nahrávajú raz
- ✅ **Flexibilita**: Varianty môžu mať vlastné fotky ak je potrebné
- ✅ **Automatický fallback**: Inteligentná logika na backenede aj frontenede
- ✅ **Optimalizované cache**: Samostatné cache pre master a variant
- ✅ **Bezpečnosť**: Admin oprávnenia na upload/delete

---

## 🔧 Migrácia z pôvodnej architektúry

Ak máte existujúce komponenty používajúce starú API (`/api/products/{productId}/gallery`):

1. **Legacy API stále funguje** - nemusíte nič meniť okamžite
2. **Postupná migrácia**: Môžete postupne migrovať na novú API
3. **Fallback support**: Nové API je backward compatible

---

## 📝 Príklad workflow

### Admin uploaduje fotky:

1. Admin otvorí MasterProduct #1
2. Uploaduje 10 fotiek → uložia sa ako master product gallery (`variant_id = NULL`)
3. Všetky varianty (1:72, 1:144, atď.) teraz zdieľajú túto galériu

4. Admin zistí, že variant "1:72 with LED" potrebuje vlastné fotky s LED osvetlením
5. Otvorí variant #5 a uploaduje 8 nových fotiek → uložia sa ako variant gallery (`variant_id = 5`)
6. Variant #5 teraz zobrazuje iba svoje fotky (nie master galériu)

### Zákazník prezerá produkt:

1. Otvorí MasterProduct #1
2. Frontend volá: `getGalleryForVariant(1, null)` → zobrazí master galériu (10 fotiek)

3. Vyberie variant "1:72 Scale" (#2)
4. Frontend volá: `getGalleryForVariant(1, 2)`
   - Backend skontroluje variant #2 galériu → prázdna
   - Vráti master galériu (fallback) → zobrazí 10 fotiek

5. Vyberie variant "1:72 with LED" (#5)
6. Frontend volá: `getGalleryForVariant(1, 5)`
   - Backend skontroluje variant #5 galériu → má 8 fotiek
   - Vráti variant galériu → zobrazí 8 fotiek s LED

---

## 🚀 Get Started

```typescript
// V admin paneli pri editácii master produktu
<AdminGalleryUpload masterProductId={product.id} />

// V admin paneli pri editácii variantu
<AdminGalleryUpload
  masterProductId={product.id}
  variantId={selectedVariant.id}
/>

// Na product detail page
<ProductGallery
  masterProductId={product.id}
  variantId={selectedVariant?.id}
/>
```

---

Created: 2025-10-26
Architecture: MasterProduct + ProductVariant Hybrid Gallery
