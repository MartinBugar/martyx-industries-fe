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

Create a `.env.local` file in the project root:

```bash
# API Configuration
API_BASE_URL=https://martyx-industries-be-2xf3x.ondigitalocean.app

# Revalidation Secret for on-demand revalidation
REVALIDATE_SECRET=your-revalidate-secret-token

# PayPal Configuration (optional)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-production-paypal-client-id

# DigitalOcean Spaces Configuration
NEXT_PUBLIC_DO_SPACES_ENDPOINT=https://fra1.digitaloceanspaces.com
NEXT_PUBLIC_DO_SPACES_BUCKET=martyx-industries
NEXT_PUBLIC_DO_CDN_ENDPOINT=https://martyx-industries.fra1.cdn.digitaloceanspaces.com
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

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

### Build and Deploy

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

3. **Test production build locally:**
   ```bash
   npm run build && npm start
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

## 🌐 DigitalOcean App Platform Deploy

### Build Command
```bash
npm run build
```

### Run Command
```bash
npm start
```

### Environment Variables
Set the following in DigitalOcean App Platform:
- `API_BASE_URL`
- `REVALIDATE_SECRET`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID` (optional)
- `NEXT_PUBLIC_DO_SPACES_ENDPOINT`
- `NEXT_PUBLIC_DO_SPACES_BUCKET`
- `NEXT_PUBLIC_DO_CDN_ENDPOINT`

### Domain Configuration
- **Primary domain:** `martyx-industries.com`
- **www redirect:** Automatically redirected to apex via middleware

## 🧪 Testing Commands

### Test SSR with Googlebot
```bash
curl -A "Googlebot" https://martyx-industries.com/products/endeavour
```

### Validate robots.txt
```bash
curl https://martyx-industries.com/robots.txt
```

### Validate sitemap.xml
```bash
curl https://martyx-industries.com/sitemap.xml
```

### Test www redirect
```bash
curl -I https://www.martyx-industries.com/
```

## 📋 Acceptance Criteria Checklist

- ✅ Next.js App Router with TypeScript and ESLint
- ✅ SSR/SSG/ISR properly configured
- ✅ Home page with featured products (SSG+ISR, revalidate=3600)
- ✅ Products listing page (SSG+ISR, revalidate=600)
- ✅ Product detail pages with dynamic routing and static generation
- ✅ About page (SSG)
- ✅ Documents page (SSG)
- ✅ On-demand revalidation API with Bearer token authentication
- ✅ SEO metadata, robots.txt, and sitemap.xml
- ✅ www to apex redirect via middleware
- ✅ Next.js Image with remote domains configured
- ✅ Custom error and not-found pages
- ✅ Cache tags for targeted revalidation

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

## 📞 Support

For issues or questions about this Next.js implementation, please refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Documentation](https://nextjs.org/docs/app)
- [Deployment Guide](https://nextjs.org/docs/deployment)
