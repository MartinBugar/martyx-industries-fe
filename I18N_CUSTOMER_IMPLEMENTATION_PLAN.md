# 🌍 Martyx Industries - Customer-Facing Localization Plan

## 📋 Executive Summary

**Scope**: Customer-facing pages ONLY (admin panel excluded)
**Current State**: 85% customer pages localized
**Target State**: 100% customer pages localized (EN, SK, DE)
**Estimated Effort**: 15-20 hours
**Priority**: HIGH

---

## ✅ Already Localized (Working Well)

### Customer Pages with Full Translation Support:
1. ✅ **Home** - home.json
2. ✅ **Products** - products.json
3. ✅ **Product Detail** - products.json
4. ✅ **Cart** - cart.json
5. ✅ **Checkout** - checkout.json
6. ✅ **About** - about.json
7. ✅ **Contact** - contact.json
8. ✅ **Auth Pages** (Login, Register, Reset) - auth.json
9. ✅ **Wishlist** - wishlist.json
10. ✅ **Collection** - collection.json
11. ✅ **Referral Dashboard** - referral.json ✅ (DE added)
12. ✅ **User Gallery** - gallery.json ✅ (DE added)
13. ✅ **Credits** - credits.json ✅ (DE added)
14. ✅ **Gamification** - gamification.json

### Translation Infrastructure:
- ✅ i18next properly configured
- ✅ Language switcher functional
- ✅ All 3 languages (EN, SK, DE) supported
- ✅ 15 namespaces loaded
- ✅ ICU format support

---

## ❌ Missing Localization (To Fix)

### 1. **OrderConfirmation Page**
**Status**: Completely hardcoded in English
**Priority**: CRITICAL (customer sees after purchase)
**Effort**: 2 hours
**Namespace**: Create `order-confirmation.json` or extend `checkout.json`

### 2. **Policy Pages**
**Status**: Completely hardcoded in English
**Priority**: HIGH (legal requirement for each language)
**Effort**: 8 hours (including legal review)

Pages to localize:
- PrivacyPolicy.tsx
- TermsOfService.tsx
- CookiesPolicy.tsx

**Namespace**: Create `policies.json`

### 3. **UserGallery Page**
**Status**: Partially localized (uses gallery.json but has hardcoded strings)
**Priority**: MEDIUM
**Effort**: 1 hour
**Namespace**: Extend `gallery.json`

### 4. **Form Validation Messages**
**Status**: Mixed (some translated, some hardcoded)
**Priority**: HIGH (consistency)
**Effort**: 3 hours
**Namespace**: Create `validation.json`

### 5. **Date/Currency Formatting**
**Status**: Inconsistent
**Priority**: MEDIUM (UX consistency)
**Effort**: 2 hours
**Action**: Create `useFormatters` hook

---

## 🎯 Implementation Plan

### **Phase 1: OrderConfirmation Page** (2 hours)

#### Step 1: Analyze Current OrderConfirmation Page
```bash
# Check what needs translation
grep -r "OrderConfirmation" src/pages/
```

#### Step 2: Extend checkout.json Namespace

**Add to EN/SK/DE files**: `public/locales/{lang}/checkout.json`

```json
{
  "confirmation": {
    "title": "Order Confirmed!",
    "subtitle": "Thank you for your order",
    "order_number": "Order Number",
    "order_date": "Order Date",
    "estimated_delivery": "Estimated Delivery",
    "shipping_address": "Shipping Address",
    "billing_address": "Billing Address",
    "payment_method": "Payment Method",
    "order_summary": "Order Summary",
    "items": "Items",
    "subtotal": "Subtotal",
    "shipping": "Shipping",
    "tax": "Tax",
    "total": "Total",
    "tracking_info": "You will receive tracking information via email",
    "questions": "Questions about your order?",
    "contact_support": "Contact Support",
    "continue_shopping": "Continue Shopping",
    "view_orders": "View My Orders",
    "payment_processing": "Your payment is being processed",
    "email_sent": "A confirmation email has been sent to {email}"
  }
}
```

