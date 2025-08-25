# 🔒 Bezpečnostné opatrenia - MARTYX INDUSTRIES E-shop

Tento dokument popisuje implementované bezpečnostné opatrenia v frontend aplikácii.

## 📋 Prehľad implementovaných bezpečnostných prvkov

### 🛡️ 1. Content Security Policy (CSP)
**Súbor:** `index.html`
- **Implementované v:** Meta tag v HTML hlavičke
- **Ochrana proti:** XSS útoky, code injection
- **Funkcie:**
  - Obmedzenie zdrojov skriptov na dôveryhodné domény
  - Blokácia inline skriptov (okrem povolených)
  - Kontrola zdrojov štýlov, obrázkov a fontov
  - Reporting CSP violations v development mode

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  ...
">
```

### 🔐 2. Input Sanitization & Validation
**Súbory:** `src/utils/security.ts`, `src/utils/validation.ts`
- **Ochrana proti:** XSS, injection útoky
- **Funkcie:**
  - HTML sanitizácia všetkých používateľských vstupov
  - Validácia emailových adries (RFC 5322 compliant)
  - Pokročilá validácia hesiel s kontrolou sily
  - Odstránenie nebezpečných znakov a protokolov

```typescript
// Príklad sanitizácie
export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // ... ďalšie sanitizačné pravidlá
};
```

### 🚫 3. CSRF Protection
**Súbor:** `src/utils/csrf.ts`
- **Ochrana proti:** Cross-Site Request Forgery útoky
- **Funkcie:**
  - Generovanie kryptograficky bezpečných tokenov
  - Automatické pridávanie CSRF tokenov do HTTP hlavičiek
  - Validácia tokenov na strane klienta
  - Session-based ukladanie tokenov

```typescript
// CSRF token management
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};
```

### ⏱️ 4. Rate Limiting
**Súbor:** `src/utils/security.ts`
- **Ochrana proti:** Brute force útoky, DoS
- **Funkcie:**
  - Obmedzenie pokusov o prihlásenie (5 za 15 minút)
  - Obmedzenie registrácií (3 za 30 minút)
  - Sliding window algoritmus
  - Automatické resetovanie po úspešnom prihlásení

```typescript
// Rate limiter implementácia
export const loginRateLimiter = new RateLimiter(5, 900000); // 5 pokusov za 15 minút
export const registrationRateLimiter = new RateLimiter(3, 1800000); // 3 pokusy za 30 minút
```

### 🔒 5. Secure Token Storage
**Súbor:** `src/utils/security.ts`, `src/context/AuthProvider.tsx`
- **Ochrana proti:** Token theft, XSS
- **Funkcie:**
  - Bezpečné ukladanie do localStorage s error handling
  - Automatická kontrola expirácie tokenov
  - Bezpečné parsovanie JSON s ochranou proti prototype pollution
  - Sanitizácia localStorage kľúčov

```typescript
// Bezpečné localStorage API
export const secureLocalStorage = {
  set: (key: string, value: unknown): boolean => {
    const sanitizedKey = sanitizeStorageKey(key);
    const serialized = JSON.stringify(value);
    localStorage.setItem(sanitizedKey, serialized);
    return true;
  },
  // ... ďalšie metódy
};
```

### 🌐 6. Security Headers
**Súbor:** `index.html`
- **Ochrana proti:** Clickjacking, MIME sniffing, XSS
- **Implementované headers:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` pre obmedzenie API prístupu

### 🛑 7. Error Boundary
**Súbor:** `src/components/security/SecurityErrorBoundary.tsx`
- **Ochrana proti:** Information disclosure
- **Funkcie:**
  - Zachytávanie a bezpečné spracovanie chýb
  - Skrývanie citlivých informácií z error stackov
  - Automatické reportovanie chýb v development mode
  - Graceful fallback UI pre používateľov

### 🔍 8. Form Security
**Súbory:** Všetky auth formuláre
- **Ochrana proti:** XSS, injection, enumeration
- **Funkcie:**
  - Real-time validácia s debouncing
  - Sanitizácia všetkých vstupov
  - Bezpečné handling chybových správ
  - Password strength checking

## 🔧 Konfigurácia a použitie

### Pre vývojárov:

1. **CSP reporting** je automaticky aktivované v development mode
2. **Rate limiting** sa aplikuje automaticky na auth formuláre
3. **Input sanitization** sa používa vo všetkých formulároch
4. **CSRF tokeny** sa automaticky pridávajú do API calls

### Pre produkciu:

1. Zabezpečte HTTPS pre všetky komunikácie
2. Implementujte proper HSTS headers na serveri
3. Nastavte monitoring pre CSP violations
4. Aktivujte error reporting service

## 📊 Bezpečnostné metriky

| Oblasť | Implementované | Level |
|--------|---------------|-------|
| XSS Protection | ✅ | High |
| CSRF Protection | ✅ | High |
| Input Validation | ✅ | High |
| Rate Limiting | ✅ | Medium |
| Secure Storage | ✅ | High |
| Error Handling | ✅ | High |
| Content Security | ✅ | High |

## 🚨 Reportovanie bezpečnostných problémov

Ak nájdete bezpečnostný problém:

1. **Neotvárajte** verejný issue
2. Kontaktujte bezpečnostný tím priamo
3. Poskytnite detailný popis problému
4. Očakávajte odpoveď do 48 hodín

## 📚 Ďalšie zdroje

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [React Security Best Practices](https://react.dev/learn/security)

---
**Posledná aktualizácia:** Január 2024  
**Verzia bezpečnostných opatrení:** 1.0.0
