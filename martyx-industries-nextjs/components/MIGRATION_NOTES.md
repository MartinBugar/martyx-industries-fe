# Migration Notes - Layout Components

## Completed Migrations

### ✅ Navbar Component
- **Source**: `src/components/Navbar/Navbar.tsx`
- **Destination**: `martyx-industries-nextjs/components/Navbar/Navbar.tsx`
- **Changes Made**:
  - Added `"use client"` directive for Next.js client component
  - Replaced `react-router-dom` imports with Next.js equivalents:
    - `Link` → `next/link`
    - `NavLink` → `next/link` (with custom `isActive` logic)
    - `useNavigate` → `useRouter` from `next/navigation`
    - `useLocation` → `usePathname` from `next/navigation`
  - Replaced `<img>` with Next.js `Image` component for logo
  - Added `mounted` state to prevent hydration issues with portal
  - Removed `import.meta.env` references (not present in original, but noted for future)
  - Maintained all CSS and styling
  - Preserved all functionality including drawer, search, auth, and i18n

### ✅ Footer Component
- **Source**: `src/components/Footer/Footer.tsx`
- **Destination**: `martyx-industries-nextjs/components/Footer/Footer.tsx`
- **Changes Made**:
  - Added `"use client"` directive for Next.js client component
  - Replaced `react-router-dom` `Link` with `next/link`
  - Replaced `<img>` tags with Next.js `Image` component
  - Removed local image imports, using public folder paths instead
  - Maintained all CSS and styling
  - Preserved all footer sections and links

## Dependencies Required

Both components require the following dependencies to be migrated or installed:

### 1. **LanguageSwitcher Component**
- Path in Vite app: `src/components/LanguageSwitcher`
- Status: ⚠️ NOT YET MIGRATED
- Required by: Navbar
- Action: Needs to be migrated to `martyx-industries-nextjs/components/LanguageSwitcher`

### 2. **WishlistContext**
- Path in Vite app: `src/context/WishlistContext`
- Status: ⚠️ NOT YET MIGRATED
- Required by: Navbar
- Action: Needs to be migrated to `martyx-industries-nextjs/context/WishlistContext`

### 3. **i18next Configuration**
- The navbar uses `react-i18next` for translations
- Required packages:
  - `react-i18next`
  - `i18next`
- Translation namespaces used:
  - `nav` - Navigation translations
  - `common` - Common translations
- Action: Ensure i18next is configured in Next.js app

### 4. **Public Assets**
Required files in `public/` folder:
- `/logo/logo.png` - Main Martyx Industries logo
- `/logo/paypal.png` - PayPal payment logo

## CSS Files

Both CSS files have been copied as-is:
- ✅ `Navbar.css` - Contains all Navbar and drawer styles
- ✅ `Footer.css` - Contains all Footer styles

## Next Steps

1. **Migrate LanguageSwitcher component**
   - Copy from Vite app
   - Adapt for Next.js (use Next.js Link, add "use client")

2. **Migrate WishlistContext**
   - Copy from Vite app context folder
   - Ensure it works with Next.js App Router
   - May need to create a provider component wrapper

3. **Configure i18next for Next.js**
   - Install required packages
   - Set up i18next configuration
   - Copy translation files
   - Configure for App Router

4. **Copy Public Assets**
   - Copy logo files to `public/logo/` folder

5. **Test Components**
   - Import in a Next.js page/layout
   - Verify all links work
   - Test responsive behavior
   - Verify drawer functionality
   - Test i18n switching

## Usage Example

```tsx
// In app/layout.tsx
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Navbar cartCount={0} />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

## Known Limitations

1. **Type Safety**: Component prop types are maintained but WishlistContext types need to be verified after migration
2. **Authentication**: The `user` and `onLogout` props need to be wired up to your Next.js auth system
3. **Cart Count**: The `cartCount` prop needs to be connected to your cart state management
4. **Search Submit**: The `onSearchSubmit` callback can be customized or use the default router.push behavior

## Files Created

```
martyx-industries-nextjs/
├── components/
│   ├── Navbar/
│   │   ├── Navbar.tsx
│   │   ├── Navbar.css
│   │   └── index.ts
│   ├── Footer/
│   │   ├── Footer.tsx
│   │   ├── Footer.css
│   │   └── index.ts
│   └── MIGRATION_NOTES.md (this file)
```
