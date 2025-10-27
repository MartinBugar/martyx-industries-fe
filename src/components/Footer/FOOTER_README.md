# Footer Component - Dokumentácia

## Prehľad

Moderný, prémiový footer komponent pre e-shop s dark theme dizajnom. Inšpirovaný najlepšími praktikami od značiek ako Stripe, Linear, Vercel, Apple a Framer.

## Vlastnosti

- ✅ **Newsletter CTA** - Email validácia a odoslanie
- ✅ **Trust Badges** - Platobné metódy, SSL, 14-dní vrátenie
- ✅ **Responzívny** - Mobile akordeóny, tablet/desktop grid
- ✅ **Accessibility** - WCAG AA+, focus ringy, ARIA atribúty
- ✅ **SEO** - JSON-LD Organization schema
- ✅ **Dark Theme** - Tmavožltá #FFC400, čierne pozadie #0D0D0D
- ✅ **TypeScript** - Plná type safety
- ✅ **Tailwind CSS** - Utility-first styling

## Použitie

### Základná integrácia

```tsx
import FooterNew from '@/components/Footer/FooterNew';

function Layout() {
  return (
    <div>
      <main>{/* Váš obsah */}</main>
      <FooterNew />
    </div>
  );
}
```

### Nahradenie starého footeru

```tsx
// V App.tsx alebo layout.tsx
// Bolo:
import Footer from './components/Footer/Footer';

// Teraz:
import FooterNew from './components/Footer/FooterNew';

// A použite <FooterNew /> namiesto <Footer />
```

## Štruktúra

### Komponenty

- **FooterNew** - Hlavný footer komponent
- **NewsletterForm** - Newsletter prihlásenie s validáciou
- **TrustIcons** - Platobné metódy a trust badges
- **FooterColumn** - Navigačný stĺpec (desktop) alebo akordeón (mobile)
- **SocialLinks** - Social media linky

### Sekcie

1. **Top Section (CTA)**
   - Newsletter prihlásenie
   - Value proposition text
   - Trust icons (platby, SSL, vrátenie)

2. **Middle Section (Navigation)**
   - Shop links
   - Podpora links
   - Spoločnosť links
   - Právne links
   - Kontakt info

3. **Bottom Section**
   - Copyright
   - Jazyk/Krajina selector (SK/EN)

## Prispôsobenie

### Zmena linkov

Upravte objekt `footerColumns` v `FooterNew.tsx`:

```tsx
const footerColumns = {
  shop: {
    title: 'Shop',
    links: [
      { label: 'Nový link', href: '/novy-link' },
      // ... ďalšie linky
    ],
  },
  // ... ďalšie stĺpce
};
```

### Zmena kontaktných údajov

Upravte sekciu "Kontakt" v komponente:

```tsx
<a href="mailto:vasa-email@domena.sk">
  vasa-email@domena.sk
</a>
```

### Pridanie/odobratie platobných metód

Upravte `TrustIcons` komponent a pridajte/odstráňte SVG ikony:

```tsx
<div className="flex items-center gap-3">
  <svg>...</svg>
  <span>Nova platobna metoda</span>
</div>
```

### Zmena farieb

Farby sú definované cez Tailwind utility classes:

- Primárna (tmavožltá): `bg-[#FFC400]`, `text-[#FFC400]`
- Pozadie: `bg-[#0D0D0D]`
- Text: `text-white`, `text-[#B3B3B3]`
- Bordery: `border-[#141414]`, `border-[#1A1A1A]`

Pre globálnu zmenu farieb, upravte Tailwind config:

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#FFC400',
      background: '#0D0D0D',
      // ...
    }
  }
}
```

### Newsletter API integrácia

Upravte `handleSubmit` v `NewsletterForm`:

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!isValid) return;

  setIsSubmitting(true);

  try {
    // Volanie API
    await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    // Success handling
    setEmail('');
    setIsValid(false);
  } catch (error) {
    // Error handling
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};
```

### JSON-LD Schema

Upravte organizačné údaje v `<script type="application/ld+json">`:

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Váš názov",
  "url": "https://vasa-domena.sk",
  "logo": "https://vasa-domena.sk/logo.png",
  "sameAs": [
    "https://facebook.com/vasa-stranka",
    "https://instagram.com/vasa-stranka"
  ]
}
```

## Responsive Breakpoints

- **Mobile**: ≤ 640px - Akordeóny, 1-stĺpec
- **Tablet**: 768px - 1024px - 2-3 stĺpce
- **Desktop**: ≥ 1280px - 5 stĺpcov

## Accessibility

- ✅ Kontrast min. WCAG AA (4.5:1)
- ✅ Focus ringy na všetkých interaktívnych prvkoch
- ✅ ARIA labels pre screen readery
- ✅ Klávesová navigácia (Tab, Enter, Space)
- ✅ `aria-expanded` pre akordeóny
- ✅ Semantický HTML (`<footer>`, `<nav>`, `<h2>`)

## Performance

- ⚡ Žiadne externé obrázky (len inline SVG)
- ⚡ Minimálny JavaScript (len akordeóny a validácia)
- ⚡ Žiadny layout shift (CLS = 0)
- ⚡ Tailwind purge eliminuje nepoužitý CSS

## Testing

```bash
# Spustenie testov
npm test Footer.test.tsx

# Lighthouse audit
npm run lighthouse
```

## Ikony

Používame **lucide-react** pre ikony:

- `Mail`, `Phone`, `MapPin` - Kontakt
- `Shield`, `RotateCcw` - Trust badges
- `Facebook`, `Instagram`, `Youtube` - Social
- `ChevronDown` - Akordeóny

### Pridanie novej ikony

```tsx
import { NewIcon } from 'lucide-react';

<NewIcon className="w-4 h-4" />
```

## Changelog

### v1.0.0 (2025-01-27)
- ✨ Prvé vydanie
- ✨ Newsletter form s validáciou
- ✨ Responzívne akordeóny
- ✨ JSON-LD schema
- ✨ Trust badges
- ✨ Social links
- ✨ Language selector UI

## Podpora

Pre otázky alebo problémy, kontaktujte vývojový tím alebo vytvorte issue v repozitári.

## License

Proprietárny - © 2025 Martyx Industries
