# 🌍 Martyx Industries - Internationalization Implementation Plan

## 📋 Executive Summary

**Current State**: 40-45% localized (primarily customer-facing pages)
**Target State**: 95%+ full application localization (EN, SK, DE)
**Estimated Effort**: 40-60 hours
**Priority**: HIGH - Critical for German market expansion

---

## 🎯 Strategic Goals

1. **Complete German (DE) Coverage** - Fill missing translation files
2. **Full Admin Panel Localization** - Enable multi-language admin interface
3. **Standardize Translation Architecture** - Follow industry best practices
4. **Ensure Type Safety** - Proper TypeScript integration
5. **Maintainable Translation Workflow** - Easy for non-developers to contribute

---

## 📊 Current State Analysis Summary

### ✅ What's Working Well

- **i18next Infrastructure**: Properly configured with React, ICU support, language detection
- **Customer Pages**: 85% translated (home, products, cart, checkout, auth)
- **Language Switcher**: Functional with persistence and accessibility
- **Translation Organization**: Well-structured namespaces by feature
- **Development Tools**: Missing key detection and debug capabilities

### ❌ Critical Issues

1. **Missing German Files**: 3 translation files (gallery, referral, credits)
2. **Admin Panel**: 92% untranslated (34/37 pages hardcoded English)
3. **Hardcoded Dialogs**: 29 window.confirm/alert without translations
4. **Policy Pages**: Legal documents not translated
5. **Incomplete Namespace Config**: Type safety issues

---

## 🏗️ Architecture & Best Practices

### Translation File Structure (Best Practice)

```
public/locales/
├── en/
│   ├── common.json          # Shared UI elements, errors, actions
│   ├── admin.json           # Admin panel specific (NEW)
│   ├── validation.json      # Form validation messages (NEW)
│   ├── policies.json        # Legal documents (NEW)
│   ├── checkout.json        # Feature-specific translations
│   ├── products.json
│   ├── cart.json
│   └── ...
├── sk/ (same structure)
└── de/ (same structure)
```

### Key Principles

1. **Namespace by Feature**: Group related translations together
2. **Flat Structure**: Avoid deep nesting (max 2 levels)
3. **Consistent Key Naming**: `feature.action_noun` (e.g., `admin.delete_user`)
4. **ICU Format**: Use for pluralization, gender, date/number formatting
5. **Context in Keys**: `button.save` vs `button.save_draft` (be specific)
6. **No Hardcoded Text**: Every user-visible string must use t()

---

## 📐 Implementation Plan

### Phase 1: Foundation & Critical Fixes (Week 1)
**Goal**: Fix critical issues blocking German users

#### Task 1.1: Create Missing German Translation Files
**Effort**: 2 hours
**Priority**: CRITICAL

1. Copy EN files to DE:
   - `public/locales/de/gallery.json`
   - `public/locales/de/referral.json`
   - `public/locales/de/credits.json`

2. Translate all strings to German
3. Validate JSON structure
4. Test in browser with DE language selected

**Acceptance Criteria**:
- [ ] All 3 files created with valid JSON
- [ ] 100% translation coverage (no English fallbacks)
- [ ] App loads without errors in German
- [ ] Gallery, Referral, Credits pages display in German

---

#### Task 1.2: Fix i18n Configuration
**Effort**: 1 hour
**Priority**: HIGH

**File**: `src/i18n/index.ts`

**Changes Required**:

```typescript
// Add missing namespaces to type definition
export type Namespace =
  | 'common'
  | 'checkout'
  | 'products'
  | 'home'
  | 'collection'
  | 'auth'
  | 'about'
  | 'cart'
  | 'contact'
  | 'nav'
  | 'wishlist'
  | 'gallery'        // ADD
  | 'referral'       // ADD
  | 'credits'        // ADD
  | 'gamification'   // ADD
  | 'admin'          // ADD (new namespace)
  | 'policies'       // ADD (new namespace)
  | 'validation';    // ADD (new namespace)

// Update i18next config
i18n.use(initReactI18next).init({
  // ... existing config
  ns: [
    'common', 'checkout', 'products', 'home', 'collection',
    'auth', 'about', 'cart', 'contact', 'nav', 'wishlist',
    'gallery', 'referral', 'credits', 'gamification',
    'admin', 'policies', 'validation'  // ADD NEW
  ],
  defaultNS: 'common',
  // ...
});
```

**Acceptance Criteria**:
- [ ] All namespace types match actual files
- [ ] No TypeScript errors
- [ ] All namespaces load correctly in browser console

