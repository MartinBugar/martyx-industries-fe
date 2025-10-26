# FRONTEND ARCHITECTURE - Martyx Industries

## 📋 Overview

This document describes the **NEW frontend architecture** refactored to work with the new backend MasterProduct + ProductVariant system.

The old single-level `Product` system has been replaced with a **multi-variant architecture** that supports:
- Multiple variants per product (Digital, Physical, Hybrid)
- Slovak VAT pricing (price with VAT, price without VAT)
- Stock tracking per variant
- Digital downloads with expiration
- Bill of materials (variant components)

---

## 🏗️ Core Architecture

### Type Definitions (`src/types/api.ts`)

```typescript
MasterProduct (1) ──> (N) ProductVariant (1) ──> (N) VariantComponent
                                     │
                                     └──> (N) ProductDownload
```

#### 1. **MasterProductDto** - Product Concepts
Main product concept (e.g., "ENDEAVOUR Robot Model")

**Key Fields:**
- `id` - Master product ID
- `name` - Product name
- `slug` - SEO-friendly URL
- `description` - Short description
- `longDescription` - Detailed description
- `productCategory` - MODEL_KIT, MERCHANDISE, ELECTRONICS, ACCESSORIES, DIGITAL_DOWNLOAD
- `hasVariants` - TRUE if product has multiple variants
- `isActive` - Published status

#### 2. **ProductVariantDto** - Sellable SKUs
Actual sellable products with prices (e.g., "Digital Edition €89.90")

**Key Fields:**
- `id` - Variant ID
- `masterProductId` - FK to master product
- `variantName` - Display name ("Digital Edition", "Full Kit")
- `sku` - Unique stock keeping unit
- `variantType` - DIGITAL_ONLY, PHYSICAL_ONLY, HYBRID
- `fulfillmentType` - DIGITAL, PHYSICAL, MIXED

**Pricing (Slovak VAT):**
- `priceWithVat` - Display price (€89.90)
- `priceWithoutVat` - Base price (€73.09)
- `vatRate` - VAT % (23.00)
- `vatAmount` - VAT sum (€16.81)
- `currency` - EUR

**Stock Management:**
- `stockQuantity` - Current stock
- `trackInventory` - Enable/disable tracking
- `availabilityStatus` - IN_STOCK, OUT_OF_STOCK, PRE_ORDER, DISCONTINUED, BACKORDERED

**Digital Content:**
- `hasDigitalContent`, `isDownloadable`
- `digitalFileUrl`, `digitalFileSizeBytes`
- `downloadLimit` (5), `downloadExpiryDays` (30)

**Physical Properties:**
- `requiresShipping`
- `weightGrams`, `lengthCm`, `widthCm`, `heightCm`

#### 3. **VariantComponentDto** - Bill of Materials
What each variant includes (STL files, servo motors, Arduino, etc.)

**Key Fields:**
- `id` - Component ID
- `variantId` - FK to product variant
- `componentType` - STL_FILES, MECHANICAL_PARTS, ELECTRONICS, PRINTED_PARTS, ASSEMBLY_GUIDE, SOFTWARE
- `componentName` - Display name
- `isDigital`, `isPhysical` - Component nature
- `filePath`, `fileSizeBytes` - For digital components
- `quantity`, `weightGrams` - For physical components
- `displayOrder` - Ordering

#### 4. **ProductDownloadDto** - Secure Download System
Download tokens with expiration and limits

**Key Fields:**
- `id` - Download ID
- `orderId`, `orderItemId`, `variantId` - References
- `componentId` - Optional specific component
- `downloadToken` - UUID token
- `downloadUrl` - Full download URL
- `tokenType` - EMAIL, REGENERATED, ADMIN_CREATED
- `maxDownloads` (5), `downloadCount`
- `expiresAt` - 30 days from creation

---

## 🔌 API Service Layer

### ProductService (`src/services/productService.ts`)

#### NEW Variant Architecture Methods:

```typescript
// Get all master products
getMasterProducts(category?: string, language?: string): Promise<MasterProductDto[]>

// Get single master product
getMasterProduct(id: number, language?: string): Promise<MasterProductDto>

// Get variants for a master product
getVariantsForMasterProduct(masterProductId: number, language?: string): Promise<ProductVariantDto[]>

// Get single variant
getVariant(variantId: number, language?: string): Promise<ProductVariantDto>

// Get variant components (BOM)
getVariantComponents(variantId: number, language?: string): Promise<VariantComponentDto[]>
```

#### LEGACY Methods (Deprecated):

```typescript
/** @deprecated Use getMasterProducts() instead */
getProducts(category?: string, language?: string): Promise<ProductDto[]>

/** @deprecated Use getMasterProduct() and getVariantsForMasterProduct() instead */
getProduct(id: number, language?: string): Promise<ProductDto>
```

---

## 🔄 Hybrid Product Service Pattern

The `HybridProductService` (`src/services/hybridProductService.ts`) merges:
- **Backend data** (MasterProduct + Variant) - prices, stock, availability
- **Frontend hardcoded data** (from `productData.ts`) - 3D models, tabs, UI elements

### Migration Strategy:

**OLD Pattern:**
```typescript
// Backend returns complete Product
Product {
  id: 1,
  name: "Endeavour",
  price: 89.90,
  description: "...",
  productType: "DIGITAL"
}
```

**NEW Pattern:**
```typescript
// Backend returns MasterProduct + Variants
MasterProduct {
  id: 1,
  name: "ENDEAVOUR Robot Model",
  productCategory: "MODEL_KIT",
  hasVariants: true
}

ProductVariant[] {
  {
    id: 101,
    masterProductId: 1,
    variantName: "Digital Edition",
    priceWithVat: 89.90,
    variantType: "DIGITAL_ONLY"
  },
  {
    id: 102,
    masterProductId: 1,
    variantName: "Full Kit",
    priceWithVat: 499.90,
    variantType: "HYBRID"
  }
}
```

---

## 🛒 Cart Context Updates

### OLD Cart Structure:
```typescript
CartItem {
  product: Product;  // Single product
  quantity: number;
}
```

### NEW Cart Structure:
```typescript
CartItem {
  masterProduct: MasterProductDto;
  variant: ProductVariantDto;
  quantity: number;
}
```

**Key Changes:**
- Cart now stores **both** master product (for display) and selected variant (for pricing/checkout)
- Product ID changed to Variant ID for cart operations
- Price comes from `variant.priceWithVat`
- Stock checking uses `variant.stockQuantity`

---

## 📦 Component Refactoring Strategy

### Phase 1: Type-Safe Updates
1. ✅ Update `types/api.ts` with new interfaces
2. ✅ Update `productService.ts` with new endpoints
3. ⏳ Update `hybridProductService.ts` to merge master + variants
4. ⏳ Update `cartContextTypes.ts` to use variants

### Phase 2: UI Components
1. ⏳ Update `ProductList` to show variants as options
2. ⏳ Update `ProductDetail` to support variant selection
3. ⏳ Update `Cart` to display selected variants
4. ⏳ Update `Checkout` to send variantId to backend

### Phase 3: Backward Compatibility
1. Keep old `ProductDto` for legacy code (marked @deprecated)
2. Provide fallback methods during migration
3. Gradual migration of components

---

## 🎯 Frontend Data Flow

### Product List Page:
```
1. Fetch master products: getMasterProducts()
2. For each master product, fetch variants: getVariantsForMasterProduct(id)
3. Display master product with variant selector dropdown
4. User selects variant → shows variant price, stock status
```

### Product Detail Page:
```
1. Fetch master product: getMasterProduct(id)
2. Fetch all variants: getVariantsForMasterProduct(id)
3. Show variant selector (Digital €89.90 | Mechanical €299.90 | Full €499.90)
4. Fetch selected variant components: getVariantComponents(variantId)
5. Display BOM (STL files, Arduino, Motors, etc.)
```

### Add to Cart:
```
1. User selects variant from dropdown
2. Click "Add to Cart"
3. Save { masterProduct, selectedVariant, quantity } to cart
4. Cart displays: "ENDEAVOUR - Digital Edition €89.90"
```