#### Step 3: Update OrderConfirmation Component

**File**: `src/pages/OrderConfirmation/OrderConfirmation.tsx`

```typescript
import { useTranslation } from 'react-i18next';

const OrderConfirmation: React.FC = () => {
  const { t } = useTranslation('checkout');

  return (
    <div>
      <h1>{t('confirmation.title')}</h1>
      <p>{t('confirmation.subtitle')}</p>
      {/* Replace all hardcoded strings */}
    </div>
  );
};
```

---

### **Phase 2: Policy Pages** (8 hours)

#### Step 1: Create policies.json Namespace

**Structure**:
```
public/locales/
├── en/policies.json
├── sk/policies.json
└── de/policies.json
```

#### Step 2: English policies.json Template

```json
{
  "privacy": {
    "title": "Privacy Policy",
    "last_updated": "Last Updated: {date}",
    "intro": "At Martyx Industries, we take your privacy seriously...",
    "sections": {
      "data_collection": {
        "title": "What Data We Collect",
        "content": "We collect the following types of data:\n• Personal information (name, email, address)\n• Order information\n• Usage data (cookies, analytics)"
      },
      "data_usage": {
        "title": "How We Use Your Data",
        "content": "We use your data to:\n• Process orders\n• Send order confirmations\n• Improve our services"
      },
      "data_sharing": {
        "title": "Data Sharing",
        "content": "We do not sell your personal data. We share data only with:\n• Payment processors\n• Shipping providers"
      },
      "cookies": {
        "title": "Cookies",
        "content": "We use cookies to improve your experience..."
      },
      "your_rights": {
        "title": "Your Rights",
        "content": "You have the right to:\n• Access your data\n• Request data deletion\n• Opt out of marketing"
      },
      "contact": {
        "title": "Contact Us",
        "content": "For privacy concerns, contact us at: privacy@martyxindustries.com"
      }
    }
  },
  "terms": {
    "title": "Terms of Service",
    "last_updated": "Last Updated: {date}",
    "intro": "By using Martyx Industries, you agree to these terms...",
    "sections": {
      "acceptance": {
        "title": "Acceptance of Terms",
        "content": "By accessing this website, you accept these terms..."
      },
      "use_license": {
        "title": "Use License",
        "content": "Permission is granted to temporarily download..."
      },
      "user_obligations": {
        "title": "User Obligations",
        "content": "You agree not to:\n• Use the site for illegal purposes\n• Attempt to hack or disrupt the service"
      },
      "disclaimers": {
        "title": "Disclaimers",
        "content": "The materials on this website are provided 'as is'..."
      },
      "limitation_liability": {
        "title": "Limitation of Liability",
        "content": "In no event shall Martyx Industries be liable..."
      },
      "governing_law": {
        "title": "Governing Law",
        "content": "These terms are governed by the laws of Slovakia"
      }
    }
  },
  "cookies": {
    "title": "Cookie Policy",
    "last_updated": "Last Updated: {date}",
    "intro": "This Cookie Policy explains how we use cookies...",
    "sections": {
      "what_are_cookies": {
        "title": "What Are Cookies?",
        "content": "Cookies are small text files stored on your device..."
      },
      "types_of_cookies": {
        "title": "Types of Cookies We Use",
        "essential": "Essential Cookies - Required for site functionality",
        "analytics": "Analytics Cookies - Help us understand site usage",
        "marketing": "Marketing Cookies - Used for targeted advertising",
        "preferences": "Preference Cookies - Remember your settings"
      },
      "manage_cookies": {
        "title": "Managing Cookies",
        "content": "You can control cookies through your browser settings...",
        "browser_instructions": "Instructions for major browsers:",
        "chrome": "Chrome: Settings > Privacy > Cookies",
        "firefox": "Firefox: Options > Privacy > Cookies",
        "safari": "Safari: Preferences > Privacy"
      },
      "third_party": {
        "title": "Third-Party Cookies",
        "content": "We use third-party services that may set cookies:\n• Google Analytics\n• Payment processors"
      }
    }
  },
  "banner": {
    "message": "We use cookies to improve your experience",
    "accept": "Accept All",
    "reject": "Reject Non-Essential",
    "customize": "Customize",
    "learn_more": "Learn More"
  }
}
```