---

#### Task 1.3: Create Admin Namespace Structure
**Effort**: 3 hours
**Priority**: HIGH

**Create 3 new files**:
- `public/locales/en/admin.json`
- `public/locales/sk/admin.json`
- `public/locales/de/admin.json`

**Content Structure** (example):

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "orders": "Orders",
    "products": "Products",
    "users": "Users",
    "analytics": "Analytics"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "export": "Export",
    "import": "Import",
    "refresh": "Refresh",
    "search": "Search"
  },
  "status": {
    "loading": "Loading...",
    "saving": "Saving...",
    "success": "Success!",
    "error": "Error",
    "pending": "Pending",
    "active": "Active",
    "inactive": "Inactive"
  },
  "confirm": {
    "delete": "Are you sure you want to delete this item?",
    "delete_user": "Are you sure you want to delete this user? This action cannot be undone.",
    "run_detection": "Run abandoned cart detection now?",
    "unsaved_changes": "You have unsaved changes. Are you sure you want to leave?"
  },
  "errors": {
    "load_failed": "Failed to load data",
    "save_failed": "Failed to save changes",
    "delete_failed": "Failed to delete item",
    "network_error": "Network error. Please try again.",
    "unauthorized": "You are not authorized to perform this action"
  },
  "messages": {
    "no_results": "No results found",
    "empty_state": "No items yet",
    "select_item": "Please select an item",
    "changes_saved": "Changes saved successfully"
  },
  "forms": {
    "name": "Name",
    "email": "Email",
    "description": "Description",
    "status": "Status",
    "created_at": "Created At",
    "updated_at": "Updated At"
  }
}
```

**Acceptance Criteria**:
- [ ] All 3 language files created
- [ ] Core admin vocabulary covered (50+ keys minimum)
- [ ] Consistent key naming across all 3 languages

---

### Phase 2: Admin Panel Localization (Week 2-3)
**Goal**: Translate all 34 admin pages

#### Task 2.1: Create Translation Helper Utilities
**Effort**: 2 hours
**Priority**: MEDIUM

**Create**: `src/utils/i18nHelpers.ts`

```typescript
import { TFunction } from 'i18next';

/**
 * Translated confirmation dialog
 * Replaces window.confirm() with i18n support
 */
export const confirmAction = (
  message: string,
  t: TFunction<'admin'>
): boolean => {
  return window.confirm(t(message as any));
};

/**
 * Translated alert dialog
 */
export const alertMessage = (
  message: string,
  t: TFunction<'admin'>
): void => {
  window.alert(t(message as any));
};

/**
 * Format date with locale
 */
