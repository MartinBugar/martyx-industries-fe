# Next.js Migration - Zostávajúce úlohy

## ✅ Dokončené (Progress: 60%)

### Core Infrastructure
- [x] Skontrolovať a opraviť package.json (type: module, engines, scripts)
- [x] Nastaviť Tailwind v4 + PostCSS pipeline správne
- [x] Nakonfigurovať next.config.mjs (outputFileTracingRoot, remote images)
- [x] Odstrániť duplicity (robots/sitemap)
- [x] Nastaviť globals.css s design tokens a dark theme

### Layout & Components
- [x] Migrovať Navbar komponent
- [x] Migrovať Footer komponent
- [x] Preniesť assets (logo) do public/
- [x] Aktualizovať root layout s Navbar a Footer

### Pages
- [x] Implementovať Home page (/) s ISR
  - Hero section
  - How It Works
  - Featured Products (6 produktov z API)
  - Testimonials
  - Newsletter form
- [x] Implementovať Products listing (/products) s ISR
  - Server Component s data fetching
  - Search a category filter
  - Responsive grid
  - ProductCard komponent

---

## 🔄 Zostáva dokončiť (Progress: 40%)

### 1. Product Detail Page (`/products/[slug]/page.tsx`) - PRIORITA 1
**Čo treba:**
- [ ] Vytvoriť dynamickú route `/products/[slug]/page.tsx`
- [ ] Implementovať `generateStaticParams()` pre pre-generovanie produktov
- [ ] Server Component s ISR (`revalidate: 600`, tags: `['product', slug]`)
- [ ] Data fetching z API: `GET /api/v1/products/${slug}`
- [ ] Layout:
  - Galéria obrázkov (main image + thumbnails)
  - Názov, cena, popis
  - Add to Cart button (client component)
  - Dostupnosť a shipping info
  - Product details tabs (Specifications, Downloads, Reviews)
- [ ] Metadata s dynamic title a description
- [ ] Breadcrumbs navigácia
- [ ] Related products sekcia

**Súbory na vytvorenie:**
```
app/products/[slug]/page.tsx
components/ProductGallery.tsx (client)
components/AddToCart.tsx (client)
components/ProductTabs.tsx (client)
```

---

### 2. About Page (`/about/page.tsx`) - PRIORITA 2
**Čo treba:**
- [ ] Vytvoriť `/about/page.tsx`
- [ ] Skopírovať obsah z pôvodnej About page
- [ ] Adaptovať pre Next.js (Link, Image komponenty)
- [ ] Metadata
- [ ] Responsive layout

**Súbory:**
```
app/about/page.tsx
app/about/about.module.css (ak treba)
```

---

### 3. Loading & Error States - PRIORITA 1
**Čo treba:**
- [ ] Vytvoriť `app/loading.tsx` - global loading skeleton
- [ ] Vytvoriť `app/error.tsx` - global error boundary
- [ ] Vytvoriť `app/products/loading.tsx` - products loading skeleton
- [ ] Vytvoriť `app/products/[slug]/loading.tsx` - detail loading skeleton
- [ ] Implementovať Skeleton komponenty (cards, text, images)

**Súbory:**
```
app/loading.tsx
app/error.tsx
app/products/loading.tsx
app/products/[slug]/loading.tsx
components/Skeleton.tsx
```

---

### 4. Metadata & SEO - PRIORITA 2
**Čo treba:**
- [ ] Aktualizovať `robots.ts`:
  - Správne pravidlá pre crawlery
  - Sitemap URL
- [ ] Aktualizovať `sitemap.ts`:
  - Dynamické generovanie z produktov
  - Include all pages (/, /products, /about, /products/[slug])
  - Lastmod timestamps
- [ ] Pridať OpenGraph images
- [ ] Pridať favicons (favicon.ico, apple-touch-icon.png)

**Súbory:**
```
app/robots.ts (update)
app/sitemap.ts (update)
app/opengraph-image.tsx (new)
public/favicon.ico
public/apple-touch-icon.png
```

---

### 5. Revalidation Testing - PRIORITA 1
**Čo treba:**
- [ ] Overiť existujúci `/api/revalidate/route.ts`:
  - Bearer token autentifikácia
  - Tags support
  - Error handling
- [ ] Otestovať revalidáciu:
  - Upraviť produkt v BE
  - Zavolať POST `/api/revalidate` s tagom `['products']`
  - Overiť že FE sa updatol
- [ ] Otestovať Home page revalidation (tag: `['home', 'products']`)
- [ ] Otestovať Product detail revalidation (tag: `['product', slug]`)

**Test checklist:**
```bash
# Test revalidation
curl -X POST https://martyx-industries.com/api/revalidate \
  -H "Authorization: Bearer ${REVALIDATE_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["products"]}'
```

---

