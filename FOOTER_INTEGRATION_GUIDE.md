# Footer Integration Guide

## 🚀 Rýchla integrácia (5 minút)

### 1. Nainštaluj závislosti

```bash
npm install lucide-react
# alebo
yarn add lucide-react
```

### 2. Skontroluj Tailwind CSS

Uisti sa, že Tailwind CSS je správne nakonfigurovaný:

**tailwind.config.js:**
```js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FFC400',
        background: '#0D0D0D',
      },
    },
  },
  plugins: [],
}
```

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. Nahraď starý footer

**Option A: Priama náhrada**
```tsx
// V App.tsx alebo layout.tsx
import FooterNew from './components/Footer/FooterNew';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {/* Váš obsah */}
      </main>
      <FooterNew />
    </div>
  );
}
```

**Option B: Postupná migrácia**
```tsx
// Ponechaj obidva footery a prepínaj ich
import Footer from './components/Footer/Footer';
import FooterNew from './components/Footer/FooterNew';

const USE_NEW_FOOTER = true; // Feature flag

function App() {
  return (
    <div>
      <main>{/* content */}</main>
      {USE_NEW_FOOTER ? <FooterNew /> : <Footer />}
    </div>
  );
}
```

### 4. Testuj responzivitu

Otvor stránku a testuj na rôznych zariadeniach:
- Mobile: ≤640px (akordeóny)
- Tablet: 768-1024px (2-3 stĺpce)
- Desktop: ≥1280px (5 stĺpcov)

---

## 📋 Detailná integrácia

### Štruktúra súborov

```
src/
├── components/
│   └── Footer/
│       ├── FooterNew.tsx           ← Hlavný komponent
│       ├── FooterNew.test.tsx      ← Testy
│       ├── FooterNew.stories.tsx   ← Storybook stories
│       ├── FOOTER_README.md        ← Dokumentácia
│       ├── Footer.tsx              ← Starý footer (optional backup)
│       └── Footer.css              ← Starý CSS (optional backup)
```

### Konfigurácia projektu

#### 1. TypeScript (tsconfig.json)

Uisti sa, že máš správne path aliasy:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

#### 2. Testing (jest.config.js)

Pre accessibility testing:

```bash
npm install --save-dev jest-axe @testing-library/react @testing-library/jest-dom
```

```js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom',
  // ...
};
```

**src/setupTests.ts:**
```ts
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);
```

#### 3. Storybook (optional)

```bash
npx storybook@latest init
```

**,storybook/preview.ts:**
```ts
import '../src/index.css'; // Import Tailwind

const preview = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0D0D0D' },
        { name: 'light', value: '#FFFFFF' },
      ],
    },
  },
};

export default preview;
```

---

## 🎨 Customizácia

### Zmena farieb

**Option 1: Inline (rýchle)**
```tsx
// V FooterNew.tsx, nahraď všetky výskyty:
bg-[#FFC400]  →  bg-[#YOUR_COLOR]
text-[#FFC400] →  text-[#YOUR_COLOR]
```

**Option 2: Tailwind theme (odporúčané)**
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'brand-primary': '#FFC400',
      'brand-bg': '#0D0D0D',
      'brand-text': '#FFFFFF',
      'brand-text-muted': '#B3B3B3',
      'brand-border': '#141414',
    },
  },
}
```

Potom v komponente:
```tsx
<button className="bg-brand-primary text-brand-bg">
  Prihlásiť sa
</button>
```

### Pridanie nového stĺpca

```tsx
const footerColumns = {
  // ... existujúce stĺpce
  resources: {
    title: 'Zdroje',
    links: [
      { label: 'Dokumentácia', href: '/docs' },
      { label: 'API', href: '/api' },
      { label: 'SDK', href: '/sdk' },
    ],
  },
};
```

Potom v JSX:
```tsx
<FooterColumn
  title={footerColumns.resources.title}
  links={footerColumns.resources.links}
/>
```

### Newsletter API integrácia

**Backend endpoint:**
```ts
// POST /api/newsletter
interface NewsletterRequest {
  email: string;
}

interface NewsletterResponse {
  success: boolean;
  message: string;
}
```

**Frontend integrácia:**
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!isValid) return;

  setIsSubmitting(true);

  try {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) throw new Error('Subscription failed');

    const data: NewsletterResponse = await response.json();

    // Success toast/notification
    toast.success(data.message);

    setEmail('');
    setIsValid(false);
  } catch (error) {
    // Error toast/notification
    toast.error('Nepodarilo sa prihlásiť. Skúste to znova.');
  } finally {
    setIsSubmitting(false);
  }
};
```

### Internationalization (i18n)

**Integrácia s react-i18next:**

```tsx
import { useTranslation } from 'react-i18next';

const FooterNew: React.FC = () => {
  const { t } = useTranslation('footer');

  return (
    <footer>
      <h2>{t('newsletter.title')}</h2>
      <p>{t('newsletter.description')}</p>
      {/* ... */}
    </footer>
  );
};
```