export const formatDate = (
  date: string | Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format currency with locale
 */
export const formatCurrency = (
  amount: number,
  locale: string,
  currency: string = 'EUR'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Format number with locale
 */
export const formatNumber = (
  num: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat(locale, options).format(num);
};
```

---

#### Task 2.2: Localize High-Priority Admin Pages
**Effort**: 12 hours (3 hours per page group)
**Priority**: HIGH

**Group 1: Core Admin Pages** (3 hours)
- AdminDashboard
- AdminOrders
- AdminProducts
- AdminUsers

**Process per page**:
1. Import useTranslation hook
2. Replace all hardcoded strings with t() calls
3. Add translation keys to admin.json (all 3 languages)
4. Replace window.confirm/alert with translated helpers
5. Test page in all 3 languages

**Example Transformation**:

**Before**:
```typescript
<button onClick={() => {
  if (window.confirm('Delete this user?')) {
    deleteUser();
  }
}}>
  Delete
</button>
```

**After**:
```typescript
const { t } = useTranslation('admin');

<button onClick={() => {
  if (confirmAction('confirm.delete_user', t)) {
    deleteUser();
  }
}}>
  {t('actions.delete')}
</button>
```

**Group 2: Analytics & Reports** (3 hours)
- AdminProductAnalytics
- AdminAbandonedCarts
- AdminEmailCampaigns
- AdminCampaigns

**Group 3: Settings & Configuration** (3 hours)
- AdminShippingZones
- AdminDiscounts
- AdminSegments
- AdminXpConfig

**Group 4: Content Management** (3 hours)
- AdminGallery
- AdminProductAttachments
- AdminEmailTemplates
- AdminHomeSettings

---

#### Task 2.3: Localize Remaining Admin Pages
**Effort**: 8 hours
**Priority**: MEDIUM

**Batch process remaining 22 pages**:
- Focus on commonly used pages first
- Use consistent patterns from Groups 1-4
- Bulk translate similar pages together

---

### Phase 3: Legal & Policy Pages (Week 3)
**Goal**: Translate terms, privacy policy, cookies policy

#### Task 3.1: Create Policies Namespace
**Effort**: 4 hours
**Priority**: MEDIUM

**Create 3 files**:
- `public/locales/en/policies.json`
- `public/locales/sk/policies.json`
- `public/locales/de/policies.json`

**Structure**:
```json
{
  "privacy": {
    "title": "Privacy Policy",
    "last_updated": "Last Updated: {date}",
    "sections": {
      "introduction": "...",
      "data_collection": "...",
      "data_usage": "...",
      "cookies": "..."
    }
  },
  "terms": {
    "title": "Terms of Service",
    "sections": {
      "acceptance": "...",
      "user_obligations": "...",
      "disclaimers": "..."
    }
  },
  "cookies": {
    "title": "Cookie Policy",
    "sections": {
      "what_are_cookies": "...",
      "types_of_cookies": "...",
      "manage_cookies": "..."
    }
  }
}
```

**Note**: Legal text translation should be reviewed by legal team for each locale.

---

#### Task 3.2: Update Policy Page Components
**Effort**: 2 hours

**Files to update**:
- `src/pages/PrivacyPolicy/PrivacyPolicy.tsx`
- `src/pages/TermsOfService/TermsOfService.tsx`
- `src/pages/CookiesPolicy/CookiesPolicy.tsx`

**Pattern**:
```typescript
import { useTranslation } from 'react-i18next';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation('policies');

  return (
    <div>
      <h1>{t('privacy.title')}</h1>
      <p>{t('privacy.sections.introduction')}</p>
      {/* ... */}
    </div>
  );
};
```

---

### Phase 4: Form Validation & Error Handling (Week 4)
**Goal**: Standardize validation messages

#### Task 4.1: Create Validation Namespace
**Effort**: 3 hours
**Priority**: MEDIUM

**Create**:
- `public/locales/en/validation.json`
- `public/locales/sk/validation.json`
- `public/locales/de/validation.json`

**Structure**:
```json
{
  "required": "{field} is required",
  "invalid_email": "Invalid email address",
  "invalid_phone": "Invalid phone number",
  "min_length": "{field} must be at least {min} characters",
  "max_length": "{field} must not exceed {max} characters",
  "password_mismatch": "Passwords do not match",
  "invalid_format": "Invalid {field} format",
  "out_of_range": "{field} must be between {min} and {max}",
  "future_date": "Date must be in the future",
  "past_date": "Date must be in the past",
  "invalid_url": "Invalid URL format",
  "number_only": "{field} must contain only numbers",
  "alpha_only": "{field} must contain only letters",
  "alphanumeric_only": "{field} must contain only letters and numbers"
}
```

---

#### Task 4.2: Integrate Zod with i18next
**Effort**: 2 hours

**Install**: `zod-i18n-map` for automatic Zod error translation

```bash
npm install zod-i18n-map
```

**Configure**:
```typescript
import { z } from 'zod';
import { zodI18nMap } from 'zod-i18n-map';
import i18next from 'i18next';

// Set Zod error map
z.setErrorMap(zodI18nMap);

// Use in schemas
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
```

---

### Phase 5: Date, Number, Currency Formatting (Week 4)
**Goal**: Consistent locale-based formatting

#### Task 5.1: Create Formatting Hooks
**Effort**: 2 hours

**Create**: `src/hooks/useFormatters.ts`

```typescript
import { useTranslation } from 'react-i18next';

export const useFormatters = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, options);
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(num);
  };

  const formatRelativeTime = (date: Date) => {
    // Use Intl.RelativeTimeFormat or library like date-fns
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diffInDays = Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return rtf.format(diffInDays, 'day');
  };

  return {
    formatDate,
    formatCurrency,
    formatNumber,
    formatRelativeTime,
    locale
  };
};
```

---

#### Task 5.2: Replace All Date/Number Formatting
**Effort**: 4 hours

**Search and replace patterns**:
- `.toLocaleDateString()` → `formatDate()`
- Hardcoded `€` → `formatCurrency()`
- Number display → `formatNumber()`

**Example**:
```typescript
// Before
<span>{amount.toFixed(2)} €</span>
<span>{date.toLocaleDateString()}</span>

