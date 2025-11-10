# 🎨 XP SYSTEM - FRONTEND IMPLEMENTATION

**Dátum:** 2025-11-10
**Status:** ✅ FRONTEND COMPLETE - Ready for Integration
**Autor:** Claude + Martin

---

## ✅ COMPLETED FRONTEND IMPLEMENTATION

### 1. Services Layer (API Communication)

#### ✅ xpConfigService.ts
**Location:** `src/services/xpConfigService.ts`

**Exported Types:**
```typescript
interface XpConfigDto {
    id: number;
    sourceCode: string;
    sourceName: string;
    sourceNameEn?: string;
    sourceNameDe?: string;
    xpAmount: number;
    isEnabled: boolean;
    frequencyLimit?: string;
    maxPerDay?: number;
    maxTotal?: number;
    description?: string;
    descriptionEn?: string;
    descriptionDe?: string;
    displayOrder: number;
    icon?: string;
    createdAt: string;
    updatedAt: string;
    updatedBy?: {
        id: number;
        username: string;
    };
}

interface UpdateXpConfigRequest {
    sourceName: string;
    xpAmount: number;
    isEnabled: boolean;
    frequencyLimit?: string;
    maxPerDay?: number;
    // ... multi-language fields
}
```

**API Methods:**
- `getAllXpConfigs()` - Get all XP configurations
- `getXpConfigById(id)` - Get config by ID
- `getXpConfigBySource(sourceCode)` - Get config by source code
- `updateXpConfig(id, config)` - Update configuration
- `createXpConfig(config)` - Create new configuration
- `deleteXpConfig(id)` - Delete configuration
- `toggleXpSource(id, enabled)` - Enable/disable XP source

#### ✅ xpHistoryService.ts
**Location:** `src/services/xpHistoryService.ts`

**Exported Types:**
```typescript
interface XpTransactionDto {
    id: number;
    user: {
        id: number;
        username: string;
        email: string;
    };
    xpAmount: number;
    xpSource: string;
    sourceId?: number;
    sourceType?: string;
    description?: string;
    metadataJson?: Record<string, any>;
    createdAt: string;
    createdBy?: {
        id: number;
        username: string;
    };
}

enum XpSource {
    PURCHASE = 'PURCHASE',
    GALLERY_UPLOAD = 'GALLERY_UPLOAD',
    REVIEW = 'REVIEW',
    // ... všetky zdroje
}
```

**API Methods:**
- `getMyXpHistory(params)` - Get current user's XP history (paginated)
- `getUserXpHistory(userId, params)` - Get user's history by ID (admin only)

---

### 2. Admin Components

#### ✅ AdminXpConfig.tsx
**Location:** `src/pages/admin/AdminXpConfig.tsx`

**Features:**
- ✅ Display all XP configurations in ordered list
- ✅ Edit XP amounts inline
- ✅ Edit max per day limits
- ✅ Edit descriptions (Slovak)
- ✅ Enable/disable XP sources with toggle button
- ✅ Visual indicators for enabled/disabled sources
- ✅ Display frequency limits (UNLIMITED, ONCE_PER_PRODUCT, etc.)
- ✅ Show last updated by admin and timestamp
- ✅ Save/Cancel editing mode
- ✅ Responsive design (mobile-friendly)

**UI Structure:**
```
📦 Admin Panel
├── 🎮 XP Configuration
│   ├── Header (title + subtitle)
│   ├── Configs List
│   │   ├── Config Row (PURCHASE)
│   │   │   ├── Icon (💰)
│   │   │   ├── Info (name, description, frequency limit)
│   │   │   ├── Controls (XP amount, Edit, Enable/Disable)
│   │   │   └── Footer (last updated by...)
│   │   ├── Config Row (GALLERY_UPLOAD)
│   │   ├── Config Row (REVIEW)
│   │   └── ... (12 configs total)
│   └── Info Section (how XP earning works)
```

**State Management:**
- `configs` - List of all XP configurations
- `editingId` - ID of config being edited
- `editedValues` - Temporary edit values
- `loading` - Loading state

**Key Functions:**
- `loadConfigs()` - Fetch all configs from backend
- `handleEdit(config)` - Enter edit mode
- `handleSave(config)` - Save changes to backend
- `handleCancel(id)` - Cancel editing
- `handleToggle(config)` - Enable/disable source

#### ✅ AdminXpConfig.css
**Location:** `src/pages/admin/AdminXpConfig.css`

**Styling:**
- Clean, modern card-based layout
- Color-coded frequency limits (blue badges)
- Disabled state (greyed out + opacity 0.6)
- Hover effects on config rows
- Edit form with rounded inputs
- XP display with highlighted blue background
- Responsive grid for mobile devices
- Info section with light blue background

---

### 3. User Components

#### ✅ XpHistory.tsx
**Location:** `src/components/XpHistory/XpHistory.tsx`

