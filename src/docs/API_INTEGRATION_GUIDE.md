# API Integration Guide - i18n Implementation

Tento dokument popisuje, ako správne používať nové API služby s internacionalizačnou podporou a jednotným error kontraktom.

## 🌐 Základné princípy

### Accept-Language Headers
Všetky API volania automaticky posielajú `Accept-Language` hlavičku na základe aktuálne vybraného jazyka v aplikácii.

```typescript
// Automaticky sa pridáva Accept-Language header
const products = await productService.getProducts();

// Alebo explicitne zadať jazyk
const product = await productService.getProduct(123, 'sk');
```

### Jednotný Error Kontrakt
Backend vracia chyby v štandardnom formáte:

```typescript
{
  "timestamp": "2025-08-29T18:20:11.123Z",
  "path": "/api/products/999",
  "errorCode": "ERR_NOT_FOUND",
  "args": {}
}
```

## 📦 Dostupné služby

### MetaService
```typescript
import { metaService } from '../services/metaService';

// Získanie podporovaných jazykov
const locales = await metaService.getSupportedLocales();
// Výsledok: ["en", "sk", "de"]
```

### ProductService
```typescript
import { productService } from '../services/productService';

// Zoznam produktov s lokalizáciou
const products = await productService.getProducts();

// Produkty v konkrétnej kategórii
const books = await productService.getProducts('Books');

// Detail produktu s lokalizovaným obsahom
const product = await productService.getProduct(123);

// Detail v konkrétnom jazyku
const productSK = await productService.getProduct(123, 'sk');
```

### PayPalService
```typescript
import { paypalService } from '../services/paypalService';

// Vytvorenie objednávky
const orderRequest = paypalService.createPaymentRequest(
  cartItems,
  'customer@example.com',
  'EUR'
);

const order = await paypalService.createOrder(orderRequest);

// Zachytenie platby
const payment = await paypalService.captureOrder({
  orderId: order.id
});
```

## 🔧 Error Handling

### Základné použitie
```typescript
import { translateApiError } from '../utils/translateApiError';

try {
  const product = await productService.getProduct(999);
} catch (error) {
  const message = translateApiError(error, t);
  // Zobrazí lokalizovanú chybovú správu
  toast.error(message);
}
```

### S custom argumentmi
```typescript
try {
  await paypalService.createOrder(request);
} catch (error) {
  const message = translateApiError(error, t, {
    amount: request.totalAmount,
    currency: request.currency
  });
  showErrorModal(message);
}
```

## 🎯 Typické error kódy

| Error Code | Slovensky | Deutsch | English |
|------------|-----------|---------|---------|
| `ERR_NOT_FOUND` | Zdroj sa nenašiel | Ressource nicht gefunden | Resource not found |
| `ERR_BAD_REQUEST` | Neplatná požiadavka | Ungültige Anfrage | Bad request |
| `ERR_UNAUTHORIZED` | Vyžaduje sa prihlásenie | Authentifizierung erforderlich | Authentication required |
| `ERR_PAYMENT_FAILED` | Spracovanie platby zlyhalo | Zahlungsverarbeitung fehlgeschlagen | Payment processing failed |

## 🔄 Hooks pre jednoduchšie použitie

### usePayPalCheckout
```typescript
import { usePayPalCheckout } from '../hooks/usePayPalCheckout';

const CheckoutComponent = () => {
  const {
    loading,
    error,
    orderData,
    paymentResult,
    createOrder,
    captureOrder,
    isSuccess
  } = usePayPalCheckout();

  const handleCheckout = async () => {
    try {
      const order = await createOrder(cartItems, userEmail, 'EUR');
      // Redirect to PayPal...
    } catch (err) {
      // Error is already handled and translated
      console.error('Checkout failed:', err);
    }
  };

  return (
    <div>
      {loading && <p>Spracovávam...</p>}
      {error && <p className="error">{error}</p>}
      {isSuccess && <p>Platba úspešná!</p>}
      
      <button onClick={handleCheckout} disabled={loading}>
        Zaplatiť
      </button>
    </div>
  );
};
```

## 🌍 Komponenty s lokalizáciou

### LocalizedProductCard
```typescript
import LocalizedProductCard from '../components/LocalizedProductCard/LocalizedProductCard';

// Automaticky sa aktualizuje pri zmene jazyka
<LocalizedProductCard 
  productId={123} 
  showFullDescription={true} 
/>
```

### LocaleSelector
```typescript
import LocaleSelector from '../components/LocaleSelector/LocaleSelector';

// Načíta podporované jazyky z backend API
<LocaleSelector />
```

## 🔄 Automatické aktualizácie

Keď používateľ zmení jazyk v aplikácii:

1. ✅ Automaticky sa aktualizuje `Accept-Language` header pre všetky API volania
2. ✅ Komponenty sa znovu načítajú s novým jazykom
3. ✅ Error správy sa zobrazia v novom jazyku
4. ✅ LocalStorage si pamätá výber jazyka

## 🚀 Best Practices

### 1. Vždy používaj translateApiError
```typescript
// ✅ Správne
catch (error) {
  const message = translateApiError(error, t);
  showError(message);
}

// ❌ Nesprávne
catch (error) {
  showError(error.message);
}
```

### 2. Využívaj TypeScript typy
```typescript
// ✅ Správne
import type { ProductDto, CreatePaymentRequest } from '../types/api';

const handleProduct = (product: ProductDto) => {
  // TypeScript kontroluje typy
};
```

### 3. Handle loading a error stavy
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// Zobraz loading a error stavy v UI
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage message={error} />;
```

### 4. Loguj pre debugging
```typescript
console.log('🌐 Loading product in language:', i18n.language);
console.log('✅ Product loaded:', product);
console.error('❌ API Error:', error);
```

## 🔍 Debugging

### Kontrola missing keys
```typescript
// V developer console
window.__i18nDebug.getMissingKeys();
// Zobrazí všetky chýbajúce translation keys
```

### Zmena jazyka programovo
```typescript
// V developer console
window.__i18nDebug.changeLanguage('sk');
```

### Kontrola API volaní
V Network tab v developer tools skontrolujte:
- ✅ `Accept-Language` header je nastavený
- ✅ Response má správny formát error kontraktu
- ✅ Lokalizovaný obsah sa načítava správne
