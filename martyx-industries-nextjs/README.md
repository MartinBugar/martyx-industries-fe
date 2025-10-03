# MartyX Industries - Next.js Frontend

A modern Next.js application for MartyX Industries, featuring 3D-printed RC models and components. Built with App Router, SSR/SSG/ISR, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Next.js App Router** with TypeScript
- **SSR/SSG/ISR** for optimal performance and SEO
- **On-demand revalidation** via API routes
- **Responsive design** with Tailwind CSS
- **SEO optimized** with metadata, robots.txt, and sitemap.xml
- **Image optimization** with Next.js Image component
- **Error handling** with custom error and not-found pages
- **www to apex redirect** via middleware

## 📁 Project Structure

```
├── app/                     # Next.js App Router
│   ├── (pages)/
│   │   ├── about/          # About page (SSG)
│   │   ├── documents/      # Documents page (SSG)
│   │   └── products/       # Products pages (SSG+ISR)
│   │       └── [slug]/     # Dynamic product pages
│   ├── api/
│   │   └── revalidate/     # On-demand revalidation API
│   ├── robots.txt/         # Dynamic robots.txt
│   ├── sitemap.xml/        # Dynamic sitemap.xml
│   ├── error.tsx           # Error boundary
│   ├── not-found.tsx       # 404 page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page (SSG+ISR)
├── lib/
│   └── api.ts              # API utilities with cache tags
├── middleware.ts           # www to apex redirect
├── next.config.ts          # Next.js configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

## 🔧 Environment Variables

### Required Variables

**Build Time & Runtime:**
- `API_BASE_URL` - Backend API URL (required for both build and runtime)
  - Example: `https://martyx-industries-be-2xf3x.ondigitalocean.app`
  - ⚠️ **CRITICAL:** No fallback - build will fail if missing

**Runtime Only:**
- `REVALIDATE_SECRET` - Secret token for `/api/revalidate` endpoint
  - Generate a secure random string (e.g., `openssl rand -hex 32`)
  - Used for Bearer authentication on revalidation API

**Optional:**
- `NEXT_PUBLIC_SITE_URL` - Public site URL for robots.txt and sitemap.xml
  - Example: `https://martyx-industries.com`
  - Default: `https://martyx-industries.com`

### Local Development

Create a `.env.local` file in the project root:

```bash
# Required
API_BASE_URL=https://martyx-industries-be-2xf3x.ondigitalocean.app
REVALIDATE_SECRET=your-secure-random-token

# Optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 📡 Backend API Endpoints

The application expects the following API endpoints:

### Products
- `GET /api/v1/products?featured=true` - Featured products
- `GET /api/v1/products?page=1&limit=20` - Products listing with pagination
- `GET /api/v1/products/slugs` - Product slugs for static generation
- `GET /api/v1/products/{slug}` - Product details by slug

### Content
- `GET /api/v1/documents` - Documents listing
- `GET /api/v1/pages/about` - About page content

### API Response Schema

#### Product
```typescript
interface Product {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  specs?: Record<string, any>;
  gallery?: Array<{
    id: string;
    url: string;
    alt?: string;
    order?: number;
  }>;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
```

#### Document
```typescript
interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'html';
  url: string;
  description?: string;
}
```

#### Page Content
```typescript
interface PageContent {
  content: string; // HTML content
  title?: string;
  seo?: {
    title?: string;
    description?: string;
  };
}
```

## 🚀 Getting Started

### Local Development

1. **Install dependencies:**
   ```bash
   npm ci
   ```

2. **Set up environment variables:**
   ```bash
   # Create .env.local with required variables
   echo "API_BASE_URL=https://martyx-industries-be-2xf3x.ondigitalocean.app" > .env.local
   echo "REVALIDATE_SECRET=$(openssl rand -hex 32)" >> .env.local
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

### Production Build

1. **Full production build and test:**
   ```bash
   npm ci && npm run build && PORT=8080 npm start
   ```
   Server binds to `0.0.0.0:$PORT` (default 3000)