**Features:**
- ✅ Display user's XP transaction history
- ✅ Paginated loading (20 transactions per page)
- ✅ "Load More" button for infinite scroll
- ✅ Color-coded XP amounts (green=positive, red=negative)
- ✅ Border color based on XP value (high/medium/low)
- ✅ Source icons (💰 PURCHASE, 🖼️ GALLERY_UPLOAD, ⭐ REVIEW, etc.)
- ✅ Formatted dates (Slovak locale)
- ✅ Empty state message for new users
- ✅ Loading spinner
- ✅ Error handling

**UI Structure:**
```
📦 User Profile
├── 🎮 Your XP History
│   ├── Header (title + subtitle)
│   ├── Transactions List
│   │   ├── Transaction Row
│   │   │   ├── Icon (💰)
│   │   │   ├── Info (description, date, source badge)
│   │   │   └── XP Amount (+89 XP)
│   │   ├── Transaction Row
│   │   └── ... (20 per page)
│   ├── Load More Button
│   └── Loading Spinner (when loading more)
```

**State Management:**
- `transactions` - Array of XP transactions
- `loading` - Loading state
- `error` - Error message
- `page` - Current page number
- `hasMore` - Whether more pages available

**Key Functions:**
- `loadTransactions()` - Fetch transactions from backend
- `handleLoadMore()` - Load next page
- `formatDate(dateString)` - Format date to Slovak locale
- `getSourceIcon(source)` - Get emoji for XP source
- `getSourceColor(xpAmount)` - Determine border color

#### ✅ XpHistory.css
**Location:** `src/components/XpHistory/XpHistory.css`

**Styling:**
- Card-based transaction list
- Color-coded left borders (green, blue, grey, red)
- Source badges with blue background
- Responsive design (stacks on mobile)
- Empty state with dashed border
- Load more button with hover effects
- Loading spinner animation

---

## 📊 INTEGRATION GUIDE

### How to Add Admin XP Config to Admin Panel

**Step 1: Add Route**

Find the admin routing file (e.g., `App.tsx` or `AdminRoutes.tsx`) and add:

```typescript
import AdminXpConfig from './pages/admin/AdminXpConfig';

// Inside admin routes:
<Route path="/admin/xp-config" element={<AdminXpConfig />} />
```

**Step 2: Add Menu Item**

Find the admin navigation menu (e.g., `AdminLayout.tsx` or `AdminSidebar.tsx`) and add:

```tsx
<Link to="/admin/xp-config">
  🎮 XP Configuration
</Link>
```

### How to Add XP History to User Profile

**Option 1: Add as Tab in UserProfile**

Edit `UserProfile.tsx`:

```typescript
import XpHistory from '../XpHistory/XpHistory';

// Inside component:
const [activeTab, setActiveTab] = useState('profile'); // or 'xp-history'

// In JSX:
<div className="tabs">
  <button onClick={() => setActiveTab('profile')}>Profile</button>
  <button onClick={() => setActiveTab('xp-history')}>XP History</button>
</div>

{activeTab === 'profile' && <ProfileForm />}
{activeTab === 'xp-history' && <XpHistory />}
```

**Option 2: Add as Separate Page**

Create new route:

```typescript
import XpHistory from '../components/XpHistory/XpHistory';

<Route path="/profile/xp-history" element={<XpHistory />} />
```

---

## 🎯 USAGE EXAMPLES

### Example 1: Admin Changes REVIEW XP from 30 to 50

**Admin Flow:**
1. Admin navigates to `/admin/xp-config`
2. Finds "Napísanie recenzie produktu" (REVIEW) card
3. Clicks "✏️ Edit" button
4. Edit form appears with input for XP amount
5. Changes `30` to `50`
6. Clicks "💾 Save"
7. Backend updates `xp_config` table
8. UI refreshes to show "50 XP"
9. Footer shows "Last updated by admin@martyx.sk on 10.11.2025 15:30"

**Frontend Code Flow:**
```
handleEdit(config)
  → Edit form appears
  → User changes value
  → handleSave(config)
  → xpConfigService.updateXpConfig(id, updatedConfig)
  → Backend PUT /api/admin/xp-config/{id}
  → loadConfigs() (refresh)
```

### Example 2: User Views XP History

**User Flow:**
1. User navigates to profile page
2. Clicks "XP History" tab (if tabbed) or sees history below profile
3. XpHistory component loads
4. Displays list of transactions:
   ```
   💰 Nákup za 89.90€ (+89 XP)
      10. novembra 2025 14:30 | PURCHASE

   🖼️ Nahranie postaveneho modelu do galérie (+100 XP)
      9. novembra 2025 10:15 | GALLERY UPLOAD

   ⭐ Napísanie recenzie produktu (+30 XP)
      8. novembra 2025 16:45 | REVIEW
   ```
5. User scrolls to bottom
6. Clicks "Load More" to see older transactions
7. Next 20 transactions appear

**Frontend Code Flow:**
```
useEffect() on component mount
  → loadTransactions()
  → xpHistoryService.getMyXpHistory({ page: 0, size: 20 })
  → Backend GET /api/gamification/xp-history?page=0&size=20
  → setTransactions(data)
  → Render list

User clicks "Load More"
  → handleLoadMore()
  → setPage(1)
  → loadTransactions() with page=1
  → Appends to existing transactions
```