// After
const { formatCurrency, formatDate } = useFormatters();
<span>{formatCurrency(amount)}</span>
<span>{formatDate(date)}</span>
```

---

### Phase 6: Testing & QA (Week 5)
**Goal**: Verify translation quality and completeness

#### Task 6.1: Translation Coverage Report
**Effort**: 1 hour

**Create**: `scripts/check-translations.js`

```javascript
// Script to check translation file completeness
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../public/locales');
const languages = ['en', 'sk', 'de'];
const namespaces = [
  'common', 'checkout', 'products', 'home', 'collection',
  'auth', 'about', 'cart', 'contact', 'nav', 'wishlist',
  'gallery', 'referral', 'credits', 'gamification',
  'admin', 'policies', 'validation'
];

const report = {};

languages.forEach(lang => {
  report[lang] = {};
  namespaces.forEach(ns => {
    const filePath = path.join(localesDir, lang, `${ns}.json`);
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const keyCount = countKeys(content);
      report[lang][ns] = { exists: true, keys: keyCount };
    } else {
      report[lang][ns] = { exists: false, keys: 0 };
    }
  });
});

function countKeys(obj, count = 0) {
  Object.keys(obj).forEach(key => {
    if (typeof obj[key] === 'object') {
      count = countKeys(obj[key], count);
    } else {
      count++;
    }
  });
  return count;
}

console.table(report);
```

Run: `node scripts/check-translations.js`

---

#### Task 6.2: Create Translation Checklist
**Effort**: 1 hour

**Checklist Items**:
- [ ] All namespaces exist for EN, SK, DE
- [ ] No missing keys between languages (EN is baseline)
- [ ] All admin pages use translations
- [ ] All window.confirm/alert replaced
- [ ] Date/currency/number formatting consistent
- [ ] Policy pages translated (with legal review)
- [ ] Form validation translated
- [ ] Error messages translated
- [ ] No hardcoded strings in JSX/TSX
- [ ] Language switcher works on all pages
- [ ] Translations persist across sessions
- [ ] No console errors related to i18n

---

#### Task 6.3: Manual QA Testing
**Effort**: 4 hours

**Test Matrix**:
| Feature | EN | SK | DE | Pass/Fail |
|---------|:--:|:--:|:--:|-----------|
| Homepage | ✅ | ✅ | ✅ | |
| Product pages | ✅ | ✅ | ✅ | |
| Cart & Checkout | ✅ | ✅ | ✅ | |
| Admin Dashboard | ✅ | ✅ | ✅ | |
| Admin Orders | ✅ | ✅ | ✅ | |
| Admin Products | ✅ | ✅ | ✅ | |
| Policy pages | ✅ | ✅ | ✅ | |
| Form validation | ✅ | ✅ | ✅ | |
| Confirmation dialogs | ✅ | ✅ | ✅ | |
| Date formatting | ✅ | ✅ | ✅ | |
| Currency display | ✅ | ✅ | ✅ | |

---

### Phase 7: Documentation & Maintenance (Week 5)
**Goal**: Enable ongoing translation management

#### Task 7.1: Create Translation Guidelines
**Effort**: 2 hours

**Create**: `docs/TRANSLATION_GUIDELINES.md`

**Content**:
```markdown
# Translation Guidelines

## Key Naming Conventions
- Use snake_case: `user_profile`, `delete_button`
- Namespace by feature: `admin.actions.save`
- Be specific: `button.save_draft` not just `save`
- Group related keys: `errors.*`, `actions.*`

## Translation Best Practices
1. Keep translations concise and clear
2. Maintain consistent tone across languages
3. Respect cultural differences
4. Use formal vs informal consistently per language
5. Test in all target languages before merging

## Adding New Translations
1. Add key to EN file first (baseline)
2. Add same key to SK and DE files
3. Run translation coverage script
4. Test in browser with each language
5. Commit all 3 files together

## Interpolation Examples
- Variables: `"Welcome, {name}!"`
- Pluralization: `"{count, plural, one {# item} other {# items}}"`
- Dates: Use formatDate() hook, not hardcoded in translations
- Currency: Use formatCurrency() hook

## Common Mistakes to Avoid
❌ Hardcoded strings in components
❌ Inconsistent key naming
❌ Missing translations in one language
❌ Concatenating translated strings
❌ Using English fallbacks in production