### 6. Build Testing & Fixes - PRIORITA 1
**Čo treba:**
- [ ] Spustiť lokálny build: `npm run build`
- [ ] Opraviť všetky TypeScript errors
- [ ] Opraviť všetky ESLint warnings
- [ ] Overiť že CSS sa načíta správne
- [ ] Overiť že obrázky sa načítajú z DO Spaces
- [ ] Testovať produkčný build lokálne: `npm start`

**Príkazy:**
```bash
cd martyx-industries-nextjs
npm run build
npm start  # test na http://localhost:8080
```

---

### 7. Chýbajúce Pages (Voliteľné - môže počkať)
- [ ] `/cart` - Cart page
- [ ] `/checkout` - Checkout page
- [ ] `/login` - Login page
- [ ] `/register` - Register page
- [ ] `/account` - User account
- [ ] `/contact` - Contact page

**Poznámka:** Tieto môžu byť implementované postupne po základnom spustení.

---

### 8. Deployment - FINÁLNY KROK
**Čo treba:**
- [ ] Nastaviť ENV variables v DigitalOcean App Platform:
  ```
  NODE_ENV=production
  API_BASE_URL=https://martyx-industries-be-2xf3x.ondigitalocean.app
  REVALIDATE_SECRET=<your-secret-token>
  NEXT_PUBLIC_SITE_URL=https://martyx-industries.com
  ```
- [ ] Push na PRODUCTION branch
- [ ] Overiť deployment logs
- [ ] Sanity check:
  - CSS sa načítava ✓
  - Obrázky sa zobrazujú ✓
  - ISR funguje ✓
  - Revalidation funguje ✓
- [ ] Lighthouse audit (LCP < 2.5s)

---

## 🔧 Known Issues & Fixes Needed

### 1. Navbar Dependencies
- Navbar aktuálne nemá:
  - [ ] Auth context (user, logout)
  - [ ] Cart context (cartCount)
  - [ ] Wishlist context
  - [ ] i18next (LanguageSwitcher)

**Riešenie:** Vytvoriť zjednodušené Client Component wrapper alebo dočasne disabled features.

### 2. API Integration
- [ ] Overiť API endpoints:
  - `GET /api/v1/products` ✓
  - `GET /api/v1/products/${slug}` - needs testing
  - `GET /api/v1/categories` - needs testing
- [ ] Overiť API response typy (TypeScript interfaces)

### 3. Missing Assets
- [ ] Hero image (`/cassandra/Home-Cass.png`) - potrebné skopírovať
- [ ] Favicon a touch icons
- [ ] OG images pre social sharing

---

## 📋 Priority Checklist (ked sa vrátiš)

**Urgent (musí fungovať pre deployment):**
1. ✅ Product Detail page s ISR
2. ✅ Loading states (skeleton UI)
3. ✅ Error boundaries
4. ✅ Build testing a oprava chýb
5. ✅ Revalidation testing

**Important (treba mať pred go-live):**
6. ✅ About page
7. ✅ Robots.ts a Sitemap.ts update
8. ✅ Favicon a OG images
9. ✅ Deployment ENV vars

**Nice to have (môže počkať):**
10. ⏸️ Cart/Checkout pages
11. ⏸️ Auth pages (login/register)
12. ⏸️ Contact page

---

## 🚀 Quick Start (keď pokračuješ)

```bash
# 1. Pokračuj v práci
cd martyx-industries-nextjs

# 2. Vytvor Product Detail page
# app/products/[slug]/page.tsx

# 3. Vytvor loading states
# app/loading.tsx, app/error.tsx, app/products/loading.tsx

# 4. Test build
npm run build
npm start

# 5. Fix errors, commit, push
git add .
git commit -m "feat: product detail page + loading states"
git push origin PRODUCTION
```

---

## 📊 Current Status

```
Infrastructure:    ████████████████████ 100%
Layout:            ████████████████████ 100%
Home Page:         ████████████████████ 100%
Products List:     ████████████████████ 100%
Product Detail:    ░░░░░░░░░░░░░░░░░░░░   0%
Loading States:    ░░░░░░░░░░░░░░░░░░░░   0%
About Page:        ░░░░░░░░░░░░░░░░░░░░   0%
SEO/Metadata:      ████████░░░░░░░░░░░░  40%
Testing:           ░░░░░░░░░░░░░░░░░░░░   0%
Deployment Ready:  ████████████░░░░░░░░  60%
```

**Estimated time to completion:** 4-6 hodín práce

---

## 📝 Notes

- Backend API funguje na: `https://martyx-industries-be-2xf3x.ondigitalocean.app`
- Obrázky sú v DO Spaces: `mi-gallery.fra1.digitaloceanspaces.com`
- Port pre start: `8080` (nie 3000)
- Monorepo setup: Next.js je v `martyx-industries-nextjs/` subfolder
- Git branch: `PRODUCTION`

Všetko commitnuté a ready pre pokračovanie! 🎉