#### Step 3: Translate to Slovak & German

**Important**: Legal translations should be reviewed by legal team

**Slovak (SK)**: Professional translation of all policy text
**German (DE)**: Professional translation of all policy text

#### Step 4: Update Policy Components

**PrivacyPolicy.tsx**:
```typescript
import { useTranslation } from 'react-i18next';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation('policies');

  return (
    <div className="policy-page">
      <h1>{t('privacy.title')}</h1>
      <p className="last-updated">
        {t('privacy.last_updated', { date: '2025-01-12' })}
      </p>
      <p>{t('privacy.intro')}</p>

      <section>
        <h2>{t('privacy.sections.data_collection.title')}</h2>
        <p style={{ whiteSpace: 'pre-line' }}>
          {t('privacy.sections.data_collection.content')}
        </p>
      </section>

      {/* Repeat for other sections */}
    </div>
  );
};
```

**TermsOfService.tsx**: Similar structure
**CookiesPolicy.tsx**: Similar structure

---

### **Phase 3: Validation Messages** (3 hours)

#### Step 1: Create validation.json

**Structure**:
```json
{
  "required": "{field} is required",
  "required_generic": "This field is required",
  "invalid_email": "Please enter a valid email address",
  "invalid_phone": "Please enter a valid phone number",
  "invalid_postal_code": "Please enter a valid postal code",
  "min_length": "{field} must be at least {min} characters",
  "max_length": "{field} cannot exceed {max} characters",
  "min_value": "{field} must be at least {min}",
  "max_value": "{field} cannot exceed {max}",
  "password_mismatch": "Passwords do not match",
  "weak_password": "Password must contain at least 8 characters, one uppercase, one lowercase, and one number",
  "invalid_url": "Please enter a valid URL",
  "invalid_date": "Please enter a valid date",
  "future_date": "Date must be in the future",
  "past_date": "Date must be in the past",
  "numeric_only": "{field} must contain only numbers",
  "alpha_only": "{field} must contain only letters",
  "alphanumeric_only": "{field} must contain only letters and numbers",
  "invalid_format": "Invalid {field} format",
  "terms_required": "You must accept the terms and conditions",
  "age_requirement": "You must be at least {age} years old",
  "invalid_card": "Invalid card number",
  "invalid_cvv": "Invalid CVV code",
  "card_expired": "Card has expired",
  "fields": {
    "email": "email",
    "password": "password",
    "name": "name",
    "first_name": "first name",
    "last_name": "last name",
    "phone": "phone number",
    "address": "address",
    "city": "city",
    "postal_code": "postal code",
    "country": "country",
    "message": "message",
    "quantity": "quantity"
  }
}
```

#### Step 2: Create Validation Hook

**File**: `src/hooks/useValidation.ts`

```typescript
import { useTranslation } from 'react-i18next';

export const useValidation = () => {
  const { t } = useTranslation('validation');

  return {
    required: (field?: string) =>
      field
        ? t('required', { field: t(`fields.${field}`) })
        : t('required_generic'),

    email: () => t('invalid_email'),

    minLength: (min: number, field?: string) =>
      t('min_length', {
        min,
        field: field ? t(`fields.${field}`) : ''
      }),

    maxLength: (max: number, field?: string) =>
      t('max_length', {
        max,
        field: field ? t(`fields.${field}`) : ''
      }),

    passwordMismatch: () => t('password_mismatch'),

    // ... other validation messages
  };
};
```

#### Step 3: Use in Forms

**Example**:
```typescript
const { required, email, minLength } = useValidation();

<input
  type="email"
  required
  onChange={validate}
  error={errors.email ? email() : undefined}
/>
```