**Translations file (locales/sk/footer.json):**
```json
{
  "newsletter": {
    "title": "Zostaň v obraze",
    "description": "Nové modely, exkluzívne zľavy a návody priamo do tvojej schránky.",
    "placeholder": "Tvoj email",
    "button": "Prihlásiť sa",
    "sending": "Odosiela sa..."
  },
  "sections": {
    "shop": "Shop",
    "support": "Podpora",
    "company": "Spoločnosť",
    "legal": "Právne",
    "contact": "Kontakt"
  }
}
```

---

## 🔍 Testing & Quality Assurance

### 1. Spusti testy

```bash
# Unit testy
npm test FooterNew.test.tsx

# Coverage report
npm test -- --coverage --collectCoverageFrom="src/components/Footer/FooterNew.tsx"
```

### 2. Lighthouse audit

```bash
npm run build
npx lighthouse http://localhost:3000 --view
```

**Ciele:**
- Performance: 90+
- Accessibility: 100
- Best Practices: 90+
- SEO: 90+

### 3. Accessibility audit

```bash
# V prehliadači
# 1. Otvor DevTools
# 2. Lighthouse tab → Accessibility
# 3. Axe DevTools extension

# Alebo programaticky
npm install -g @axe-core/cli
axe http://localhost:3000
```

### 4. Manual testing checklist

- [ ] Newsletter form validuje email
- [ ] Newsletter form odošle údaje
- [ ] Všetky linky fungujú
- [ ] Social linky otvárajú v novom okne
- [ ] Akordeóny na mobile fungujú
- [ ] Jazyk selector je vizuálne správny
- [ ] Footer je sticky na spodnej časti stránky
- [ ] Klávesová navigácia (Tab) funguje
- [ ] Focus ringy sú viditeľné
- [ ] Kontrast je min. 4.5:1 (WCAG AA)
- [ ] Screen reader číta obsah správne

---

## 🐛 Troubleshooting

### Footer nie je na spodku stránky

**Problém:** Footer visí v strede stránky.

**Riešenie:**
```tsx
// V App.tsx alebo layout.tsx
<div className="flex flex-col min-h-screen">
  <Header />
  <main className="flex-1">
    {/* content */}
  </main>
  <FooterNew />
</div>
```

### Tailwind classes nefungujú

**Problém:** Štýly sa neaplikujú.

**Riešenie:**
1. Skontroluj `tailwind.config.js` - obsah path musí zahŕňať `tsx` súbory
2. Skontroluj `src/index.css` - musí obsahovať `@tailwind` direktívy
3. Reštartuj dev server: `npm start`

### Ikony sa nezobrazujú

**Problém:** Lucide ikony sa nezobrazia.

**Riešenie:**
```bash
npm install lucide-react --save
# a reštartuj server
```

### Typescript chyby

**Problém:** TS errors v testoch alebo stories.

**Riešenie:**
```bash
npm install --save-dev @types/react @types/react-router-dom @types/jest @types/testing-library__react
```

### React Router Link nefunguje

**Problém:** `<Link>` komponenty spôsobujú errors.

**Riešenie:**
Uisti sa, že aplikácia je wrapped v `<BrowserRouter>`:

```tsx
// index.tsx
import { BrowserRouter } from 'react-router-dom';

root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
```

---

## 📊 Performance Optimizations

### 1. Code splitting

```tsx
import { lazy, Suspense } from 'react';

const FooterNew = lazy(() => import('./components/Footer/FooterNew'));

function App() {
  return (
    <div>
      <main>{/* content */}</main>
      <Suspense fallback={<div>Loading...</div>}>
        <FooterNew />
      </Suspense>
    </div>
  );
}
```

### 2. Memoization

Pre veľmi dynamické footery:

```tsx
import { memo } from 'react';

const FooterNew = memo(() => {
  // component code
});

export default FooterNew;
```

### 3. Image optimization

Ak pridáš obrázky (napr. payment logos):

```tsx
import Image from 'next/image'; // Next.js
// alebo
import paypalLogo from './paypal.webp';

<Image
  src={paypalLogo}
  alt="PayPal"
  width={100}
  height={40}
  loading="lazy"
/>
```

---

## 🚢 Deployment Checklist

- [ ] Všetky testy prechádzajú
- [ ] Lighthouse score > 90
- [ ] No console errors/warnings
- [ ] Newsletter API endpoint funguje
- [ ] Všetky linky smerujú na správne URLs
- [ ] JSON-LD schema má reálne údaje
- [ ] Social media linky sú správne
- [ ] Kontaktné údaje sú aktuálne
- [ ] GDPR links fungujú
- [ ] Mobile responsive funguje
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

---

## 📞 Support

Ak máš problémy alebo otázky:

1. Prečítaj si `FOOTER_README.md` v `src/components/Footer/`
2. Skontroluj existing issues v repozitári
3. Vytvor nový issue s:
   - Popis problému
   - Steps to reproduce
   - Screenshots/screen recordings
   - Browser/device info

---

## 📝 Next Steps

1. **Customizuj obsah** - Aktualizuj linky, kontakty, texty
2. **Pripoj API** - Implementuj newsletter backend
3. **Add analytics** - Track newsletter sign-ups, link clicks
4. **i18n** - Pridaj viacjazyčnú podporu
5. **SEO** - Aktualizuj JSON-LD schema s reálnymi údajmi

---

**Hotovo! 🎉** Footer je teraz integrovaný a pripravený na produkciu.