2. **Build only:**
   ```bash
   npm ci
   npm run build
   ```

3. **Start production server:**
   ```bash
   PORT=8080 npm start
   ```

## 🔄 On-Demand Revalidation

Update cached content by calling the revalidation API:

### Revalidate by paths
```bash
curl -X POST https://martyx-industries.com/api/revalidate \
  -H "Authorization: Bearer YOUR_REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"paths": ["/", "/products", "/products/endeavour"]}'
```

### Revalidate by cache tags
```bash
curl -X POST https://martyx-industries.com/api/revalidate \
  -H "Authorization: Bearer YOUR_REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["products", "product:endeavour"]}'
```

### Available cache tags:
- `products` - All product-related data
- `featured-products` - Featured products
- `product:{slug}` - Specific product by slug
- `documents` - Documents listing
- `pages` - Page content
- `about` - About page

### API Response Format

**Success (200):**
```json
{
  "success": true,
  "message": "All revalidation operations completed successfully",
  "results": [
    {"type": "path", "value": "/products", "success": true},
    {"type": "tag", "value": "products", "success": true}
  ],
  "timestamp": "2025-10-03T12:00:00.000Z"
}
```

**Partial Success (207):**
```json
{
  "success": false,
  "message": "1 operation(s) failed",
  "results": [
    {"type": "path", "value": "/invalid", "success": false, "error": "..."}
  ],
  "timestamp": "2025-10-03T12:00:00.000Z"
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

## 🌐 DigitalOcean App Platform Deploy

### App Configuration
- **Service Type:** Web Service
- **Source Directory:** `martyx-industries-nextjs`
- **Build Command:** Custom: `npm ci && npm run build`
- **Run Command:** `npm run start`
- **HTTP Port:** Auto-detected from `$PORT` environment variable
- **Instance Size:** Basic (512MB RAM recommended minimum)

### Required Environment Variables

Add these in **App-Level Environment Variables**:

| Variable | Type | Value |
|----------|------|-------|
| `API_BASE_URL` | Build + Runtime | `https://martyx-industries-be-2xf3x.ondigitalocean.app` |
| `REVALIDATE_SECRET` | Runtime | Generate with `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | Build + Runtime | `https://martyx-industries.com` |

### Optional Environment Variables
- `NEXT_PUBLIC_ASSETS_BASE` - CDN base URL for static assets (if using separate CDN)