---

### **Phase 4: Formatting Utilities** (2 hours)

#### Create useFormatters Hook

**File**: `src/hooks/useFormatters.ts`

```typescript
import { useTranslation } from 'react-i18next';

export const useFormatters = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language;

  const formatDate = (
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, options || {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (date: string | Date): string => {
    return `${formatDate(date)} ${formatTime(date)}`;
  };

  const formatCurrency = (
    amount: number,
    currency: string = 'EUR'
  ): string => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(amount);
  };

  const formatNumber = (
    num: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    return new Intl.NumberFormat(locale, options).format(num);
  };

  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  const formatRelativeTime = (date: Date): string => {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diffInSeconds = Math.floor((date.getTime() - Date.now()) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1
    };

    for (const [unit, seconds] of Object.entries(intervals)) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (Math.abs(interval) >= 1) {
        return rtf.format(interval, unit as Intl.RelativeTimeFormatUnit);
      }
    }

    return rtf.format(0, 'second');
  };

  return {
    formatDate,
    formatShortDate,
    formatTime,
    formatDateTime,
    formatCurrency,
    formatNumber,
    formatPercentage,
    formatRelativeTime,
    locale
  };
};
```

#### Usage Example:

```typescript
const { formatCurrency, formatDate } = useFormatters();

<div>
  <span>{formatCurrency(29.99)}</span>
  <span>{formatDate(order.createdAt)}</span>
</div>
```

---

### **Phase 5: Audit & Testing** (2 hours)

#### Checklist for Each Customer Page:

- [ ] Home
- [ ] Products
- [ ] Product Detail
- [ ] Cart
- [ ] Checkout
- [ ] OrderConfirmation ⚠️
- [ ] About
- [ ] Contact
- [ ] Auth (Login, Register, Reset)
- [ ] Wishlist
- [ ] Collection
- [ ] ReferralDashboard
- [ ] UserGallery ⚠️
- [ ] PrivacyPolicy ⚠️
- [ ] TermsOfService ⚠️
- [ ] CookiesPolicy ⚠️

**For each page, verify**:
1. ✅ No hardcoded English strings
2. ✅ All t() calls working
3. ✅ Translations exist for EN, SK, DE
4. ✅ Date/currency formatting uses hooks
5. ✅ Form validation translated
6. ✅ Error messages translated
7. ✅ Language switcher works
8. ✅ Page renders correctly in all 3 languages

---

## 📊 Summary & Timeline

| Task | Priority | Effort | Status |
|------|----------|--------|--------|
| ✅ Missing DE files (gallery, referral, credits) | CRITICAL | 2h | DONE |
| ✅ Fix i18n config | HIGH | 1h | DONE |
| OrderConfirmation | CRITICAL | 2h | TODO |
| Policy Pages | HIGH | 8h | TODO |
| Validation namespace | HIGH | 3h | TODO |
| useFormatters hook | MEDIUM | 2h | TODO |
| UserGallery audit | LOW | 1h | TODO |
| Full testing (all pages) | HIGH | 2h | TODO |
| **TOTAL** | | **21h** | **14% done** |

---

## 🚀 Quick Wins (Start Here)

1. **OrderConfirmation** - 2 hours, critical customer touchpoint
2. **Validation namespace** - 3 hours, improves consistency
3. **useFormatters hook** - 2 hours, fixes date/currency formatting

**After these 3 tasks (7 hours)**: You'll have ~95% customer-facing localization

**Policy pages** can be done later with legal review (8 hours additional)

---

## 📝 Notes

- **Admin panel**: NOT translated (as requested)
- **Translation quality**: Consider professional translators for policy pages
- **Legal review**: SK & DE policy translations need legal team approval
- **Testing**: Test all 3 languages before deployment
- **Performance**: Translations are lazy-loaded, no performance impact

---

**Last Updated**: 2025-01-12
**Version**: 2.0 (Customer-Only)
**Status**: Ready for Implementation