### Example 3: Admin Disables FORUM_POST Source

**Admin Flow:**
1. Admin finds "Príspevok na fóre" (FORUM_POST) card
2. Card shows "5 XP" with "🔴 Disable" button (currently enabled)
3. Admin clicks "🔴 Disable"
4. Backend receives PATCH request
5. `xp_config.is_enabled` set to `false`
6. UI refreshes
7. Card becomes greyed out (opacity 0.6)
8. Button now shows "🟢 Enable"

**Frontend Code Flow:**
```
handleToggle(config)
  → xpConfigService.toggleXpSource(id, !config.isEnabled)
  → Backend PATCH /api/admin/xp-config/{id}/toggle?enabled=false
  → loadConfigs()
  → Card CSS class changes to 'disabled'
```

---

## 🎨 DESIGN HIGHLIGHTS

### Color Palette
- **Primary Blue:** `#3b82f6` (buttons, badges, highlights)
- **Success Green:** `#10b981` (positive XP, high amounts)
- **Warning Orange:** `#f59e0b` (limit badges)
- **Error Red:** `#ef4444` (negative XP, disabled sources)
- **Neutral Grey:** `#6b7280` (text, borders)

### Typography
- **Headings:** 24-28px, bold 700
- **Body Text:** 14-16px, regular 400
- **Badges:** 11-12px, bold 600, uppercase

### Spacing
- **Card Padding:** 20px
- **Gap Between Cards:** 16px
- **Form Input Padding:** 10-12px
- **Button Padding:** 12-24px

### Responsive Breakpoints
- **Mobile:** < 640px (stacked layout)
- **Tablet:** < 768px (reduced padding)
- **Desktop:** >= 768px (full layout)

---

## 📝 NEXT STEPS FOR INTEGRATION

### Required User Approval
**Before adding XP History to UserProfile, ask Martin:**
1. Should XP History be a tab in UserProfile or a separate page?
2. Should it be above or below the profile form?
3. Should there be a link in the navbar?

### Backend API Testing
**To test if backend is working:**
1. Start backend: `./mvnw spring-boot:run`
2. Login as admin
3. Open browser console
4. Navigate to admin XP config page
5. Check Network tab for:
   - `GET /api/admin/xp-config` → Should return 12 configs
6. Click Edit on PURCHASE config
7. Change XP amount and save
8. Check Network tab for:
   - `PUT /api/admin/xp-config/1` → Should return updated config

### Frontend Testing Checklist
- [ ] Admin can view all 12 XP configurations
- [ ] Admin can edit XP amount for PURCHASE
- [ ] Admin can toggle FORUM_POST to disabled
- [ ] User can view XP history (after making a purchase)
- [ ] User sees "No XP History Yet" if no transactions
- [ ] Load More button works correctly
- [ ] Mobile responsive layout works

---

## 🔧 TROUBLESHOOTING

### Issue: XP Config List is Empty

**Possible Causes:**
1. Backend not running
2. Migration V36 not executed
3. Admin not authenticated

**Solution:**
```bash
# Check backend logs for:
"Loaded 12 XP configurations"

# Check browser console for:
GET /api/admin/xp-config → 200 OK

# Check database:
SELECT COUNT(*) FROM xp_config; -- Should return 12
```

### Issue: XP History Shows Error

**Possible Causes:**
1. User not authenticated
2. No XP transactions exist yet

**Solution:**
```bash
# Check browser console for:
GET /api/gamification/xp-history → 200 OK

# Check database:
SELECT COUNT(*) FROM xp_transactions WHERE user_id = 1; -- Should return 0 if new user
```

### Issue: Edit Form Not Saving

**Possible Causes:**
1. Validation error
2. Network error
3. Missing authorization header

**Solution:**
```typescript
// Check browser console for:
PUT /api/admin/xp-config/1 → 200 OK

// Check request payload:
{
  "sourceName": "Nákup produktu",
  "xpAmount": 100, // Changed value
  "isEnabled": true
}
```

---

## ✅ SUMMARY

**Frontend Implementation:**
- ✅ 2 Service files created (`xpConfigService.ts`, `xpHistoryService.ts`)
- ✅ 2 Component files created (`AdminXpConfig.tsx`, `XpHistory.tsx`)
- ✅ 2 CSS files created (`AdminXpConfig.css`, `XpHistory.css`)
- ✅ TypeScript interfaces for all DTOs
- ✅ Error handling and loading states
- ✅ Responsive design for mobile
- ✅ Pagination for XP history

**Ready for:**
- ✅ Integration with existing UserProfile component
- ✅ Addition to admin panel routing
- ✅ Backend API testing
- ✅ End-to-end testing with real data

---

**Status:** Frontend implementation COMPLETE! 🎉

**Prepared by:** Claude (Anthropic AI)
**Reviewed by:** Martin @ Martyx Industries
**Date:** 2025-11-10