### Domain Configuration
1. **Primary domain:** `martyx-industries.com` (apex)
2. **www subdomain:** `www.martyx-industries.com` → 301 redirect to apex (via middleware)
3. **SSL/TLS:** Automatic via DigitalOcean (Let's Encrypt)

### Health Check
- **Path:** `/api/health`
- **Expected:** `200 OK`
- **Interval:** 30 seconds recommended
- **Failure Threshold:** 3 attempts

## 🧪 Testing Commands

### Test SSR with Googlebot
```bash
curl -A "Googlebot" https://martyx-industries.com/products/endeavour
```
Expected: Full HTML with product content (not JSON)

### Validate robots.txt
```bash
curl https://martyx-industries.com/robots.txt
```
Expected: `Allow: /` and sitemap reference

### Validate sitemap.xml
```bash
curl https://martyx-industries.com/sitemap.xml
```
Expected: XML with all static + dynamic product URLs

### Test www redirect
```bash
curl -I https://www.martyx-industries.com/
```
Expected: `301 Moved Permanently` to apex domain

### Test health endpoint
```bash
curl https://martyx-industries.com/api/health
```
Expected: `{"status":"ok","timestamp":"...","uptime":...,"service":"martyx-industries-nextjs"}`

### Test revalidation API
```bash
curl -X POST https://martyx-industries.com/api/revalidate \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tags":["products"]}'
```
Expected: `{"success":true,...}`

## 📋 Acceptance Criteria Checklist

### Core Features
- ✅ Next.js 15 App Router with TypeScript
- ✅ Tailwind CSS fully integrated (dependencies, postcss, config)
- ✅ ISR configured (revalidate on all pages, no force-dynamic)
- ✅ Cache tags on all API fetches for on-demand revalidation
- ✅ images.unoptimized = true (direct loading from DO Spaces)
- ✅ No hardcoded API_BASE_URL fallback (throws error if missing)

### Pages & Rendering
- ✅ Home page (ISR, revalidate=3600, tags: products/featured-products)
- ✅ Products listing (ISR, revalidate=600, tags: products)
- ✅ Product detail (ISR, revalidate=3600, tags: products/product:{slug})
- ✅ About page (ISR, revalidate=86400, tags: pages/about)
- ✅ Documents page (ISR, revalidate=3600, tags: documents)

### APIs & Infrastructure
- ✅ On-demand revalidation API (/api/revalidate)
  - ✅ Bearer token authentication (REVALIDATE_SECRET)
  - ✅ Supports paths and tags
  - ✅ Logging to STDOUT
- ✅ Health check endpoint (/api/health)

### SEO & Crawling
- ✅ robots.ts (no duplicate robots.txt route)
- ✅ sitemap.ts (no duplicate sitemap.xml route)
- ✅ Sitemap includes static + dynamic product URLs
- ✅ Metadata with OpenGraph and Twitter Cards
- ✅ Canonical URLs configured

### Security & Middleware
- ✅ www → apex redirect (301, via middleware)
- ✅ Security headers (X-Frame-Options, CSP, etc.)
- ✅ Middleware matcher excludes api/_next/favicon/robots/sitemap

### Documentation
- ✅ README with environment variables (build vs runtime)
- ✅ README with deployment instructions
- ✅ README with revalidation API examples
- ✅ README with testing commands

## 🔍 SEO Features

- **Metadata generation** per page with fallbacks
- **Open Graph** and Twitter Card support
- **Canonical URLs** with metadataBase
- **Structured robots.txt** allowing crawling
- **Dynamic sitemap.xml** including all product URLs
- **Semantic HTML** structure
- **Image optimization** with proper alt texts and sizes

## 🛠 Development Notes

- **Revalidation periods:** Home (1h), Products (10m), Static pages (24h)
- **Image domains:** Configured for DigitalOcean Spaces CDN
- **Error handling:** Graceful fallbacks for API failures
- **Type safety:** Full TypeScript coverage
- **Performance:** Optimized with ISR and proper caching strategies

## 🔮 Future: Moving Next.js to Root

When ready to make Next.js the primary project and archive the legacy Vite app:

### Steps to Promote Next.js to Root

1. **Backup current state:**
   ```bash
   git checkout -b backup-before-nextjs-promotion
   git commit -am "Backup before promoting Next.js to root"
   ```

2. **Archive legacy Vite project:**
   ```bash
   mkdir legacy-vite
   mv src/ dist/ index.html vite.config.ts legacy-vite/
   ```

3. **Move Next.js to root:**
   ```bash
   mv martyx-industries-nextjs/* .
   mv martyx-industries-nextjs/.* . 2>/dev/null || true
   rmdir martyx-industries-nextjs
   ```

4. **Update DigitalOcean App Platform:**
   - Change **Source Directory** from `martyx-industries-nextjs` to `/` (root)
   - Keep **Build Command:** `npm ci && npm run build`
   - Keep **Run Command:** `npm run start`

5. **Test locally from root:**
   ```bash
   npm ci && npm run build && PORT=8080 npm start
   ```

6. **Commit and deploy:**
   ```bash
   git add .
   git commit -m "Promote Next.js to root, archive legacy Vite"
   git push
   ```

### Why Keep in Subdirectory for Now?

- **Safety:** Current setup works; changes are risky mid-production
- **Rollback:** Easy to revert if issues arise
- **Isolation:** No conflicts between Vite and Next.js configs
- **Testing:** Can verify Next.js in production before full migration

## 📞 Support

For issues or questions about this Next.js implementation, please refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Documentation](https://nextjs.org/docs/app)
- [Deployment Guide](https://nextjs.org/docs/deployment)