✅ Always use t() for user-visible text
✅ Consistent naming across namespaces
✅ Complete translations in all languages
✅ Use ICU format for complex strings
✅ Fail fast with missing key warnings
```

---

#### Task 7.2: Setup Translation Workflow
**Effort**: 1 hour

**Options**:

1. **Manual Workflow** (current)
   - Developers add keys to EN file
   - Translation team updates SK/DE
   - PR review checks for completeness

2. **Automated with CI/CD** (recommended)
   - GitHub Actions check for missing keys
   - Block PRs with incomplete translations
   - Auto-generate translation tasks

3. **Translation Management Platform** (future)
   - Consider: Lokalise, Crowdin, POEditor
   - Benefits: Non-dev contributors, context, TM
   - Integration with GitHub

**Implement GitHub Action**: `.github/workflows/check-translations.yml`

```yaml
name: Check Translations

on:
  pull_request:
    paths:
      - 'public/locales/**'
      - 'src/**/*.tsx'
      - 'src/**/*.ts'

jobs:
  check-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node scripts/check-translations.js
      - run: node scripts/check-missing-keys.js
```

---

## 📈 Success Metrics

### Coverage Goals
- **Overall**: 95%+ (up from 40-45%)
- **Customer Pages**: 100% (currently 85%)
- **Admin Pages**: 95%+ (currently 5%)
- **Validation/Errors**: 100% (currently 70%)

### Quality Metrics
- **Zero** hardcoded user-visible strings
- **Zero** missing translation keys in production
- **Consistent** date/currency formatting
- **Fast** language switching (<100ms)
- **Accessible** language selector (WCAG 2.1 AA)

### Performance Metrics
- No increase in bundle size (translations lazy-loaded)
- Initial load time unchanged
- Language switch <100ms

---

## 🛠️ Tools & Technologies

### Current Stack
- **react-i18next** v15.7.3 - React bindings
- **i18next** v25.4.2 - Core i18n library
- **i18next-http-backend** v3.0.2 - Lazy load translations
- **i18next-browser-languagedetector** v8.2.0 - Auto-detect language
- **i18next-icu** v2.4.0 - ICU message format support

### Recommended Additions
- **zod-i18n-map** - Translate Zod validation errors
- **date-fns** (optional) - Advanced date formatting with locales
- **Lokalise/Crowdin** (optional) - Translation management platform

---

## 📅 Timeline Summary

| Phase | Duration | Priority | Status |
|-------|----------|----------|--------|
| Phase 1: Foundation & Critical Fixes | Week 1 (6h) | CRITICAL | Pending |
| Phase 2: Admin Panel Localization | Week 2-3 (23h) | HIGH | Pending |
| Phase 3: Legal & Policy Pages | Week 3 (6h) | MEDIUM | Pending |
| Phase 4: Form Validation | Week 4 (5h) | MEDIUM | Pending |
| Phase 5: Date/Number Formatting | Week 4 (6h) | MEDIUM | Pending |
| Phase 6: Testing & QA | Week 5 (6h) | HIGH | Pending |
| Phase 7: Documentation | Week 5 (3h) | LOW | Pending |
| **TOTAL** | **5 weeks** | **55 hours** | **0% Complete** |

---

## 🚀 Quick Start Guide

### For Developers

**1. Adding a new translatable string**:
```typescript
// 1. Import hook
import { useTranslation } from 'react-i18next';

// 2. Get t function
const { t } = useTranslation('namespace');

// 3. Use in JSX
<button>{t('actions.save')}</button>
```

**2. Adding a new translation key**:
```bash
# 1. Add to EN file (baseline)
echo '"new_key": "English text"' >> public/locales/en/namespace.json

# 2. Add to SK file
echo '"new_key": "Slovenský text"' >> public/locales/sk/namespace.json

# 3. Add to DE file
echo '"new_key": "Deutscher Text"' >> public/locales/de/namespace.json

# 4. Validate JSON
npm run validate:translations
```

**3. Testing translations**:
```typescript
// Switch language programmatically
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
i18n.changeLanguage('sk'); // or 'en', 'de'
```

---

## 📞 Support & Contact

### Translation Team
- **Lead**: TBD
- **English**: Native speaker review needed
- **Slovak**: In-house team
- **German**: External translator recommended

### Technical Support
- **i18n Architecture**: Development team
- **Translation Platform**: TBD
- **QA Testing**: QA team

---

## 📚 Additional Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [ICU Message Format Guide](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [Web Internationalization Best Practices](https://www.w3.org/International/questions/qa-i18n)
- [Lokalise i18n Guide](https://lokalise.com/blog/react-i18n/)

---

**Last Updated**: 2025-01-12
**Version**: 1.0
**Status**: Draft - Awaiting Approval