### Checkout:
```
1. Cart sends:
   {
     variantId: 101,
     quantity: 1,
     price: 89.90
   }
2. Backend validates variant stock
3. Backend creates order with variant reference
4. Backend generates download tokens for digital components
```

---

## 📊 Example: ENDEAVOUR Product Display

### Master Product Display:
```
┌─────────────────────────────────────┐
│ ENDEAVOUR Robot Model               │
│ 3D Printed RC APC Project          │
├─────────────────────────────────────┤
│ Select Edition:                     │
│ ┌─────────────────────────────┐    │
│ │ Digital Edition     €89.90  │ ← ProductVariant
│ │ Mechanical Kit      €299.90 │    │
│ │ Full Kit            €499.90 │    │
│ └─────────────────────────────┘    │
├─────────────────────────────────────┤
│ Stock: IN_STOCK                    │
│ [Add to Cart]                      │
└─────────────────────────────────────┘
```

### Variant Components (BOM):
```
Digital Edition includes:
✓ STL Files (45.2 MB)
✓ Assembly Guide PDF (2.4 MB)
✓ Arduino Code (1.8 MB)

Full Kit includes:
✓ STL Files (45.2 MB)
✓ Assembly Guide PDF (2.4 MB)
✓ Arduino Code (1.8 MB)
✓ 3D Printed Parts (physical)
✓ 4x DC Gear Motors (physical)
✓ Arduino Mega 2560 (physical)
✓ Motor Driver Shield (physical)
✓ 2x LiPo Battery (physical)
```

---

## ⚠️ Critical Refactoring Patterns

### ✅ Correct Patterns:

**1. Fetching Products:**
```typescript
// ✅ NEW: Fetch master products + variants
const masterProducts = await productService.getMasterProducts();
for (const mp of masterProducts) {
  const variants = await productService.getVariantsForMasterProduct(mp.id);
  // Display mp.name with variant dropdown
}
```

**2. Adding to Cart:**
```typescript
// ✅ NEW: Store variant, not product
const addToCart = (masterProduct: MasterProductDto, variant: ProductVariantDto) => {
  cartItems.push({
    masterProduct,
    variant,
    quantity: 1
  });
};
```

**3. Displaying Price:**
```typescript
// ✅ NEW: Use variant price with VAT
<div className="price">
  {variant.priceWithVat.toFixed(2)} {variant.currency}
  <small>(excl. VAT: {variant.priceWithoutVat.toFixed(2)})</small>
</div>
```

### ❌ Wrong Patterns (OLD):

**1. Direct product price:**
```typescript
// ❌ OLD: Product had single price
<div>{product.price} EUR</div>
```

**2. No variant selection:**
```typescript
// ❌ OLD: No variants, just add product
addToCart(product);
```

**3. Single productType:**
```typescript
// ❌ OLD: productType was 'DIGITAL' or 'PHYSICAL'
if (product.productType === 'DIGITAL') { ... }
```

---

## 🧪 Testing Checklist

After refactoring, test:
- [ ] Product list shows all master products
- [ ] Variant selector shows all variants with correct prices
- [ ] Selecting variant updates price and stock status
- [ ] Add to cart stores correct variantId
- [ ] Cart displays: "ProductName - VariantName €X.XX"
- [ ] Checkout sends variantId to backend
- [ ] Digital downloads work with new variant system
- [ ] Stock validation works per variant
- [ ] VAT prices display correctly (with/without VAT)

---

## 📝 Migration Progress

### Completed:
- ✅ Type definitions created (`types/api.ts`)
- ✅ ProductService updated with variant endpoints
- ✅ Documentation created

### In Progress:
- ⏳ HybridProductService refactoring
- ⏳ Cart context update

### Pending:
- ⏳ Product list component
- ⏳ Product detail component
- ⏳ Cart component
- ⏳ Checkout component
- ⏳ Download system integration

---

**Last Updated:** 2025-10-26
**Backend Architecture:** See `A:\CODING\MARTYX-INDUSTRIES.COM\martyx-indystries-be\PRODUCT_ARCHITECTURE.md`
**Status:** Active refactoring in progress
